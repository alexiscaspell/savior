FROM python:3.8

ARG TAG=local

RUN apt-get update && \
    apt-get install -y openssh-server sshpass

RUN apt-get clean

WORKDIR /usr/src/

# VARIABLES PREDEFINIDAS
ENV SAVIOR_VERSION=${TAG}

ENV SAVIOR_PYTHON_HOST=0.0.0.0
ENV SAVIOR_PYTHON_PORT=5000
ENV SAVIOR_PYTHON_GUNICORN_WORKERS=1
ENV SAVIOR_PYTHON_GUNICORN_CONNECTIONS=1000
ENV SAVIOR_PYTHON_NOMBRE_APP=main
ENV SAVIOR_PYTHON_NOMBRE_FUNCION_APP=app


# EJECUCION
CMD gunicorn -k uvicorn.workers.UvicornWorker \
    -b ${SAVIOR_PYTHON_HOST}:${SAVIOR_PYTHON_PORT} \
    --reload \
    --workers=${SAVIOR_PYTHON_GUNICORN_WORKERS} \
    --worker-connections=${SAVIOR_PYTHON_GUNICORN_CONNECTIONS} \
    ${SAVIOR_PYTHON_NOMBRE_APP}:${SAVIOR_PYTHON_NOMBRE_FUNCION_APP}

EXPOSE ${SAVIOR_PYTHON_PORT}


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