from fastapi import APIRouter
from app.utils.rest_util import get_valid_rest_object
import app.services.savior as savior

import app.config.configuration as conf
from app.config.vars import Vars
from app.model.action import Action
from typing import List

URI = "/actions"
VERSION = "/v1"

blue_print = APIRouter(prefix=conf.get(Vars.API_BASE_PATH)+VERSION+URI, tags=["actions"])


@blue_print.get('', response_model=List[Action])
def get_actions():
    return get_valid_rest_object(savior.get_all_actions())

@blue_print.get('/{action_id}', response_model=Action)
def get_action(action_id:int):
    return get_valid_rest_object(savior.get_action_by_id(action_id))

@blue_print.post('', response_model=int)
def add_action(action:Action):
    return savior.add_action(action)

@blue_print.put('/{action_id}', response_model=int)
def update_action(action_id:int, action:Action):
    return savior.update_action(action_id, action)

@blue_print.delete('/{action_id}', response_model=int)
def delete_action(action_id:int):
    return savior.delete_action(action_id)
