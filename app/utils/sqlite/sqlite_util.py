import sqlalchemy as db
from app.utils.logger_util import get_logger
from sqlalchemy.orm import Session, sessionmaker
from app.model.app_model import AppModel
from typing import List
from sqlalchemy.ext.declarative import declarative_base
from app.utils.reflection.modules_util import load_modules_by_path
import app.config.configuration as conf
from app.config.vars import Vars

from sqlalchemy import or_,and_


logger = get_logger(__name__)
_ENGINE = None
ModelEntity = declarative_base()

class EntityMetadata(AppModel):
    id_column:str = "id"


def init(db_name:str):
    _create_engine(db_name)

    if conf.get(Vars.AUTOCREATE_DB,bool):
        for module_type in load_modules_by_path(conf.get(Vars.ENTITY_DIR)):
            module_type.ModelEntity.metadata.create_all(_ENGINE)

    # global ModelEntity

    # ModelEntity = automap_base()
    # ModelEntity.prepare(_ENGINE, reflect=auto_create_tables)

def _create_engine(db_name:str=None)->db.Engine:
    global _ENGINE

    if not _ENGINE:
        _ENGINE = db.create_engine(f'sqlite:///{db_name}.db')

    return _ENGINE


def create_session() -> Session:
    return sessionmaker(_create_engine())()

def _metadata():
    return db.MetaData()


def select_by_ids(ids:list,class_entity:ModelEntity) -> List[AppModel]:
    session = create_session()

    q = session.query(class_entity)
    q = q.filter(getattr(class_entity,get_metadata(class_entity).id_column).in_(ids))

    result = q.all()

    return [e.to_model() for e in result]

def select_by_id(id,class_entity:ModelEntity) -> AppModel:
    result = select_by_filter({get_metadata(class_entity).id_column:id},class_entity)

    return result[0] if len(result)>0 else None

def select_all(class_entity:ModelEntity) -> List[AppModel]:
    session = create_session()

    q = session.query(class_entity)

    result = q.all()

    session.close()

    return [e.to_model() for e in result]

def select_one_by_filter(filter:dict,class_entity:ModelEntity) -> AppModel:
    session = create_session()

    result = session.query(class_entity).get(filter)

    session.close()

    return result.to_model()

def select_by_filter(filter:dict,class_entity:ModelEntity) -> List[AppModel]:
    session = create_session()

    q = session.query(class_entity).where(
        and_(getattr(class_entity,k).like(filter[k]) for k in filter)
    )

    result = q.all()

    session.close()

    return [e.to_model() for e in result]

def get_metadata(entity:ModelEntity):
    try:
        return entity.__metadata__
    except Exception as _:
        return EntityMetadata()

def _get_id(entity:ModelEntity):
    return getattr(entity,get_metadata(entity).id_column)


def insert(some_obj:AppModel,class_entity: ModelEntity,return_id=True):
    session = create_session()

    entity = class_entity.from_model(some_obj)

    session.add(entity)
    session.commit()
    session.flush()

    session.refresh(entity)

    if return_id:
        return _get_id(entity)


def delete(id,class_entity:ModelEntity):
    session = create_session()

    entity = select_by_id(id,class_entity)

    session.delete(entity)
    session.commit()
    session.flush()

def get_table(entity_class:ModelEntity):
    return db.Table(entity_class, _metadata(), autoload=True, autoload_with=_create_engine())