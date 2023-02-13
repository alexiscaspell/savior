from app.utils.sqlite.sqlite_util import ModelEntity,EntityMetadata
from sqlalchemy import Column, String,Integer
from app.model.action import Action,ActionType
import json
from app.utils.json_util import to_json,from_json


class ActionEntity(ModelEntity):
    __tablename__ = 'ACTIONS'
    __table_args__ = {'extend_existing': True}
    __metadata__ = EntityMetadata(id_column="id")

    id = Column(Integer,primary_key=True,autoincrement=True)
    name = Column(String)
    type = Column(String)
    input = Column(String)
    result = Column(String)

    def to_model(self)->Action:
        return Action(id=self.id,
                    name=self.name,
                    type=ActionType[self.type],
                    input=from_json(self.input),
                    result=self.result
                )

    @staticmethod
    def from_model(a: Action) -> 'ActionEntity':
        input = {} if a.input is None else a.input
        return ActionEntity(id=a.id,
                            name=a.name,
                            type=a.type.value,
                            input=to_json(input),
                            result=a.result
                        )