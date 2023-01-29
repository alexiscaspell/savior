import os
from enum import Enum

import app.config.mapa_variables as mapa_variables
from app.config.mapa_variables import ENVIRONMENT_MODE, NO_MOSTRAR, APP_NAME


def _get_mapa_variables():
    return getattr(mapa_variables, ENVIRONMENT_MODE)


def get(variable):
    '''
    Obtiene el valor de la variable de entorno correspondiente, en caso de no obtenerla, 
    la saca del archivo de configuracion
    '''
    variable = variable.value if isinstance(variable, Enum) else variable

    return os.environ.get(f"{APP_NAME}".upper()+f"_{variable}", _get_mapa_variables()[variable])


def variables_cargadas() -> dict:
    '''
    Devuelve el mapa de variables con sus valores instanciados y filtrados por la lista de no mostrados
    '''
    resultado = {}
    for key in _get_mapa_variables().keys():
        if key in NO_MOSTRAR:
            continue

        resultado[key] = get(key)

    return resultado
