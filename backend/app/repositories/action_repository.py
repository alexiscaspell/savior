
from app.model.action import Action
from app.utils.sqlite import sqlite_util as sql
from app.repositories.entity.action_entity import ActionEntity
from typing import List


def add(new_action:Action)->int:
    action_id = sql.insert(new_action,ActionEntity)
    return action_id

def update(action:Action)->int:
    return sql.update(action, ActionEntity)

def delete(action_id:int)->int:
    sql.delete(action_id, ActionEntity)
    return action_id

def get_by_ids(ids:List[int])->List[Action]:
    if not ids:
        return []
    return sql.select_by_ids(ids,ActionEntity)

def get_all()->List[Action]:
    return sql.select_all(ActionEntity)

def get_by_name(name:str)-> Action:
    action = sql.select_one_by_filter({"name":name},ActionEntity)
    return action

def get_by_id(id:int)-> Action:
    return sql.select_by_id(id, ActionEntity)
