
from app.model.source import Source
from app.utils.sqlite import sqlite_util as sql
from app.repositories.entity.source_entity import SourceEntity
from typing import List


def add(new_source:Source)->int:
    source_id = sql.insert(new_source,SourceEntity)
    return source_id

def get_by_ids(ids:List[int])->List[Source]:
    return sql.select_by_ids(ids,SourceEntity)

def get_by_name(name:str)-> Source:
    source = sql.select_one_by_filter({"name":name},SourceEntity)

    return source