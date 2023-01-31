from app.model.app_model import AppModel,Case,convert_to_case
from enum import Enum
from app.model.exception import InvalidActionException
import sys
from app.utils.logger_util import get_logger
import requests as req

logger = get_logger(__name__)

class Consequence(AppModel):
    action: str
    result: object

class ActionType(Enum):
    suggest = "suggest"
    http_action = "http_action"
    custom = "custom"

def class_from_str(classname):
    return getattr(sys.modules[__name__], classname)
    

class Action(AppModel):
    id: str = None
    name: str
    type: ActionType
    result: str

    def apply(self,service:"Service"):
        return self.to_specific_action().apply(service)

    def to_specific_action(self):
        classname = convert_to_case(self.type.value,Case.pascal)+"Action"

        try:
            return class_from_str(classname).from_dict(self.to_dict())
        except Exception as e:
            logger.warning(e)
            raise InvalidActionException()
    
class SuggestAction(Action):
    def apply(self,service:"Service"):
        return self.result

class HttpAction(Action):
    url: str
    body: dict = None
    method: str

    def apply(self,service:"Service"):
        if self.method in ["post","put","patch"]:
            return getattr(req, self.method)(self.url,data=self.body)
        else:
            getattr(req, self.method)(self.url)

