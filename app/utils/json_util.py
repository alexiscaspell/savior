

import json
import datetime
from bson import ObjectId
import decimal

DEFAULT_DATETIME_FORMAT = "%Y-%m-%dT%H:%M:%SZ"
DEFAULT_DATE_FORMAT = "%Y-%m-%d"

def encoder(o):
    if isinstance(o, datetime.datetime):
        return o.strftime(DEFAULT_DATETIME_FORMAT)
    elif isinstance(o, datetime.date):
        return o.strftime(DEFAULT_DATE_FORMAT)
    elif isinstance(o, (decimal.Decimal, ObjectId)):
        return str(o)
    elif hasattr(o.__class__, 'to_dict') and callable(getattr(o.__class__, 'to_dict')):
        return o.to_dict()
    else:
        try:
            return dict(o)
        except Exception as _:
            return str(o)

def decoder(some_class):
    def func(o):
        if type(o.__class__) is not type(dict):
            o = json.loads(o)

        if some_class is dict:
            return o
        else:
            try:
                return some_class(o)
            except Exception as _:
                return some_class(**o)

    return func

def to_json(o)->str:
    return json.dumps(o,default=encoder)

def from_json(o,return_class=dict):
    dict_json = json.loads(o)
    converter = decoder(return_class)

    if type(dict_json.__class__) is list:
        return [converter(e) for e in dict_json]
            
    return converter(dict_json)