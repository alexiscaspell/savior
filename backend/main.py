import app.config.configuration as conf
from app.config.vars import Vars
from fastapi import FastAPI,Request,status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.model.exception import AppException
from app.utils.blueprint_util import registrar_blue_prints
import uvicorn
from app.services import savior
import app.utils.sqlite.sqlite_util as sql
from app.utils.logger_util import get_logger

app = FastAPI(title="SAVIOR API", version="1.0.0")

logger=get_logger(__name__)

cors_origins = [o.strip() for o in str(conf.get(Vars.CORS_ORIGINS)).split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

registrar_blue_prints(app, 'app/routes')

sql.init(conf.get(Vars.DATABASE_NAME))

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):

    exc_str = f'{exc}'.replace('\n', ' ').replace('   ', ' ')
    # or logger.error(f'{exc}')
    logger.error(request, exc_str)
    content = {'status_code': 10422, 'message': exc_str, 'data': None}
    return JSONResponse(content=content, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

@app.exception_handler(AppException)
async def unicorn_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.codigo if isinstance(exc.codigo, int) and 400 <= exc.codigo < 600 else 409,
        content=exc.to_dict(),
    )

if conf.get(Vars.MOCK,bool):
    savior.mock("files/data_hard.yml")

if __name__ == '__main__':

    possible_ports = [int(conf.get(Vars.API_PORT)), 80, 5000]

    for port in possible_ports:
        try:
            uvicorn.run(app, host=conf.get(Vars.API_HOST), port=port)
            break
        except:
            continue
