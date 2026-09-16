from app.model.app_model import AppModel,Case,convert_to_case
from enum import Enum
from app.model.exception import InvalidActionException
import sys
from app.utils.logger_util import get_logger
import requests as req
from app.model.context import Context
from app.utils.ssh_util import SshCredentials as SshCreds,execute_command

logger = get_logger(__name__)

class Consequence(AppModel):
    action: str
    result: object

class ActionType(Enum):
    suggest = "suggest"
    http_action = "http_action"
    set_variable = "set_variable"
    ssh = "ssh"
    custom = "custom"

def class_from_str(classname):
    return getattr(sys.modules[__name__], classname)
    

from typing import Optional

class Action(AppModel):
    id: Optional[int] = None
    name: Optional[str] = None
    type: ActionType
    result: str = ""
    input: Optional[dict] = None
    context : Optional[Context] = None


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
    
class SetVariableAction(Action):
    expression: str
    variable: str
    
    def apply(self):
        context = self.context
        expression = context.current_rule.get_curated_string(self.expression)

        variable = context.current_rule.get_curated_string(self.variable)
        variable = context.eval(variable,context.context_vars())

        result = context.eval(expression,context.context_vars())
        context.service.vars.update({variable:result})

        return None

class SuggestAction(Action):
    def apply(self):
        context = self.context
        result = context.current_rule.get_curated_string(self.result)
        return context.eval(result,context.context_vars())

class HttpAction(Action):
    url: str
    body: dict = None
    method: str
    headers: dict = {}

    def apply(self):
        context = self.context
        args = context.context_vars()

        url = context.current_rule.get_curated_string(self.url)
        url = context.eval(url, args)

        body = self.body
        if isinstance(body, str):
            body = context.current_rule.get_curated_string(body)
            body = context.eval(body, args)
        elif isinstance(body, dict):
            # Allow templated string values inside JSON body
            curated = {}
            for k, v in body.items():
                if isinstance(v, str):
                    v = context.current_rule.get_curated_string(v)
                    v = context.eval(v, args)
                curated[k] = v
            body = curated

        if self.method in ["post", "put", "patch"]:
            response = getattr(req, self.method)(url, data=body, headers=self.headers)
        else:
            response = getattr(req, self.method)(url, headers=self.headers)

        result = self.result.replace("$response", "response")
        # Include service context so result templates can mention svc.vars.*
        eval_args = dict(args)
        eval_args["response"] = response
        return context.eval(result, eval_args)

class SshCredentials(AppModel):
    user : str
    password : str = None
    key_file : str = None

class SshAction(Action):
    command: str
    creds: SshCredentials
    ip: str
    port: int = 22

    def apply(self)->str:
        creds = SshCreds(self.creds.user,self.creds.password,self.creds.key_file)
        bash_command = self.context.current_rule.get_curated_string(self.command) 
        bash_command = self.context.eval(bash_command,self.context.context_vars())

        return execute_command(bash_command,self.ip,creds,self.port)
