from importlib.util import module_from_spec, spec_from_file_location
from types import ModuleType
from typing import List
from app.utils.file_util import get_file_name,list_files


def load_module_by_path(module_path: str) -> ModuleType:
    module_name = get_file_name(module_path)

    spec = spec_from_file_location(module_name, module_path)
    module = module_from_spec(spec)
    spec.loader.exec_module(module)

    return module

def get_modules_paths(path: str) -> List[str]:
    return list(filter(lambda p:'__pycache__' not in p and p.endswith(".py"),list_files(path)))

def load_modules_by_path(path: str) -> List[ModuleType]:
    modules = []
    module_paths = get_modules_paths(path)

    for path in module_paths:
        modules.append(load_module_by_path(path))
        
    return modules