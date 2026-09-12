FROM python:3.8

ARG TAG=local

RUN apt-get update && \
    apt-get install -y openssh-server sshpass && \
    apt-get clean

WORKDIR /usr/src/

ENV SAVIOR_VERSION=${TAG}
ENV SAVIOR_PYTHON_HOST=0.0.0.0
ENV SAVIOR_PYTHON_PORT=5000
ENV SAVIOR_PYTHON_GUNICORN_WORKERS=1
ENV SAVIOR_PYTHON_GUNICORN_CONNECTIONS=1000
ENV SAVIOR_PYTHON_NOMBRE_APP=main
ENV SAVIOR_PYTHON_NOMBRE_FUNCION_APP=app
ENV SAVIOR_MOCK=true
ENV SAVIOR_ENTITY_DIR=app/repositories/entity/
ENV SAVIOR_AUTOCREATE_DB=true
ENV SAVIOR_DATABASE_NAME=savior_db

COPY ./requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt && rm requirements.txt

COPY ./files ./files
COPY ./app ./app
COPY ./main.py ./main.py

CMD gunicorn -k uvicorn.workers.UvicornWorker \
    -b ${SAVIOR_PYTHON_HOST}:${SAVIOR_PYTHON_PORT} \
    --workers=${SAVIOR_PYTHON_GUNICORN_WORKERS} \
    --worker-connections=${SAVIOR_PYTHON_GUNICORN_CONNECTIONS} \
    ${SAVIOR_PYTHON_NOMBRE_APP}:${SAVIOR_PYTHON_NOMBRE_FUNCION_APP}

EXPOSE ${SAVIOR_PYTHON_PORT}
