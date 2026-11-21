export type AgentId = "herramientas" | "rag" | "traductor";

export interface AgentResponse {
  agente: AgentId;
  respuesta: string;
  detalles: string[];
  fuentes: string[];
  modelo: string;
}

export const API_URL = (import.meta.env['VITE_API_URL'] || "http://127.0.0.1:8000").replace(/\/+$/, "");
const localHosts = new Set(["localhost", "127.0.0.1", "[::1]", "::1", "0.0.0.0"]);

export function isRemoteLocalApi(pageHostname: string, apiUrl = API_URL): boolean {
  try {
    return localHosts.has(new URL(apiUrl).hostname) && !localHosts.has(pageHostname);
  } catch {
    return false;
  }
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function assertBrowserConnection() {
  if (typeof window === "undefined") {
    throw new ApiError("La conexión al modelo solo se realiza desde el navegador.");
  }
  if (isRemoteLocalApi(window.location.hostname)) {
    throw new ApiError("La vista previa remota no puede acceder a tu modelo local. Descarga el proyecto y ejecuta npm run dev en tu computador.");
  }
}

async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  assertBrowserConnection();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    const response = await fetch(`${API_URL}${path}`, { ...init, signal: controller.signal });
    if (!response.ok) {
      throw new ApiError(`El servidor devolvió un error (${response.status}). Comprueba el backend Python e inténtalo de nuevo.`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("El modelo tardó demasiado en responder. Comprueba Ollama y vuelve a intentarlo.");
    }
    throw new ApiError(`No se pudo conectar con ${API_URL}. Comprueba que Python y Ollama estén activos y que el backend permita el origen del frontend (CORS).`);
  } finally {
    clearTimeout(timeout);
  }
}

export async function askAgent(
  agente: AgentId,
  pregunta: string,
  origen = "español",
  destino = "inglés",
): Promise<AgentResponse> {
  const data = await request("/preguntar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agente, pregunta, origen, destino }),
  });
  if (!data || typeof data !== "object" || !("respuesta" in data) || typeof data.respuesta !== "string") {
    throw new ApiError("El backend no devolvió una respuesta válida. Revisa el formato de /preguntar.");
  }
  const record = data as Record<string, unknown>;
  const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  return {
    agente,
    respuesta: data.respuesta,
    detalles: strings(record['detalles']),
    fuentes: strings(record['fuentes']),
    modelo: typeof record['modelo'] === "string" ? record['modelo'] : "",
  };
}

export async function checkHealth(): Promise<void> {
  await request("/salud");
}

export function uniqueDetails(response: string, details: string[]): string[] {
  const normalize = (text: string) => text.toLocaleLowerCase("es").replace(/\s+/g, " ").trim();
  const main = normalize(response);
  const seen = new Set<string>();
  return details.filter((detail) => {
    const normalized = normalize(detail);
    if (!normalized || main.includes(normalized) || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export function safeSourceUrl(source: string): string | null {
  try {
    const url = new URL(source);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}