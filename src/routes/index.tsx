import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, ArrowUp, ArrowUpRight, Check, ChevronRight, CloudSun, Copy, Cpu, ExternalLink, Globe2, Loader2, Menu, RotateCcw, Settings2, ShieldCheck, Sparkles, Trash2, User, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_URL, askAgent, checkHealth, isRemoteLocalApi, safeSourceUrl, uniqueDetails, type AgentId, type AgentResponse } from "@/lib/api";
import { agents, languages } from "@/lib/agents";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gemma Agent Studio · Tu espacio de IA local" },
      { name: "description", content: "Conversa con tus agentes locales de Gemma: calculadora y clima, FAQ Mercado Libre y traductor. Un estudio privado, claro y en español." },
      { property: "og:title", content: "Gemma Agent Studio · Tu espacio de IA local" },
      { property: "og:description", content: "Tres agentes, un espacio. Cálculos, consultas con fuentes y traducciones con Gemma 3:1b local." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Studio,
});

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
  response?: AgentResponse;
}
interface PendingQuestion { pregunta: string; origen: string; destino: string }
interface Conversation {
  messages: Message[];
  draft: string;
  loading: boolean;
  error: string | null;
  retry: PendingQuestion | null;
}
type Connection = "checking" | "connected" | "error" | "remote";
const emptyConversation = (): Conversation => ({ messages: [], draft: "", loading: false, error: null, retry: null });

