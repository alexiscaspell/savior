from app.model.app_model import AppModel,Case,convert_to_case
from enum import Enum
import sys
from app.model.exception import InvalidSourceException
import requests as req
from app.utils.logger_util import get_logger

logger = get_logger(__name__)

class SourceType(Enum):
    http_log = "http_log"
    http_request = "http_request"
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

        full_dict = self.to_dict()
        full_dict.update(self.input)

        try:
            return class_from_str(classname).from_dict(full_dict)
        except Exception as e:
            logger.warning(e)
            raise InvalidSourceException()

class HttpRequestSource(Source):
    method: str = "get"
    url: str
    body: object = None

    def get_data(self)->object:
        if self.method in ["post","put","patch"]:
            return getattr(req, self.method)(self.url,data=self.body)
        else:
            return getattr(req, self.method)(self.url)