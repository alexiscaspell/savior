<a name="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/alexiscaspell/savior">
    <img src="img/savemesuperman.gif" alt="Logo" width="400" height="300">
  </a>

  <h3 align="center">SAVIOR</h3>

  <p align="center">
    Santo salvador de DevOps, protector y resucitador de servicios
    <br />
    <a href="https://github.com/alexiscaspell/savior"><strong>Explora la documentacion »</strong></a>
    <br />
    <br />
    <a href="https://github.com/alexiscaspell/savior/issues">Reportar Bug</a>
    ·
    <a href="https://github.com/alexiscaspell/savior/issues">Sugerir una Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Tabla de Contenido</summary>
  <ol>
    <li>
      <a href="#sobre-el-proyecto">Sobre el proyecto</a>
      <ul>
        <li><a href="#tecnologias-usadas">Tecnologias usadas</a></li>
      </ul>
    </li>
    <li>
      <a href="#empezando">Empezando</a>
      <ul>
        <li><a href="#prerequisitos">Prerequisitos</a></li>
        <li><a href="#instalacion">Instalacion</a></li>
      </ul>
    </li>
    <li><a href="#uso">Uso</a></li>
    <li><a href="#contribucion">Contribucion</a></li>
    <li><a href="#contacto">Contacto</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## Sobre el proyecto

[![Product Screen Shot][product-screenshot]](img/screenshot1.png)

Este proyecto consiste en una rest api la cual se le pueden definir la abstraccion de **service**, y a este se le asocian reglas, las cuales en caso de cumplirse desencadenan acciones o como el santo salvador las llama **consecuencias**. La Restapi esta documentada con Fast
api.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Tecnologias usadas

Para realizar esto se utilizo:

* [![Docker][Docker]][Docker-url]
* [![Python][Python]][Python-url]
* React + Vite + MUI (admin web)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Empezando

El repo está organizado en monorepo:

```
backend/   # FastAPI + SQLite
frontend/  # Admin React + MUI
```

### Prerequisitos

* Docker (opcional)
* Python 3.8+ y Node 20+ (desarrollo local)

### Instalacion

**Docker Compose (API + UI)**

```sh
git clone https://github.com/alexiscaspell/savior.git
cd savior
docker compose up --build
```

- API: http://localhost:5000/docs
- Admin UI: http://localhost:3000

**Desarrollo local**

Backend:

```sh
cd backend
pip install -r requirements.txt
python main.py
```

Frontend (en otra terminal):

```sh
cd frontend
npm install
npm run dev
```

### Tests

```sh
cd backend
pip install -r requirements.txt -r requirements-dev.txt
pytest -v
```

Cubre mock YAML, CRUD de services/sources y pray (incl. `source: null` y happy path con HTTP mockeado).

### CI / Docker Hub

En push a `main` (y tags `v*`), GitHub Actions:

1. Corre tests del backend y build del frontend
2. Publica imágenes multi-arch (`linux/amd64`, `linux/arm64`):
   - [`alexiscaspell/savior`](https://hub.docker.com/r/alexiscaspell/savior) (API)
   - [`alexiscaspell/savior-ui`](https://hub.docker.com/r/alexiscaspell/savior-ui) (admin)

Secrets requeridos en el repo de GitHub:

* `DOCKERHUB_USERNAME`
* `DOCKERHUB_TOKEN`

Localmente:

```sh
export DOCKER_HUB_PERSONAL_TOKEN=...
./scripts/build_and_push.sh 0.0.2
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Uso

### Admin web

Desde la UI podés dar de alta y editar **Services**, **Sources**, **Rules**, **Actions**, **Labels** y ejecutar un **Pray**.

### Configuracion

La configuracion se realiza mediante variables de ambiente, las cuales son:

* **NIVEL_LOGS**: Es el level de logging que tendra la app (default=INFO).
* **DIRECTORIO_LOGS**: Es el directorio donde se guardaran los logs (default= logs/).
* **PYTHON_GUNICORN_WORKERS**: Cantidad de workers que se levantaran en uvicorn (default=1).
* **PYTHON_GUNICORN_CONNECTIONS**: Cantidad de hilos que puede levantar cada worker (default=1000).
* **MOCK**: Si esta en true, se cargaran los datos de ***backend/files/data_hard.yml***.
* **CORS_ORIGINS**: Orígenes permitidos para el frontend (default=`http://localhost:5173,http://localhost:3000`).

### Ejecucion

```sh
docker compose up --build
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- CONTRIBUTING -->
## Contribucion

Este proyecto como tantos otros esta abierto para uso libre de la comunidad, sentite libre de sugerir ideas o cosas a mejorar.

Si queres solucionar un problema o agregar alguna funcionalidad, forkea el proyecto y crea un pull request, tambien podes abrir un issue con el prefijo **Mejora-**

1. Forkea el Proyecto
2. Crea un nuevo Branch (`git checkout -b feature/MiFeature`)
3. Commitea tus cambios (`git commit -m 'Add some Feature'`)
4. Pushea el Branch (`git push origin feature/MiFeature`)
5. Abri un Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- CONTACT -->
## Contacto

Alexis Taberna - alexiscaspell@gmail.com

Link del proyecto: [https://github.com/alexiscaspell/savior](https://github.com/alexiscaspell/savior)

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/alexiscaspell/savior.svg?style=for-the-badge
[contributors-url]: https://github.com/alexiscaspell/savior/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/alexiscaspell/savior.svg?style=for-the-badge
[forks-url]: https://github.com/alexiscaspell/savior/network/members
[stars-shield]: https://img.shields.io/github/stars/alexiscaspell/savior.svg?style=for-the-badge
[stars-url]: https://github.com/alexiscaspell/savior/stargazers
[issues-shield]: https://img.shields.io/github/issues/alexiscaspell/savior.svg?style=for-the-badge
[issues-url]: https://github.com/alexiscaspell/savior/issues
[license-shield]: https://img.shields.io/github/license/alexiscaspell/savior.svg?style=for-the-badge
[license-url]: https://github.com/alexiscaspell/savior/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/alexis-taberna-824690147
[product-screenshot]: https://github.com/alexiscaspell/savior/blob/main/img/screenshot1.png
[Python]: https://github.com/alexiscaspell/savior/blob/main/img/python.ico
[Docker]: https://github.com/alexiscaspell/savior/blob/main/img/logodocker.ico
[Python-url]: https://docs.python.org/3/
[Docker-url]: https://www.docker.com/
