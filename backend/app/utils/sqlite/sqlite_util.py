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
        # Import entities so their tables register on ModelEntity.metadata
        # (needed when only .pyc are present or dynamic load misses files)
        try:
            import app.repositories.entity.service_entity  # noqa: F401
            import app.repositories.entity.source_entity  # noqa: F401
            import app.repositories.entity.rule_entity  # noqa: F401
            import app.repositories.entity.action_entity  # noqa: F401
            import app.repositories.entity.label_entity  # noqa: F401
        except Exception as e:
            logger.warning(f"No se pudieron importar entities explícitamente: {e}")

        for module_type in load_modules_by_path(conf.get(Vars.ENTITY_DIR)):
            module_type.ModelEntity.metadata.create_all(_ENGINE)

        ModelEntity.metadata.create_all(_ENGINE)

def _create_engine(db_name:str=None)->db.Engine:
    global _ENGINE

    if not _ENGINE:
        _ENGINE = db.create_engine(f'sqlite:///{db_name}.db',pool_size=20, max_overflow=0)

    return _ENGINE


def reset(db_name:str=None):
    """Cierra el engine actual y opcionalmente reinicializa con otra DB (tests)."""
    global _ENGINE
    if _ENGINE is not None:
        _ENGINE.dispose()
        _ENGINE = None
    if db_name is not None:
        init(db_name)


def create_session() -> Session:
    return sessionmaker(_create_engine())()

def _metadata():
    return db.MetaData()


def _select_by_ids(ids:list,class_entity:ModelEntity) -> List[ModelEntity]:
    session = create_session()

    q = session.query(class_entity)
    q = q.filter(getattr(class_entity,get_metadata(class_entity).id_column).in_(ids))

    result = q.all()

    session.close()

    return result

def select_by_ids(ids:list,class_entity:ModelEntity) -> List[AppModel]:
    result = _select_by_ids(ids,class_entity)
    return [e.to_model() for e in result]

def _select_by_id(id,class_entity:ModelEntity) -> ModelEntity:
    return _select_one_by_filter({get_metadata(class_entity).id_column:id},class_entity)

def _select_one_by_filter(filter:dict,class_entity:ModelEntity) -> ModelEntity:
    result = _select_by_filter(filter,class_entity)
    return result[0] if len(result)>0 else None

def _select_by_filter(filter:dict,class_entity:ModelEntity) -> List[ModelEntity]:
    session = create_session()

    q = session.query(class_entity).where(
        and_(getattr(class_entity,k).like(filter[k]) for k in filter)
    )

    result = q.all()

    session.close()

    return result

def select_by_id(id,class_entity:ModelEntity) -> AppModel:
    entity = _select_by_id(id,class_entity)
    return entity.to_model() if entity is not None else None

def select_all(class_entity:ModelEntity) -> List[AppModel]:
    session = create_session()

    q = session.query(class_entity)

    result = q.all()

    session.close()

    return [e.to_model() for e in result]

def select_one_by_filter(filter:dict,class_entity:ModelEntity) -> AppModel:
    result = _select_one_by_filter(filter,class_entity)
    return result.to_model() if not result is None else None

def select_by_filter(filter:dict,class_entity:ModelEntity) -> List[AppModel]:
    result = _select_by_filter(filter,class_entity)
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

    new_id = _get_id(entity) if return_id else None

    session.close()

    return new_id


def update(some_obj:AppModel, class_entity: ModelEntity):
    session = create_session()
    entity = class_entity.from_model(some_obj)
    session.merge(entity)
    session.commit()
    session.flush()
    updated_id = _get_id(entity)
    session.close()
    return updated_id


def delete(id,class_entity:ModelEntity):
    session = create_session()

    entity = _select_by_id(id,class_entity)
    if entity is None:
        session.close()
        return

    session.delete(entity)
    session.commit()
    session.flush()
    session.close()

def delete_many(ids,class_entity:ModelEntity):
    entities = _select_by_ids(ids,class_entity)
    delete_by_entities(entities)

def delete_by_entities(entities:List[ModelEntity]):
    if not entities:
        return
    session = create_session()
    try:
        for entity in entities:
            session.delete(session.merge(entity))
        session.commit()
    finally:
        session.close()

def delete_by_filter(filter:dict, class_entity:ModelEntity):
    session = create_session()
    try:
        q = session.query(class_entity).where(
            and_(getattr(class_entity,k).like(filter[k]) for k in filter)
        )
        for entity in q.all():
            session.delete(entity)
        session.commit()
    finally:
        session.close()

def get_table(entity_class:ModelEntity):
    return db.Table(entity_class, _metadata(), autoload=True, autoload_with=_create_engine())