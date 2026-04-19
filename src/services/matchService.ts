// Serviço de likes/dislikes (avaliações)
import { supabase } from "@/integrations/supabase/client";
import type { UserId } from "./photoService";

export type Rating = "like" | "dislike";

export interface RatingRow {
  id: string;
  photo_id: string;
  rater: UserId;
  rating: Rating;
  rated_at: string;
}

export const matchService = {
  async listAll(): Promise<RatingRow[]> {
    const { data, error } = await supabase.from("ratings").select("*");
    if (error) throw error;
    return (data || []) as RatingRow[];
  },

  /**
   * Faz upsert da avaliação (uma por (photo_id, rater)).
   * O backend (RLS) impede avaliar a própria foto.
   */
  async rate(photoId: string, rater: UserId, rating: Rating) {
    const { error } = await supabase
      .from("ratings")
      .upsert(
        { photo_id: photoId, rater, rating },
        { onConflict: "photo_id,rater" },
      );
    if (error) throw error;
  },

  async resetForRater(rater: UserId) {
    const { error } = await supabase.from("ratings").delete().eq("rater", rater);
    if (error) throw error;
  },

  subscribe(onChange: () => void) {
    const channel = supabase
      .channel("ratings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ratings" },
        () => onChange(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
};
