import { afterEach, describe, expect, it, vi } from "vitest";
import { askAgent, checkHealth, isRemoteLocalApi, safeSourceUrl, uniqueDetails } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("Local agent API", () => {
  it.each(["herramientas", "rag", "traductor"] as const)("sends the exact agent value %s and default languages", async (agente) => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ agente, respuesta: "Resultado real", detalles: [], fuentes: [], modelo: "gemma3:1b" }) });
    vi.stubGlobal("fetch", fetchMock);
    const result = await askAgent(agente, "Pregunta real");
    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:8000/preguntar", expect.objectContaining({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agente, pregunta: "Pregunta real", origen: "español", destino: "inglés" }) }));
    expect(result.respuesta).toBe("Resultado real");
  });
  it("sends selected translation languages", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ respuesta: "Bonjour" }) });
    vi.stubGlobal("fetch", fetchMock);
    await askAgent("traductor", "Hola", "español", "francés");
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ body: JSON.stringify({ agente: "traductor", pregunta: "Hola", origen: "español", destino: "francés" }) }));
  });
  it("never contacts localhost from the remote preview", async () => {
    vi.stubGlobal("window", { location: { hostname: "example.lovable.app" } });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(askAgent("rag", "Ayuda")).rejects.toThrow("vista previa remota");
    await expect(checkHealth()).rejects.toThrow("vista previa remota");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("returns an error, never a fabricated answer, when disconnected", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(askAgent("herramientas", "2+2")).rejects.toThrow("No se pudo conectar");
  });
  it("consults GET /salud", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "ok" }) });
    vi.stubGlobal("fetch", fetchMock);
    await checkHealth();
    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:8000/salud", expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });
  it("omits tool details already in the response or repeated", () => {
    expect(uniqueDetails("En Bogotá: 18 °C", ["18 °C", " Humedad: 70% ", "Humedad: 70%", ""])).toEqual([" Humedad: 70% "]);
  });
  it("permits local execution and a configured non-local API", () => {
    expect(isRemoteLocalApi("localhost")).toBe(false);
    expect(isRemoteLocalApi("preview.lovable.app", "https://api.example.com")).toBe(false);
  });
  it("only creates clickable HTTP sources", () => {
    expect(safeSourceUrl("https://www.mercadolibre.com/ayuda")).toBe("https://www.mercadolibre.com/ayuda");
    expect(safeSourceUrl("javascript:alert(1)")).toBeNull();
  });
});