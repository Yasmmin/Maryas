import type { UserId, Photo } from "@/hooks/useCoupleBackend";
import type { RatingRecord } from "@/hooks/useCoupleBackend";

export interface PhotoFeedback {
  photoId: string;
  likes: number;
  dislikes: number;
  total: number;
}

/**
 * Get feedback stats for a specific photo
 */
export const getRatingStats = (
  photoId: string,
  ratings: RatingRecord[]
): PhotoFeedback => {
  const photoRatings = ratings.filter((r) => r.photoId === photoId);
  const likes = photoRatings.filter((r) => r.rating === "like").length;
  const dislikes = photoRatings.filter((r) => r.rating === "dislike").length;
  
  return {
    photoId,
    likes,
    dislikes,
    total: likes + dislikes,
  };
};

/**
 * Get feedback for all photos owned by a specific user
 */
export const getFeedbackForUserPhotos = (
  photos: Photo[],
  ratings: RatingRecord[],
  owner: UserId
): Map<string, PhotoFeedback> => {
  const userPhotos = photos.filter((p) => p.owner === owner);
  const feedbackMap = new Map<string, PhotoFeedback>();
  
  userPhotos.forEach((photo) => {
    feedbackMap.set(photo.id, getRatingStats(photo.id, ratings));
  });
  
  return feedbackMap;
};

/**
 * Check if a photo has been rated by the partner
 */
export const hasReceivedRating = (
  photoId: string,
  rater: UserId,
  ratings: RatingRecord[]
): { hasRating: boolean; rating?: "like" | "dislike" } => {
  const rating = ratings.find((r) => r.photoId === photoId && r.rater === rater);
  return {
    hasRating: !!rating,
    rating: rating?.rating,
  };
};
