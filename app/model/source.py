from app.model.app_model import AppModel,Case,convert_to_case
from enum import Enum
import sys
from app.model.exception import InvalidSourceException
import requests as req

class SourceType(Enum):
    http_log = "http_log"
    http_response = "http_response"
    ssh_log = "ssh_log"
    custom = "custom"

def class_from_str(classname):
    return getattr(sys.modules[__name__], classname)

class Source(AppModel):
    id: str = None
    name: str = None
    type: SourceType
    input: dict 
    output: str

    def get_data(self):
        return self.to_specific_source().get_data()

    def to_specific_source(self):
        classname = convert_to_case(self.type.value,Case.pascal)+"Source"

        try:
            return class_from_str(classname).from_dict(self.to_dict())
        except Exception as _:
            raise InvalidSourceException()

class HttpResponseSource(Source):
    method: str = "get"

    def get_data(self)->object:
        url = self.input["url"]

        if self.method=="get":
            return req.get(url)
        else:
            raise NotImplementedError("Solo se implemento metodo get")