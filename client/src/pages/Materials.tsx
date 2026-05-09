import { useState, useRef } from "react";
import SchoolLayout from "@/components/shared/SchoolLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, FileText, BookOpen, Presentation, StickyNote, Trash2, Download, Plus, Eye } from "lucide-react";
import InAppFileViewer from "@/components/shared/InAppFileViewer";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  book: <BookOpen className="h-5 w-5" />,
  slides: <Presentation className="h-5 w-5" />,
  notes: <StickyNote className="h-5 w-5" />,
  other: <FileText className="h-5 w-5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  book: "text-blue-600 bg-blue-50",
  slides: "text-purple-600 bg-purple-50",
  notes: "text-amber-600 bg-amber-50",
  other: "text-slate-600 bg-slate-50",
};

export default function Materials() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  const role = isTeacher ? "teacher" : "student";

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadCategory, setUploadCategory] = useState<"book" | "slides" | "notes" | "other">("other");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: classes } = trpc.classes.myClasses.useQuery();
  const { data: materials, refetch } = trpc.materials.list.useQuery(
    { classId: selectedClassId! },
    { enabled: !!selectedClassId }
  );

  const uploadFile = trpc.files.upload.useMutation();
  const uploadMaterial = trpc.materials.upload.useMutation();
  const deleteMaterial = trpc.materials.delete.useMutation();

  const handleUpload = async () => {
    if (!selectedFile || !uploadTitle.trim() || !selectedClassId) {
      toast.error("Please fill in all required fields and select a file.");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const fileResult = await uploadFile.mutateAsync({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileBase64: base64,
        });
        await uploadMaterial.mutateAsync({
          classId: selectedClassId,
          title: uploadTitle,
          description: uploadDesc || undefined,
          fileUrl: fileResult.url,
          fileKey: fileResult.key,
          fileName: fileResult.fileName,
          fileType: selectedFile.type,
          category: uploadCategory,
        });
        toast.success("Material uploaded successfully!");
        setShowUpload(false);
        setUploadTitle("");
        setUploadDesc("");
        setSelectedFile(null);
        refetch();
      };
      reader.readAsDataURL(selectedFile);
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMaterial.mutateAsync({ id });
      toast.success("Material deleted.");
      refetch();
    } catch {
      toast.error("Failed to delete material.");
    }
  };

  const categoryGroups = materials?.reduce((acc, m) => {
    const cat = m.category ?? "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {} as Record<string, typeof materials>);

  return (
    <SchoolLayout role={role}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold">Class Materials</h1>
            <p className="text-muted-foreground mt-1">
              {isTeacher ? "Upload books, slides, and notes for your students" : "Access materials shared by your teachers"}
            </p>
          </div>
          {isTeacher && selectedClassId && (
            <Dialog open={showUpload} onOpenChange={setShowUpload}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Upload Material
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">Upload Material</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Title *</Label>
                    <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="e.g. Chapter 5 Slides" className="mt-1" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} placeholder="Optional description..." className="mt-1" rows={2} />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v as any)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="book">Book / Textbook</SelectItem>
                        <SelectItem value="slides">Slides / Presentation</SelectItem>
                        <SelectItem value="notes">Notes / Handout</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>File *</Label>
                    <div
                      className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      {selectedFile ? (
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Click to select a file (PDF, PPTX, DOCX, etc.)</p>
                      )}
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.txt,.png,.jpg,.jpeg"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <Button onClick={handleUpload} disabled={uploading || !selectedFile} className="w-full">
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Class selector */}
        <div className="flex gap-2 flex-wrap">
          {classes?.map((c) => (
            <Badge
              key={c.id}
              variant={selectedClassId === c.id ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
              onClick={() => setSelectedClassId(c.id)}
            >
              {c.name}
            </Badge>
          ))}
        </div>

        {!selectedClassId && (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-serif text-lg">Select a class to view materials</p>
          </div>
        )}

        {selectedClassId && materials?.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Upload className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-serif text-lg">No materials yet</p>
            {isTeacher && <p className="text-sm mt-1">Upload books, slides, or notes for your students</p>}
          </div>
        )}

        {/* Materials by category */}
        {categoryGroups && Object.entries(categoryGroups).map(([category, items]) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-md ${CATEGORY_COLORS[category]}`}>
                {CATEGORY_ICONS[category]}
              </span>
              <h2 className="font-semibold text-lg capitalize">{category === "other" ? "Other Files" : category + "s"}</h2>
              <Badge variant="secondary">{items?.length}</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {items?.map((material) => (
                <Card key={material.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className={`p-2 rounded-lg shrink-0 ${CATEGORY_COLORS[material.category ?? "other"]}`}>
                        {CATEGORY_ICONS[material.category ?? "other"]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{material.title}</h3>
                        {material.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{material.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{material.fileName}</p>
                        <p className="text-xs text-muted-foreground">{new Date(material.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <InAppFileViewer
                          url={material.fileUrl}
                          fileName={material.fileName ?? undefined}
                          trigger={
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View file">
                              <Eye className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <a href={material.fileUrl} download={material.fileName ?? "file"} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Download">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                        {isTeacher && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => handleDelete(material.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SchoolLayout>
  );
}
