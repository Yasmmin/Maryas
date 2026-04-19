import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { Notification } from "@/services/notificationService";

interface NotificationCenterProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

/**
 * Displays notifications in the top-right corner
 * Appears non-intrusively with auto-dismiss
 */
export const NotificationCenter = ({ notifications, onRemove }: NotificationCenterProps) => {
  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm space-y-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 400, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 400, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="pointer-events-auto"
          >
            <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
              {/* Gradient accent top */}
              <div
                className="h-1 w-full bg-gradient-to-r from-primary via-primary/50 to-primary/0"
              />
              
              <div className="p-4 flex gap-3">
                {/* Icon/emoji area */}
                <div className="flex-shrink-0 text-2xl leading-none">
                  {notification.type === "photo_added" ? "📸" : "💓"}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                </div>

                {/* Close button */}
                <button
                  onClick={() => onRemove(notification.id)}
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Fechar notificação"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
