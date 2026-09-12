from fastapi import APIRouter,Body
from app.utils.rest_util import get_valid_rest_object
import app.services.source_service as source_svc
from typing import Dict

import app.config.configuration as conf
from app.config.vars import Vars
from app.model.source import Source
from typing import List

URI = "/sources"
VERSION = "/v1"


blue_print = APIRouter(prefix=conf.get(Vars.API_BASE_PATH)+VERSION+URI,tags=["sources"])


@blue_print.get('', response_model=List[Source])
def get_sources(name:str=None):
    sources = source_svc.get_by_name(name) if name else source_svc.get_all()
    if name and sources and not isinstance(sources, list):
        sources = [sources]
    elif name and not sources:
        sources = []
    return get_valid_rest_object(sources)

@blue_print.get('/{source_id}', response_model=Source)
def get_source(source_id:int):
    source = source_svc.get_by_id(source_id)
    return get_valid_rest_object(source)

@blue_print.post('', response_model=int)
def add_source(source:Source):
    id = source_svc.add(source)
    return id

@blue_print.put('/{source_id}', response_model=int)
def update_source(source_id:int, source:Source):
    return source_svc.update(source_id, source)

@blue_print.delete('/{source_id}', response_model=int)
def delete_source(source_id:int):
    return source_svc.delete(source_id)

@blue_print.post('/{source_id}/eval')
def eval_source(source_id:int,params:Dict):
    result = source_svc.eval(source_id,params)
    return get_valid_rest_object(result)
