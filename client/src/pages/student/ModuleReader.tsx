import { useState, useEffect, useRef } from "react";"react";
import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Loader2, Code2, Video, FileText, Heading1, Globe, RotateCcw } from "lucide-react";
import { useLocation, useParams } from "wouter";
import ReactMarkdown from "react-markdown";

// ─── Pyodide Python Runner ────────────────────────────────────────────────────
declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<any>;
    _pyodide?: any;
  }
}

function PythonEditor({ initialCode, language }: { initialCode: string; language?: string | null }) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [pyReady, setPyReady] = useState(false);
  const pyRef = useRef<any>(null);

  // Load Pyodide lazily from CDN
  useEffect(() => {
    if (language && language !== "python") return; // only load for Python
    if (window._pyodide) { pyRef.current = window._pyodide; setPyReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.js";
    script.onload = async () => {
      try {
        const py = await window.loadPyodide!({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.5/full/" });
        window._pyodide = py;
        pyRef.current = py;
        setPyReady(true);
      } catch (e) {
        console.error("Pyodide load failed", e);
      }
    };
    document.head.appendChild(script);
  }, [language]);

  const runCode = async () => {
    if (!pyRef.current) return;
    setRunning(true);
    setOutput("");
    try {
      // Redirect stdout
      pyRef.current.runPython(`
import sys
import io
_stdout_capture = io.StringIO()
sys.stdout = _stdout_capture
`);
      pyRef.current.runPython(code);
      const out = pyRef.current.runPython("_stdout_capture.getvalue()");
      setOutput(out || "(no output)");
    } catch (e: any) {
      setOutput(`Error:\n${e.message ?? String(e)}`);
    } finally {
      // Restore stdout
      try { pyRef.current.runPython("sys.stdout = sys.__stdout__"); } catch {}
      setRunning(false);
    }
  };

  const isNonPython = language && language !== "python";

  return (
    <div className="rounded-2xl border border-green-300 dark:border-green-700 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-green-400">
        <div className="flex items-center gap-2 text-xs font-mono">
          <Code2 className="w-3.5 h-3.5" />
          <span>{language ?? "python"}</span>
          {!isNonPython && (
            <span className={`ml-2 text-xs ${pyReady ? "text-green-400" : "text-yellow-400"}`}>
              {pyReady ? "● Ready" : "● Loading Python…"}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCode(initialCode)}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
            title="Reset code"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
          {!isNonPython && (
            <button
              onClick={runCode}
              disabled={running || !pyReady}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1 rounded-lg transition-colors"
            >
              {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              Run
            </button>
          )}
        </div>
      </div>
      {/* Code editor */}
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        className="w-full bg-gray-950 text-green-300 font-mono text-sm p-4 resize-none outline-none min-h-[120px]"
        style={{ tabSize: 4 }}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            e.preventDefault();
            const start = e.currentTarget.selectionStart;
            const end = e.currentTarget.selectionEnd;
            const newCode = code.substring(0, start) + "    " + code.substring(end);
            setCode(newCode);
            setTimeout(() => { e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 4; }, 0);
          }
        }}
      />
      {/* Output */}
      {(output || running) && (
        <div className="border-t border-gray-700 bg-gray-900 px-4 py-3">
          <p className="text-xs text-gray-400 mb-1 font-mono uppercase tracking-wide">Output</p>
          <pre className="text-sm text-white font-mono whitespace-pre-wrap">{running ? "Running…" : output}</pre>
        </div>
      )}
    </div>
  );
}

// ─── YouTube embed helper ─────────────────────────────────────────────────────
function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function VideoBlock({ content, caption }: { content: string; caption?: string | null }) {
  const ytId = getYouTubeId(content);
  if (ytId) {
    return (
      <div className="rounded-2xl overflow-hidden border border-blue-200 dark:border-blue-800">
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={caption ?? "Video"}
          />
        </div>
        {caption && <p className="text-xs text-center text-muted-foreground py-2 px-4">{caption}</p>}
      </div>
    );
  }
  // Fallback: link
  return (
    <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
      <div className="flex items-center gap-2">
        <Video className="w-4 h-4 text-blue-500" />
        <a href={content} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline break-all">{content}</a>
      </div>
      {caption && <p className="text-xs text-muted-foreground mt-1">{caption}</p>}
    </div>
  );
}

// ─── Website Embed Block ────────────────────────────────────────────────────────
function EmbedBlock({ url }: { url: string }) {
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Set a timeout to detect if iframe doesn't load
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        setError("Website took too long to load");
        setBlocked(true);
      }
    }, 8000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [loading]);

  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    setLoading(false);
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    try {
      const doc = (e.target as HTMLIFrameElement).contentDocument;
      if (!doc || doc.body.innerHTML === "") {
        setError("Website blocked embedding");
        setBlocked(true);
      }
    } catch {
      // Cross-origin: can't read — assume it loaded fine
    }
  };

  const handleIframeError = () => {
    setLoading(false);
    setError("Failed to load website");
    setBlocked(true);
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-blue-200 dark:border-blue-800 bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/40 border-b border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Globe className="w-3.5 h-3.5" />
          <span className="truncate max-w-xs">{url}</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:underline shrink-0 ml-2"
        >
          Open in new tab ↗
        </a>
      </div>
      {/* Iframe or fallback */}
      {blocked ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
          <Globe className="w-12 h-12 text-muted-foreground/30" strokeWidth={1} />
          <div>
            <p className="font-semibold text-foreground">This website can't be embedded</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error || "Some websites block embedding for security reasons."}
            </p>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Open {new URL(url).hostname} in new tab ↗
          </a>
        </div>
      ) : (
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10 rounded-b-2xl">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-xs text-muted-foreground">Loading website...</p>
              </div>
            </div>
          )}
          <iframe
            src={url}
            className="w-full rounded-b-2xl"
            style={{ height: "680px" }}
            title="Embedded lesson"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ModuleReader() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = parseInt(params.moduleId ?? "0");
  const [, navigate] = useLocation();

  const { data: mod, isLoading } = trpc.modules.get.useQuery({ moduleId }, { enabled: moduleId > 0 });

  if (isLoading) {
    return (
      <SchoolLayout role="student">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </SchoolLayout>
    );
  }

  if (!mod) {
    return (
      <SchoolLayout role="student">
        <div className="text-center py-20 text-muted-foreground">Module not found.</div>
      </SchoolLayout>
    );
  }

  const isCS = /computer.?science|\bcs\b|python|programming|coding|javascript|html|css/i.test(mod.subject ?? "");

  return (
    <SchoolLayout role="student">
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)} className="rounded-xl mt-1">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-3xl font-bold">{mod.title}</h1>
              {isCS && (
                <Badge variant="outline" className="text-green-600 border-green-400 gap-1">
                  <Code2 className="w-3 h-3" /> Python
                </Badge>
              )}
            </div>
            {mod.subject && <p className="text-sm text-muted-foreground mt-0.5">{mod.subject}</p>}
            {mod.description && <p className="text-sm text-muted-foreground mt-1">{mod.description}</p>}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{mod.blocks.length} section{mod.blocks.length !== 1 ? "s" : ""}</span>
          {isCS && <span className="text-green-600 font-medium">· Live Python editor included</span>}
        </div>

        {/* Content blocks */}
        <div className="space-y-6">
          {mod.blocks.map((block: any) => (
            <div key={block.id}>
              {block.type === "heading" && (
                <h2 className="font-serif text-2xl font-bold border-b border-border pb-2">{block.content}</h2>
              )}
              {block.type === "text" && block.content.startsWith("__EMBED__") ? (
                <EmbedBlock url={block.content.replace("__EMBED__", "")} />
              ) : block.type === "text" && (
                <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                  <ReactMarkdown>{block.content}</ReactMarkdown>
                </div>
              )}
              {block.type === "video" && (
                <VideoBlock content={block.content} caption={block.caption} />
              )}
              {block.type === "code" && (
                <PythonEditor initialCode={block.content} language={block.language} />
              )}
              {block.type === "image" && (
                <div className="rounded-2xl overflow-hidden border border-border">
                  <img src={block.content} alt={block.caption ?? ""} className="w-full object-cover" />
                  {block.caption && <p className="text-xs text-center text-muted-foreground py-2 px-4">{block.caption}</p>}
                </div>
              )}
            </div>
          ))}
        </div>

        {mod.blocks.length === 0 && (
          <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-2xl">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>This module has no content yet.</p>
          </div>
        )}

        {/* Source link */}
        {mod.sourceUrl && (
          <div className="pt-4 border-t border-border text-xs text-muted-foreground">
            Original source: <a href={mod.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{mod.sourceUrl}</a>
          </div>
        )}
      </div>
    </SchoolLayout>
  );
}
