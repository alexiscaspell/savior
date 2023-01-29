from app.model.app_model import AppModel
from app.model.action import Action,Consequence
from app.model.source import Source
from typing import List
from enum import Enum

class RuleType(Enum):
    http_status = "http_status"
    log_contains = "log_contains"
    custom = "custom"

class Rule(AppModel):
    id: str = None
    name: str
    type: RuleType
    source: Source
    actions: List[Action]

    def apply_actions(self):
        raise NotImplementedError("Funcionalidad no implementada")

class ResultRule(AppModel):
    name: str
    consequences: List[Consequence]