from app.model.rule import Rule
from app.model.action import Action
from app.utils.sqlite import sqlite_util as sql
from app.repositories.entity.rule_entity import RuleEntity, ActionRuleEntity
from typing import List
import app.repositories.action_repository as action_repo


def _get_complete_rule(incomplete_rule: Rule) -> Rule:
    if incomplete_rule is None:
        return None
    action_ids = list(
        map(lambda ar: ar.action_id, sql.select_by_filter({"rule_id": incomplete_rule.id}, ActionRuleEntity))
    )
    actions = action_repo.get_by_ids(action_ids)
    incomplete_rule.actions = actions
    return incomplete_rule


def _action_ids_for_rule(rule_id: int) -> List[int]:
    return list(
        map(lambda ar: ar.action_id, sql.select_by_filter({"rule_id": rule_id}, ActionRuleEntity))
    )


def _delete_orphan_actions(action_ids: List[int]):
    """Delete actions that are no longer linked to any rule."""
    for action_id in action_ids:
        if action_id is None:
            continue
        remaining = sql.select_by_filter({"action_id": action_id}, ActionRuleEntity)
        if remaining:
            continue
        action_repo.delete(action_id)


def _materialize_owned_action(action: Action) -> int:
    """Always insert a fresh action row — never reuse/share by id or name."""
    payload = action.to_dict() if hasattr(action, "to_dict") else dict(action)
    payload.pop("id", None)
    payload.pop("context", None)
    clone = Action.from_dict(payload)
    return action_repo.add(clone)


def _attach_actions(rule_id: int, actions: List[Action]):
    for a in actions or []:
        action_id = _materialize_owned_action(a)
        sql.insert(ActionRuleEntity.from_ids(action_id, rule_id), ActionRuleEntity, return_id=False)


def add(new_rule: Rule, infer_ids: bool = False) -> int:
    # infer_ids is ignored for actions: each rule owns atomic copies.
    rule_id = sql.insert(new_rule, RuleEntity)
    _attach_actions(rule_id, new_rule.actions or [])
    return rule_id


def update(rule: Rule, infer_ids: bool = False) -> int:
    old_action_ids = _action_ids_for_rule(rule.id)
    sql.update(rule, RuleEntity)
    sql.delete_by_filter({"rule_id": rule.id}, ActionRuleEntity)
    _delete_orphan_actions(old_action_ids)
    _attach_actions(rule.id, rule.actions or [])
    return rule.id


def delete(rule_id: int) -> int:
    old_action_ids = _action_ids_for_rule(rule_id)
    sql.delete_by_filter({"rule_id": rule_id}, ActionRuleEntity)
    _delete_orphan_actions(old_action_ids)
    sql.delete(rule_id, RuleEntity)
    return rule_id


def get_all() -> List[Rule]:
    return [_get_complete_rule(r) for r in sql.select_all(RuleEntity)]


def get_by_id(id: int) -> Rule:
    incomplete = sql.select_by_id(id, RuleEntity)
    return _get_complete_rule(incomplete)


def get_by_ids(ids: List[int]) -> List[Rule]:
    if not ids:
        return []
    return [_get_complete_rule(r) for r in sql.select_by_ids(ids, RuleEntity)]


def get_by_name(name: str) -> Rule:
    incomplete_rule = sql.select_one_by_filter({"name": name}, RuleEntity)
    return _get_complete_rule(incomplete_rule) if incomplete_rule else None


def link_action(rule_id: int, action_id: int):
    """Attach a *copy* of the action so the rule stays atomic."""
    source = action_repo.get_by_id(action_id)
    if source is None:
        return
    owned_id = _materialize_owned_action(source)
    sql.insert(ActionRuleEntity.from_ids(owned_id, rule_id), ActionRuleEntity, return_id=False)


def unlink_action(rule_id: int, action_id: int):
    sql.delete_by_filter({"rule_id": rule_id, "action_id": action_id}, ActionRuleEntity)
    _delete_orphan_actions([action_id])
