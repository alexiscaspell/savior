from app.model.service import Service
from typing import List
from app.utils.sqlite import sqlite_util as sql
from app.repositories.entity.service_entity import ServiceEntity,RuleServiceEntity,SourceServiceEntity
import app.repositories.source_repository as source_repo
import app.repositories.rule_repository as rule_repo
from app.model.exception import ServiceNotFoundException
from app.repositories.entity.label_entity import LabelServiceEntity
from app.model.label import ServiceLabel

def get_all()-> List[Service]:
    services = sql.select_all(ServiceEntity)
    return [_get_complete_service(s) for s in services]

def add(new_service:Service,infer_ids:bool=False)->int:
    service_id = sql.insert(new_service,ServiceEntity)

    for s in new_service.sources:
        if s.id is None:
            existing = None

            if infer_ids:
                existing = source_repo.get_by_name(s.name)
                
            s.id = existing.id if existing is not None else source_repo.add(s) 
        source_id = s.id
        sql.insert(SourceServiceEntity.from_ids(service_id,source_id),SourceServiceEntity,return_id=False)
    
    for r in new_service.rules:
        if r.id is None:
            existing = None

            if infer_ids:
                existing = rule_repo.get_by_name(r.name)

            r.id = existing.id if existing is not None else rule_repo.add(r,infer_ids)

        rule_id = r.id
        sql.insert(RuleServiceEntity.from_ids(service_id,rule_id),RuleServiceEntity,return_id=False)

    return service_id

def _get_complete_service(incomplete_svc:Service)->Service:
    source_service_entities=sql.select_by_filter({"service_id":int(incomplete_svc.id)},SourceServiceEntity)
    sources_ids = list(map(lambda ss:ss.source_id,source_service_entities))
    sources = source_repo.get_by_ids(sources_ids)
    incomplete_svc.sources = sources

    rules_ids = list(map(lambda rs:rs.rule_id,sql.select_by_filter({"service_id":incomplete_svc.id},RuleServiceEntity)))
    rules = rule_repo.get_by_ids(rules_ids)
    incomplete_svc.rules = rules

    templates = get_all_labels(incomplete_svc.labels)

    for template in templates:
        incomplete_svc = template.apply_to_service(incomplete_svc)

    return incomplete_svc


def get_by_id(id:str)-> Service:
    service = sql.select_by_id(id,ServiceEntity)
    return _get_complete_service(service)

def get_by_name(name:str)-> Service:
    service = sql.select_one_by_filter({"name":name},ServiceEntity)

    return _get_complete_service(service) if service else None

def get_by_name_like(name:str)-> Service:
    service = sql.select_one_by_filter({"name":f"%{name}%"},ServiceEntity)

    return _get_complete_service(service) if service else None

def get_all_by_name_like(name:str)-> List[Service]:
    services = sql.select_by_filter({"name":f"%{name}%"},ServiceEntity)

    return [_get_complete_service(service) for service in services]

def add_label(label:ServiceLabel):
    sql.insert(label,LabelServiceEntity,return_id=False)


def get_labels(label_name:str)->List[ServiceLabel]:
    incomplete_labels = sql.select_by_filter({"label":label_name},LabelServiceEntity)

    for incomplete_label in incomplete_labels:
        service = get_by_id(incomplete_label.service.id)
        service = _get_complete_service(service)

        incomplete_label.service = service

    return incomplete_labels


def get_all_labels(labels:List[str])-> List[ServiceLabel]:
    all_labels=[]

    for label in labels:
        svc_labels = get_labels(label)
        all_labels+=svc_labels

    return all_labels
