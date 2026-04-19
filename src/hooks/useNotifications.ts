import { useCallback, useEffect, useState } from "react";
import type { Notification } from "@/services/notificationService";
import { notificationService } from "@/services/notificationService";
import type { UserId } from "@/services/photoService";

const MAX_NOTIFICATIONS = 5;
const NOTIFICATION_DURATION = 4000; // 4 seconds

export const useNotifications = (currentUser: UserId) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Start listening to notifications
    notificationService.startListening(currentUser);

    // Subscribe to notification events
    const unsubscribe = notificationService.subscribe((notification) => {
      setNotifications((prev) => {
        // Limit to MAX_NOTIFICATIONS
        const updated = [notification, ...prev];
        return updated.slice(0, MAX_NOTIFICATIONS);
      });

      // Auto-remove notification after duration
      const timer = setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, NOTIFICATION_DURATION);

      return () => clearTimeout(timer);
    });

    return () => {
      notificationService.stopListening();
      unsubscribe();
    };
  }, [currentUser]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    removeNotification,
    clearAll,
  };
};
