import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { getSubjectTheme } from "@/lib/subjectTheme";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiTutorToolProps {
  classId: number;
  subject: string;
}

const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  biology: ["What is the difference between mitosis and meiosis?", "How does photosynthesis work?", "What are the main organelles of a cell?", "Explain the food chain in an ecosystem"],
  chemistry: ["What is the difference between ionic and covalent bonds?", "How do I balance a chemical equation?", "What is the periodic table organized by?", "Explain acids and bases"],
  physics: ["What is Newton's second law?", "How does gravity work?", "What is the difference between speed and velocity?", "Explain how electricity flows"],
  math: ["How do I solve a quadratic equation?", "What is the Pythagorean theorem?", "How do I find the area of a circle?", "Explain what a function is"],
  cs: ["What is a variable in Python?", "How does a for loop work?", "What is the difference between a list and a dictionary?", "Explain what an algorithm is"],
  english: ["How do I write a strong thesis statement?", "What is the difference between simile and metaphor?", "How do I identify the main idea of a passage?", "What makes a good essay introduction?"],
  default: ["Can you explain this topic in simple terms?", "What are the key concepts I should know?", "Give me an example to help me understand", "How is this used in real life?"],
};

export default function AiTutorTool({ classId, subject }: AiTutorToolProps) {
  const theme = getSubjectTheme(subject);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const chat = trpc.aiTutor.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
      setLoading(false);
    },
    onError: (e) => {
      toast.error(e.message);
      setLoading(false);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text?: string) => {
    const question = text ?? input.trim();
    if (!question) return;
    const userMsg: Message = { role: "user", content: question };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    chat.mutate({
      classId,
      question,
      history: messages.slice(-6), // Send last 6 messages as context
    });
  };

  const subjectKey = theme.key;
  const suggestions = SUGGESTED_QUESTIONS[subjectKey] ?? SUGGESTED_QUESTIONS.default;

  return (
    <div className="flex flex-col h-[560px] bg-white dark:bg-slate-900">
      {/* Header */}
      <div className={`p-4 bg-gradient-to-r ${theme.gradient} text-white`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold">AI Tutor</h3>
            <p className="text-xs opacity-80">{theme.emoji} {subject} · Ask me anything</p>
          </div>
          <Badge className="ml-auto bg-white/20 text-white border-white/30 text-xs">
            <Sparkles className="w-3 h-3 mr-1" /> AI-powered
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">{theme.emoji}</div>
            <p className="font-semibold text-muted-foreground mb-1">Hi! I'm your {subject} tutor</p>
            <p className="text-sm text-muted-foreground mb-4">I can explain concepts, answer questions, and help you understand the material. What would you like to learn?</p>
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Suggested questions:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className={`text-xs px-3 py-1.5 rounded-full border-2 transition-all hover:scale-105 ${theme.bgClass} ${theme.textClass} ${theme.borderClass}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-slate-200 dark:bg-slate-700" : `bg-gradient-to-br ${theme.gradient}`}`}>
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-slate-100 dark:bg-slate-800 rounded-tr-sm" : `${theme.bgClass} ${theme.borderClass} border rounded-tl-sm`}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br ${theme.gradient}`}>
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className={`rounded-2xl rounded-tl-sm px-4 py-3 ${theme.bgClass} ${theme.borderClass} border`}>
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.color, animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.color, animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.color, animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Ask about ${subject}…`}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className={`bg-gradient-to-r ${theme.gradient} text-white border-0 hover:opacity-90`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 text-center">
          AI tutor explains concepts — it won't solve your homework for you 😊
        </p>
      </div>
    </div>
  );
}
