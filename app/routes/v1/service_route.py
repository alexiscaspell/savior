from fastapi import APIRouter,Request,Body
from app.utils.rest_util import get_valid_rest_object
import app.services.savior as savior
from app.model.label import ServiceLabel


import app.config.configuration as conf
from app.config.vars import Vars
from app.model.service import Service
from typing import List
import yaml

URI = "/services"
VERSION = "/v1"


blue_print = APIRouter(prefix=conf.get(Vars.API_BASE_PATH)+VERSION+URI,tags=["services"])


@blue_print.get('', response_model=List[Service])
def get_services(name:str=None):
    services = savior.get_services_by_name(name) if name else savior.get_all_services()
    return get_valid_rest_object(services)

@blue_print.post('', response_model=int)
def add_service(svc:Service,infer_ids:bool=False):
    id = savior.add_service(svc,infer_ids)
    return id

@blue_print.post('{service_id}/sources/{source_id}/eval')
def eval_service_source(service_id:int,source_id:int):
    result = savior.eval_service_source(service_id,source_id)
    return get_valid_rest_object(result)

@blue_print.post('{service_id}/labels')
def add_label(service_id:int,label:ServiceLabel):
    label.service = Service.dummy(service_id)

    result = savior.add_label(label)
    return get_valid_rest_object(result)

@blue_print.post('/yaml', response_model=int)
def add_service(svc_yaml: str = Body(..., media_type='text/plain')):
    id = savior.add_service(Service.from_dict(yaml.safe_load(svc_yaml)))
    return id