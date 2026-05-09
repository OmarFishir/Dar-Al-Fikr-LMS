import { useState, useEffect } from "react";
import { X, Download, ExternalLink, FileText, Image as ImageIcon, File, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";

interface InAppFileViewerProps {
  /** The /manus-storage/{key} URL returned by storagePut, or a full https URL */
  url: string;
  /** The storage key (e.g. "uploads/123/file.pdf"). If omitted, extracted from url. */
  fileKey?: string;
  fileName?: string;
  mimeType?: string;
  trigger?: React.ReactNode;
}

function getFileType(url: string, mimeType?: string): "pdf" | "image" | "other" {
  if (mimeType) {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType === "application/pdf") return "pdf";
  }
  const lower = url.toLowerCase();
  if (lower.includes(".pdf")) return "pdf";
  if (lower.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/)) return "image";
  return "other";
}

function FileIcon({ type }: { type: "pdf" | "image" | "other" }) {
  if (type === "pdf") return <FileText className="w-4 h-4 text-red-400" />;
  if (type === "image") return <ImageIcon className="w-4 h-4 text-blue-400" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}

function extractKey(url: string): string | null {
  const match = url.match(/^\/manus-storage\/(.+)$/);
  return match ? match[1] : null;
}

function SignedViewer({ storageKey, fileType, displayName }: { storageKey: string; fileType: "pdf" | "image" | "other"; displayName: string }) {
  const { data, isLoading, isError } = trpc.files.getSignedUrl.useQuery({ key: storageKey });

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data?.signedUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-8 text-center">
        <File className="w-12 h-12 text-muted-foreground/30" strokeWidth={1} />
        <p className="text-sm text-muted-foreground">Could not load file. Please try downloading it.</p>
      </div>
    );
  }

  const signedUrl = data.signedUrl;

  if (fileType === "pdf") {
    return (
      <iframe
        src={`${signedUrl}#toolbar=1&navpanes=1&scrollbar=1`}
        className="w-full h-full border-0"
        title={displayName}
      />
    );
  }

  if (fileType === "image") {
    return (
      <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
        <img src={signedUrl} alt={displayName} className="max-w-full max-h-full object-contain rounded-md shadow-lg" />
      </div>
    );
  }

  // Other file types — offer download
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-8">
      <File className="w-16 h-16 text-muted-foreground/30" strokeWidth={1} />
      <div className="space-y-1">
        <p className="font-semibold text-foreground">{displayName}</p>
        <p className="text-sm text-muted-foreground">This file type cannot be previewed in the browser.</p>
      </div>
      <div className="flex gap-2">
        <a href={signedUrl} download={displayName} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors">
          <Download className="w-4 h-4" /> Download
        </a>
        <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors">
          <ExternalLink className="w-4 h-4" /> Open in new tab
        </a>
      </div>
    </div>
  );
}

export default function InAppFileViewer({ url, fileKey, fileName, mimeType, trigger }: InAppFileViewerProps) {
  const [open, setOpen] = useState(false);
  const fileType = getFileType(url, mimeType);
  const displayName = fileName ?? url.split("/").pop()?.split("?")[0] ?? "File";
  const storageKey = fileKey ?? extractKey(url);

  const DefaultTrigger = (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:border-foreground/30 hover:bg-accent transition-all text-sm text-foreground group"
    >
      <FileIcon type={fileType} />
      <span className="flex-1 text-left truncate max-w-[200px]">{displayName}</span>
      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
    </button>
  );

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">{trigger}</div>
      ) : (
        DefaultTrigger
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background shrink-0">
            <FileIcon type={fileType} />
            <span className="flex-1 font-medium text-sm text-foreground truncate">{displayName}</span>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden bg-muted/20">
            {open && storageKey ? (
              <SignedViewer storageKey={storageKey} fileType={fileType} displayName={displayName} />
            ) : open && !storageKey ? (
              /* Direct external URL — render as-is */
              fileType === "pdf" ? (
                <iframe src={`${url}#toolbar=1`} className="w-full h-full border-0" title={displayName} />
              ) : fileType === "image" ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img src={url} alt={displayName} className="max-w-full max-h-full object-contain rounded-md shadow-lg" />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-8">
                  <File className="w-16 h-16 text-muted-foreground/30" strokeWidth={1} />
                  <p className="font-semibold text-foreground">{displayName}</p>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors">
                    <ExternalLink className="w-4 h-4" /> Open in new tab
                  </a>
                </div>
              )
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
