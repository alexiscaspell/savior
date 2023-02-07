import re
import importlib
from typing import Dict
from copy import copy


def evaluate(expression:str,args:Dict={}):
    args = {} if not args else args
    global_args = globals().update(args)
    local_args = locals().update(args)

    try:
        return eval(expression,global_args,local_args)
    except NameError as ne:
        module=re.findall(r"'([^']*)'", str(ne))[0]
        args.update({module:importlib.import_module(module)})
        return evaluate(expression,args)
    except Exception as e:
        if "'" in expression:
            returned=eval(f'f"{expression}"',global_args,local_args)
        else:
            returned=eval(f"f'{expression}'",global_args,local_args)

        is_str = returned.startswith("f'") and returned.endswith('"')
        is_str = is_str or  (returned.startswith('f"') and returned.endswith("'"))

        if is_str:
            return eval(returned)
        return returned

def safe_evaluate(expression:str,some_args:Dict={}):
    safe_expression = expression.replace("$","")
    safe_args=copy(some_args)

    if (safe_expression.startswith("f'") or safe_expression.startswith("'")) and  safe_expression.endswith("'"):
        safe_expression = 'f"' + safe_expression[2:-1].replace('"',"'") + '"'

    for k in some_args:
        if "$" in k:
            item = safe_args.pop(k)
            safe_args.update({k.replace("$",""):item})

    return evaluate(safe_expression,safe_args)