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
      <a href="#conceptos">Conceptos</a>
      <ul>
        <li><a href="#visión-general">Visión general</a></li>
        <li><a href="#service">Service</a></li>
        <li><a href="#source">Source</a></li>
        <li><a href="#rule">Rule</a></li>
        <li><a href="#action-y-consequence">Action y Consequence</a></li>
        <li><a href="#label">Label</a></li>
        <li><a href="#pray">Pray</a></li>
        <li><a href="#ejemplo-completo">Ejemplo completo</a></li>
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



<!-- CONCEPTS -->
## Conceptos

SAVIOR observa servicios, evalúa reglas y dispara acciones (consecuencias) cuando algo anda mal.

```
Service
 ├── vars
 ├── labels  ──────────────► Label (plantilla → otro Service)
 ├── sources[]               (cómo obtener datos)
 └── rules[]
      ├── expression
      ├── source (qué sources usa)
      ├── preconditions
      └── actions[]  ──────► al cumplirse → Consequence[]
```

### Visión general

| Concepto | Qué es en una frase |
|----------|---------------------|
| **Service** | El sistema/API que querés cuidar |
| **Source** | De dónde se obtienen datos (HTTP, SSH, etc.) |
| **Rule** | Condición a evaluar (`expression`) |
| **Action** | Qué hacer si la rule se cumple |
| **Consequence** | Resultado concreto de una action al ejecutar un Pray |
| **Label** | Plantilla reutilizable de vars/rules entre services |
| **Pray** | “Rezá” por un service: evalúa rules y aplica actions |

### Service

Un **service** es el contenedor principal. Agrupa sources, rules, variables (`vars`) y labels.

```yaml
- name: "pruebita"
  vars:
    env: staging
  labels: []          # opcionales; ver Label
  sources: [...]
  rules: [...]
```

Al hacer un **Pray**, SAVIOR carga el service completo (incluyendo rules heredadas por labels) y recorre sus rules en orden (respetando `preconditions`).

### Source

Un **source** define **cómo** obtener datos para evaluar expressions.

Campos importantes:

| Campo | Uso |
|-------|-----|
| `type` | `http_request`, `http_log`, `ssh_log`, `custom` |
| `name` | Identificador opcional (útil para referenciar desde rules) |
| `variable` | Alias en expressions, ej. `$response` |
| `input` | Parámetros según el tipo (url, method, creds, …) |
| `output` | Expresión opcional para transformar la respuesta |

Ejemplo HTTP:

```yaml
- type: http_request
  name: input_alive
  variable: $response_alive
  input:
    method: get
    url: https://httpbin.org/status/200
```

En la expression de una rule, `$response_alive` se reemplaza por los datos de ese source.

### Rule

Una **rule** es una condición. Si se cumple, se ejecutan sus **actions**.

| Campo | Uso |
|-------|-----|
| `name` | Nombre único lógico |
| `expression` | Condición booleana (Python evaluado en contexto) |
| `source` | Qué sources alimentar: `variables`, `names`, `renames` |
| `preconditions` | Nombres de otras rules que deben haberse cumplido antes |
| `actions` | Lista de actions a disparar |

Cómo se eligen los sources de una rule:

- `source.variables: [$response]` → usa sources cuya `variable` esté en esa lista
- `source.names: [input_alive]` → usa sources por `name`
- `source.renames` → renombra variables en la expression (ej. `response_alive → response` para reutilizar `$response`)

Ejemplo:

```yaml
- name: alive_status
  source:
    variables:
      - $response
  expression: "$response.status_code != 200"
  actions:
    - name: suggest-something
      type: suggest
      result: "El endpoint principal respondió mal; probá /alive"
```

### Action y Consequence

Una **action** es la definición de “qué hacer”. Una **consequence** es el resultado de aplicar esa action en un Pray concreto.

Tipos de action:

| `type` | Qué hace |
|--------|----------|
| `suggest` | Evalúa `result` y devuelve un mensaje/sugerencia |
| `http_action` | Hace un HTTP request (`input.url`, `method`, …) y evalúa `result` |
| `set_variable` | Escribe una variable en `service.vars` |
| `ssh` | Ejecuta un comando remoto por SSH |
| `custom` | Extensión custom |

Ejemplo `suggest`:

```yaml
- name: suggest-health
  type: suggest
  result: "Healthcheck falló; revisá el servicio"
```

Ejemplo `http_action`:

```yaml
- name: check-alive
  type: http_action
  input:
    url: https://httpbin.org/status/200
    method: get
  result: "f'Alive check: {$response.status_code}'"
```

Respuesta típica de un Pray (consequences):

```json
{
  "service": "pruebita",
  "rules": [
    {
      "name": "alive_status",
      "consequences": [
        { "action": "suggest-something", "result": "El endpoint principal respondió mal..." },
        { "action": "check-alive", "result": "Alive check: 200" }
      ]
    }
  ]
}
```

### Label

Un **label** es una **plantilla**: asocia un nombre (ej. `http-health`) a un service “modelo”.  
Otro service que declare ese label en su lista `labels` **hereda** al cargarse:

1. las `vars` del template (las propias del service pisan si hay conflicto)
2. las `rules` del template que todavía no tenga

No hereda sources: el consumidor debe tener sus propios sources (con los mismos `name`/`variable` que esperan las rules de la plantilla).

Alta de la asociación (YAML de seed):

```yaml
labels:
  - label: http-health
    service_name: healthcheck_template
```

Service consumidor:

```yaml
- name: api_consumidor
  labels:
    - http-health
  vars:
    env: staging
  sources:
    - type: http_request
      name: health_probe
      variable: $response
      input:
        method: get
        url: https://httpbin.org/status/503
  rules: []   # hereda health_not_ok del template
```

### Pray

**Pray** (“plegaria”) es la operación de ejecución: elegís un service y SAVIOR evalúa sus rules.

```http
POST /api/v1/savior/pray
Content-Type: application/json

{
  "service_id": 1,
  "fast": false,
  "params": {}
}
```

| Campo | Uso |
|-------|-----|
| `service_id` / `service_name` | Qué service evaluar (uno de los dos) |
| `fast` | Si es `true`, corta al primer match |
| `source` | Filtro opcional por source |
| `params` | Dict mergeado al service antes de evaluar |

También lo podés disparar desde la UI en la pantalla **Pray**.

### Ejemplo completo

Flujo mental con el seed (`backend/files/data_hard.yml`):

1. `healthcheck_template` define la rule `health_not_ok` y el label `http-health` apunta a él.
2. `api_consumidor` solo declara `labels: [http-health]` + un source `health_probe`.
3. Al hacer Pray sobre `api_consumidor`:
   - hereda `health_not_ok`
   - consulta el source
   - si `status_code != 200`, dispara `suggest-health`
   - esa ejecución se refleja como **consequence** en la respuesta

Para explorar más ejemplos cargados:

```sh
curl http://localhost:5000/api/v1/services
curl http://localhost:5000/api/v1/labels
curl -X POST http://localhost:5000/api/v1/savior/pray \
  -H 'Content-Type: application/json' \
  -d '{"service_name":"api_consumidor","params":{}}'
```

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
Ver la sección [Conceptos](#conceptos) para el significado de cada uno.

También hay toggle de **tema claro/oscuro** e idioma **ES/EN**.

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
[product-screenshot]: img/screenshot1.png
[Python]: img/python.png
[Docker]: img/logodocker.ico
[Python-url]: https://docs.python.org/3/
[Docker-url]: https://www.docker.com/
