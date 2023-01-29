from app.model.pray import PrayResponse,Pray
from app.model.rule import Rule,ResultRule
from app.model.action import Consequence
from app.model.exception import InvalidPrayException
from app.model.service import Service
from typing import List

def get_service_by_id(id:str)-> Service:
    raise NotImplementedError("Funcionalidad no implementada")

def get_service_by_name(name:str)-> Service:
    raise NotImplementedError("Funcionalidad no implementada")

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
        if rule.satisfies(service):
            consequences:List[Consequence] = rule.apply_actions()

            result = ResultRule.from_dict({"name":rule.name,"consequences":consequences})
            response.rules.append(result)

            if pray.fast:
                return response

    return response