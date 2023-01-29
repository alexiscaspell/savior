from app.model.app_model import AppModel
from enum import Enum

class SourceType(Enum):
    http_log = "http_log"
    http_response = "http_response"
    ssh_log = "ssh_log"
    custom = "custom"

class Source(AppModel):
    id: str = None
    name: str
    type: SourceType