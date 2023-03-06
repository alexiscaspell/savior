from app.model.app_model import AppModel
from app.model.rule import Rule
from typing import List
from app.model.source import Source
from typing import Dict

class Service(AppModel):
    id: int = None
    name: str
    rules: List[Rule] = []
    sources: List[Source] = []
    vars: Dict = {}
    labels: List[str] = []

    def ordered_rules(self)->List[Rule]:
        rules_wo_preconditions = list(filter(lambda r:len(r.preconditions)==0,self.rules))
        rules_w_preconditions = list(filter(lambda r:len(r.preconditions)>0,self.rules))
        ordered_rules = rules_wo_preconditions

        while len(rules_w_preconditions)>0:
            rule = rules_w_preconditions.pop()
            all_satisfy = all(p in list(map(lambda r:r.name,ordered_rules)) for p in rule.preconditions)

            list_to_append = ordered_rules if all_satisfy else rules_w_preconditions

            list_to_append.append(rule)

        return ordered_rules

    @staticmethod
    def dummy(id:int=None)->"Service":
        return Service(id=id,name="",rules=[],sources=[],vars=dict())
