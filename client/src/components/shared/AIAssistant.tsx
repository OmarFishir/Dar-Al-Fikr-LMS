import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Sparkles, Send, X, Loader2, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIAssistantProps {
  mode: "student_help" | "teacher_draft";
  context?: string;
  placeholder?: string;
  className?: string;
}

export default function AIAssistant({
  mode,
  context,
  placeholder = mode === "teacher_draft" ? "Ask AI to help draft assignment instructions…" : "Ask for help understanding this assignment…",
  className,
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const ask = trpc.ai.ask.useMutation({
    onSuccess: (data) => {
      const reply: string = typeof data.reply === "string" ? data.reply : String(data.reply);
      setMessages((prev) => [...prev, { role: "assistant" as const, content: reply }]);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ask.isPending]);

  const handleSend = () => {
    if (!input.trim() || ask.isPending) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    ask.mutate({ message: userMsg, context, mode });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-sm text-sm font-sans font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
        >
          <Sparkles className="w-4 h-4" strokeWidth={1.5} />
          {mode === "teacher_draft" ? "AI Draft Helper" : "Ask AI Assistant"}
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="editorial-card flex flex-col" style={{ height: "420px" }}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-foreground/60" strokeWidth={1.5} />
              <h3 className="font-serif text-sm font-bold">
                {mode === "teacher_draft" ? "AI Draft Helper" : "AI Study Assistant"}
              </h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-6 space-y-2">
                <Bot className="w-8 h-8 text-muted-foreground/30 mx-auto" strokeWidth={1} />
                <p className="text-sm text-muted-foreground font-sans">
                  {mode === "teacher_draft"
                    ? "I can help you write clear, engaging assignment descriptions."
                    : "I can help you understand this assignment. Ask me anything!"}
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-sm bg-foreground/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-foreground/60" strokeWidth={1.5} />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] px-3 py-2.5 rounded-sm text-sm font-sans",
                    msg.role === "user"
                      ? "bg-foreground text-background"
                      : "bg-secondary text-foreground"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <Streamdown className="prose prose-sm max-w-none text-foreground">{msg.content}</Streamdown>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-sm bg-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-background" strokeWidth={1.5} />
                  </div>
                )}
              </div>
            ))}
            {ask.isPending && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-sm bg-foreground/8 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-foreground/60" strokeWidth={1.5} />
                </div>
                <div className="bg-secondary px-3 py-2.5 rounded-sm">
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-border flex gap-2 flex-shrink-0">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm font-sans text-foreground placeholder:text-muted-foreground outline-none border border-border rounded-sm px-3 py-2 focus:border-foreground/30 transition-colors"
              style={{ minHeight: "38px", maxHeight: "80px" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || ask.isPending}
              className="w-9 h-9 flex items-center justify-center bg-foreground text-background rounded-sm hover:bg-foreground/90 disabled:opacity-40 transition-all flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
