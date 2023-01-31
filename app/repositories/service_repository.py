from app.model.service import Service
from typing import List

SERVICES = []

def get_all()-> List[Service]:
    global SERVICES
    for service in SERVICES:
        for source in service.sources:
            source.data=None
    return SERVICES

def add(new_service:Service):
    global SERVICES
    new_id = len(SERVICES)+1
    new_service.id = new_service.id if new_service.id else f"{new_id}"
    SERVICES.append(new_service)

def get_by_id(id:str)-> Service:
    return list(filter(lambda s:s.id==id,get_all()))[0]

def get_by_name(name:str)-> Service:
    return list(filter(lambda s:s.name==id,get_all()))[0]