export function Studio() {
  const [activeId, setActiveId] = useState<AgentId>("herramientas");
  const [conversations, setConversations] = useState<Record<AgentId, Conversation>>({ herramientas: emptyConversation(), rag: emptyConversation(), traductor: emptyConversation() });
  const [connection, setConnection] = useState<Connection>("checking");
  const [connectionError, setConnectionError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [origin, setOrigin] = useState("español");
  const [destination, setDestination] = useState("inglés");
  const [copied, setCopied] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [model, setModel] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const locks = useRef(new Set<AgentId>());
  const activeAgent = agents.find((agent) => agent.id === activeId) ?? agents[0];
  const Icon = activeAgent.icon;
  const current = conversations[activeId];

  function updateConversation(id: AgentId, update: (conversation: Conversation) => Conversation) {
    setConversations((previous) => ({ ...previous, [id]: update(previous[id]) }));
  }

  async function refreshHealth() {
    if (isRemoteLocalApi(window.location.hostname)) {
      setConnection("remote");
      return;
    }
    setConnection("checking");
    try {
      await checkHealth();
      setConnection("connected");
      setConnectionError("");
    } catch (error) {
      setConnection("error");
      setConnectionError(error instanceof Error ? error.message : "No se pudo comprobar la conexión.");
    }
  }

  useEffect(() => { void refreshHealth(); }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "end" });
  }, [activeId, current.messages.length, current.loading, current.error]);
  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      input.style.height = "auto";
      input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
    }
  }, [current.draft, activeId]);

  const time = () => new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" }).format(new Date());

  async function send(id: AgentId, question: PendingQuestion, retry = false) {
    if (!question.pregunta.trim() || locks.current.has(id)) return;
    locks.current.add(id);
    updateConversation(id, (conversation) => ({
      ...conversation,
      messages: retry ? conversation.messages : [...conversation.messages, { id: crypto.randomUUID(), role: "user", text: question.pregunta, time: time() }],
      draft: retry ? conversation.draft : "",
      loading: true,
      error: null,
      retry: question,
    }));
    try {
      const response = await askAgent(id, question.pregunta, question.origen, question.destino);
      updateConversation(id, (conversation) => ({ ...conversation, loading: false, retry: null, messages: [...conversation.messages, { id: crypto.randomUUID(), role: "assistant", text: response.respuesta, time: time(), response }] }));
      setConnection("connected");
      setConnectionError("");
      if (response.modelo) setModel(response.modelo);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo obtener una respuesta. Inténtalo de nuevo.";
      updateConversation(id, (conversation) => ({ ...conversation, loading: false, error: message }));
      setConnection(isRemoteLocalApi(window.location.hostname) ? "remote" : "error");
      setConnectionError(message);
    } finally {
      locks.current.delete(id);
    }
  }

  function submit() {
    void send(activeId, { pregunta: current.draft.trim(), origen: origin, destino: destination });
  }

  async function copyMessage(message: Message) {
    try {
      const details = message.response ? uniqueDetails(message.text, message.response.detalles) : [];
      const sources = message.response?.fuentes ?? [];
      await navigator.clipboard.writeText([message.text, ...details, ...sources].join("\n\n"));
      setCopied(message.id);
      setCopyError(null);
      setTimeout(() => setCopied((value) => value === message.id ? null : value), 2000);
    } catch {
      setCopyError(message.id);
    }
  }

  const connectionLabel = { checking: "Comprobando", connected: "Conectado", error: "Sin conexión", remote: "Modo local" }[connection];

  return (
    <div className="studio">
      {sidebarOpen && <Button className="sidebar-overlay" aria-label="Cerrar menú" onClick={() => setSidebarOpen(false)} />}
      <aside className="sidebar" data-open={sidebarOpen} aria-label="Agentes">
        <div className="brand">
          <div className="brand-symbol"><Sparkles size={21} strokeWidth={1.6} /></div>
          <div><div className="brand-name">Gemma<span className="text-primary">.</span></div><div className="brand-subtitle">Agent Studio</div></div>
          <Button variant="ghost" size="icon" className="mobile-menu ml-auto" aria-label="Cerrar menú de agentes" onClick={() => setSidebarOpen(false)}><X /></Button>
        </div>
        <div className="sidebar-caption">TUS AGENTES</div>
        <nav className="agent-nav">
          {agents.map((agent) => {
            const AgentIcon = agent.icon;
            return <Button key={agent.id} variant="ghost" className={`agent-nav-item ${agent.className}`} data-active={agent.id === activeId} aria-pressed={agent.id === activeId} onClick={() => { setActiveId(agent.id); setSidebarOpen(false); }}>
              <span className="agent-icon"><AgentIcon /></span>
              <span><span className="nav-title">{agent.name}</span><span className="nav-subtitle">{agent.short}</span></span>
              {agent.id === activeId && <span className="active-dot" />}
              {conversations[agent.id].loading && <Loader2 className="animate-spin ml-auto" />}
            </Button>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-model">
            <div className="model-caption"><Cpu />Gemma 3:1b local</div>
            <div className="model-note"><span className="status-dot" />Ollama · En tu computador</div>
          </div>
          <div className="sidebar-footer"><span>Tu espacio. Tu modelo.</span><Button variant="ghost" size="icon" title="Configuración de conexión" aria-label="Configuración de conexión" onClick={() => setSettingsOpen(true)}><Settings2 /></Button></div>
        </div>
      </aside>

      <main className={`workspace ${activeAgent.className}`}>
        <header className="workspace-header">
          <Button variant="ghost" size="icon" className="mobile-menu" aria-label="Abrir menú de agentes" onClick={() => setSidebarOpen(true)}><Menu /></Button>
          <div className="agent-icon"><Icon /></div>
          <div><div className="workspace-title">{activeAgent.name}</div><div className="workspace-subtitle">{activeAgent.short}</div></div>
          <div className="header-actions">
            <span className="status" data-state={connection} role="status"><span className="status-dot" />{connectionLabel}</span>
            <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label="Nueva conversación" title="Nueva conversación" disabled={!current.messages.length || current.loading} onClick={() => setClearOpen(true)}><Trash2 /></Button>
          </div>
        </header>

        {activeId === "traductor" && <div className="chat-inner translation-controls">
          <div className="language-field"><label htmlFor="origin-language">Idioma de origen</label><Select value={origin} onValueChange={setOrigin}><SelectTrigger id="origin-language" aria-label="Idioma de origen"><SelectValue /></SelectTrigger><SelectContent>{languages.map((language) => <SelectItem key={language} value={language}>{language}</SelectItem>)}</SelectContent></Select></div>
          <Button variant="ghost" size="icon" className="mt-4" aria-label="Intercambiar idiomas" title="Intercambiar idiomas" onClick={() => { setOrigin(destination); setDestination(origin); }}><ArrowLeftRight /></Button>
          <div className="language-field"><label htmlFor="destination-language">Idioma de destino</label><Select value={destination} onValueChange={setDestination}><SelectTrigger id="destination-language" aria-label="Idioma de destino"><SelectValue /></SelectTrigger><SelectContent>{languages.map((language) => <SelectItem key={language} value={language}>{language}</SelectItem>)}</SelectContent></Select></div>
        </div>}

        <div className="chat-scroll" role="log" aria-label={`Historial de ${activeAgent.name}`} aria-live="polite">
          {!current.messages.length ? <section className="welcome">
            <div className="welcome-content">
              <div className="welcome-emblem"><div className="welcome-emblem-inner"><Icon /></div></div>
              <div className="eyebrow">UN AGENTE, MUCHAS POSIBILIDADES</div>
              <h1>{activeAgent.welcome}</h1>
              <p className="welcome-description">{activeAgent.description}<br />Pregunta a tu agente y sigamos desde ahí.</p>
              <div className="suggestions">
                {activeAgent.suggestions.map((suggestion, index) => {
                  const SuggestionIcon = suggestion.icon ?? (activeId === "herramientas" ? index === 1 ? CloudSun : ArrowUpRight : activeId === "rag" ? index === 0 ? Globe2 : index === 1 ? RotateCcw : ShieldCheck : index === 0 ? Globe2 : index === 1 ? ArrowUpRight : LanguagesIcon);
                  return <Button key={suggestion.title} variant="outline" className="suggestion" onClick={() => { updateConversation(activeId, (conversation) => ({ ...conversation, draft: suggestion.text })); inputRef.current?.focus(); }}><SuggestionIcon /><span className="suggestion-title">{suggestion.title}</span><span className="suggestion-text">{suggestion.text}</span></Button>;
                })}
              </div>
              <p className="welcome-note"><ShieldCheck />Conversaciones privadas, solo en esta sesión.</p>
            </div>
          </section> : <div className="chat-inner messages">
            {current.messages.map((message) => {
              const details = activeId === "herramientas" && message.response ? uniqueDetails(message.text, message.response.detalles) : [];
              const sources = [...new Set(message.response?.fuentes ?? [])];
              return <article key={message.id} className={`message message-${message.role}`}>
                <div className="message-avatar">{message.role === "user" ? <User /> : <Icon />}</div>
                <div className="message-body">
                  <div className="message-heading">{message.role === "user" ? "Tú" : activeAgent.name}<span className="message-time">{message.time}</span></div>
                  <div className="message-text">{message.text}</div>
                  {details.length > 0 && <div className="message-details">{details.map((detail) => <p key={detail}>{detail}</p>)}</div>}
                  {sources.length > 0 && <div className="message-sources"><span className="text-muted-foreground">Fuentes</span>{sources.map((source, index) => {
                    const url = safeSourceUrl(source);
                    return url ? <a key={source} href={url} target="_blank" rel="noopener noreferrer" className="source-link" title={source}>{index + 1}. {new URL(url).hostname.replace(/^www\./, "")}<ExternalLink size={11} /></a> : <span key={source} className="break-all">{source}</span>;
                  })}</div>}
                  {message.role === "assistant" && <><Button variant="ghost" size="sm" className="copy-action" title="Copiar respuesta" aria-label={copied === message.id ? "Respuesta copiada" : "Copiar respuesta"} onClick={() => void copyMessage(message)}>{copied === message.id ? <Check /> : <Copy />}{copied === message.id && "Copiado"}</Button>{copyError === message.id && <p className="text-xs text-muted-foreground">No se pudo copiar. Selecciona el texto para copiarlo.</p>}</>}
                </div>
              </article>;
            })}
            {current.loading && <div className="message message-assistant"><div className="message-avatar"><Icon /></div><div className="loading-text" role="status"><Loader2 className="size-4 animate-spin" />Gemma está pensando…</div></div>}
            {current.error && <div className="connection-notice" role="alert"><WifiOff /><div><h2>No se pudo obtener una respuesta</h2><p>{current.error}</p><Button variant="ghost" className="notice-action" onClick={() => { if (current.retry) void send(activeId, current.retry, true); }}><RotateCcw />Reintentar</Button>{connection === "remote" && <Button variant="ghost" className="notice-action ml-4" onClick={() => setSettingsOpen(true)}>Conexión local<ChevronRight /></Button>}</div></div>}
            <div ref={endRef} />
          </div>}
        </div>

        <div className="composer-area">
          {connection === "error" && !current.error && <div className="connection-notice" role="alert"><WifiOff /><div><h2>Tu modelo no está conectado</h2><p>{connectionError}</p><Button variant="ghost" className="notice-action" onClick={() => void refreshHealth()}><RotateCcw />Reintentar conexión</Button></div></div>}
          <form className="composer" onSubmit={(event) => { event.preventDefault(); submit(); }}>
            <textarea ref={inputRef} rows={2} value={current.draft} aria-label="Escribe tu mensaje" placeholder={activeId === "traductor" ? "Escribe el texto que quieres traducir…" : "Escribe tu pregunta, hagamos algo útil…"} onChange={(event) => updateConversation(activeId, (conversation) => ({ ...conversation, draft: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); } }} />
            <div className="composer-toolbar"><span className="composer-agent"><Icon />{activeAgent.name}</span><Button type="submit" className="composer-send" size="icon" aria-label="Enviar mensaje" title="Enviar mensaje" disabled={!current.draft.trim() || current.loading}>{current.loading ? <Loader2 className="animate-spin" /> : <ArrowUp />}</Button></div>
          </form>
          <p className="composer-footnote"><ShieldCheck />Gemma 3:1b local<span className="mx-1">·</span>La IA puede cometer errores. Verifica la información importante.</p>
        </div>
      </main>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}><DialogContent><DialogHeader><DialogTitle>Conexión local</DialogTitle><DialogDescription>Gemma Agent Studio se conecta a tu backend Python y a Ollama.</DialogDescription></DialogHeader><div className="flex items-center gap-2 text-sm"><Cpu className="size-4 text-primary" />Gemma 3:1b local</div>{model && <p className="text-xs text-muted-foreground">Modelo devuelto por el backend: {model}</p>}<div className="settings-code">{API_URL}</div><p className="text-sm leading-7 text-muted-foreground">En la vista previa remota no se realizan peticiones a localhost. Descarga el código desde GitHub, crea .env.local y ejecuta el proyecto en tu computador.</p><div className="settings-code">VITE_API_URL=http://127.0.0.1:8000{"\n\n"}npm install{"\n"}npm run dev</div><p className="text-xs leading-6 text-muted-foreground">Python y Ollama deben estar activos. Autoriza el origen local de Vite en la configuración CORS del backend. Consulta el README para las instrucciones completas.</p><Button variant="outline" onClick={() => void refreshHealth()} disabled={connection === "checking"}><RotateCcw />Comprobar conexión</Button><span className="status" data-state={connection}><span className="status-dot" />{connectionLabel}</span>{connection === "error" && <p className="text-xs text-destructive" role="alert">{connectionError}</p>}</DialogContent></Dialog>
      <Dialog open={clearOpen} onOpenChange={setClearOpen}><DialogContent><DialogHeader><DialogTitle>¿Empezar de nuevo?</DialogTitle><DialogDescription>Se borrará el historial de {activeAgent.name}. Las conversaciones de los otros agentes se conservarán.</DialogDescription></DialogHeader><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setClearOpen(false)}>Cancelar</Button><Button onClick={() => { if (!locks.current.has(activeId)) updateConversation(activeId, () => emptyConversation()); setClearOpen(false); }}>Nueva conversación</Button></div></DialogContent></Dialog>
    </div>
  );
}

function LanguagesIcon() { return <Globe2 />; }