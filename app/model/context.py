from app.model.app_model import AppModel
from typing import List,Dict
from app.utils.introspection_util import evaluate

class Context(AppModel):
    service: object
    current_rule:object = None
    current_action:object = None

    def rule_sources(self)->List["Source"]:
        if self.current_rule.source.names:
            return list(filter(lambda s:s.name in self.current_rule.source.names,self.service.sources))

        return list(filter(lambda s: s.variable in self.current_rule.source.variables,self.service.sources))

    def source_vars(self):
        vars={}

        for i,s in enumerate(self.service.sources):
            if s.data:
                vars.update({f"source{i}":s})

        return vars

    def current_rule_vars(self):
        vars=self.source_vars()

        vars.update({"svc":self.service})

        return vars

    
    def get_curated_string(self,some_str:str,sources:List["Source"]=None,renames:Dict=None):
        return_str = some_str
        sources = self.service.sources if not sources else sources
        renames = {v:k for k,v in renames.items()} if renames else {}

        for k in renames:
            return_str = return_str.replace(k,renames[k])

        for i,source in enumerate(sources):
            return_str = return_str.replace(source.variable,f"source{i}.data")

        return return_str

    def eval(self,some_str:str,params:Dict):
        return evaluate(some_str,params)


        

