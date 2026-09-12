from fastapi import APIRouter
from app.utils.rest_util import get_valid_rest_object
import app.services.savior as savior
from app.model.label import ServiceLabel
from app.model.service import Service

import app.config.configuration as conf
from app.config.vars import Vars
from typing import List

URI = "/labels"
VERSION = "/v1"

blue_print = APIRouter(prefix=conf.get(Vars.API_BASE_PATH)+VERSION+URI, tags=["labels"])


@blue_print.get('', response_model=List[ServiceLabel])
def list_labels():
    return get_valid_rest_object(savior.get_all_labels())

@blue_print.post('', response_model=dict)
def create_label(label:ServiceLabel):
    if label.service is None or label.service.id is None:
        from app.model.exception import AppException
        raise AppException(400, "service.id es requerido")
    savior.add_label(label)
    return {"label": label.label, "service_id": label.service.id}

@blue_print.delete('/{service_id}')
def delete_label(service_id:int, label:str=None):
    return savior.delete_label(service_id, label)
