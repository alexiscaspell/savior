from app.utils.sqlite.sqlite_util import ModelEntity,EntityMetadata
from sqlalchemy import Column, String,Integer,ForeignKey
import json
from app.model.service import Service
from app.model.label import ServiceLabel
from app.repositories.entity.service_entity import ServiceEntity

class LabelServiceEntity(ModelEntity):
    __tablename__ = 'LABELS_SERVICES'
    __table_args__ = {'extend_existing': True}

    label = Column(String)
    service_id = Column(Integer, ForeignKey(ServiceEntity.id), primary_key=True)

    def to_model(self)->'ServiceLabel':
        service = Service.dummy(self.service_id)
        return ServiceLabel(label=self.label,service=service)

    @staticmethod
    def from_model(sl:'ServiceLabel') -> 'LabelServiceEntity':
        return LabelServiceEntity(label=sl.label,service_id=sl.service.id)