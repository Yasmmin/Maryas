// Serviço responsável por enviar arquivos ao Storage do Lovable Cloud
import { supabase } from "@/integrations/supabase/client";
const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 12);
};
const BUCKET = "couple-photos";

export const uploadService = {
  /**
   * Envia um arquivo para o bucket público e retorna o path + URL pública.
   */
  async uploadImage(file: File, owner: "A" | "B") {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${owner}/${generateId()}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/jpeg",
      });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { storagePath: path, publicUrl: data.publicUrl };
  },

  async removeImage(storagePath: string) {
    const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
    if (error) throw error;
  },
};
