from app.model.app_model import AppModel
from app.model.rule import ResultRule
from typing import List, Dict, Optional

class Pray(AppModel):
    service_id: Optional[int] = None
    service_name: Optional[str] = None
    source: Optional[str] = None
    fast: bool = False
    dry_run: bool = False
    params: Dict = {}

class PrayResponse(AppModel):
    service: str
    rules: List[ResultRule] = []
