import { Calculator, BookOpen, Languages } from "lucide-react";
import type { AgentId } from "./api";

export const agents = [
  {
    id: "herramientas" as const,
    name: "Calculadora y clima",
    short: "Cálculos y pronósticos",
    description: "Un poco de precisión para tu día a día.",
    welcome: "¿Qué resolvemos hoy?",
    icon: Calculator,
    className: "agent-tools",
    suggestions: [
      { title: "Haz las cuentas", text: "¿Cuánto es el 18% de 2.450?", icon: Calculator },
      { title: "Consulta el clima", text: "¿Cómo está el clima en Bogotá?", icon: null },
      { title: "Resuelve un cálculo", text: "Calcula (125 × 8) + 340", icon: null },
    ],
  },
  {
    id: "rag" as const,
    name: "FAQ Mercado Libre",
    short: "Respuestas con fuentes",
    description: "Tus dudas sobre Mercado Libre, en un solo lugar.",
    welcome: "Compra con más claridad.",
    icon: BookOpen,
    className: "agent-faq",
    suggestions: [
      { title: "Envíos y entregas", text: "¿Cómo puedo seguir mi envío?", icon: null },
      { title: "Cambios y devoluciones", text: "¿Cómo devuelvo una compra?", icon: null },
      { title: "Pagos y seguridad", text: "¿Qué medios de pago se aceptan?", icon: null },
    ],
  },
  {
    id: "traductor" as const,
    name: "Traductor",
    short: "Palabras sin fronteras",
    description: "La misma idea, en otro idioma.",
    welcome: "Conectemos tus palabras.",
    icon: Languages,
    className: "agent-translator",
    suggestions: [
      { title: "Una conversación", text: "Hola, ¿cómo estás? Me alegra verte.", icon: null },
      { title: "Un correo de trabajo", text: "Gracias por tu tiempo. Quedo atento a tus comentarios.", icon: null },
      { title: "Tu próximo viaje", text: "¿Podrías indicarme cómo llegar a la estación?", icon: null },
    ],
  },
] as const satisfies { id: AgentId; name: string; short: string; description: string; welcome: string; icon: typeof Calculator; className: string; suggestions: { title: string; text: string; icon: typeof Calculator | null }[] }[];

export const languages = ["español", "inglés", "francés", "portugués", "alemán", "italiano", "japonés", "chino"];