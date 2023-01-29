from fastapi import APIRouter
from app.utils.rest_util import get_valid_rest_object
import app.services.savior as savior

import app.config.configuration as conf
from app.config.vars import Vars
from app.model.pray import PrayResponse,Pray

URI = "/savior"
VERSION = "/v1"


blue_print = APIRouter(prefix=conf.get(Vars.API_BASE_PATH)+VERSION+URI,tags=["savior"])


@blue_print.post('/helpme', response_model=PrayResponse)
def help_me(pray:Pray):
    response = savior.helpme(pray)
    return get_valid_rest_object(response)