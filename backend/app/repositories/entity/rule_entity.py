from app.utils.sqlite.sqlite_util import ModelEntity,EntityMetadata
from sqlalchemy import Column, String,Integer,ForeignKey
from app.model.rule import Rule,SourceRule
import json
from app.repositories.entity.action_entity import ActionEntity

def list_from_str(some_str,delimiter=",")->list:
    if some_str is None or some_str=="":
        return []
    return some_str.split(delimiter)

class RuleEntity(ModelEntity):
    __tablename__ = 'RULES'
    __table_args__ = {'extend_existing': True}
    __metadata__ = EntityMetadata(id_column="id")

    id = Column(Integer,primary_key=True,autoincrement=True)
    name = Column(String)
    expression = Column(String)
    preconditions = Column(String)
    source_variables = Column(String)
    source_names = Column(String)
    source_renames = Column(String)

    def to_model(self):
        if self.source_names is None:
            self.source_names=""
        renames = {} if not self.source_renames else json.loads(self.source_renames)
        source_rule=SourceRule(variables=list_from_str(self.source_variables),names=list_from_str(self.source_names),renames=renames)

        return Rule(id=self.id,
                    name=self.name,
                    expression=self.expression,
                    preconditions=list_from_str(self.preconditions),
                    actions=[],
                    source=source_rule
                )

    @staticmethod
    def from_model(r: Rule) -> 'RuleEntity':
        sr = r.source if r.source else SourceRule()
        return RuleEntity(  id=r.id,
                            name=r.name,
                            expression=r.expression,
                            preconditions=",".join(r.preconditions or []),
                            source_variables=",".join(sr.variables or []),
                            source_names=",".join(sr.names or []),
                            source_renames=json.dumps(sr.renames or {})
                        )

class ActionRuleEntity(ModelEntity):
    __tablename__ = 'ACTION_RULES'
    __table_args__ = {'extend_existing': True}

    action_id = Column(Integer, ForeignKey(ActionEntity.id), primary_key=True)
    rule_id = Column(Integer, ForeignKey(RuleEntity.id), primary_key=True)

    def to_model(self)->'ActionRuleEntity':
        return self

    @staticmethod
    def from_ids(id_action:int,id_rule:int) -> 'ActionRuleEntity':
        return ActionRuleEntity(action_id=id_action,rule_id=id_rule)

    @staticmethod
    def from_model(a:'ActionRuleEntity') -> 'ActionRuleEntity':
        return a