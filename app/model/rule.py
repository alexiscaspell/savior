from app.model.app_model import AppModel
from app.model.action import Action,Consequence
from app.model.source import Source
from typing import List
from enum import Enum
from app.utils.logger_util import get_logger
from app.model.context import Context

logger = get_logger(__name__)

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
    preconditions: List[str] = []
    result:bool = None
    context: Context = None

    def to_dict(self):
        context = self.context
        self.context = None
        my_dict = super().to_dict()
        self.context=context
        return my_dict

    def collect_data(self):
        sources = self.context.rule_sources()

        for source in sources:
            if not source.data:
                source.context = self.context
                source.data = source.get_data()

        return sources

    def satisfy_preconditions(self):
        return all(list(filter(lambda r:r.name==p,self.context.service.rules))[0].result for p in self.preconditions)

    def satisfies(self):
        if self.result:
            return self.result

        if not self.satisfy_preconditions():
            self.result = False
            return self.result

        logger.info(f"Ejecutando rule {self.name} ...")

        context = self.context

        context.current_rule = self
        
        self.collect_data()

        params = context.context_vars()

        expression = self.get_curated_string(self.expression)

        self.result = bool(context.eval(expression,params))

        logger.info(f"Resultado: {self.result}")

        return self.result

    def get_curated_string(self,some_str:str):
        return self.context.get_curated_string(some_str,renames=self.source.renames)
        
    def apply_actions(self):
        context = self.context

        result_rule = ResultRule.from_dict({"name":self.name,"consequences":[]})

        for action in self.actions:
            context.current_action = action

            action.context = context

            action_result = action.apply()

            logger.info("Action result:")
            logger.info(action_result)

            consequence = Consequence.from_dict({"action":action.name,"result":action_result})

            result_rule.consequences.append(consequence)

        return result_rule

class ResultRule(AppModel):
    name: str
    consequences: List[Consequence]