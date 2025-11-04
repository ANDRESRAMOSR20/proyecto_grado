# Manual Técnico – Sistema de Preselección ATS

**Autor:** Andrés Ramos
**Fecha:** Noviembre 2025
**Versión:** 1.0

---

## 1. Descripción General del Sistema

El **Sistema de Preselección ATS (Applicant Tracking System)** es una aplicación web diseñada para optimizar el proceso de gestión y filtrado de candidatos dentro de un entorno empresarial o institucional. Este sistema permite centralizar la información de los postulantes, gestionar sus datos mediante una base de datos estructurada y ofrecer herramientas automatizadas de análisis, preselección y almacenamiento.

El proyecto está desarrollado bajo una arquitectura modular que separa la lógica de negocio, la gestión de datos y la interfaz de usuario. El núcleo del sistema se encuentra implementado en **Python**, con soporte de **PostgreSQL** para la gestión de datos y contenedores **Docker** para la portabilidad y despliegue.

---

## 2. Arquitectura del Proyecto

El sistema sigue una arquitectura **cliente-servidor** compuesta por:

* **Frontend (Interfaz de usuario):** Encargado de la interacción con el usuario. Aunque no se incluye en esta versión del repositorio, el backend está preparado para consumir peticiones desde interfaces web o móviles.
* **Backend (API RESTful):** Implementado en **Python** mediante el archivo principal `app.py`, donde se centralizan las rutas, la conexión con la base de datos y los servicios de negocio.
* **Base de datos:** Implementada con **PostgreSQL**, configurada mediante el archivo `pg_hba.conf` y gestionada a través de Docker.
* **Contenedorización:** El uso de **Dockerfile** y `docker-compose.yml` permite el despliegue automatizado del entorno de desarrollo y producción.

### 2.1 Diagrama General de Arquitectura

```
[ Cliente Web / API Consumer ]
          ↓
     [ Backend Python ]  ←→  [ PostgreSQL Database ]
          ↓
      [ Docker Container ]
```

---

## 3. Tecnologías y Dependencias

| Componente                | Descripción / Versión sugerida                     |
| ------------------------- | -------------------------------------------------- |
| **Lenguaje principal**    | Python 3.12                                        |
| **Framework / Librerías** | FastAPI / Flask (según implementación en `app.py`) |
| **Base de datos**         | PostgreSQL 14+                                     |
| **Contenedorización**     | Docker y Docker Compose                            |
| **Gestión de entornos**   | `.env`, `.venv`                                    |
| **Sistema operativo**     | Compatible con Windows, Linux y macOS              |

Dependencias adicionales se encuentran definidas en el archivo `requirements.txt`, el cual se instala automáticamente durante la configuración del entorno.

---

## 4. Estructura de Carpetas del Proyecto

```
preseleccion_ats/
│
├── backend_ats/                  # Núcleo del sistema backend
│   ├── app.py                    # Archivo principal de ejecución
│   ├── requirements.txt          # Dependencias del proyecto
│   ├── Dockerfile                # Configuración de imagen Docker
│   ├── docker-compose.yml        # Orquestación de contenedores
│   ├── .env                      # Variables de entorno
│   ├── pg_hba.conf               # Configuración de PostgreSQL
│   ├── wait-for-postgres.sh      # Script de espera de base de datos
│   ├── README_QDRANT.md          # Documentación sobre Qdrant
│   └── .venv/                    # Entorno virtual de Python
│
├── .gitignore                    # Exclusiones de control de versiones
├── README.md                     # Descripción general del proyecto
└── .idea/                        # Configuración del IDE (PyCharm)
```

---

## 5. Requisitos del Sistema

Para la instalación y ejecución del sistema se requieren los siguientes componentes:

* **Python 3.10 o superior**
* **Docker Engine** y **Docker Compose**
* **PostgreSQL** (si se ejecuta fuera de contenedor)
* **Git** (para control de versiones y despliegue)

**Recursos mínimos recomendados:**

* CPU: 2 núcleos
* Memoria RAM: 4 GB
* Espacio en disco: 2 GB libres

---

## 6. Instalación y Configuración

### 6.1 Clonación del Repositorio

```bash
git clone https://github.com/usuario/preseleccion_ats.git
cd preseleccion_ats/backend_ats
```

### 6.2 Creación del Entorno Virtual

```bash
python -m venv .venv
source .venv/bin/activate   # En Linux/Mac
.venv\Scripts\activate      # En Windows
```

### 6.3 Instalación de Dependencias

```bash
pip install -r requirements.txt
```

### 6.4 Configuración del Archivo `.env`

El archivo `.env` define las variables de entorno del sistema, incluyendo la conexión a la base de datos. Un ejemplo básico:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ats_db
DB_USER=admin
DB_PASSWORD=admin123
```

---

## 7. Despliegue con Docker

El sistema puede ejecutarse de forma completamente contenedorizada mediante Docker.

### 7.1 Construcción de la Imagen

```bash
docker build -t preseleccion_ats_backend .
```

### 7.2 Ejecución con Docker Compose

```bash
docker-compose up -d
```

Esto iniciará los servicios definidos (backend y base de datos) de forma automatizada.

---

## 8. Configuración de la Base de Datos

El sistema utiliza **PostgreSQL** como motor principal. La configuración se gestiona a través de los archivos:

* `pg_hba.conf` → define los métodos de autenticación.
* `wait-for-postgres.sh` → garantiza que la base de datos esté disponible antes de iniciar el backend.

El esquema de base de datos puede inicializarse mediante scripts SQL incluidos o mediante ORM, según lo especificado en `app.py`.

---

## 9. Ejecución del Backend

Una vez configurado el entorno, el backend se ejecuta con el siguiente comando:

```bash
python app.py
```

Por defecto, el sistema se ejecutará en el puerto **8000** (o el especificado en las variables de entorno).

---

## 10. Mantenimiento y Recomendaciones

* Mantener actualizado el archivo `requirements.txt` tras cada instalación de nuevos paquetes.
* Realizar respaldos periódicos de la base de datos PostgreSQL.
* Controlar versiones mediante Git y evitar subir el entorno `.venv`.
* Utilizar ramas de desarrollo y producción para evitar conflictos en despliegues.
* Documentar nuevas rutas o servicios API dentro del archivo `README_QDRANT.md` o en una nueva guía técnica.

---

## 11. Conclusión

El **Sistema de Preselección ATS** representa una solución modular, escalable y portable para la gestión automatizada de candidatos. Su estructura basada en Docker, junto con la integración de Python y PostgreSQL, permite mantener un flujo de desarrollo eficiente y adaptable a distintos entornos de producción o investigación.

---

**Fin del Documento**

