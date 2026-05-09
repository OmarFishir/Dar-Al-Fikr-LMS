import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface TimelineEvent {
  id: string;
  year: string;
  title: string;
  description: string;
  color: string;
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6"];

export default function TimelineBuilder() {
  const [events, setEvents] = useState<TimelineEvent[]>([
    { id: "1", year: "1453", title: "Fall of Constantinople", description: "The Ottoman Empire conquers Constantinople, ending the Byzantine Empire.", color: "#ef4444" },
    { id: "2", year: "1492", title: "Columbus reaches America", description: "Christopher Columbus lands in the Bahamas, beginning European colonization.", color: "#f97316" },
    { id: "3", year: "1776", title: "American Independence", description: "The United States declares independence from Britain.", color: "#3b82f6" },
  ]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ year: "", title: "", description: "", color: COLORS[0] });

  const addEvent = () => {
    if (!form.year || !form.title) { toast.error("Year and title are required"); return; }
    const newEvent: TimelineEvent = { id: Date.now().toString(), ...form };
    const updated = [...events, newEvent].sort((a, b) => parseInt(a.year) - parseInt(b.year));
    setEvents(updated);
    setForm({ year: "", title: "", description: "", color: COLORS[0] });
    setAdding(false);
    toast.success("Event added!");
  };

  const removeEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  return (
    <div className="p-4 min-h-[500px] bg-stone-50/50 dark:bg-stone-950/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-stone-700 dark:text-stone-300">📅 Timeline</h3>
        <Button size="sm" onClick={() => setAdding(!adding)} className="bg-stone-600 hover:bg-stone-700 text-white">
          <Plus className="w-4 h-4 mr-1" /> Add Event
        </Button>
      </div>

      {/* Add form */}
      {adding && (
        <Card className="mb-6 border-2 border-stone-300 dark:border-stone-700">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Year (e.g. 1453)" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
              <Input placeholder="Event title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <Textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="min-h-[60px]" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Color:</span>
              {COLORS.map(c => (
                <button key={c} className="w-6 h-6 rounded-full transition-transform hover:scale-125" style={{ backgroundColor: c, outline: form.color === c ? "2px solid white" : "none", outlineOffset: "1px" }} onClick={() => setForm({ ...form, color: c })} />
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addEvent} className="bg-stone-600 hover:bg-stone-700 text-white">Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[60px] top-0 bottom-0 w-0.5 bg-stone-300 dark:bg-stone-700" />

        <div className="space-y-6">
          {events.map((event, i) => (
            <div key={event.id} className="flex items-start gap-4 group">
              {/* Year */}
              <div className="w-[52px] shrink-0 text-right">
                <span className="text-sm font-black text-stone-600 dark:text-stone-400">{event.year}</span>
              </div>

              {/* Dot */}
              <div className="shrink-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-md mt-1 z-10" style={{ backgroundColor: event.color }} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <Card className="border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: event.color }}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm">{event.title}</h4>
                        {event.description && <p className="text-xs text-muted-foreground mt-1">{event.description}</p>}
                      </div>
                      <button
                        onClick={() => removeEvent(event.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">📅</div>
            <p>No events yet. Click "Add Event" to start building your timeline.</p>
          </div>
        )}
      </div>
    </div>
  );
}
