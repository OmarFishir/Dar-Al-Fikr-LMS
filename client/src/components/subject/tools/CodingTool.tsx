import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Play, Save, Loader2, Terminal, RotateCcw } from "lucide-react";

interface CodingToolProps {
  classId: number;
  role: "teacher" | "student";
}

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<any>;
    pyodide?: any;
  }
}

export default function CodingTool({ classId, role }: CodingToolProps) {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(`# Welcome to the Coding Tool! 🚀
# Write your code below and click Run
# You can choose any programming language

print("Hello, World!")

# Try some math:
x = 5
y = 3
print(f"{x} + {y} = {x + y}")
print(f"{x} * {y} = {x * y}")
`);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [pyodideLoading, setPyodideLoading] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const pyodideRef = useRef<any>(null);

  // Load Pyodide on mount
  useEffect(() => {
    if (window.pyodide) {
      pyodideRef.current = window.pyodide;
      setPyodideReady(true);
      return;
    }
    setPyodideLoading(true);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js";
    script.onload = async () => {
      try {
        const pyodide = await window.loadPyodide!({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/" });
        pyodideRef.current = pyodide;
        window.pyodide = pyodide;
        setPyodideReady(true);
      } catch (e) {
        console.error("Runtime load error:", e);
        toast.error("Failed to load runtime");
      } finally {
        setPyodideLoading(false);
      }
    };
    script.onerror = () => {
      setPyodideLoading(false);
      toast.error("Failed to load runtime");
    };
    document.head.appendChild(script);
  }, []);

  const runCode = async () => {
    if (!pyodideRef.current) { toast.error("Runtime not ready yet"); return; }
    setRunning(true);
    setOutput("");
    try {
      const pyodide = pyodideRef.current;
      // Capture stdout
      let captured = "";
      pyodide.setStdout({ batched: (text: string) => { captured += text + "\n"; } });
      pyodide.setStderr({ batched: (text: string) => { captured += "Error: " + text + "\n"; } });
      await pyodide.runPythonAsync(code);
      setOutput(captured || "(no output)");
    } catch (e: any) {
      setOutput("❌ " + (e?.message ?? String(e)));
    } finally {
      setRunning(false);
    }
  };

  const submitCode = trpc.labs.submit.useMutation({
    onSuccess: () => { setSaving(false); toast.success("Code saved! Your teacher can see it."); },
    onError: (e) => { setSaving(false); toast.error(e.message); },
  });

  const { data: labs } = trpc.labs.list.useQuery({ classId });
  const firstLab = labs?.[0];

  const handleSave = () => {
    if (!firstLab) { toast.error("No assignment for this class yet"); return; }
    setSaving(true);
    submitCode.mutate({ labId: firstLab.id, code, output });
  };

  const languageTemplates: Record<string, string> = {
    python: `# Python\nprint("Hello, World!")`,
    javascript: `// JavaScript\nconsole.log("Hello, World!");`,
    java: `// Java\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}`,
    cpp: `// C++\n#include <iostream>\nusing namespace std;\nint main() {\n  cout << "Hello, World!" << endl;\n  return 0;\n}`,
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setCode(languageTemplates[lang] || "");
  };

  return (
    <div className="p-4 min-h-[500px] bg-blue-50/50 dark:bg-blue-950/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-blue-700 dark:text-blue-300">Coding</h3>
          {pyodideLoading && <Badge variant="secondary" className="text-xs">Loading runtime…</Badge>}
          {pyodideReady && <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-xs">Ready ✓</Badge>}
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="px-2 py-1 text-sm rounded border border-slate-700 bg-slate-800 text-white font-mono"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCode("")}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
          </Button>
          {role === "student" && firstLab && (
            <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
              Save
            </Button>
          )}
          <Button
            size="sm"
            onClick={runCode}
            disabled={running || !pyodideReady}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
            Run
          </Button>
        </div>
      </div>

      {/* Code editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Code Editor</p>
          <Textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            className="font-mono text-sm min-h-[320px] resize-none bg-slate-900 text-blue-400 border-slate-700 focus-visible:ring-blue-500"
            spellCheck={false}
            onKeyDown={(e) => {
              // Tab key inserts spaces
              if (e.key === "Tab") {
                e.preventDefault();
                const start = e.currentTarget.selectionStart;
                const end = e.currentTarget.selectionEnd;
                const newCode = code.substring(0, start) + "    " + code.substring(end);
                setCode(newCode);
                setTimeout(() => { e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 4; }, 0);
              }
              // Ctrl+Enter runs code
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") runCode();
            }}
          />
          <p className="text-xs text-muted-foreground mt-1">Tip: Press Tab to indent · Ctrl+Enter to run</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Output</p>
          <div className="font-mono text-sm min-h-[320px] bg-slate-900 text-white rounded-md border border-slate-700 p-3 overflow-auto whitespace-pre-wrap">
            {running ? (
              <span className="text-blue-400 animate-pulse">Running…</span>
            ) : output ? (
              <span className={output.startsWith("❌") ? "text-red-400" : "text-blue-300"}>{output}</span>
            ) : (
              <span className="text-slate-500">Output will appear here after you click Run</span>
            )}
          </div>
        </div>
      </div>

      {/* Language-specific reference */}
      <Card className="mt-3 border-blue-200 dark:border-blue-800">
        <CardContent className="py-3 px-4">
          <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">📚 {language.toUpperCase()} Reference</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-muted-foreground">
            {language === "python" && (
              <>
                <code>print("text")</code>
                <code>x = 5</code>
                <code>if x &gt; 3:</code>
                <code>for i in range(5):</code>
              </>
            )}
            {language === "javascript" && (
              <>
                <code>console.log()</code>
                <code>let x = 5;</code>
                <code>if (x &gt; 3) {}</code>
                <code>for (let i = 0; i &lt; 5; i++)</code>
              </>
            )}
            {language === "java" && (
              <>
                <code>System.out.println()</code>
                <code>int x = 5;</code>
                <code>if (x &gt; 3) {}</code>
                <code>for (int i = 0; i &lt; 5; i++)</code>
              </>
            )}
            {language === "cpp" && (
              <>
                <code>cout &lt;&lt; ""</code>
                <code>int x = 5;</code>
                <code>if (x &gt; 3) {}</code>
                <code>for (int i = 0; i &lt; 5; i++)</code>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
