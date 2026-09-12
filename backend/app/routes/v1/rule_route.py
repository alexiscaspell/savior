from fastapi import APIRouter
from app.utils.rest_util import get_valid_rest_object
import app.services.savior as savior

import app.config.configuration as conf
from app.config.vars import Vars
from app.model.rule import Rule
from typing import List

URI = "/rules"
VERSION = "/v1"

blue_print = APIRouter(prefix=conf.get(Vars.API_BASE_PATH)+VERSION+URI, tags=["rules"])


@blue_print.get('', response_model=List[Rule])
def get_rules():
    return get_valid_rest_object(savior.get_all_rules())

@blue_print.get('/{rule_id}', response_model=Rule)
def get_rule(rule_id:int):
    return get_valid_rest_object(savior.get_rule_by_id(rule_id))

@blue_print.post('', response_model=int)
def add_rule(rule:Rule, infer_ids:bool=False):
    return savior.add_rule(rule, infer_ids)

@blue_print.put('/{rule_id}', response_model=int)
def update_rule(rule_id:int, rule:Rule, infer_ids:bool=False):
    return savior.update_rule(rule_id, rule, infer_ids)

@blue_print.delete('/{rule_id}', response_model=int)
def delete_rule(rule_id:int):
    return savior.delete_rule(rule_id)

@blue_print.post('/{rule_id}/actions/{action_id}')
def link_action(rule_id:int, action_id:int):
    return savior.link_action(rule_id, action_id)

@blue_print.delete('/{rule_id}/actions/{action_id}')
def unlink_action(rule_id:int, action_id:int):
    return savior.unlink_action(rule_id, action_id)
