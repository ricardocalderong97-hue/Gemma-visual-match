# Gemma Agent Studio

Interfaz web para utilizar tres funcionalidades implementadas en Python con **LangChain, LangGraph y Gemma 3:1b**, ejecutado localmente con **Ollama**:

- **Calculadora y clima:** operaciones matemáticas y consultas de clima (simuladas si `CLIMA_REAL=false`).
- **FAQ Mercado Libre:** consultas a una base documental local mediante RAG y recuperación BM25.
- **Traductor:** traducción de textos entre idiomas.

El frontend fue elaborado con **Lovable, React, TypeScript y Vite**. El backend utiliza **FastAPI** para comunicarse con los agentes de Python. **LangSmith es opcional** y sirve para registrar ejecuciones y evaluaciones. El historial visible en el frontend se guarda temporalmente en la memoria del navegador; se pierde al recargar la página.

## Repositorios

| Componente | Repositorio |
| --- | --- |
| Backend: agentes Python + FastAPI | https://github.com/ricardocalderong97-hue/Agentes-Gemma-MercadoLibre-FAQ |
| Frontend: interfaz web | https://github.com/ricardocalderong97-hue/pixel-perfect-match |

> **Importante:** la aplicación usa un modelo **local**. No basta con abrir el proyecto en la vista previa de Lovable: para consultar los agentes, hay que ejecutar Ollama, el backend y el frontend en el mismo computador. Los datos de clima pueden ser simulados y la base FAQ no se actualiza automáticamente.

## 1. Requisitos previos — Windows

Instala lo siguiente:

1. **Git**: https://git-scm.com/downloads
2. **Python** (recomendado: una versión compatible con `requirements.txt`; el proyecto se ha usado con Python 3.14): https://www.python.org/downloads/
3. **Node.js 22.12 o superior** (incluye npm): https://nodejs.org/
4. **Ollama**: https://ollama.com/download
5. **Visual Studio Code** (recomendado): https://code.visualstudio.com/

Abre VS Code y una terminal **PowerShell** (`Terminal > New Terminal`). Comprueba las instalaciones:

```powershell
python --version
node --version
npm --version
git --version
ollama --version
```

Si algún comando no se reconoce, instala el programa correspondiente y reinicia VS Code.

## 2. Descargar los dos repositorios

En PowerShell, ve a la carpeta donde deseas guardar el proyecto. Por ejemplo:

```powershell
cd "$HOME\Documents"
```

Clona **ambos** repositorios:

```powershell
git clone https://github.com/ricardocalderong97-hue/Agentes-Gemma-MercadoLibre-FAQ.git
git clone https://github.com/ricardocalderong97-hue/pixel-perfect-match.git
```

Al finalizar tendrás dos carpetas independientes:

```text
Documents/
├── Agentes-Gemma-MercadoLibre-FAQ/   # Backend Python
└── pixel-perfect-match/             # Frontend Lovable
```

## 3. Configurar el backend (Python)

Entra al repositorio del backend:

```powershell
cd "$HOME\Documents\Agentes-Gemma-MercadoLibre-FAQ"
```

Crea el entorno virtual con la versión de Python instalada:

```powershell
python -m venv .venv
```

Actívalo:

```powershell
.\.venv\Scripts\Activate.ps1
```

