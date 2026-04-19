import { supabase } from "@/integrations/supabase/client";
import type { UserId } from "./photoService";

export type NotificationType = "photo_added" | "photo_rated";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  icon?: string;
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  photoId?: string;
  owner?: UserId;
  rater?: UserId;
  rating?: "like" | "dislike";
}

type NotificationListener = (notification: Notification) => void;

class NotificationService {
  private listeners: Set<NotificationListener> = new Set();
  private photoChannelId = "photos-notifications";
  private ratingsChannelId = "ratings-notifications";
  private photoUnsubscribe: (() => void) | null = null;
  private ratingsUnsubscribe: (() => void) | null = null;

  /**
   * Subscribe to notification events
   */
  subscribe(listener: NotificationListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit a notification to all listeners
   */
  private emit(notification: Notification) {
    this.listeners.forEach((listener) => listener(notification));
  }

  /**
   * Start listening to real-time changes
   * Notifications will be emitted when photos are added or ratings change
   */
  startListening(currentUser: UserId) {
    // Subscribe to new photos added by partner
    const photoChannel = supabase
      .channel(this.photoChannelId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "photos",
        },
        (payload) => {
          const newPhoto = payload.new as { owner: UserId };
          // Only notify if the photo was added by the partner
          if (newPhoto.owner !== currentUser) {
            this.emit({
              id: `photo-${payload.new.id}`,
              type: "photo_added",
              title: "📸 Nova foto adicionada",
              message: `${newPhoto.owner === "A" ? "Yasmmin" : "Maria"} adicionou uma foto para avaliação`,
              timestamp: Date.now(),
              photoId: payload.new.id,
            });
          }
        }
      )
      .subscribe();

    this.photoUnsubscribe = () => {
      supabase.removeChannel(photoChannel);
    };

    // Subscribe to new ratings on my photos
    const ratingsChannel = supabase
      .channel(this.ratingsChannelId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ratings",
        },
        (payload) => {
          const newRating = payload.new as {
            photo_id: string;
            rater: UserId;
            rating: "like" | "dislike";
          };
          // We'll need to verify this rating is for current user's photo
          // For now, we emit for all new ratings
          if (newRating.rater !== currentUser) {
            const isLike = newRating.rating === "like";
            this.emit({
              id: `rating-${payload.new.id}`,
              type: "photo_rated",
              title: isLike ? "❤️ Você recebeu um Like!" : "👎 Você recebeu um Dislike",
              message: `${newRating.rater === "A" ? "Yasmmin" : "Maria"} ${isLike ? "curtiu" : "não curtiu"} uma de suas fotos`,
              timestamp: Date.now(),
              photoId: newRating.photo_id,
            });
          }
        }
      )
      .subscribe();

    this.ratingsUnsubscribe = () => {
      supabase.removeChannel(ratingsChannel);
    };
  }

  /**
   * Stop listening to real-time changes
   */
  stopListening() {
    this.photoUnsubscribe?.();
    this.ratingsUnsubscribe?.();
  }

  /**
   * Clear all listeners
   */
  clearListeners() {
    this.listeners.clear();
  }
}

export const notificationService = new NotificationService();
