from app.utils.sqlite.sqlite_util import ModelEntity,EntityMetadata
from sqlalchemy import Column, String,Integer
import json
from app.model.source import Source,SourceType

class SourceEntity(ModelEntity):
    __tablename__ = 'SOURCES'
    __table_args__ = {'extend_existing': True}
    __metadata__ = EntityMetadata(id_column="id")

    id = Column(Integer,primary_key=True,autoincrement=True)
    name = Column(String)
    type = Column(String)
    input = Column(String)
    variable = Column(String)
    output = Column(String)

    def to_model(self)->Source:
        return Source(id=self.id,name=self.name,type=SourceType[self.type],input=json.loads(self.input),variable=self.variable,output=self.output)

    @staticmethod
    def from_model(s: Source) -> 'SourceEntity':
        return SourceEntity(id=s.id,name=s.name,type=s.type.value,input=json.dumps(s.input),variable=s.variable,output=s.output)