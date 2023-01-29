FROM python:3.8

ARG TAG=local

WORKDIR /usr/src/


# VARIABLES PREDEFINIDAS
ENV PYTHON_FASTAPI_TEMPLATE_VERSION=${TAG}

ENV PYTHON_FASTAPI_TEMPLATE_PYTHON_HOST=0.0.0.0
ENV PYTHON_FASTAPI_TEMPLATE_PYTHON_PORT=5000
ENV PYTHON_FASTAPI_TEMPLATE_PYTHON_GUNICORN_WORKERS=1
ENV PYTHON_FASTAPI_TEMPLATE_PYTHON_GUNICORN_CONNECTIONS=1000
ENV PYTHON_FASTAPI_TEMPLATE_PYTHON_NOMBRE_APP=main
ENV PYTHON_FASTAPI_TEMPLATE_PYTHON_NOMBRE_FUNCION_APP=app


# EJECUCION
CMD gunicorn -k uvicorn.workers.UvicornWorker \
    -b ${PYTHON_FASTAPI_TEMPLATE_PYTHON_HOST}:${PYTHON_FASTAPI_TEMPLATE_PYTHON_PORT} \
    --reload \
    --workers=${PYTHON_FASTAPI_TEMPLATE_PYTHON_GUNICORN_WORKERS} \
    --worker-connections=${PYTHON_FASTAPI_TEMPLATE_PYTHON_GUNICORN_CONNECTIONS} \
    ${PYTHON_FASTAPI_TEMPLATE_PYTHON_NOMBRE_APP}:${PYTHON_FASTAPI_TEMPLATE_PYTHON_NOMBRE_FUNCION_APP}

EXPOSE ${PYTHON_FASTAPI_TEMPLATE_PYTHON_PORT}


# DEPENDENCIAS
RUN pip install compile --upgrade pip

COPY ./requirements.txt .
COPY ./files ./files

RUN pip install -r requirements.txt
RUN rm requirements.txt


# COMPILACION
COPY ./app ./src/app
COPY ./main.py ./src

RUN python -m compile -b -f -o ./dist ./src
RUN mv -f ./dist/src/* .