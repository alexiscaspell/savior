from typing import List

from app.model.action import Consequence
from app.model.exception import InvalidPrayException
from app.model.pray import Pray, PrayResponse
from app.model.rule import ResultRule, Rule
from app.model.service import Service
from app.repositories import service_repository as service_repo
import yaml
from app.utils.logger_util import get_logger

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


def get_all_services()-> List[Service]:
    return service_repo.get_all()

def get_service_by_id(id:str)-> Service:
    return service_repo.get_by_id(id)

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

    response = PrayResponse.from_dict({"service":service.name,"rules":[]})

    for rule in service.rules:
        if pray.source and pray.source != rule.source.name:
            continue
        
        if rule.satisfies(service):
            result = rule.apply_actions(service)

            response.rules.append(result)

            if pray.fast:
                return response

    return response
