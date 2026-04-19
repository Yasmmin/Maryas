import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Heart, X } from "lucide-react";
import type { Photo } from "@/hooks/useCoupleBackend";
const userNames: Record<"A" | "B", string> = {
  A: "Yasmmin",
  B: "Maria",
};
interface SwipeCardProps {
  photo: Photo;
  onSwipe: (direction: "like" | "dislike") => void;
  isTop: boolean;
  index: number;
}

// Card individual com swipe gestural via Framer Motion
export const SwipeCard = ({ photo, onSwipe, isTop, index }: SwipeCardProps) => {
  const x = useMotionValue(0);
  // Rotação proporcional ao deslocamento horizontal
  const rotate = useTransform(x, [-300, 0, 300], [-20, 0, 20]);
  // Overlays de feedback
  const likeOpacity = useTransform(x, [0, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, 0], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 120;
    if (info.offset.x > threshold || info.velocity.x > 600) {
      onSwipe("like");
    } else if (info.offset.x < -threshold || info.velocity.x < -600) {
      onSwipe("dislike");
    }
  };

  // Cards atrás aparecem ligeiramente menores e deslocados, dando profundidade
  const stackOffset = index * 8;
  const stackScale = 1 - index * 0.04;

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        zIndex: 10 - index,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale: stackScale, y: stackOffset, opacity: 0 }}
      animate={{ scale: stackScale, y: stackOffset, opacity: 1 }}
      exit={{
        x: x.get() > 0 ? 600 : -600,
        opacity: 0,
        rotate: x.get() > 0 ? 30 : -30,
        transition: { duration: 0.35 },
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-card bg-card select-none">
        <img
          src={photo.dataUrl}
          alt="Foto para avaliar"
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
        />

        {/* Gradient bottom for legibility */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5 text-white">
          <p className="text-sm opacity-80">Enviado por</p>
          <p className="text-xl font-semibold">
            {userNames[photo.owner]}
          </p>
        </div>

        {/* LIKE overlay */}
        {isTop && (
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-8 left-8 px-4 py-2 border-4 border-like text-like rounded-xl rotate-[-15deg] font-extrabold text-3xl tracking-wider bg-background/30 backdrop-blur"
          >
            LIKE
          </motion.div>
        )}

        {/* NOPE overlay */}
        {isTop && (
          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute top-8 right-8 px-4 py-2 border-4 border-nope text-nope rounded-xl rotate-[15deg] font-extrabold text-3xl tracking-wider bg-background/30 backdrop-blur"
          >
            NOPE
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Botões de ação (like/dislike por clique)
export const SwipeActions = ({
  onLike,
  onDislike,
  disabled,
}: {
  onLike: () => void;
  onDislike: () => void;
  disabled?: boolean;
}) => (
  <div className="flex items-center justify-center gap-6 mt-8">
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.08 }}
      onClick={onDislike}
      disabled={disabled}
      className="w-16 h-16 rounded-full bg-card shadow-card flex items-center justify-center text-nope border border-border disabled:opacity-40"
      aria-label="Dislike"
    >
      <X className="w-8 h-8" strokeWidth={3} />
    </motion.button>
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.08 }}
      onClick={onLike}
      disabled={disabled}
      className="w-20 h-20 rounded-full bg-gradient-romance shadow-glow flex items-center justify-center text-primary-foreground disabled:opacity-40"
      aria-label="Like"
    >
      <Heart className="w-10 h-10 fill-current" />
    </motion.button>
  </div>
);
