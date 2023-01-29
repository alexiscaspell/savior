
import app.config.configuration as conf
from app.config.vars import Vars
from fastapi import FastAPI,Request
from fastapi.responses import JSONResponse
from app.model.exception import AppException
from app.utils.blueprint_util import registrar_blue_prints
import uvicorn

app = FastAPI()

registrar_blue_prints(app, 'app/routes')

@app.exception_handler(AppException)
async def unicorn_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.codigo,
        content=exc.to_dict(),
    )

if __name__ == '__main__':

    possible_ports = [int(conf.get(Vars.API_PORT)), 80, 5000]

    for port in possible_ports:
        try:
            uvicorn.run(app, host=conf.get(Vars.API_HOST), port=port)
            break
        except:
            continue
