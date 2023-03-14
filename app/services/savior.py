from typing import List

from app.model.action import Consequence
from app.model.exception import InvalidPrayException,FailedPrayException
from app.model.pray import Pray, PrayResponse
from app.model.rule import ResultRule, Rule
from app.model.service import Service
from app.repositories import service_repository as service_repo
import yaml
from app.utils.logger_util import get_logger
from app.model.context import Context
import app.services.source_service as source_svc
from app.model.label import ServiceLabel

logger = get_logger(__name__)


def mock(file_path):
    with open(file_path) as f:
        services_dict = yaml.safe_load(f)

        logger.info(services_dict)

    service_repo.SERVICES = []
        
    for service_dict in services_dict["services"]:
        service=Service.from_dict(service_dict)

        logger.info(service)

        service_repo.add(service)


def add_service(service:Service,infer_ids:bool=False)->int:
    return service_repo.add(service,infer_ids)

def get_all_services()-> List[Service]:
    return service_repo.get_all()

def get_service_by_id(id:str)-> Service:
    return service_repo.get_by_id(id)

def get_services_by_name(name:str)-> List[Service]:
    return service_repo.get_all_by_name_like(name)

def get_service_by_name(name:str)-> Service:
    return service_repo.get_by_name(name)

def infer_service(pray:Pray) -> Service:
    if pray.service_id:
        return get_service_by_id(pray.service_id)

    if pray.service_name:
        return get_service_by_name(pray.service_name)
    
    raise InvalidPrayException()

def helpme(pray:Pray):
    service = infer_service(pray)

    svc_dict = service.to_dict()
    svc_dict.update(pray.params)
    service = Service.from_dict(svc_dict)

    context_dict = {"service":service}
    context = Context.from_dict(context_dict)

    response = PrayResponse.from_dict({"service":service.name,"rules":[]})

    rules = service.ordered_rules()

    logger.info(f"Evaluando servicio {service.name}({service.id}) ...")

    rule_failed_counter = 0

    for rule in rules:
        if pray.source and pray.source != rule.source.name:
            continue

        rule.context = context

        try:
            if rule.satisfies():
                result = rule.apply_actions()

                response.rules.append(result)

                if pray.fast:
                    return response
        except Exception as re:
            logger.error(f"FALLO EJECUTANDO REGLA {rule.name}")
            logger.error(re)
            rule_failed_counter+=1

    if rule_failed_counter==len(rules):
        raise FailedPrayException(service.name)
            
    return response

def eval_service_source(service_id:int,source_id:int):
    service = get_service_by_id(service_id)

    return source_svc.eval(source_id,{"service",service})

def add_label(label:ServiceLabel):
    return service_repo.add_label(label)

def delete_service(service_id:int)->int:
    return service_repo.delete(service_id)