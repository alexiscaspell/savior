'''
Herramienta que carga de formma dinamica los blueprints de flask recursivamente
que se encuentren en un directorio
'''
import re
from importlib.util import module_from_spec, spec_from_file_location
from os import listdir, path

from fastapi import FastAPI

__version__ = '1.1.0'


def _nombre_archivo(ruta: str):
    '''
    Devuelve el nombre del archivo al final de la ruta sin la extension
    '''
    return path.basename(ruta).split(".")[0]


def _cargar_rutas_de_archivos(ruta_base: str):
    '''
    Obtiene las rutas de todos los archivos .py dentro del directorio parametro, 
    es recursivo por lo que si hay carpetas dentro tambien busca ahi
    '''
    sub_rutas = listdir(ruta_base)
    if '__pycache__' in sub_rutas:
        sub_rutas.remove('__pycache__')
    
    if ".pyc" in ruta_base:
        return []

    rutas_archivos = []
    directorios = []
    for i in sub_rutas:
        ruta_completa = path.join(ruta_base, i)

        if path.isfile(ruta_completa):
            rutas_archivos.append(ruta_completa)

        if path.isdir(ruta_completa):
            directorios.append(ruta_completa)

    for d in directorios:
        rutas_archivos.extend(_cargar_rutas_de_archivos(d))

    return rutas_archivos


def registrar_blue_prints(app: FastAPI, directorio_rutas: str):
    '''
    Registra los archivos dentro de `directorio_rutas` recursivamente como Blueprints para Flask,
    pera esto es necesario que se defina un atributo llamado `blue_print` en cada archivo python. \n
    Ejemplo:
    ```
    from flask import Blueprint
    blue_print = Blueprint('nombre_unico_de_ruta', __name__, url_prefix='/api/v1/ejemplos')
    ```
    '''
    rutas = _cargar_rutas_de_archivos(directorio_rutas)

    for ruta_archivo in rutas:
        nombre_modulo = _nombre_archivo(ruta_archivo)

        spec = spec_from_file_location(nombre_modulo, ruta_archivo)
        modulo = module_from_spec(spec)
        spec.loader.exec_module(modulo)

        app.include_router(modulo.blue_print)