from copy import deepcopy,copy
from enum import Enum
from stringcase import snakecase,camelcase,pascalcase
import datetime
from pydantic import BaseModel

class Case(Enum):
    camel = "camel"
    snake = "snake"
    pascal = "pascal"

def convert_to_case(cadena:str,case:Case):
    if case==Case.snake:
        return snakecase(cadena)
    elif case==Case.pascal:
        return pascalcase(cadena)
    else:
        return camelcase(cadena)

def _cast_to_datetime(value):
    converted_value = None
    possible_formats = ["%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%S.%f",
                        "%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S", '%Y-%m-%d %H:%M:%S', "%Y-%m-%dT%H:%M:%SZ"]

    for possible_format in possible_formats:
        try:
            converted_value = datetime.datetime.strptime(
                str(value).lstrip().rstrip(), possible_format)
            return converted_value
        except BaseException as e:
            continue

    raise RuntimeError(f"No es posible castear {value} a datetime")

def change_keys(obj, convert):
    """
    Recursively goes through the dictionary obj and replaces keys with the convert function.
    """
    if isinstance(obj, (str, int, float)):
        return obj
    if isinstance(obj, dict):
        new = obj.__class__()
        for k, v in obj.items():
            new[convert(k)] = change_keys(v, convert)
    elif isinstance(obj, (list, set, tuple)):
        new = obj.__class__(change_keys(v, convert) for v in obj)
    else:
        return obj
    return new

def model_metadata(args):
    def decorate(func):
        func.__model_metadata__ = args
        return func
    return decorate


class AppModel(BaseModel):

    def __new__(cls, *args,**kwargs):
        return super().__new__(cls)

    def to_dict(self,case=Case.snake):

        # self_dict = copy(self.__dict__)
        # BaseModel function
        self_dict = self.dict()

        for key, value in self.__dict__.items():
            
            if isinstance(value,list):
                new_list=[]
                for e in value:
                    if hasattr(e.__class__, 'to_dict'):
                        e = e.to_dict()
                        
                    new_list.append(e)
                    
                self_dict[key]=new_list

            elif hasattr(value.__class__, 'to_dict'):
                self_dict[key] = value.to_dict()

            elif isinstance(value, Enum):
                self_dict[key] = value.value

        for attrname in dir(self.__class__):
            if isinstance(getattr(self.__class__, attrname), property):
                self_dict[attrname] = getattr(self, attrname)

        if case!=Case.snake:
            self_dict = change_keys(self_dict,lambda k: convert_to_case(k,case))

        return self_dict

    @classmethod
    def _format_parameter(cls, some_object, some_class):
        if(isinstance(some_object,list)):
            return [cls._format_parameter(e,some_class) for e in some_object]
        elif issubclass(some_class, AppModel):
            return some_class.from_dict(some_object)
        elif issubclass(some_class, Enum):
            return some_class(some_object)
        elif issubclass(some_class, datetime.datetime):
            return _cast_to_datetime(some_object)

    @classmethod
    def from_dict(cls, some_dict,case=Case.snake):

        if case!=Case.snake:
            some_dict = change_keys(copy(some_dict),lambda k: convert_to_case(k,Case.snake))

        new_dict = copy(some_dict)

        # for arg in cls.__fields__:
        #     if arg in some_dict:
        #         new_dict.update({arg: cls._format_parameter(
        #             some_dict[arg], cls.__model_metadata__[arg])})

        try:
            return cls(**new_dict)
        except Exception as _:
            return cls(new_dict)

    def __repr__(self):
        return self.__str__()

    def __str__(self):
        return str(self.to_dict())
        
    def clone(self):
        return self.__class__.from_dict(self.to_dict())
