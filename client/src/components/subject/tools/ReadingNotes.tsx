import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { StickyNote, Save } from "lucide-react";

interface ReadingNotesProps {
  classId: number;
  role: "teacher" | "student";
}

export default function ReadingNotes({ classId, role }: ReadingNotesProps) {
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Save to localStorage as a simple note pad (can be wired to backend later)
    const key = `reading-note-class-${classId}`;
    localStorage.setItem(key, note);
    setSaved(true);
    toast.success("Note saved!");
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLoad = () => {
    const key = `reading-note-class-${classId}`;
    const saved = localStorage.getItem(key);
    if (saved) setNote(saved);
  };

  // Load on mount
  useState(() => { handleLoad(); });

  return (
    <div className="p-4 min-h-[500px] bg-amber-50/50 dark:bg-amber-950/20">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Reading area */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-amber-700 dark:text-amber-300">My Notes</h3>
          </div>
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Write your notes here… You can jot down key points, vocabulary, summaries, or questions you want to ask the teacher."
            className="min-h-[380px] text-base leading-relaxed resize-none border-2 border-amber-200 dark:border-amber-800 focus-visible:ring-amber-400 bg-white dark:bg-slate-900"
          />
          <div className="flex gap-2 mt-3">
            <Button
              onClick={handleSave}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saved ? "Saved!" : "Save Notes"}
            </Button>
            <Button variant="outline" onClick={() => { setNote(""); localStorage.removeItem(`reading-note-class-${classId}`); }}>
              Clear
            </Button>
          </div>
        </div>

        {/* Tips panel */}
        <div className="lg:w-64 shrink-0 space-y-3">
          <Card className="border-2 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-4">
              <h4 className="font-bold text-sm mb-2 text-amber-700 dark:text-amber-300">📝 Note-taking Tips</h4>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li>✅ Write in your own words — don't copy word for word</li>
                <li>✅ Use bullet points for lists of facts</li>
                <li>✅ Highlight key vocabulary with CAPS or *asterisks*</li>
                <li>✅ Write questions you want to ask: "Q: Why does…?"</li>
                <li>✅ Summarize each paragraph in one sentence</li>
                <li>✅ Draw diagrams or arrows to show connections</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-2 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-4">
              <h4 className="font-bold text-sm mb-2 text-amber-700 dark:text-amber-300">💡 Useful Symbols</h4>
              <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1">
                <span>→ leads to</span>
                <span>∴ therefore</span>
                <span>∵ because</span>
                <span>≈ approximately</span>
                <span>↑ increases</span>
                <span>↓ decreases</span>
                <span>★ important</span>
                <span>? question</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
