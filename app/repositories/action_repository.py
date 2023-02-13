
from app.model.action import Action
from app.utils.sqlite import sqlite_util as sql
from app.repositories.entity.action_entity import ActionEntity
from typing import List


def add(new_action:Action)->int:
    action_id = sql.insert(new_action,ActionEntity)
    return action_id

def get_by_ids(ids:List[int])->List[Action]:
    return sql.select_by_ids(ids,ActionEntity)