from fastapi import APIRouter,Request,Body
from app.utils.rest_util import get_valid_rest_object
import app.services.savior as savior


import app.config.configuration as conf
from app.config.vars import Vars
from app.model.service import Service
from typing import List
import yaml

URI = "/services"
VERSION = "/v1"


blue_print = APIRouter(prefix=conf.get(Vars.API_BASE_PATH)+VERSION+URI,tags=["services"])


@blue_print.get('/', response_model=List[Service])
def get_services(name:str=None):
    if name:
        return get_valid_rest_object([savior.get_service_by_name(name)])
    return get_valid_rest_object(savior.get_all_services())

@blue_print.post('/', response_model=int)
def add_service(svc:Service):
    id = savior.add_service(svc)
    return id

@blue_print.post('/yaml', response_model=int)
async def add_service(svc_yaml: str = Body(...)):
    id = savior.add_service(Service.from_dict(yaml.safe_load(svc_yaml)))
    return id