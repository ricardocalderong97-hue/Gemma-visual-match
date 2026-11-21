# Gemma Agent Studio

Interfaz en español para tres agentes de un backend Python existente con Ollama y Gemma 3:1b. No incluye generación de respuestas, autenticación, base de datos ni APIs comerciales. Los historiales independientes viven únicamente en memoria y se pierden al recargar o cerrar la pestaña.

## Ejecución local

1. Descarga o clona este repositorio desde GitHub y abre una terminal en su carpeta.
2. Instala Node.js 22.12+ y las dependencias:

   ```sh
   npm install
   ```

3. Crea `.env.local` en la raíz (no se sube a GitHub):

   ```dotenv
   VITE_API_URL=http://127.0.0.1:8000
   ```

   También puedes copiar `.env.example` a `.env.local`. Sin esta variable se utiliza la misma dirección por defecto. La URL es pública en el navegador: no añadas contraseñas o claves privadas.

4. Arranca tu backend Python y Ollama por separado, con el modelo Gemma 3:1b disponible. Este repositorio no modifica ni instala tu backend.
5. Inicia la aplicación:

   ```sh
   npm run dev
   ```

6. Abre en **tu computador** la dirección local que muestra Vite en la terminal. Si modificas `.env.local`, reinicia `npm run dev`.

## Vista previa de Lovable

La vista previa remota sirve para revisar la interfaz, no para conectar con tu computador. Mientras `VITE_API_URL` apunte a localhost o 127.0.0.1, se bloquean las peticiones a `/salud` y `/preguntar` desde un dominio remoto. No se crean respuestas ficticias. Para usar tu modelo, ejecuta el proyecto localmente.

## Contrato del backend

`src/lib/api.ts` exporta `askAgent(agente, pregunta, origen='español', destino='inglés')`.

```http
POST /preguntar
Content-Type: application/json
```

```json
{
  "agente": "herramientas",
  "pregunta": "¿Cuánto es el 18% de 2450?",
  "origen": "español",
  "destino": "inglés"
}
```

Valores exactos de agente: `herramientas`, `rag`, `traductor`.

Respuesta esperada:

```ts
{
  agente: 'herramientas' | 'rag' | 'traductor';
  respuesta: string;
  detalles: string[];
  fuentes: string[];
  modelo: string;
}
```

`GET /salud` debe devolver un estado HTTP satisfactorio y JSON válido. Se consulta al abrir localmente y al comprobar de nuevo la conexión. Las fuentes HTTP/HTTPS son enlaces; los detalles de herramientas que ya figuran en la respuesta no se repiten. El tiempo máximo por petición es de 120 segundos.

### CORS y solución de problemas

- Autoriza en el backend el **origen exacto** de Vite que ves en la terminal, por ejemplo `http://localhost:8080` o `http://localhost:5173`. `localhost` y `127.0.0.1` son orígenes distintos.
- Para FastAPI, configura `CORSMiddleware` con esos orígenes, métodos `GET`, `POST`, `OPTIONS` y la cabecera `Content-Type`.
- Si aparece un error de conexión, verifica `/salud`, el puerto Python, Ollama y CORS. El botón **Reintentar** vuelve a enviar la misma pregunta y los mismos idiomas sin duplicar el mensaje del usuario.
- Si usas otro computador para Python, cambia `VITE_API_URL` por su IP de red y permite el origen del frontend; no uses una URL HTTPS para llamar a un backend HTTP sin considerar las restricciones del navegador.

## Estructura y comandos

- `src/routes/index.tsx`: estudio y estado de conversaciones en memoria.
- `src/lib/agents.ts`: agentes e idiomas.
- `src/lib/api.ts`: peticiones de navegador y validación de conexión.
- `src/styles.css`: sistema visual y adaptación a pantallas pequeñas.
- `npm test`: pruebas de contrato API, conexión y navegación.
- `npm run build`: compilación de la aplicación.

La plantilla de Lovable conserva React + TypeScript + Vite y TanStack Start como infraestructura obligatoria. La lógica del estudio es exclusivamente frontend: ninguna petición al modelo se ejecuta en servidor ni se implementan funciones de backend. No es una plantilla Vite SPA independiente.
