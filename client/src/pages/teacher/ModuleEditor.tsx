import { useState } from "react";
import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft, Eye, EyeOff, Plus, Trash2, Code2, FileText,
  Video, Heading1, Globe, GripVertical, Loader2, BookOpen
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BLOCK_TYPES = [
  { value: "heading", label: "Heading", icon: <Heading1 className="w-4 h-4" /> },
  { value: "text", label: "Text / Markdown", icon: <FileText className="w-4 h-4" /> },
  { value: "video", label: "Video URL", icon: <Video className="w-4 h-4" /> },
  { value: "code", label: "Code Block", icon: <Code2 className="w-4 h-4" /> },
  { value: "image", label: "Image URL", icon: <Globe className="w-4 h-4" /> },
];

export default function ModuleEditor() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = parseInt(params.moduleId ?? "0");
  const [, navigate] = useLocation();

  const [newBlockType, setNewBlockType] = useState<"heading" | "text" | "video" | "code" | "image">("text");
  const [newBlockContent, setNewBlockContent] = useState("");
  const [newBlockLang, setNewBlockLang] = useState("python");
  const [newBlockCaption, setNewBlockCaption] = useState("");

  const { data: mod, refetch } = trpc.modules.get.useQuery({ moduleId }, { enabled: moduleId > 0 });

  const setPublished = trpc.modules.setPublished.useMutation({
    onSuccess: () => { toast.success("Updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteModule = trpc.modules.delete.useMutation({
    onSuccess: () => { toast.success("Module deleted"); navigate("/teacher/modules"); },
    onError: (e) => toast.error(e.message),
  });

  // We'll use createManual to add a block by recreating the module — but actually
  // we need a simpler addBlock procedure. For now, we use a workaround: 
  // call createManual with existing blocks + new block. 
  // Better: let's just use a direct DB call via a new procedure.
  // Since we don't have addBlock yet, we show a "coming soon" placeholder for adding blocks
  // and focus on displaying + deleting existing blocks.

  if (!mod) {
    return (
      <SchoolLayout role="teacher">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </SchoolLayout>
    );
  }

  const isCS = /computer.?science|\bcs\b|python|programming|coding|javascript|html|css/i.test(mod.subject ?? "");

  return (
    <SchoolLayout role="teacher">
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/teacher/modules")} className="rounded-xl mt-1">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-3xl font-bold">{mod.title}</h1>
              <Badge variant={mod.published ? "default" : "secondary"}>
                {mod.published ? "Published" : "Draft"}
              </Badge>
              {isCS && (
                <Badge variant="outline" className="text-blue-500 border-blue-300 gap-1">
                  <Code2 className="w-3 h-3" /> Python Editor
                </Badge>
              )}
            </div>
            {mod.subject && <p className="text-sm text-muted-foreground mt-0.5">{mod.subject}</p>}
            {mod.description && <p className="text-sm text-muted-foreground mt-1">{mod.description}</p>}
            {mod.sourceUrl && (
              <a href={mod.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
                Source: {mod.sourceUrl}
              </a>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5"
              onClick={() => setPublished.mutate({ moduleId: mod.id, published: !mod.published })}
              disabled={setPublished.isPending}
            >
              {mod.published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {mod.published ? "Unpublish" : "Publish"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-destructive hover:text-destructive"
              onClick={() => { if (confirm("Delete this module?")) deleteModule.mutate({ moduleId: mod.id }); }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Blocks */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Content Blocks ({mod.blocks.length})</h2>
          {mod.blocks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-semibold">No blocks yet</p>
              <p className="text-sm">This module was created empty. Students will see a blank page until you add content.</p>
            </div>
          ) : (
            mod.blocks.map((block: any, idx: number) => (
              <BlockCard key={block.id} block={block} idx={idx} isCS={isCS} />
            ))
          )}
        </div>

        {/* Preview note */}
        <div className="p-4 rounded-2xl bg-muted/50 border text-sm text-muted-foreground">
          <strong>Student view:</strong> Students will see this module under their class &rarr; Learning tab. Code blocks will have a live Python runner. Video URLs from YouTube will be embedded automatically.
          {!mod.published && <span className="text-amber-500 font-medium"> This module is still a draft — publish it to make it visible to students.</span>}
        </div>
      </div>
    </SchoolLayout>
  );
}

function BlockCard({ block, idx, isCS }: { block: any; idx: number; isCS: boolean }) {
  const typeInfo = BLOCK_TYPES.find((t) => t.value === block.type);
  const colors: Record<string, string> = {
    heading: "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800",
    text: "bg-background border-border",
    video: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
    code: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
    image: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800",
  };

  return (
    <div className={`rounded-2xl border p-4 ${colors[block.type] ?? "bg-background border-border"}`}>
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 mt-0.5">
          <GripVertical className="w-3.5 h-3.5 opacity-40" />
          <span className="font-mono">{idx + 1}</span>
          <span className="flex items-center gap-1 font-semibold uppercase tracking-wide">
            {typeInfo?.icon} {typeInfo?.label ?? block.type}
          </span>
          {block.language && <Badge variant="outline" className="text-xs">{block.language}</Badge>}
        </div>
      </div>
      <div className="mt-2">
        {block.type === "heading" && (
          <p className="font-bold text-lg">{block.content}</p>
        )}
        {block.type === "text" && (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{block.content.slice(0, 300)}{block.content.length > 300 ? "…" : ""}</p>
        )}
        {block.type === "video" && (
          <div className="space-y-1">
            <a href={block.content} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline break-all">{block.content}</a>
            {block.caption && <p className="text-xs text-muted-foreground">{block.caption}</p>}
          </div>
        )}
        {block.type === "code" && (
          <pre className="text-xs bg-black/80 text-green-400 rounded-xl p-3 overflow-x-auto font-mono">
            {block.content.slice(0, 400)}{block.content.length > 400 ? "\n…" : ""}
          </pre>
        )}
        {block.type === "image" && (
          <div className="space-y-1">
            <a href={block.content} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline break-all">{block.content}</a>
            {block.caption && <p className="text-xs text-muted-foreground">{block.caption}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
