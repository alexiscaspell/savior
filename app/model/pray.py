from app.model.app_model import AppModel
from app.model.rule import ResultRule
from typing import List,Dict

class Pray(AppModel):
    service_id: int = None
    service_name: str = None
    source: str = None
    fast: bool = False
    params: Dict = {}

class PrayResponse(AppModel):
    service: str
    rules: List[ResultRule]