Si PowerShell impide la activación, ejecuta **solo en esa terminal**:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Instala las dependencias del proyecto y de la API:

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install -r requirements_api.txt
```

### Archivo de configuración `.env`

Crea una copia de la plantilla:

```powershell
Copy-Item .env.example .env
```

Abre `.env` en VS Code y asegúrate de que incluya estos valores (conserva cualquier otra variable necesaria de la plantilla):

```dotenv
OLLAMA_MODEL=gemma3:1b
OLLAMA_BASE_URL=http://localhost:11434
CLIMA_REAL=false
LANGSMITH_TRACING=false
LANGSMITH_PROJECT=agentes-gemma-mercadolibre
```

Para registrar trazas en **LangSmith**, crea una clave propia en https://smith.langchain.com y cambia/agrega:

```dotenv
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=PEGA_AQUI_TU_CLAVE_PERSONAL
```

LangSmith **no es obligatorio** para usar la interfaz. **Nunca subas `.env` ni tu clave API a GitHub.**

## 4. Descargar y ejecutar el modelo local

Con Ollama instalado, abre una terminal PowerShell adicional y ejecuta:

```powershell
ollama pull gemma3:1b
```

Comprueba que aparece en la lista:

```powershell
ollama list
```

El servicio de Ollama debe estar ejecutándose. Si no se ha iniciado automáticamente, abre la aplicación Ollama o ejecuta `ollama serve` en una terminal propia (si no hay otro servicio ya escuchando en el mismo puerto).

## 5. Iniciar FastAPI — Terminal 1

Abre una terminal en la carpeta del **backend** y activa `.venv` si aún no lo está:

```powershell
cd "$HOME\Documents\Agentes-Gemma-MercadoLibre-FAQ"
.\.venv\Scripts\Activate.ps1
python -m uvicorn api:app --host 127.0.0.1 --port 8000
```

Deberías ver:

```text
Uvicorn running on http://127.0.0.1:8000
```

**No cierres esta terminal.**

Comprueba que el backend responde en:

- Salud: http://127.0.0.1:8000/salud
- Documentación y pruebas: http://127.0.0.1:8000/docs

En `/docs`, selecciona `POST /preguntar` > **Try it out** y utiliza:

```json
{
  "agente": "herramientas",
  "pregunta": "¿Cuánto es (8+4)*3?",
  "origen": "español",
  "destino": "inglés"
}
```

La respuesta debe contener el resultado **36**. El endpoint devuelve `respuesta`, `detalles`, `fuentes` y `modelo`.

## 6. Configurar el frontend — Terminal 2

Abre **otra terminal** en VS Code (sin cerrar FastAPI) y entra a la carpeta del frontend:

```powershell
cd "$HOME\Documents\pixel-perfect-match"
```

Instala las dependencias. Como el repositorio incluye `package-lock.json`, utiliza:

```powershell
npm ci
```

Crea la configuración local del frontend:

```powershell
Copy-Item .env.example .env.local
```

Abre `.env.local` y confirma que contiene:

```dotenv
VITE_API_URL=http://127.0.0.1:8000
```

Inicia la interfaz:

```powershell
npm run dev
```

Abre en el navegador la dirección **Local** indicada por Vite, normalmente:

http://localhost:8080/

**No cierres la terminal de Vite.** Deja abiertas las dos terminales (FastAPI y Vite) mientras utilizas la aplicación; Ollama también debe seguir funcionando.

## 7. Probar los tres agentes

Desde la interfaz web, selecciona cada sección y realiza una prueba:

| Sección | Consulta de prueba | Resultado esperado |
| --- | --- | --- |
| Calculadora y clima | `¿Cuánto es (8+4)*3?` | `36` |
| Calculadora y clima | `¿Qué clima hace en Cali?` | Respuesta identificada como **simulada** si `CLIMA_REAL=false` |
| FAQ Mercado Libre | `¿Puedo pagar usando Nequi o Daviplata?` | Respuesta basada en las FAQ locales; puede mencionar PSE y mostrar fuentes |
| Traductor (español → inglés) | `El presupuesto del proyecto debe estar listo mañana.` | Traducción al inglés |

Las respuestas del RAG dependen de la **base local** incluida en el backend: no constituyen información en tiempo real ni garantizan que las políticas comerciales actuales sean las mismas.

## 8. Cómo volver a ejecutar la aplicación otro día

**No necesitas reinstalar las dependencias** si ya están instaladas.

1. Abre Ollama o comprueba que sigue activo.
2. Abre la carpeta del backend en VS Code, activa `.venv` y ejecuta:

   ```powershell
   python -m uvicorn api:app --host 127.0.0.1 --port 8000
   ```

3. Abre el frontend en otra ventana/terminal de VS Code y ejecuta:

   ```powershell
   npm run dev
   ```

4. Abre `http://localhost:8080/` o el puerto que indique Vite.

