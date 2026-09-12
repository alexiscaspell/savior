from app.model.source import Source
from typing import List
import app.repositories.source_repository as source_repo
from typing import List,Dict
from app.model.context import Context
from app.model.exception import AppException

def get_by_name(name:str)->Source:
    return source_repo.get_by_name(name)

def get_by_id(source_id:int)->Source:
    return source_repo.get_by_id(source_id)

def get_all()->List[Source]:
    return source_repo.get_all()

def add(new_source:Source)->int:
    return source_repo.add(new_source)

def update(source_id:int, source:Source)->int:
    if source_repo.get_by_id(source_id) is None:
        raise AppException(404, "Source no existente")
    source.id = source_id
    return source_repo.update(source)

def delete(source_id:int)->int:
    if source_repo.get_by_id(source_id) is None:
        raise AppException(404, "Source no existente")
    return source_repo.delete(source_id)

def eval(source_id:int,params:Dict):
    source = source_repo.get_by_id(source_id)
    if source is None:
        raise AppException(404, "Source no existente")

    context = Context.from_dict(params)

    source.context = context

    return source.get_data()
