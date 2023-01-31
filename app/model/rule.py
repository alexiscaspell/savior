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

class SourceRule(AppModel):
    variables : List[str] = None
    names : List[str] = None
    renames: dict = {}

class Rule(AppModel):
    id: str = None
    name: str
    expression: str
    source: SourceRule
    actions: List[Action]

    
    def infer_sources(self,sources:List[Source])->List[Source]:
        if self.source.names:
            return list(filter(lambda s:s.name in self.source.names,sources))

        return list(filter(lambda s: s.variable in self.source.variables,sources))

    def collect_data(self,sources: List[Source]):
        sources = self.infer_sources(sources)

        for source in sources:
            if not source.data:
                source.data = source.get_data()

        return sources

    def satisfies(self,service: "Service"):
        sources = self.collect_data(service.sources)

        params = {"svc":service}

        expression = self.expression

        renames = {v: k for k, v in self.source.renames.items()}

        for k in renames:
            expression = expression.replace(k,renames[k])

        for i,source in enumerate(sources):
            expression = expression.replace(source.variable,f"sources[{i}].data")

        params.update({"sources":sources})

        return bool(evaluate(expression,params))
        

    def apply_actions(self,service:"Service"):
        result_rule = ResultRule.from_dict({"name":self.name,"consequences":[]})

        for action in self.actions:
            action_result=action.apply(service)

            logger.info("Action result:")
            logger.info(action_result)

            consequence = Consequence.from_dict({"action":action.name,"result":action_result})

            result_rule.consequences.append(consequence)
        return result_rule

class ResultRule(AppModel):
    name: str
    consequences: List[Consequence]