También existe `INICIAR_API.bat` dentro del backend para iniciar su API en Windows.

## 9. Problemas frecuentes

**`python` o `node` no se reconoce.** Comprueba que están instalados y reinicia la terminal. En algunos equipos Windows se usa `py` en lugar de `python`.

**PowerShell bloquea `Activate.ps1`.** Ejecuta `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` únicamente en esa terminal y vuelve a activar el entorno.

**`ollama` no se reconoce / no conecta.** Instala Ollama, comprueba `ollama list`, confirma que `gemma3:1b` está descargado y que el servicio está activo.

**Error `Failed to fetch`, `ERR_CONNECTION_REFUSED` o “desconectado”.** Comprueba que FastAPI siga funcionando en `http://127.0.0.1:8000/salud`, que Vite esté abierto, y que `VITE_API_URL` apunte al puerto correcto. Reinicia `npm run dev` si modificaste `.env.local`.

**Error de CORS.** El backend debe autorizar el origen exacto usado por el frontend, por ejemplo `http://localhost:8080`. `localhost` y `127.0.0.1` no son el mismo origen. Revisa la configuración de CORS en `api.py` si Vite se inició con otro puerto.

**La vista previa de Lovable no responde.** Es normal que la vista previa remota no pueda acceder directamente a `127.0.0.1` de tu computador. Ejecuta el frontend **localmente**.

**Aparecen avisos de npm o dependencias obsoletas.** No ejecutes `npm audit fix --force` sin revisar los posibles cambios incompatibles; comprueba primero con `npm audit`.

**Tildes incorrectas al imprimir README en PowerShell.** Puede ser un problema de codificación de la consola; no implica necesariamente que el archivo Markdown esté dañado. Ábrelo directamente en VS Code o GitHub.

## 10. Arquitectura y funcionamiento

```text
Navegador (Gemma Agent Studio / React)
            |
            | POST /preguntar
            v
FastAPI (Python, puerto 8000)
            |
            +---- Calculadora y clima
            +---- RAG FAQ Mercado Libre
            +---- Traductor
            |
            v
Ollama / Gemma 3:1b (local)
            |
            +---- LangSmith (opcional: trazas y evaluaciones)
```

El frontend envía peticiones al backend mediante `src/lib/api.ts`, que expone `askAgent(agente, pregunta, origen, destino)`. Los identificadores de agente aceptados por la API son `herramientas`, `rag` y `traductor`.

- `GET /salud`: comprueba el estado del backend.
- `GET /agentes`: lista los agentes disponibles.
- `POST /preguntar`: ejecuta la consulta y devuelve una respuesta estructurada.

Los componentes de software se ejecutan **localmente**, excepto la plataforma LangSmith cuando se activa el registro en la nube. El proyecto no requiere una API comercial de inferencia.

## 11. Pruebas técnicas opcionales

Backend, desde la carpeta del proyecto Python:

```powershell
python evaluar.py
```

Frontend, desde la carpeta `pixel-perfect-match`:

```powershell
npm test
npm run build
```

La evaluación académica del RAG reportó **4/4 respuestas que cumplieron criterios específicos** en un conjunto pequeño de cuatro preguntas. No debe interpretarse como precisión general del sistema.

## 12. Notas de seguridad

- Los archivos `.env` y `.env.local` contienen configuraciones locales; las claves privadas nunca deben incluirse en el repositorio.
- `VITE_API_URL` es visible para el navegador y **no** debe contener secretos.
- El backend local de ejemplo no incorpora autenticación. No lo expongas directamente a Internet sin aplicar medidas de seguridad adicionales.
- El proyecto está destinado a fines académicos y demostraciones locales.
