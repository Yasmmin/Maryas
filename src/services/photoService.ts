// Serviço de fotos: CRUD + assinatura realtime
import { supabase } from "@/integrations/supabase/client";

export type UserId = "A" | "B";

export interface PhotoRow {
  id: string;
  owner: UserId;
  storage_path: string;
  public_url: string;
  created_at: string;
}

export const photoService = {
  async listAll(): Promise<PhotoRow[]> {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data || []) as PhotoRow[];
  },

  async create(owner: UserId, storagePath: string, publicUrl: string) {
    const { data, error } = await supabase
      .from("photos")
      .insert({ owner, storage_path: storagePath, public_url: publicUrl })
      .select()
      .single();
    if (error) throw error;
    return data as PhotoRow;
  },

  async remove(id: string, storagePath: string) {
    // Apaga a linha (cascade remove ratings) e o arquivo do storage
    const { error } = await supabase.from("photos").delete().eq("id", id);
    if (error) throw error;
    await supabase.storage.from("couple-photos").remove([storagePath]);
  },

  /** Assina mudanças em tempo real na tabela photos */
  subscribe(onChange: () => void) {
    const channel = supabase
      .channel("photos-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "photos" },
        () => onChange(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
};
