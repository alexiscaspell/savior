from app.model.app_model import AppModel,Case,convert_to_case
from enum import Enum
from app.model.exception import InvalidActionException
import sys
from app.utils.logger_util import get_logger
import requests as req

logger = get_logger(__name__)

def evaluate(expression:str,args):
    return eval(expression,globals(),args)


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
    name: str = None
    type: ActionType
    result: str
    input: dict=None

    def apply(self,service:"Service"):
        return self.to_specific_action().apply(service)

    def to_specific_action(self):
        classname = convert_to_case(self.type.value,Case.pascal)
        classname = classname if classname.endswith("Action") else classname+"Action"

        full_dict = self.to_dict()
        full_dict.update(self.input if self.input else {})

        try:
            return class_from_str(classname).from_dict(full_dict)
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
    headers: dict = {}

    def apply(self,service:"Service"):
        if self.method in ["post","put","patch"]:
            response = getattr(req, self.method)(self.url,data=self.body,headers=self.headers)
        else:
            response = getattr(req, self.method)(self.url,headers=self.headers)
            
        result = self.result.replace("$response","response")

        return evaluate(result,{"response":response})

