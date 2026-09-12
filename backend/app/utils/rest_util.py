from app.utils.logger_util import get_logger
from app.model.exception import AppException,InvalidTokenException

from functools import wraps
import os
from bson import ObjectId
import app.config.configuration as conf
from app.config.vars import Vars
from fastapi import Request


def get_token(request):

    token = request.environ.get("HTTP_AUTHORIZATION")

    if "Bearer " not in token:
        raise InvalidTokenException()

    token = token.replace("Bearer ","")

    return token

def get_uri(request):
    host = request.host_url
    base_path = request.url

    return base_path.replace(host[:-1]+conf.get(Vars.API_BASE_PATH),"")

def get_body(request:Request):
    return request.json()


def wrap_rest_response(ok: int = 200, error: int = 500, logger=get_logger(__name__)):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            http_status = ok
            result = {}

            try:
                result = func(*args, **kwargs)

            except AppException as ae:

                logger.exception(ae)
                result,http_status = ae.respuesta_json()
            except Exception as ex:
                result = {}
                logger.exception(ex)
                http_status = 500

            return get_valid_rest_object(result), http_status
        return wrapper
    return decorator

def get_valid_rest_object(some_result):
    if not some_result:
        return some_result
    elif isinstance(some_result,list):
        return [get_valid_rest_object(e) for e in some_result]
    elif isinstance(some_result,dict):
        return some_result
    elif isinstance(some_result,ObjectId):
        return str(some_result)
    elif hasattr(some_result.__class__, 'to_dict') and callable(getattr(some_result.__class__, 'to_dict')):
        return some_result.to_dict()
    else:
        return some_result

