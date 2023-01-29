from app.model.app_model import AppModel
from enum import Enum

class Consequence(AppModel):
    action: str
    result: object

class ActionType(Enum):
    suggest = "suggest"
    http_action = "http_action"
    custom = "custom"

class Action(AppModel):
    id: str
    name: str
    type: ActionType
