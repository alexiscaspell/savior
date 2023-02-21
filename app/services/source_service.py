from app.model.source import Source
from typing import List
import app.repositories.source_repository as source_repo
from typing import List,Dict
from app.model.context import Context

def get_by_name(name:str)->Source:
    return source_repo.get_by_name(name)

def get_all()->List[Source]:
    return source_repo.get_all()

def add(new_source:Source)->int:
    return source_repo.add(new_source)

def eval(source_id:int,params:Dict):
    source = source_repo.get_by_id(source_id)

    context = Context.from_dict(params)

    source.context = context

    return source.get_data()

