from app.utils.sqlite.sqlite_util import ModelEntity,EntityMetadata
from sqlalchemy import Column, String,Integer,ForeignKey
from app.model.rule import Rule,SourceRule
import json
from app.repositories.entity.source_entity import SourceEntity

def list_from_str(some_str,delimiter=",")->list:
    if some_str is None:
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
        source_rule=SourceRule(variables=list_from_str(self.source_variables),names=list_from_str(self.source_names),renames=json.loads(self.source_renames))

        return Rule(id=self.id,
                    name=self.name,
                    expression=self.expression,
                    preconditions=list_from_str(self.preconditions),
                    actions=[],
                    source=source_rule
                )

    @staticmethod
    def from_model(r: Rule) -> 'RuleEntity':
        sr = r.source
        return RuleEntity(  id=r.id,
                            name=r.name,
                            expression=r.expression,
                            preconditions=",".join(r.preconditions),
                            source_variables=",".join(sr.variables),
                            source_renames=json.dumps(sr.renames)
                        )

class ActionRuleEntity(ModelEntity):
    __tablename__ = 'ACTION_RULES'
    __table_args__ = {'extend_existing': True}

    action_id = Column(Integer, ForeignKey(SourceEntity.id), primary_key=True)
    rule_id = Column(Integer, ForeignKey(RuleEntity.id), primary_key=True)

    def to_model(self)->'ActionRuleEntity':
        return self

    @staticmethod
    def from_ids(id_action:int,id_rule:int) -> 'ActionRuleEntity':
        return ActionRuleEntity(action_id=id_action,rule_id=id_rule)

    @staticmethod
    def from_model(a:'ActionRuleEntity') -> 'ActionRuleEntity':
        return a