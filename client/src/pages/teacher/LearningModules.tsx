import { useState } from "react";
import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  BookOpen, Link2, Loader2, Plus, Trash2, Eye, EyeOff,
  Globe, Code2, FileText, Video, Heading1, Sparkles, Cpu, Send
} from "lucide-react";
import { useLocation } from "wouter";

export default function LearningModules() {
  const [, navigate] = useLocation();
  const [selectedClassId, setSelectedClassId] = useState<string>("none");
  const [showImport, setShowImport] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showPublish, setShowPublish] = useState<number | null>(null);

  // Import from URL form
  const [importUrl, setImportUrl] = useState("");
  const [importSubject, setImportSubject] = useState("");
  const [importMode, setImportMode] = useState<"ai" | "embed">("ai");

  // Manual create form
  const [createTitle, setCreateTitle] = useState("");
  const [createSubject, setCreateSubject] = useState("");
  const [createDesc, setCreateDesc] = useState("");

  // Publish to class form
  const [publishClassId, setPublishClassId] = useState<string>("none");

  const { data: classes } = trpc.classes.myClasses.useQuery();
  const allClasses = (classes ?? []) as any[];
  const parentClasses = allClasses.filter((c: any) => !c.parentId);

  const { data: modules, refetch } = trpc.modules.list.useQuery(
    { classId: parseInt(selectedClassId) },
    { enabled: selectedClassId !== "none" }
  );

  const importFromUrl = trpc.modules.importFromUrl.useMutation({
    onSuccess: (data) => {
      toast.success(`✅ Lesson imported: "${data.title}" with ${data.blockCount} content blocks!`);
      setShowImport(false);
      setImportUrl("");
      setImportSubject("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const createManual = trpc.modules.createManual.useMutation({
    onSuccess: (data) => {
      toast.success("Module created!");
      setShowCreate(false);
      setCreateTitle("");
      setCreateSubject("");
      setCreateDesc("");
      navigate(`/teacher/modules/${data.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteModule = trpc.modules.delete.useMutation({
    onSuccess: () => { toast.success("Module deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const setPublished = trpc.modules.setPublished.useMutation({
    onSuccess: () => { refetch(); setShowPublish(null); },
    onError: (e) => toast.error(e.message),
  });

  const handleImport = () => {
    if (!importUrl) { toast.error("Enter a URL"); return; }
    if (selectedClassId === "none") { toast.error("Select a class first"); return; }

    if (importMode === "ai") {
      // Real AI extraction: server fetches page, AI structures content into blocks
      importFromUrl.mutate({
        url: importUrl,
        classId: parseInt(selectedClassId),
        subject: importSubject || undefined,
      });
    } else {
      // Embed mode: store URL as iframe embed block
      if (!importSubject) { toast.error("Enter a module title"); return; }
      createManual.mutate({
        classId: parseInt(selectedClassId),
        title: importSubject,
        subject: undefined,
        description: `Embedded from: ${importUrl}`,
        blocks: [
          { type: "heading", content: importSubject, orderIndex: 0 },
          { type: "text", content: `__EMBED__${importUrl}`, orderIndex: 1 },
        ],
      }, {
        onSuccess: () => {
          toast.success("Lesson embedded successfully!");
          setShowImport(false);
          setImportUrl("");
          setImportSubject("");
          refetch();
        },
      });
    }
  };

  const handleCreate = () => {
    if (!createTitle) { toast.error("Enter a title"); return; }
    if (selectedClassId === "none") { toast.error("Select a class first"); return; }
    createManual.mutate({ classId: parseInt(selectedClassId), title: createTitle, subject: createSubject || undefined, description: createDesc || undefined, blocks: [] });
  };

  const handlePublishToClass = (moduleId: number, published: boolean) => {
    setPublished.mutate({ moduleId, published });
  };

  const isLoading = importFromUrl.isPending || createManual.isPending;

  return (
    <SchoolLayout role="teacher">
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-4xl font-bold mb-1">Learning Modules</h1>
            <p className="text-muted-foreground">Import from any learning platform or build your own interactive lessons</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button onClick={() => setShowCreate(true)} variant="outline" className="rounded-xl gap-2" disabled={selectedClassId === "none"}>
              <Plus className="w-4 h-4" /> New Module
            </Button>
            <Button
              onClick={() => setShowImport(true)}
              className="rounded-xl gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              disabled={selectedClassId === "none"}
            >
              <Sparkles className="w-4 h-4" /> Import from URL
            </Button>
          </div>
        </div>

        {/* Class selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Class:</label>
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-64 rounded-xl">
              <SelectValue placeholder="Choose a class…" />
            </SelectTrigger>
            <SelectContent>
              {allClasses.map((c: any) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.parentId ? `  ↳ ${c.name}` : c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Module list */}
        {selectedClassId === "none" ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Select a class to see its modules</p>
          </div>
        ) : !modules || modules.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-border rounded-2xl">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold mb-1">No modules yet</p>
            <p className="text-sm">Import from Qubit, Khan Academy, or any learning site — AI will extract the real content.</p>
            <div className="flex gap-3 justify-center mt-4">
              <Button onClick={() => setShowImport(true)} className="rounded-xl gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <Sparkles className="w-4 h-4" /> Import from URL
              </Button>
              <Button onClick={() => setShowCreate(true)} variant="outline" className="rounded-xl gap-2">
                <Plus className="w-4 h-4" /> Create from Scratch
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {(modules as any[]).map((mod: any) => (
              <Card key={mod.id} className="border hover:border-foreground/20 transition-colors cursor-pointer group" onClick={() => navigate(`/teacher/modules/${mod.id}`)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                        <h3 className="font-semibold text-base truncate">{mod.title}</h3>
                        <Badge variant={mod.published ? "default" : "secondary"} className="shrink-0 text-xs">
                          {mod.published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      {mod.subject && <p className="text-xs text-muted-foreground mb-1">{mod.subject}</p>}
                      {mod.description && <p className="text-sm text-muted-foreground line-clamp-2">{mod.description}</p>}
                      {mod.sourceUrl && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-blue-500">
                          <Link2 className="w-3 h-3" />
                          <span className="truncate max-w-xs">{mod.sourceUrl}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-lg h-8 px-3 gap-1.5 text-xs"
                        title={mod.published ? "Unpublish" : "Publish to students"}
                        onClick={() => {
                          if (mod.published) {
                            handlePublishToClass(mod.id, false);
                          } else {
                            setPublished.mutate({ moduleId: mod.id, published: true });
                          }
                        }}
                      >
                        {mod.published ? <><EyeOff className="w-3.5 h-3.5" /> Unpublish</> : <><Eye className="w-3.5 h-3.5" /> Publish</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-lg h-8 w-8 p-0 hover:text-destructive"
                        title="Delete"
                        onClick={() => { if (confirm("Delete this module?")) deleteModule.mutate({ moduleId: mod.id }); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Import from URL dialog */}
      <Dialog open={showImport} onOpenChange={(o) => { if (!isLoading) setShowImport(o); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" /> Import Lesson from URL
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setImportMode("ai")}
                className={`p-3 rounded-xl border-2 text-left transition-all ${importMode === "ai" ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30" : "border-border hover:border-foreground/20"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Cpu className="w-4 h-4 text-purple-500" />
                  <span className="font-semibold text-sm">AI Extract</span>
                  <Badge className="text-[10px] px-1.5 py-0 bg-purple-500 text-white">Recommended</Badge>
                </div>
                <p className="text-xs text-muted-foreground">AI reads the page and brings all text, headings, and videos into SchoolHub as a real lesson</p>
              </button>
              <button
                onClick={() => setImportMode("embed")}
                className={`p-3 rounded-xl border-2 text-left transition-all ${importMode === "embed" ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-border hover:border-foreground/20"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-sm">Embed</span>
                </div>
                <p className="text-xs text-muted-foreground">Show the real website inside SchoolHub as an iframe (works if the site allows embedding)</p>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Page URL *</label>
              <Input
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://qubit.com/lesson/..."
                className="rounded-xl"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {importMode === "ai" ? "Subject (optional — helps AI)" : "Module Title *"}
              </label>
              <Input
                value={importSubject}
                onChange={(e) => setImportSubject(e.target.value)}
                placeholder={importMode === "ai" ? "e.g. Python, Biology, Math…" : "e.g. Python Variables — Qubit Lesson 3"}
                className="rounded-xl"
                disabled={isLoading}
              />
            </div>

            {importMode === "ai" && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
                ⏳ AI extraction takes 10–30 seconds. The AI will read the full page and structure it into headings, text, and video blocks inside SchoolHub.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImport(false)} className="rounded-xl" disabled={isLoading}>Cancel</Button>
            <Button
              onClick={handleImport}
              disabled={isLoading}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{importMode === "ai" ? "AI is reading the page…" : "Creating…"}</>
              ) : (
                <><Send className="w-4 h-4 mr-2" />{importMode === "ai" ? "Extract with AI" : "Add as Embedded Lesson"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create from scratch dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-500" /> Create New Module
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title *</label>
              <Input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} placeholder="e.g. Introduction to Python Variables" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject (optional)</label>
              <Input value={createSubject} onChange={(e) => setCreateSubject(e.target.value)} placeholder="e.g. Computer Science, Python" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description (optional)</label>
              <Textarea value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} placeholder="Brief summary of what students will learn…" rows={2} className="rounded-xl resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleCreate} disabled={createManual.isPending} className="rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white">
              {createManual.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</> : <><Plus className="w-4 h-4 mr-2" />Create Module</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SchoolLayout>
  );
}
