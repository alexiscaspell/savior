from enum import Enum
from functools import wraps


HTTP_STATUS_ERROR_NEGOCIO = 409


class AppException(Exception):
    '''
    Clase de error basico para manejar errores de negocio o errores dentro de la aplicacion
    que son esperados sus atributos son:

    codigo: usado para quien quiera atrapar la excepcion, se puede usar un str de la forma 'ERROR_ALTA_USUARIO'
    o un codigo numerico, la idea es que alguien pueda hacer un if con este codigo pudiendo hacer algo al respecto

    mensaje: contiene informacion extra en formato texto para una mayor informacion, esto es mas para quien use la api,
    un ejemplo puede ser: 'el usuario ya existe en la base de datos'
    '''

    def __init__(self, codigo, mensaje):
        self.codigo = codigo.value if isinstance(codigo, Enum) else codigo
        self.mensaje = mensaje

    def to_dict(self):
        return {'codigo': self.codigo, 'mensaje': self.mensaje}

    def respuesta_json(self):
        return self.to_dict(), HTTP_STATUS_ERROR_NEGOCIO

class UnauthorizedException(AppException):
    def __init__(self):
        super().__init__(401, 'Usuario no autorizado')

    def __str__(self):
        return self.mensaje


class InvalidTokenException(AppException):
    def __init__(self):
        super().__init__(400, 'Token invalido')

    def __str__(self):
        return self.mensaje

class InvalidPrayException(AppException):
    def __init__(self):
        super().__init__(409, 'Plegaria invalida')

    def __str__(self):
        return self.mensaje

class FailedPrayException(AppException):
    def __init__(self,service_name):
        super().__init__(409, f'No se pudo ejecutar ninguna regla del servicio {service_name}')

    def __str__(self):
        return self.mensaje

class InvalidSourceException(AppException):
    def __init__(self):
        super().__init__(409, 'Source invalida')

    def __str__(self):
        return self.mensaje

class InvalidActionException(AppException):
    def __init__(self):
        super().__init__(409, 'Action invalida')

    def __str__(self):
        return self.mensaje

class ServiceNotFoundException(AppException):
    def __init__(self):
        super().__init__(409, 'Service no existente')

    def __str__(self):
        return self.mensaje
