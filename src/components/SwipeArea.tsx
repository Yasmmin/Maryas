import { AnimatePresence, motion } from "framer-motion";
import { Heart, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SwipeActions, SwipeCard } from "./SwipeCard";
import type { Photo, Rating, UserId } from "@/hooks/useCoupleBackend";

const userNames: Record<UserId, string> = {
  A: "Yasmmin",
  B: "Maria",
};

interface SwipeAreaProps {
  currentUser: UserId;
  photos: Photo[]; // fotos disponíveis para avaliar (já filtradas)
  totalReceived: number;
  onRate: (photoId: string, rating: Rating) => void;
  onResetMyRatings: () => void;
}

export const SwipeArea = ({
  currentUser,
  photos,
  totalReceived,
  onRate,
  onResetMyRatings,
}: SwipeAreaProps) => {
  // Mostra até 3 cards empilhados para profundidade visual
  const stack = photos.slice(0, 3);
  const partner: UserId = currentUser === "A" ? "B" : "A";

  const handleSwipe = (id: string, dir: "like" | "dislike") => {
    onRate(id, dir);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground">
          Avaliando fotos enviadas por{" "}
        <span className="font-semibold text-primary">
  {userNames[partner]}
</span>
        </p>
      </div>

      {/* Card stack area */}
      <div className="relative w-full max-w-sm aspect-[3/4]">
        <AnimatePresence>
          {stack.length > 0 ? (
            stack
              .slice()
              .reverse() // último renderizado fica em cima
              .map((photo, idx) => {
                const realIndex = stack.length - 1 - idx;
                return (
                  <SwipeCard
                    key={photo.id}
                    photo={photo}
                    isTop={realIndex === 0}
                    index={realIndex}
                    onSwipe={(dir) => handleSwipe(photo.id, dir)}
                  />
                );
              })
          ) : (
            <EmptyState
              hasReceivedAny={totalReceived > 0}
              partner={partner}
              onReset={onResetMyRatings}
            />
          )}
        </AnimatePresence>
      </div>

      {stack.length > 0 && (
        <SwipeActions
          onLike={() => handleSwipe(stack[0].id, "like")}
          onDislike={() => handleSwipe(stack[0].id, "dislike")}
        />
      )}

      {totalReceived > 0 && (
        <div className="mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetMyRatings}
            className="text-muted-foreground"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Resetar minhas avaliações
          </Button>
        </div>
      )}
    </div>
  );
};

const EmptyState = ({
  hasReceivedAny,
  partner,
  onReset,
}: {
  hasReceivedAny: boolean;
  partner: UserId;
  onReset: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="absolute inset-0 rounded-3xl bg-gradient-card shadow-card flex flex-col items-center justify-center text-center p-8"
  >
    <motion.div
      animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
      transition={{ duration: 3, repeat: Infinity }}
      className="w-20 h-20 rounded-full bg-gradient-romance flex items-center justify-center shadow-glow mb-4"
    >
      {hasReceivedAny ? (
        <Sparkles className="w-10 h-10 text-primary-foreground" />
      ) : (
        <Heart className="w-10 h-10 text-primary-foreground fill-current" />
      )}
    </motion.div>
    <h3 className="text-xl font-bold mb-2">
      {hasReceivedAny ? "Você avaliou tudo!" : "Sem fotos para avaliar"}
    </h3>
    <p className="text-muted-foreground text-sm max-w-xs">
      {hasReceivedAny
        ? "Não há mais fotos novas no momento. Volte mais tarde 💕"
        : `Peça para ${userNames[partner]} enviar fotos na aba Upload.`}
    </p>
    {hasReceivedAny && (
      <Button onClick={onReset} variant="outline" className="mt-4">
        <RotateCcw className="w-4 h-4 mr-1.5" />
        Avaliar novamente
      </Button>
    )}
  </motion.div>
);
