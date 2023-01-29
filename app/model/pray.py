from app.model.app_model import AppModel
from app.model.rule import ResultRule
from typing import List

class Pray(AppModel):
    service_id: str = None
    service_name: str = None
    source: str = None
    fast: bool = False

class PrayResponse(AppModel):
    service: str
    rules: List[ResultRule]