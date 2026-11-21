import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Studio } from "./index";
import { askAgent } from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api")>();
  return { ...original, checkHealth: vi.fn().mockResolvedValue(undefined), askAgent: vi.fn() };
});

beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
  vi.mocked(askAgent).mockResolvedValue({ agente: "herramientas", respuesta: "441", detalles: [], fuentes: [], modelo: "gemma3:1b" });
});
afterEach(cleanup);

function send(text: string) {
  fireEvent.change(screen.getByRole("textbox", { name: "Escribe tu mensaje" }), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));
}

describe("Session conversations", () => {
  it("keeps independent history for each agent", async () => {
    render(<Studio />);
    send("Calcula el 18% de 2450");
    await screen.findByText("441");
    fireEvent.click(screen.getByRole("button", { name: "FAQ Mercado Libre Respuestas con fuentes" }));
    expect(screen.queryByText("441")).toBeNull();
    expect(screen.queryByText("Calcula el 18% de 2450")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Calculadora y clima Cálculos y pronósticos" }));
    expect(screen.getByText("441")).toBeInTheDocument();
    expect(screen.getByText("Calcula el 18% de 2450")).toBeInTheDocument();
  });
  it("does not retain history after the session is remounted", async () => {
    const first = render(<Studio />);
    send("Mi pregunta privada");
    await screen.findByText("441");
    first.unmount();
    render(<Studio />);
    await screen.findByText("Conectado");
    expect(screen.queryByText("Mi pregunta privada")).toBeNull();
    expect(screen.queryByText("441")).toBeNull();
  });
  it("retries the same question without duplicating the user message", async () => {
    vi.mocked(askAgent).mockRejectedValueOnce(new Error("Backend desconectado"));
    render(<Studio />);
    send("Mi pregunta original");
    await screen.findByText("Backend desconectado");
    fireEvent.click(screen.getByRole("button", { name: /^Reintentar$/ }));
    await screen.findByText("441");
    expect(screen.getAllByText("Mi pregunta original")).toHaveLength(1);
    expect(vi.mocked(askAgent).mock.calls).toEqual([
      ["herramientas", "Mi pregunta original", "español", "inglés"],
      ["herramientas", "Mi pregunta original", "español", "inglés"],
    ]);
  });
  it("does not create an assistant response on connection failure", async () => {
    vi.mocked(askAgent).mockRejectedValueOnce(new Error("Backend desconectado"));
    const { container } = render(<Studio />);
    send("Pregunta sin conexión");
    await screen.findByText("Backend desconectado");
    await waitFor(() => expect(container.querySelectorAll("article.message-assistant")).toHaveLength(0));
    expect(screen.getByText("Pregunta sin conexión")).toBeInTheDocument();
  });
});