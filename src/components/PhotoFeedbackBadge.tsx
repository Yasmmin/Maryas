import { Heart, ThumbsDown } from "lucide-react";
import { motion } from "framer-motion";

interface PhotoFeedbackBadgeProps {
  likes: number;
  dislikes: number;
}

/**
 * Badge component to display feedback (likes/dislikes) on photos
 * Shows as an overlay on the photo
 */
export const PhotoFeedbackBadge = ({ likes, dislikes }: PhotoFeedbackBadgeProps) => {
  if (likes === 0 && dislikes === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-2 left-2 z-20 flex gap-2"
    >
      {likes > 0 && (
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-like/20 to-like/10 backdrop-blur border border-like/30">
          <Heart className="w-3.5 h-3.5 text-like fill-like" />
          <span className="text-xs font-semibold text-like">{likes}</span>
        </div>
      )}
      {dislikes > 0 && (
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-nope/20 to-nope/10 backdrop-blur border border-nope/30">
          <ThumbsDown className="w-3.5 h-3.5 text-nope fill-nope" />
          <span className="text-xs font-semibold text-nope">{dislikes}</span>
        </div>
      )}
    </motion.div>
  );
};
