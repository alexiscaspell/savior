from app.model.app_model import AppModel,Case,convert_to_case
from enum import Enum
from app.model.exception import InvalidActionException
import sys
from app.utils.logger_util import get_logger
import requests as req
from app.model.context import Context

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
    name: str = None
    type: ActionType
    result: str
    input: dict=None
    context : Context = None


    def apply(self):
        return self.to_specific_action().apply()

    def to_specific_action(self):
        classname = convert_to_case(self.type.value,Case.pascal)
        classname = classname if classname.endswith("Action") else classname+"Action"

        context = self.context
        self.context = None

        full_dict = self.to_dict()
        full_dict.update(self.input if self.input else {})

        try:
            instance=class_from_str(classname).from_dict(full_dict)
            instance.context=context
            return instance        
        except Exception as e:
            logger.warning(e)
            raise InvalidActionException()
    
class SuggestAction(Action):
    def apply(self):
        context = self.context
        result = context.current_rule.get_curated_string(self.result)
        return context.eval(result,context.current_rule_vars())

class HttpAction(Action):
    url: str
    body: dict = None
    method: str
    headers: dict = {}

    def apply(self):
        context = self.context

        url = context.current_rule.get_curated_string(self.url)

        if self.method in ["post","put","patch"]:
            response = getattr(req, self.method)(url,data=self.body,headers=self.headers)
        else:
            response = getattr(req, self.method)(url,headers=self.headers)
            
        result = self.result.replace("$response","response")

        return context.eval(result,{"response":response})

