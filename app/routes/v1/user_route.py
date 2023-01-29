from fastapi import APIRouter
from app.utils.rest_util import get_valid_rest_object
import app.services.user_service as user_service

import app.config.configuration as conf
from app.config.vars import Vars
from app.model.user import User
from typing import List

URI = "/users"
VERSION = "/v1"


blue_print = APIRouter(prefix=conf.get(Vars.API_BASE_PATH)+VERSION+URI,tags=["users"])


@blue_print.get('', response_model=List[User])
def get_users():
    users = user_service.get_all_users()
    return get_valid_rest_object(users)

@blue_print.get('/{user_id}', response_model=User)
def get_user(user_id):
    user = user_service.get_user(user_id)
    return get_valid_rest_object(user)