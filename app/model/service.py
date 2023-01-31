from app.model.app_model import AppModel
from app.model.rule import Rule
from typing import List
from app.model.source import Source

class Service(AppModel):
    id: str = None
    name: str
    rules: List[Rule]
    sources: List[Source]