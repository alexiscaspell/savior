import os
from enum import Enum

import app.config.mapa_variables as mapa_variables
from app.config.mapa_variables import ENVIRONMENT_MODE, NO_MOSTRAR, APP_NAME


def _get_mapa_variables():
    return getattr(mapa_variables, ENVIRONMENT_MODE)

def _convertir_valor(valor:object,tipo):
    if tipo is None:
        return valor
    elif issubclass(tipo,str):
        return str(valor)
    elif issubclass(tipo,bool):
        return valor=="true" or valor==True
    elif issubclass(tipo,float):
        return float(valor)
    else:
        return valor

def get(variable,tipo=None):
    '''
    Obtiene el valor de la variable de entorno correspondiente, en caso de no obtenerla, 
    la saca del archivo de configuracion
    '''
    variable = variable.value if isinstance(variable, Enum) else variable

    valor = os.environ.get(variable, None)
    
    if valor is None:
        valor=os.environ.get(f"{APP_NAME}".upper()+f"_{variable}", _get_mapa_variables()[variable])

    return _convertir_valor(valor,tipo)


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