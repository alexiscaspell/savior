from app.model.app_model import AppModel
from app.model.rule import Rule
from typing import List

class Service(AppModel):
    id: str = None
    name: str
    rules: List[Rule]