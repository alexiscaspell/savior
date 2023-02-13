from app.utils.sqlite.sqlite_util import ModelEntity,EntityMetadata
from sqlalchemy import Column, String,Integer,ForeignKey
import json
from app.model.service import Service
from app.repositories.entity.rule_entity import RuleEntity
from app.repositories.entity.source_entity import SourceEntity

class ServiceEntity(ModelEntity):
    __tablename__ = 'SERVICES'
    __table_args__ = {'extend_existing': True}
    __metadata__ = EntityMetadata(id_column="id")

    id = Column(Integer,primary_key=True,autoincrement=True)
    name = Column(String)
    vars = Column(String)

    def to_model(self):
        return Service(id=self.id,name=self.name,rules=[],sources=[],vars=json.loads(self.vars))

    @staticmethod
    def from_model(s: Service) -> 'ServiceEntity':
        return ServiceEntity(id=s.id,name=s.name,vars=json.dumps(s.vars))

class SourceServiceEntity(ModelEntity):
    __tablename__ = 'SOURCES_SERVICES'
    __table_args__ = {'extend_existing': True}

    source_id = Column(Integer, ForeignKey(SourceEntity.id), primary_key=True)
    service_id = Column(Integer, ForeignKey(ServiceEntity.id), primary_key=True)

    def to_model(self)->'SourceServiceEntity':
        return self

    @staticmethod
    def from_ids(id_service:int,id_source:int) -> 'SourceServiceEntity':
        return SourceServiceEntity(source_id=id_source,service_id=id_service)

    @staticmethod
    def from_model(ss:'SourceServiceEntity') -> 'SourceServiceEntity':
        return ss

class RuleServiceEntity(ModelEntity):
    __tablename__ = 'RULES_SERVICES'
    __table_args__ = {'extend_existing': True}

    rule_id = Column(Integer, ForeignKey(RuleEntity.id), primary_key=True)
    service_id = Column(Integer, ForeignKey(ServiceEntity.id), primary_key=True)

    def to_model(self)->'RuleServiceEntity':
        return self

    @staticmethod
    def from_ids(id_service:int,id_rule:int) -> 'RuleServiceEntity':
        return RuleServiceEntity(rule_id=id_rule,service_id=id_service)

    @staticmethod
    def from_model(rs:'RuleServiceEntity') -> 'RuleServiceEntity':
        return rs