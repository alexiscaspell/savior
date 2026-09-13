from fastapi import APIRouter
from app.utils.rest_util import get_valid_rest_object
import app.services.savior as savior
from app.model.label import ServiceLabel
from app.model.exception import AppException

import app.config.configuration as conf
from app.config.vars import Vars
from typing import List, Optional

URI = "/labels"
VERSION = "/v1"

blue_print = APIRouter(prefix=conf.get(Vars.API_BASE_PATH)+VERSION+URI, tags=["labels"])


@blue_print.get('', response_model=List[ServiceLabel])
def list_labels():
    return get_valid_rest_object(savior.get_all_labels())

@blue_print.post('', response_model=dict)
def create_label(label:ServiceLabel):
    if not label.label:
        raise AppException(400, "label es requerido")
    # Template service is optional (tag-only labels).
    savior.add_label(label)
    service_id = label.service.id if label.service is not None else None
    return {"label": label.label, "service_id": service_id}

@blue_print.delete('')
def delete_label_by_name(label: str):
    """Delete a catalog label by name (works for tag-only and templated labels)."""
    if not label:
        raise AppException(400, "label query param es requerido")
    return savior.delete_label(label=label)

@blue_print.delete('/{service_id}')
def delete_label(service_id: int, label: Optional[str] = None):
    # Backward compatible: delete by template service_id (+ optional label filter).
    return savior.delete_label(service_id=service_id, label=label)
