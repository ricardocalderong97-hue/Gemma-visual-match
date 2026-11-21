# Gemma Agent Studio — Entrega conjunta

**Proyecto académico:** agentes con LangChain/LangGraph, Ollama (Gemma 3:1b), FastAPI, Lovable y LangSmith.

## 1. ¿Qué se entrega?

La aplicación está distribuida en **dos repositorios**, que se ejecutan juntos en un computador Windows:

| Parte | Repositorio | Función |
|---|---|---|
| Backend | [Agentes-Gemma-MercadoLibre-FAQ](https://github.com/ricardocalderong97-hue/Agentes-Gemma-MercadoLibre-FAQ) | Agentes Python: calculadora, clima simulado, RAG de FAQ de Mercado Libre, traductor y trazas de LangSmith. API FastAPI. |
| Frontend | [pixel-perfect-match](https://github.com/ricardocalderong97-hue/pixel-perfect-match) | Interfaz web creada en Lovable y ejecutada localmente con Node.js y Vite. |

Este archivo y `INICIAR_GEMMA_STUDIO.bat` constituyen la **guía y el lanzador de la entrega conjunta**. No contienen una copia de los repositorios: se descargan desde GitHub según los pasos siguientes.

> **Alcance:** el RAG usa una colección local de preguntas frecuentes para fines académicos; no consulta en vivo las políticas de Mercado Libre. El clima está configurado con datos simulados. La ejecución de Gemma es local; LangSmith, si se activa, usa Internet para las trazas.

## 2. Requisitos previos

Instalar en Windows:

1. **Git**: https://git-scm.com/downloads/win
2. **Python**: https://www.python.org/downloads/ — se recomienda usar **Python 3.14** para reproducir el entorno del autor, o una versión compatible con `requirements.txt`. Durante la instalación, permitir que Python quede accesible desde PowerShell.
3. **Node.js**: https://nodejs.org/ — versión **22.12 o superior** compatible con el proyecto.
4. **Ollama**: https://ollama.com/download
5. **VS Code** (opcional, pero recomendado): https://code.visualstudio.com/

Abrir **PowerShell** y comprobar:

```powershell
 git --version
 py --version
 node --version
 npm --version
 ollama --version
```

Si un comando no se reconoce, cerrar y volver a abrir PowerShell después de instalar el programa correspondiente.

## 3. Descargar todo en una misma carpeta

Crear una carpeta para la entrega y entrar en ella (puede ser cualquier ubicación):

```powershell
mkdir "$HOME\Documents\Gemma-Agent-Studio-Entrega" -Force
cd "$HOME\Documents\Gemma-Agent-Studio-Entrega"
```

> Si Windows redirige Documentos a OneDrive, este comando sigue creando una carpeta válida. Lo importante es que los **dos repositorios queden uno junto al otro**.

Clonar los proyectos:

```powershell
git clone https://github.com/ricardocalderong97-hue/Agentes-Gemma-MercadoLibre-FAQ.git
git clone https://github.com/ricardocalderong97-hue/pixel-perfect-match.git
```

La estructura debe quedar así:

```text
Gemma-Agent-Studio-Entrega/
├── Agentes-Gemma-MercadoLibre-FAQ/
└── pixel-perfect-match/
```

Si la guía y el lanzador fueron suministrados por separado, copiarlos a `Gemma-Agent-Studio-Entrega/`. También es posible ejecutar el iniciador incluido en `pixel-perfect-match/`.

## 4. Instalar el backend Python

Desde la carpeta raíz de la entrega:

```powershell
cd .\Agentes-Gemma-MercadoLibre-FAQ
py -3.14 -m venv .venv
```

Si `py -3.14` no está disponible, comprobar con `py --list` qué versión compatible está instalada y adaptar el comando (por ejemplo `py -3.12 -m venv .venv`).

Activar el entorno virtual:

```powershell
.\.venv\Scripts\Activate.ps1
```

Si PowerShell bloquea la activación:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Instalar dependencias del proyecto y de la API:

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install -r requirements_api.txt
```

### Configurar el backend

Crear `.env` a partir del ejemplo:

```powershell
Copy-Item .env.example .env
notepad .env
```

Configurar o verificar estas variables:

```dotenv
OLLAMA_MODEL=gemma3:1b
OLLAMA_BASE_URL=http://localhost:11434
CLIMA_REAL=false
LANGSMITH_TRACING=false
LANGSMITH_PROJECT=agentes-gemma-mercadolibre
```

**LangSmith es opcional:** si se desea registrar las ejecuciones, crear una clave propia en https://smith.langchain.com/ y cambiar o agregar en `.env`:

```dotenv
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=PEGAR_AQUI_MI_CLAVE_PRIVADA
```

El proyecto puede usar otras variables preexistentes de `.env.example`: conservarlas. **Nunca publicar `.env` ni compartir la clave.** No colocar la clave en `.env.local` del frontend ni en variables que comiencen con `VITE_`.

## 5. Preparar Ollama y descargar Gemma

Con Ollama instalado:

```powershell
ollama list
```

Si no está `gemma3:1b`, ejecutar:

```powershell
ollama pull gemma3:1b
```

Si Ollama no responde, iniciar la aplicación Ollama desde Windows o abrir otra terminal con `ollama serve`. Dejar el servicio activo.

## 6. Instalar el frontend

Volver a la carpeta de la entrega y entrar al frontend:

```powershell
cd ..\pixel-perfect-match
npm ci
```

`npm ci` usa `package-lock.json` para instalar las versiones del proyecto. Si por algún motivo falla la instalación por diferencias entre el `package.json` y el lockfile, revisar el error y usar `npm install` como alternativa.

Configurar la URL del backend:

```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

Debe contener:

```dotenv
VITE_API_URL=http://127.0.0.1:8000
```

Si `.env.example` no estuviera disponible, se puede crear directamente:

```powershell
'VITE_API_URL=http://127.0.0.1:8000' | Set-Content -Encoding utf8 .env.local
```

No se requiere una cuenta de Lovable para ejecutar el frontend ya descargado.

## 7. Ejecutar la aplicación — opción A: doble clic

**Una vez completada la instalación**, ubicar `INICIAR_GEMMA_STUDIO.bat` en la carpeta raíz de la entrega y hacer **doble clic**.

El iniciador:

1. Comprueba la disponibilidad de Ollama.
2. Abre FastAPI con el entorno `.venv` del backend en `http://127.0.0.1:8000`.
3. Ejecuta el frontend con Vite, normalmente en `http://localhost:8080`.
4. Abre el navegador automáticamente.

**No cerrar las ventanas de los servidores** mientras se utiliza la aplicación. Si un puerto está ocupado, detener procesos anteriores que utilicen 8000 u 8080 y volver a ejecutar el lanzador.

## 8. Ejecutar la aplicación — opción B: manual (tres terminales)

Si se prefiere iniciar cada parte individualmente, desde la carpeta raíz `Gemma-Agent-Studio-Entrega/`:

**Terminal 1 — Ollama:** abrir Ollama en Windows; si no está ejecutándose, iniciar con:

```powershell
ollama serve
```

**Terminal 2 — backend:**

```powershell
cd .\Agentes-Gemma-MercadoLibre-FAQ
.\.venv\Scripts\Activate.ps1
python -m uvicorn api:app --host 127.0.0.1 --port 8000
```

**Terminal 3 — frontend:**

```powershell
cd .\pixel-perfect-match
npm run dev
```

Abrir la dirección local mostrada por Vite, normalmente http://localhost:8080/.

## 9. Comprobar que funciona

1. En http://127.0.0.1:8000/docs se debe abrir la documentación interactiva de FastAPI. También se puede consultar http://127.0.0.1:8000/salud.
2. En la interfaz web, elegir **Calculadora y clima** y preguntar: `¿Cuánto es (8+4)*3?` → resultado esperado: **36**.
3. Consultar: `¿Qué clima hace en Cali?` → debe identificarse como **clima simulado**, no tiempo real.
4. Elegir **FAQ Mercado Libre** y preguntar: `¿Puedo pagar usando Nequi o Daviplata?` → respuesta basada en la documentación local y, cuando corresponda, referencia a PSE y fuentes.
5. Elegir **Traductor** (español → inglés): `El presupuesto del proyecto debe estar listo mañana.` → traducción coherente al inglés.
6. Con LangSmith habilitado, consultar una ejecución nueva en el proyecto configurado. Las trazas requieren conectividad con LangSmith y no incluyen automáticamente todas las operaciones del frontend.

**Evaluación académica previa:** se verificaron **4 de 4 preguntas concretas** del RAG bajo criterios definidos. No debe interpretarse como un 100 % de precisión general.

## 10. Solución de problemas

| Situación | Qué revisar |
|---|---|
| `py` no se reconoce | Instalar Python y usar el selector de versiones disponible; volver a abrir PowerShell. |
| No se puede activar `.venv` | `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` (solo en la terminal actual). |
| No hay respuesta de Gemma | Comprobar `ollama list`, `gemma3:1b` y que Ollama esté ejecutándose. |
| Error en `/preguntar` | Comprobar que Uvicorn muestre `Application startup complete` y que `api.py` esté en la carpeta backend. |
| Frontend indica desconexión | Revisar `VITE_API_URL`, `http://127.0.0.1:8000/salud`, CORS y ambos servidores. |
| Vite utiliza otro puerto | Abrir la URL exacta de la terminal; si el backend no autoriza ese origen, iniciar Vite en el puerto 8080 o configurar CORS. |
| LangSmith no muestra trazas | Verificar `LANGSMITH_TRACING=true`, clave válida, nombre del proyecto, conexión y reinicio de FastAPI. |
| El navegador abre demasiado pronto | Esperar a que Vite indique `ready` y recargar. |
| Avisos de `npm audit` | Revisarlos antes de actualizar dependencias; evitar `npm audit fix --force` sin pruebas. |

## 11. Seguridad y limitaciones

- La aplicación está diseñada para **uso local y demostración académica**, no como servicio público de producción.
- No exponer sin autenticación el puerto 8000 ni Ollama directamente en Internet.
- El historial de chat del frontend se conserva temporalmente en memoria de la pestaña, salvo cambios posteriores del código.
- El RAG usa una base FAQ **local**, no una conexión oficial en vivo con Mercado Libre.
- El clima se configura como **simulado** para evitar depender de una API meteorológica externa.
- Las trazas de LangSmith, cuando se activan, se envían a su plataforma; evitar incluir datos sensibles.

## 12. Código fuente

- Backend: https://github.com/ricardocalderong97-hue/Agentes-Gemma-MercadoLibre-FAQ
- Frontend: https://github.com/ricardocalderong97-hue/pixel-perfect-match

**Entrega:** dos repositorios versionados + una guía de instalación integral + iniciador de Windows. La integración de Python y Lovable fue probada localmente en el computador del autor; la instalación en un equipo nuevo requiere seguir esta guía y comprobar compatibilidad de dependencias.
