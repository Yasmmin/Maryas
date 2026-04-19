// Hook que substitui o LocalStorage por backend (Lovable Cloud) com realtime.
// Mantém a mesma forma de dados consumida pelos componentes (Photo / Rating).
import { useCallback, useEffect, useMemo, useState } from "react";
import { photoService, type PhotoRow, type UserId } from "@/services/photoService";
import { matchService, type Rating, type RatingRow } from "@/services/matchService";

const USER_KEY = "couple-swipe::current-user";

// Modelo usado pela UI (compatível com a versão antiga)
export interface Photo {
  id: string;
  owner: UserId;
  dataUrl: string; // agora é a URL pública do storage
  storagePath: string;
  createdAt: number;
}

export interface RatingRecord {
  photoId: string;
  rater: UserId;
  rating: Rating;
  ratedAt: number;
}

const toPhoto = (r: PhotoRow): Photo => ({
  id: r.id,
  owner: r.owner,
  dataUrl: r.public_url,
  storagePath: r.storage_path,
  createdAt: new Date(r.created_at).getTime(),
});

const toRating = (r: RatingRow): RatingRecord => ({
  photoId: r.photo_id,
  rater: r.rater,
  rating: r.rating,
  ratedAt: new Date(r.rated_at).getTime(),
});

export function useCoupleBackend() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [ratings, setRatings] = useState<RatingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUserState] = useState<UserId>(
    () => (localStorage.getItem(USER_KEY) as UserId) || "A",
  );

  const setCurrentUser = useCallback((u: UserId) => {
    setCurrentUserState(u);
    localStorage.setItem(USER_KEY, u);
  }, []);

  const refreshPhotos = useCallback(async () => {
    const rows = await photoService.listAll();
    setPhotos(rows.map(toPhoto));
  }, []);

  const refreshRatings = useCallback(async () => {
    const rows = await matchService.listAll();
    setRatings(rows.map(toRating));
  }, []);

  // Carga inicial + assinaturas realtime
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await Promise.all([refreshPhotos(), refreshRatings()]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    const unsubP = photoService.subscribe(refreshPhotos);
    const unsubR = matchService.subscribe(refreshRatings);
    return () => {
      active = false;
      unsubP();
      unsubR();
    };
  }, [refreshPhotos, refreshRatings]);

  const addPhoto = useCallback((photo: Photo) => {
    // Atualização otimista; o realtime trará o estado autoritativo
    setPhotos((prev) =>
      prev.some((p) => p.id === photo.id) ? prev : [...prev, photo],
    );
  }, []);

  const removePhoto = useCallback(
    async (id: string) => {
      const target = photos.find((p) => p.id === id);
      if (!target) return;
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      setRatings((prev) => prev.filter((r) => r.photoId !== id));
      await photoService.remove(id, target.storagePath);
    },
    [photos],
  );

  const ratePhoto = useCallback(
    async (photoId: string, rater: UserId, rating: Rating) => {
      // Otimista
      setRatings((prev) => [
        ...prev.filter((r) => !(r.photoId === photoId && r.rater === rater)),
        { photoId, rater, rating, ratedAt: Date.now() },
      ]);
      try {
        await matchService.rate(photoId, rater, rating);
      } catch (err) {
        // Rollback em caso de falha (ex.: tentou avaliar a própria foto)
        await refreshRatings();
        throw err;
      }
    },
    [refreshRatings],
  );

  const resetRatings = useCallback(
    async (rater?: UserId) => {
      if (rater) {
        setRatings((prev) => prev.filter((r) => r.rater !== rater));
        await matchService.resetForRater(rater);
      }
    },
    [],
  );

  const photosToRate = useCallback(
    (rater: UserId) => {
      const ratedIds = new Set(
        ratings.filter((r) => r.rater === rater).map((r) => r.photoId),
      );
      return photos
        .filter((p) => p.owner !== rater && !ratedIds.has(p.id))
        .sort((a, b) => a.createdAt - b.createdAt);
    },
    [photos, ratings],
  );

  return useMemo(
    () => ({
      photos,
      ratings,
      currentUser,
      setCurrentUser,
      loading,
      addPhoto,
      removePhoto,
      ratePhoto,
      resetRatings,
      photosToRate,
    }),
    [photos, ratings, currentUser, setCurrentUser, loading, addPhoto, removePhoto, ratePhoto, resetRatings, photosToRate],
  );
}

// Reexports para os componentes existentes
export type { UserId, Rating };
