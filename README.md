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

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Empezando

Para comenzar a usar el proyecto puede buildear la imagen localmente o utilizar la imagen ya buildeada [en la registry de dockerhub](https://hub.docker.com/repository/docker/alexiscaspell/savior/general)

### Prerequisitos

Antes que nada necesitas:
* Docker

### Instalacion

**Docker**

_Para empezar tenes que tener [instalado docker](https://docs.docker.com/engine/install/)_

1. Clona el repositorio
   ```sh
   git clone https://github.com/alexiscaspell/savior.git
   ```
2. Buildea la imagen
   ```sh
   cd savior && docker build -t savior .
   ```
3. Tambien podes usar la ultima version de la imagen ya construida
   ```sh
   docker pull alexiscaspell/savior:latest

**Python**

_En un entorno con [python instalado](https://realpython.com/installing-python/)_

1. Clona el repositorio
   ```sh
   git clone https://github.com/alexiscaspell/savior.git
   ```
2. Instala dependencias
   ```sh
   cd savior && pip install requirements.txt
   ```
3. Finalmente ejecuta la app
   ```sh
   python main.py
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Uso

### Configuracion

La configuracion se realiza mediante variables de ambiente, las cuales son:

* **NIVEL_LOGS**: Es el level de logging que tendra la app (default=INFO).
* **DIRECTORIO_LOGS**: Es el directorio donde se guardaran los logs (default= logs/).
* **PYTHON_GUNICORN_WORKERS**: Cantidad de workers que se levantaran en uvicorn (default=1).
* **PYTHON_GUNICORN_CONNECTIONS**: Cantidad de hilos que puede levantar cada worker (default=1000).
* **MOCK**: Si esta en true, se cargaran los datos de ***files/data_hard.yml***.

### Ejecucion

Para usar la imagen simplemente ejecutar:

```sh
docker run -p 5000:5000 alexiscaspell/savior:latest
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
