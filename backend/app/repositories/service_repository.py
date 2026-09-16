from app.model.service import Service
from typing import List
from app.utils.sqlite import sqlite_util as sql
from app.repositories.entity.service_entity import ServiceEntity,RuleServiceEntity,SourceServiceEntity
import app.repositories.source_repository as source_repo
import app.repositories.rule_repository as rule_repo
from app.repositories.entity.label_entity import LabelServiceEntity
from app.model.label import ServiceLabel

def get_all()-> List[Service]:
    services = sql.select_all(ServiceEntity)
    return [_get_complete_service(s) for s in services]

def add(new_service:Service,infer_ids:bool=False)->int:
    service_id = sql.insert(new_service,ServiceEntity)

    for s in new_service.sources or []:
        if s.id is None:
            existing = None

            if infer_ids:
                existing = source_repo.get_by_name(s.name)
                
            s.id = existing.id if existing is not None else source_repo.add(s) 
        source_id = s.id
        sql.insert(SourceServiceEntity.from_ids(service_id,source_id),SourceServiceEntity,return_id=False)
    
    for r in new_service.rules or []:
        if r.id is None:
            existing = None

            if infer_ids:
                existing = rule_repo.get_by_name(r.name)

            r.id = existing.id if existing is not None else rule_repo.add(r,infer_ids)

        rule_id = r.id
        sql.insert(RuleServiceEntity.from_ids(service_id,rule_id),RuleServiceEntity,return_id=False)

    return service_id

def update(service:Service, infer_ids:bool=False)->int:
    sql.update(service, ServiceEntity)

    sql.delete_by_filter({"service_id": service.id}, SourceServiceEntity)
    sql.delete_by_filter({"service_id": service.id}, RuleServiceEntity)

    for s in service.sources or []:
        if s.id is None:
            existing = source_repo.get_by_name(s.name) if infer_ids and s.name else None
            s.id = existing.id if existing is not None else source_repo.add(s)
        else:
            source_repo.update(s)
        sql.insert(SourceServiceEntity.from_ids(service.id, s.id), SourceServiceEntity, return_id=False)

    for r in service.rules or []:
        if r.id is None:
            existing = rule_repo.get_by_name(r.name) if infer_ids and r.name else None
            r.id = existing.id if existing is not None else rule_repo.add(r, infer_ids)
        else:
            rule_repo.update(r, infer_ids)
        sql.insert(RuleServiceEntity.from_ids(service.id, r.id), RuleServiceEntity, return_id=False)

    return service.id

def _get_service_parts(incomplete_svc: Service) -> Service:
    """Attach sources/rules only — never resolve label templates (avoids cycles)."""
    if incomplete_svc is None:
        return None

    source_service_entities = sql.select_by_filter(
        {"service_id": int(incomplete_svc.id)}, SourceServiceEntity
    )
    sources_ids = list(map(lambda ss: ss.source_id, source_service_entities))
    incomplete_svc.sources = source_repo.get_by_ids(sources_ids)

    rules_ids = list(
        map(
            lambda rs: rs.rule_id,
            sql.select_by_filter({"service_id": incomplete_svc.id}, RuleServiceEntity),
        )
    )
    incomplete_svc.rules = rule_repo.get_by_ids(rules_ids)
    return incomplete_svc


def _get_complete_service(incomplete_svc: Service, _seen: set = None) -> Service:
    if incomplete_svc is None:
        return None

    incomplete_svc = _get_service_parts(incomplete_svc)

    seen = set(_seen or [])
    if incomplete_svc.id is not None:
        if incomplete_svc.id in seen:
            # Cycle: a template (or chain) points back at a service already being resolved.
            return incomplete_svc
        seen.add(incomplete_svc.id)

    for template in get_all_labels(incomplete_svc.labels):
        incomplete_svc = template.apply_to_service(incomplete_svc)

    return incomplete_svc


def get_by_id(id: str, apply_labels: bool = True) -> Service:
    service = sql.select_by_id(id, ServiceEntity)
    if service is None:
        return None
    if apply_labels:
        return _get_complete_service(service)
    return _get_service_parts(service)


