from app.utils.sqlite.sqlite_util import ModelEntity, EntityMetadata
from sqlalchemy import Column, String, Integer, ForeignKey
from typing import Optional
from app.model.service import Service
from app.model.label import ServiceLabel
from app.repositories.entity.service_entity import ServiceEntity


class LabelServiceEntity(ModelEntity):
    """Catalog of labels. Optional template service for rule/var inheritance."""

    __tablename__ = "LABELS_SERVICES"
    __table_args__ = {"extend_existing": True}
    __metadata__ = EntityMetadata(id_column="label")

    label = Column(String, primary_key=True)
    service_id = Column(Integer, ForeignKey(ServiceEntity.id), nullable=True)

    def to_model(self) -> "ServiceLabel":
        service = Service.dummy(self.service_id) if self.service_id is not None else None
        return ServiceLabel(label=self.label, service=service)

    @staticmethod
    def from_model(sl: "ServiceLabel") -> "LabelServiceEntity":
        service_id = sl.service.id if sl.service is not None else None
        return LabelServiceEntity(label=sl.label, service_id=service_id)
