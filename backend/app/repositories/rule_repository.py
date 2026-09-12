
from app.model.rule import Rule
from app.utils.sqlite import sqlite_util as sql
from app.repositories.entity.rule_entity import RuleEntity,ActionRuleEntity
from typing import List
import app.repositories.action_repository as action_repo


def _get_complete_rule(incomplete_rule:Rule)->Rule:
    if incomplete_rule is None:
        return None
    action_ids = list(map(lambda ar:ar.action_id,sql.select_by_filter({"rule_id":incomplete_rule.id},ActionRuleEntity)))
    actions = action_repo.get_by_ids(action_ids)
    incomplete_rule.actions = actions

    return incomplete_rule


def add(new_rule:Rule,infer_ids=False)->int:
    rule_id = sql.insert(new_rule,RuleEntity)

    for a in new_rule.actions or []:
        if a.id is None:
            existing = None

            if infer_ids:
                existing = action_repo.get_by_name(a.name)

            a.id = existing.id if existing is not None else action_repo.add(a)

        action_id = a.id
        sql.insert(ActionRuleEntity.from_ids(action_id, rule_id),ActionRuleEntity,return_id=False)

    return rule_id

def update(rule:Rule, infer_ids=False)->int:
    sql.update(rule, RuleEntity)
    sql.delete_by_filter({"rule_id": rule.id}, ActionRuleEntity)

    for a in rule.actions or []:
        if a.id is None:
            existing = None
            if infer_ids and a.name:
                existing = action_repo.get_by_name(a.name)
            a.id = existing.id if existing is not None else action_repo.add(a)
        elif action_repo.get_by_id(a.id) is not None:
            action_repo.update(a)
        sql.insert(ActionRuleEntity.from_ids(a.id, rule.id), ActionRuleEntity, return_id=False)

    return rule.id

def delete(rule_id:int)->int:
    sql.delete_by_filter({"rule_id": rule_id}, ActionRuleEntity)
    sql.delete(rule_id, RuleEntity)
    return rule_id

def get_all()->List[Rule]:
    return [_get_complete_rule(r) for r in sql.select_all(RuleEntity)]

def get_by_id(id:int)->Rule:
    incomplete = sql.select_by_id(id, RuleEntity)
    return _get_complete_rule(incomplete)

def get_by_ids(ids:List[int])->List[Rule]:
    if not ids:
        return []
    return [_get_complete_rule(r) for r in sql.select_by_ids(ids,RuleEntity)]

def get_by_name(name:str)-> Rule:
    incomplete_rule = sql.select_one_by_filter({"name":name},RuleEntity)

    return _get_complete_rule(incomplete_rule) if incomplete_rule  else None

def link_action(rule_id:int, action_id:int):
    sql.insert(ActionRuleEntity.from_ids(action_id, rule_id), ActionRuleEntity, return_id=False)

def unlink_action(rule_id:int, action_id:int):
    sql.delete_by_filter({"rule_id": rule_id, "action_id": action_id}, ActionRuleEntity)
