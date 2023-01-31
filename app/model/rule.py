from app.model.app_model import AppModel
from app.model.action import Action,Consequence
from app.model.source import Source
from typing import List
from enum import Enum
from app.utils.logger_util import get_logger

logger = get_logger(__name__)

def evaluate(expression:str,args):
    logger.info("Evaluando expresion: ")
    logger.info(expression)

    eval_res = eval(expression,globals(),args)

    logger.info(f"Resultado: {eval_res}")

    return eval_res

class RuleType(Enum):
    http_status = "http_status"
    log_contains = "log_contains"
    custom = "custom"

class Rule(AppModel):
    id: str = None
    name: str
    # type: RuleType = None
    expression: str
    source: Source
    actions: List[Action]

    def satisfies(self,service: "Service"):
        expression = self.expression.replace(self.source.output,"source_data_output")

        source = self.source

        params = {"source_data_output":source.get_data(),"svc":service}

        return bool(evaluate(expression,params))
        

    def apply_actions(self,service:"Service"):
        result_rule = ResultRule.from_dict({"name":self.name,"consequences":[]})

        for action in self.actions:
            action_result=action.apply(service)
            consequence = Consequence.from_dict({"action":action.name,"result":action_result})

            result_rule.consequences.append(consequence)
        return result_rule

class ResultRule(AppModel):
    name: str
    consequences: List[Consequence]