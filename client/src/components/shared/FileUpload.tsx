import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUpload: (result: { url: string; key: string; fileName: string }) => void;
  accept?: string;
  label?: string;
  className?: string;
  currentFile?: { url: string; name: string } | null;
  onRemove?: () => void;
}

export default function FileUpload({
  onUpload,
  accept = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt",
  label = "Attach a file",
  className,
  currentFile,
  onRemove,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const upload = trpc.files.upload.useMutation({
    onSuccess: (data) => {
      onUpload(data);
      toast.success("File uploaded successfully");
    },
    onError: (err) => {
      toast.error(`Upload failed: ${err.message}`);
    },
    onSettled: () => setUploading(false),
  });

  const handleFile = async (file: File) => {
    if (file.size > 16 * 1024 * 1024) {
      toast.error("File must be under 16MB");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      upload.mutate({
        fileName: file.name,
        fileType: file.type,
        fileBase64: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (currentFile) {
    return (
      <div className={cn("flex items-center gap-3 p-3 border border-border rounded-sm bg-secondary/30", className)}>
        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
        <a
          href={currentFile.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-sans text-foreground hover:underline flex-1 truncate"
        >
          {currentFile.name}
        </a>
        {onRemove && (
          <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-sm p-6 text-center transition-all duration-200 cursor-pointer",
        isDragging ? "border-foreground/40 bg-accent/30" : "border-border hover:border-foreground/30 hover:bg-accent/10",
        className
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground font-sans">Uploading…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-6 h-6 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="text-sm font-medium font-sans text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground font-sans">Drag & drop or click to browse · Max 16MB</p>
        </div>
      )}
    </div>
  );
}