def get_by_name(name: str, apply_labels: bool = True) -> Service:
    service = sql.select_one_by_filter({"name": name}, ServiceEntity)
    if service is None:
        return None
    if apply_labels:
        return _get_complete_service(service)
    return _get_service_parts(service)

def get_by_name_like(name:str)-> Service:
    service = sql.select_one_by_filter({"name":f"%{name}%"},ServiceEntity)

    return _get_complete_service(service) if service else None

def get_all_by_name_like(name:str)-> List[Service]:
    services = sql.select_by_filter({"name":f"%{name}%"},ServiceEntity)

    return [_get_complete_service(service) for service in services]

def add_label(label: ServiceLabel):
    """Upsert catalog label in a single transaction (never delete-then-insert).

    If the template service wears this same label, strip it so consumers don't
    recurse when resolving inheritance.
    """
    from app.repositories.entity.label_entity import LabelServiceEntity

    service_id = label.service.id if label.service is not None else None
    session = sql.create_session()
    try:
        existing = (
            session.query(LabelServiceEntity)
            .filter(LabelServiceEntity.label == label.label)
            .one_or_none()
        )
        if existing is not None:
            existing.service_id = service_id
        else:
            session.add(LabelServiceEntity(label=label.label, service_id=service_id))
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

    if service_id is not None:
        tpl = sql.select_by_id(service_id, ServiceEntity)
        if tpl is not None and label.label in (tpl.labels or []):
            tpl.labels = [l for l in (tpl.labels or []) if l != label.label]
            sql.update(tpl, ServiceEntity)

def delete_label(service_id:int=None, label:str=None):
    filt = {}
    if label:
        filt["label"] = label
    if service_id is not None:
        filt["service_id"] = service_id
    if not filt:
        return 0
    sql.delete_by_filter(filt, LabelServiceEntity)
    return 1

def get_all_label_associations()->List[ServiceLabel]:
    return sql.select_all(LabelServiceEntity)

def get_labels(label_name: str) -> List[ServiceLabel]:
    incomplete_labels = sql.select_by_filter({"label": label_name}, LabelServiceEntity)

    if len(incomplete_labels) == 0:
        # Backward compat: treat a service named like the label as template
        service = get_by_name(label_name, apply_labels=False)
        if service is None:
            return []
        return [ServiceLabel(service=service, label=label_name)]

    resolved = []
    for incomplete_label in incomplete_labels:
        sid = incomplete_label.service.id if incomplete_label.service else None
        if sid is None:
            # Tag-only label: no inheritance
            resolved.append(ServiceLabel(label=incomplete_label.label, service=None))
            continue
        # Templates are loaded shallow: applying their labels would recurse when the
        # template itself wears the same catalog label (e.g. node-template + label node).
        service = get_by_id(sid, apply_labels=False)
        if service is None:
            resolved.append(ServiceLabel(label=incomplete_label.label, service=None))
            continue
        incomplete_label.service = service
        resolved.append(incomplete_label)

    return resolved


def get_all_labels(labels:List[str])-> List[ServiceLabel]:
    all_labels=[]

    for label in labels or []:
        svc_labels = get_labels(label)
        all_labels = all_labels+svc_labels

    return all_labels

def link_source(service_id:int, source_id:int):
    sql.insert(SourceServiceEntity.from_ids(service_id, source_id), SourceServiceEntity, return_id=False)

def unlink_source(service_id:int, source_id:int):
    sql.delete_by_filter({"service_id": service_id, "source_id": source_id}, SourceServiceEntity)

def link_rule(service_id:int, rule_id:int):
    sql.insert(RuleServiceEntity.from_ids(service_id, rule_id), RuleServiceEntity, return_id=False)

def unlink_rule(service_id:int, rule_id:int):
    sql.delete_by_filter({"service_id": service_id, "rule_id": rule_id}, RuleServiceEntity)

def delete(id:int)->int:
    source_service_entities = sql.select_by_filter({"service_id":int(id)},SourceServiceEntity)
    rules_service_entities = sql.select_by_filter({"service_id":id},RuleServiceEntity)

    sql.delete_by_entities(source_service_entities)
    sql.delete_by_entities(rules_service_entities)
    sql.delete_by_filter({"service_id": id}, LabelServiceEntity)

    sql.delete(id,ServiceEntity)
    return id
