from app.model.app_model import AppModel,Case,convert_to_case
from enum import Enum
import sys
import json
import os
from app.model.exception import InvalidSourceException
import requests as req
from app.utils.logger_util import get_logger
from app.model.context import Context
from requests.adapters import HTTPAdapter
from urllib3 import Retry
from app.utils.ssh_util import SshCredentials as SshCreds,execute_command

logger = get_logger(__name__)

class SourceType(Enum):
    http_log = "http_log"
    http_request = "http_request"
    ssh_log = "ssh_log"
    custom = "custom"
    python_script = "python_script"

def class_from_str(classname):
    return getattr(sys.modules[__name__], classname)

from typing import Optional

class Source(AppModel):
    id: Optional[int] = None
    name: Optional[str] = None
    type: SourceType
    input: dict = {}
    variable: str
    data: object = None
    output: Optional[str] = None
    context: Optional[Context] = None

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

class SshLogSource(Source):
    filepath: str
    creds: SshCredentials
    ip: str
    port: int = 22

    def get_data(self) -> str:
        creds = SshCreds(self.creds.user,self.creds.password,self.creds.key_file)
        bash_command = f"'cat {self.filepath}'"

        return execute_command(bash_command,self.ip,creds,self.port)


class PythonScriptSource(Source):
    """Run a Python snippet; assign `result` to produce source data.

    Available: svc, requests, json, os, source0..N (already collected), context.
    Optional `output` expression formats `result` / `response` after the script.
    """

    script: str = ""

    def get_data(self) -> object:
        context = self.context
        args = context.context_vars()

        script = self.script or ""
        if not script and isinstance(self.input, dict):
            script = self.input.get("script") or ""
        if not script:
            raise InvalidSourceException()

        script = context.get_curated_string(script)

        ns = dict(args)
        ns["result"] = None
        ns["requests"] = req
        ns["json"] = json
        ns["os"] = os
        ns["context"] = context

        try:
            exec(script, ns, ns)  # noqa: S102 — intentional user-defined source scripts
        except Exception as e:
            logger.exception("python_script source failed")
            raise InvalidSourceException() from e

        data = ns.get("result")

        if self.output:
            eval_args = dict(args)
            eval_args.update({k: v for k, v in ns.items() if not str(k).startswith("_")})
            eval_args["result"] = data
            eval_args["response"] = data
            return context.eval(self.output, eval_args)

        return data


class CustomSource(PythonScriptSource):
    """Legacy alias of python_script (`type: custom`)."""
    pass
