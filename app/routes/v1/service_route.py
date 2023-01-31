from fastapi import APIRouter
from app.utils.rest_util import get_valid_rest_object
import app.services.savior as savior

import app.config.configuration as conf
from app.config.vars import Vars
from app.model.service import Service
from typing import List

URI = "/services"
VERSION = "/v1"


blue_print = APIRouter(prefix=conf.get(Vars.API_BASE_PATH)+VERSION+URI,tags=["services"])


@blue_print.get('/', response_model=List[Service])
def get_services(name:str=None):
    if name:
        return get_valid_rest_object([savior.get_service_by_name(name)])
    return get_valid_rest_object(savior.get_all_services())