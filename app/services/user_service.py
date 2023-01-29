from app.model.user import User
from app.model.exception import UserNotFoundException

ALL_USERS=[User.from_dict({"name":"pepe","phone":"1234","age":42,"id":"1"}),User.from_dict({"id":"2","name":"yisus","age":32,"mail":"yisus.christ@gmail.com","dni":{"number":"0"}})]

def get_all_users():
    global ALL_USERS
    return ALL_USERS

def update_user(user:User):
    global ALL_USERS
    ALL_USERS = list(filter(lambda u:u.id!=user.id,ALL_USERS))
    ALL_USERS.append(user)

def get_user(user_id:str)->User:
    for u in get_all_users():
        if u.id==user_id:
            return u
    raise UserNotFoundException()

