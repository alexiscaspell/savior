from app.model.service import Service
from typing import List
from app.utils.sqlite import sqlite_util as sql
from app.repositories.entity.service_entity import ServiceEntity,RuleServiceEntity,SourceServiceEntity
import app.repositories.source_repository as source_repo
import app.repositories.rule_repository as rule_repo
from app.model.exception import ServiceNotFoundException

def get_all()-> List[Service]:
    services = sql.select_all(ServiceEntity)
    return [_get_complete_service(s) for s in services]

def add(new_service:Service)->int:
    service_id = sql.insert(new_service,ServiceEntity)

    for s in new_service.sources:
        if s.id is None:
            source_id = source_repo.add(s)
            sql.insert(SourceServiceEntity.from_ids(service_id,source_id),SourceServiceEntity,return_id=False)
    
    for r in new_service.rules:
        if r.id is None:
            rule_id = rule_repo.add(r)
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

    return incomplete_svc


def get_by_id(id:str)-> Service:
    service = sql.select_by_id(ServiceEntity)
    return _get_complete_service(service)

def get_by_name(name:str)-> Service:
    service = sql.select_one_by_filter({"name":name},ServiceEntity)

    return _get_complete_service(service)
