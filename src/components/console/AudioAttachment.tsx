import { useRef, useState } from "react";
import { Paperclip, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function AudioAttachment({
  fileUrl,
  fileName,
  onChange,
}: {
  fileUrl?: string;
  fileName?: string;
  onChange: (next: { fileUrl?: string; fileName?: string }) => void;
}) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    if (!user) return;
    setBusy(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("attachments").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("attachments").getPublicUrl(path);
      onChange({ fileUrl: data.publicUrl, fileName: file.name });
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  if (fileUrl) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <audio src={fileUrl} controls className="h-8 flex-1 min-w-0" />
        <span className="text-xs text-muted-foreground truncate max-w-[120px] hidden sm:inline">{fileName}</span>
        <button
          onClick={() => onChange({ fileUrl: undefined, fileName: undefined })}
          className="text-muted-foreground hover:text-destructive p-1 shrink-0"
          aria-label="Remove attachment"
          title="Remove attachment"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 transition text-muted-foreground disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />}
        {busy ? "Uploading…" : "Attach audio"}
      </button>
    </div>
  );
}
