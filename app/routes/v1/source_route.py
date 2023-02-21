from fastapi import APIRouter,Request,Body
from app.utils.rest_util import get_valid_rest_object
import app.services.source_service as source_svc
from typing import Dict


import app.config.configuration as conf
from app.config.vars import Vars
from app.model.source import Source
from typing import List
import yaml

URI = "/sources"
VERSION = "/v1"


blue_print = APIRouter(prefix=conf.get(Vars.API_BASE_PATH)+VERSION+URI,tags=["sources"])


@blue_print.get('', response_model=List[Source])
def get_sources(name:str=None):
    sources = source_svc.get_by_name(name) if name else source_svc.get_all()
    return get_valid_rest_object(sources)

@blue_print.post('', response_model=int)
def add_source(source:Source):
    id = source_svc.add(source)
    return id

@blue_print.post('/{source_id}/eval')
def eval_source(source_id:int,params:Dict):
    result = source_svc.eval(source_id,params)
    return get_valid_rest_object(result)