from typing import List

from app.model.action import Consequence
from app.model.exception import InvalidPrayException,FailedPrayException,ServiceNotFoundException,AppException
from app.model.pray import Pray, PrayResponse
from app.model.rule import ResultRule, Rule
from app.model.service import Service
from app.repositories import service_repository as service_repo
import yaml
from app.utils.logger_util import get_logger
from app.model.context import Context
import app.services.source_service as source_svc
from app.model.label import ServiceLabel
import app.repositories.rule_repository as rule_repo
import app.repositories.action_repository as action_repo
from app.model.action import Action

logger = get_logger(__name__)


def mock(file_path, force: bool = False):
    """Carga services y labels de ejemplo desde YAML. Por defecto no duplica si ya hay data."""
    existing = service_repo.get_all()
    if existing and not force:
        logger.info(f"Mock omitido: ya hay {len(existing)} service(s) en la DB")
        return {"loaded": 0, "labels_loaded": 0, "skipped": True, "existing": len(existing)}

    with open(file_path) as f:
        services_dict = yaml.safe_load(f)

    logger.info(f"Cargando mock desde {file_path}")
    loaded = 0
    labels_loaded = 0

    for service_dict in services_dict.get("services", []):
        service = Service.from_dict(service_dict)
        logger.info(service)
        service_repo.add(service)
        loaded += 1

    for label_dict in services_dict.get("labels", []) or []:
        label_name = label_dict.get("label")
        service_name = label_dict.get("service_name") or label_dict.get("service")
        if not label_name or not service_name:
            logger.warning(f"Label inválido en mock: {label_dict}")
            continue

        template = service_repo.get_by_name(service_name)
        if template is None:
            logger.warning(f"No se encontró service plantilla '{service_name}' para label '{label_name}'")
            continue

        # Idempotente: LABELS_SERVICES usa service_id como PK
        from app.utils.sqlite import sqlite_util as sql
        from app.repositories.entity.label_entity import LabelServiceEntity

        already = sql.select_by_filter({"label": label_name}, LabelServiceEntity)
        if already:
            logger.info(f"Label '{label_name}' ya existe, se omite")
            continue

        service_repo.add_label(ServiceLabel(
            label=label_name,
            service=Service.dummy(template.id),
        ))
        labels_loaded += 1
        logger.info(f"Label '{label_name}' → service '{service_name}' ({template.id})")

    return {
        "loaded": loaded,
        "labels_loaded": labels_loaded,
        "skipped": False,
        "existing": len(existing),
    }


def add_service(service:Service,infer_ids:bool=False)->int:
    return service_repo.add(service,infer_ids)

def update_service(service_id:int, service:Service, infer_ids:bool=False)->int:
    existing = service_repo.get_by_id(service_id)
    if existing is None:
        raise ServiceNotFoundException()
    service.id = service_id
    return service_repo.update(service, infer_ids)

def get_all_services()-> List[Service]:
    return service_repo.get_all()

def get_service_by_id(id:str)-> Service:
    service = service_repo.get_by_id(id)
    if service is None:
        raise ServiceNotFoundException()
    return service

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
        if pray.source and hasattr(rule.source, 'name') and pray.source != rule.source.name:
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

    if rule_failed_counter==len(rules) and len(rules) > 0:
        raise FailedPrayException(service.name)
            
    return response

def eval_service_source(service_id:int,source_id:int):
    service = get_service_by_id(service_id)

    return source_svc.eval(source_id,{"service":service})

def add_label(label:ServiceLabel):
    return service_repo.add_label(label)

def delete_label(service_id:int, label:str=None):
    return service_repo.delete_label(service_id, label)

def get_all_labels()->List[ServiceLabel]:
    return service_repo.get_all_label_associations()

def delete_service(service_id:int)->int:
    return service_repo.delete(service_id)

def link_source(service_id:int, source_id:int):
    get_service_by_id(service_id)
    if source_svc.get_by_id(source_id) is None:
        raise AppException(404, "Source no existente")
    service_repo.link_source(service_id, source_id)
    return {"service_id": service_id, "source_id": source_id}

def unlink_source(service_id:int, source_id:int):
    service_repo.unlink_source(service_id, source_id)
    return {"service_id": service_id, "source_id": source_id}

def link_rule(service_id:int, rule_id:int):
    get_service_by_id(service_id)
    if rule_repo.get_by_id(rule_id) is None:
        raise AppException(404, "Rule no existente")
    service_repo.link_rule(service_id, rule_id)
    return {"service_id": service_id, "rule_id": rule_id}

def unlink_rule(service_id:int, rule_id:int):
    service_repo.unlink_rule(service_id, rule_id)
    return {"service_id": service_id, "rule_id": rule_id}

# Rules
def get_all_rules()->List[Rule]:
    return rule_repo.get_all()

def get_rule_by_id(rule_id:int)->Rule:
    rule = rule_repo.get_by_id(rule_id)
    if rule is None:
        raise AppException(404, "Rule no existente")
    return rule

def add_rule(rule:Rule, infer_ids:bool=False)->int:
    return rule_repo.add(rule, infer_ids)

def update_rule(rule_id:int, rule:Rule, infer_ids:bool=False)->int:
    if rule_repo.get_by_id(rule_id) is None:
        raise AppException(404, "Rule no existente")
    rule.id = rule_id
    return rule_repo.update(rule, infer_ids)

def delete_rule(rule_id:int)->int:
    return rule_repo.delete(rule_id)

def link_action(rule_id:int, action_id:int):
    get_rule_by_id(rule_id)
    if action_repo.get_by_id(action_id) is None:
        raise AppException(404, "Action no existente")
    rule_repo.link_action(rule_id, action_id)
    return {"rule_id": rule_id, "action_id": action_id}

def unlink_action(rule_id:int, action_id:int):
    rule_repo.unlink_action(rule_id, action_id)
    return {"rule_id": rule_id, "action_id": action_id}

# Actions
def get_all_actions()->List[Action]:
    return action_repo.get_all()

def get_action_by_id(action_id:int)->Action:
    action = action_repo.get_by_id(action_id)
    if action is None:
        raise AppException(404, "Action no existente")
    return action

def add_action(action:Action)->int:
    return action_repo.add(action)

def update_action(action_id:int, action:Action)->int:
    if action_repo.get_by_id(action_id) is None:
        raise AppException(404, "Action no existente")
    action.id = action_id
    return action_repo.update(action)

def delete_action(action_id:int)->int:
    return action_repo.delete(action_id)
