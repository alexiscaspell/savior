from app.model.app_model import AppModel

class Dni(AppModel):
    number: str

class User(AppModel):
    id : str = None
    name: str
    phone : str = None
    age : int
    mail : str = None
    dni: Dni = None

    # def to_dict(self):
    #     return self.dict()

    # def from_dict(spec:dict):
    #     return User.parse_obj(spec)