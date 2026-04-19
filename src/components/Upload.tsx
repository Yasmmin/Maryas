import { ChangeEvent, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, Trash2, Upload as UploadIcon, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Photo, UserId, RatingRecord } from "@/hooks/useCoupleBackend";
import { uploadService } from "@/services/uploadService";
import { photoService } from "@/services/photoService";
import { PhotoFeedbackBadge } from "./PhotoFeedbackBadge";
import { getRatingStats } from "@/services/ratingStatsService";

interface UploadProps {
  currentUser: UserId;
  ownPhotos: Photo[];
  ratings: RatingRecord[];
  onAdded: (photo: Photo) => void;
  onRemove: (id: string) => void;
}

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

interface PendingItem {
  id: string;
  previewUrl: string;
  file: File;
}

export const Upload = ({ currentUser, ownPhotos, ratings, onAdded, onRemove }: UploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    const previews = await Promise.all(
      arr.map(async (file) => ({
      id: crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 10),
        previewUrl: await readAsDataUrl(file),
        file,
      })),
    );
    setPending((p) => [...p, ...previews]);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  };

  const confirmUpload = async () => {
    if (!pending.length) return;
    setUploading(true);
    try {
      for (const item of pending) {
        const { storagePath, publicUrl } = await uploadService.uploadImage(
          item.file,
          currentUser,
        );
        const row = await photoService.create(currentUser, storagePath, publicUrl);
        onAdded({
          id: row.id,
          owner: row.owner,
          dataUrl: row.public_url,
          storagePath: row.storage_path,
          createdAt: new Date(row.created_at).getTime(),
        });
      }
      toast.success(`${pending.length} foto(s) enviada(s) para o seu amor 💖`);
      setPending([]);
    } catch (err) {
      console.error(err);
      toast.error("Falha ao enviar as fotos. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const removePending = (id: string) =>
    setPending((p) => p.filter((x) => x.id !== id));

  return (
    <div className="space-y-8">
      {/* Dropzone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-3xl border-2 border-dashed p-10 text-center transition-all bg-gradient-card shadow-soft ${
          isDragging
            ? "border-primary scale-[1.02] shadow-glow"
            : "border-border hover:border-primary/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onInputChange}
        />
        <motion.div
          animate={{ y: isDragging ? -6 : 0 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-romance flex items-center justify-center shadow-glow">
            <ImagePlus className="w-8 h-8 text-primary-foreground" />
          </div>
          <h3 className="text-xl font-semibold">Envie suas fotos para avaliação sincera</h3>
          <p className="text-muted-foreground text-sm max-w-md">
          clique para escolher. Apenas seu o seu amoi  verá e avaliará as fotos.
          </p>
        </motion.div>
      </motion.div>

      {/* Pending preview grid */}
      <AnimatePresence>
        {pending.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-lg">
                Pré-visualização ({pending.length})
              </h4>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setPending([])} disabled={uploading}>
                  Cancelar
                </Button>
                <Button
                  onClick={confirmUpload}
                  disabled={uploading}
                  className="bg-gradient-romance text-primary-foreground hover:opacity-90"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-1" />
                  )}
                  {uploading ? "Enviando..." : "Salvar fotos"}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {pending.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="relative group aspect-square rounded-2xl overflow-hidden shadow-soft"
                >
                  <img src={p.previewUrl} alt="preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePending(p.id)}
                    disabled={uploading}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved photos grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-lg flex items-center gap-2">
            <UploadIcon className="w-5 h-5 text-primary" />
            Suas fotos salvas ({ownPhotos.length})
          </h4>
        </div>
        {ownPhotos.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 rounded-2xl bg-card/50">
            Nenhuma foto enviada ainda.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <AnimatePresence>
              {ownPhotos.map((p) => {
                const stats = getRatingStats(p.id, ratings);
                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    className="relative group aspect-square rounded-2xl overflow-hidden shadow-soft"
                  >
                    <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                    
                    {/* Feedback badges */}
                    <PhotoFeedbackBadge likes={stats.likes} dislikes={stats.dislikes} />
                    
                    {/* Delete button */}
                    <button
                      onClick={() => onRemove(p.id)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
