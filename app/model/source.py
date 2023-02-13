from app.model.app_model import AppModel,Case,convert_to_case
from enum import Enum
import sys
from app.model.exception import InvalidSourceException
import requests as req
from app.utils.logger_util import get_logger
import subprocess
from app.utils.file_util import is_file
from app.model.context import Context
from requests.adapters import HTTPAdapter
from urllib3 import Retry

logger = get_logger(__name__)

class SourceType(Enum):
    http_log = "http_log"
    http_request = "http_request"
    ssh_log = "ssh_log"
    custom = "custom"

def class_from_str(classname):
    return getattr(sys.modules[__name__], classname)

class Source(AppModel):
    id: int = None
    name: str = None
    type: SourceType
    input: dict = {}
    variable: str
    data: object = None
    output: str = None
    context: Context = None

    def get_data(self):
        return self.to_specific_source().get_data()

    def to_specific_source(self):
        classname = convert_to_case(self.type.value,Case.pascal)+"Source"

        context = self.context
        self.context = None
        full_dict = self.to_dict()
        full_dict.update(self.input)

        try:
            instance=class_from_str(classname).from_dict(full_dict)
            instance.context=context
            return instance
        except Exception as e:
            logger.warning(e)
            raise InvalidSourceException()

class HttpRequestSource(Source):
    method: str = "get"
    url: str
    body: object = None
    headers: dict = {}
    retry:int=None
    retry_sleep:int=1

    def get_data(self)->object:
        context = self.context

        args = context.context_vars()

        url = context.get_curated_string(self.url)
        url = context.eval(url,args)

        session = req.Session()
        adapter = HTTPAdapter(max_retries=Retry(total=self.retry, backoff_factor=self.retry_sleep, allowed_methods=None, status_forcelist=[429, 500, 502, 503, 504]))
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        if self.method in ["post","put","patch"]:
            response = getattr(req, self.method)(url,data=self.body,headers=self.headers)
        else:
            response = getattr(req, self.method)(url,headers=self.headers)
        
        args.update({"response":response})

        return response if not self.output else context.eval(self.output,args)

class HttpLogSource(HttpRequestSource):
    def get_data(self) -> str:
        return super().get_data().text

class SshCredentials(AppModel):
    user : str
    password : str = None
    key_file : str = None

class SshLogSource(HttpRequestSource):
    filepath: str
    creds: SshCredentials
    ip: str
    port: int = 22

    def get_data(self) -> str:
        bash_command=""

        if self.password:
            if is_file(self.password):
                bash_command = f"sshpass -f '{self.password}' "
            else:
                bash_command = f"sshpass -p '{self.password}' "

        bash_command = bash_command + f"ssh {self.creds.user}@self.ip -p {self.port} "
        ssh_command = f"'cat {self.filepath}'"

        if self.creds.key_file:
            bash_command = bash_command+f"-i {self.creds.key_file} "

        bash_command = bash_command + ssh_command

        process = subprocess.Popen(bash_command.split(), stdout=subprocess.PIPE)

        output, error = process.communicate()

        return output