import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Heart, ImagePlus, Loader2, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserSwitcher } from "@/components/UserSwitcher";
import { Upload } from "@/components/Upload";
import { SwipeArea } from "@/components/SwipeArea";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useCoupleBackend } from "@/hooks/useCoupleBackend";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";

const Index = () => {
  const {
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
  } = useCoupleBackend();

  const { notifications, removeNotification } = useNotifications(currentUser);

  const [tab, setTab] = useState<"upload" | "swipe">("swipe");

  const ownPhotos = useMemo(
    () => photos.filter((p) => p.owner === currentUser).sort((a, b) => b.createdAt - a.createdAt),
    [photos, currentUser],
  );

  const toRate = useMemo(() => photosToRate(currentUser), [photosToRate, currentUser]);

  const totalReceived = useMemo(
    () => photos.filter((p) => p.owner !== currentUser).length,
    [photos, currentUser],
  );

  const myLikes = useMemo(
    () => ratings.filter((r) => r.rater === currentUser && r.rating === "like").length,
    [ratings, currentUser],
  );

  // Feedback: avaliações recebidas nas MINHAS fotos
  const feedbackOnMyPhotos = useMemo(() => {
    const myIds = new Set(ownPhotos.map((p) => p.id));
    const partner = currentUser === "A" ? "B" : "A";
    return ratings.filter((r) => myIds.has(r.photoId) && r.rater === partner);
  }, [ownPhotos, ratings, currentUser]);

  const likesReceived = feedbackOnMyPhotos.filter((r) => r.rating === "like").length;
  const dislikesReceived = feedbackOnMyPhotos.filter((r) => r.rating === "dislike").length;

  const handleRate = async (photoId: string, rating: "like" | "dislike") => {
    try {
      await ratePhoto(photoId, currentUser, rating);
      if (rating === "like") toast("❤️ Like registrado!", { duration: 1200 });
    } catch {
      toast.error("Não foi possível registrar a avaliação.");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Notification Center */}
      <NotificationCenter notifications={notifications} onRemove={removeNotification} />

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-lg bg-background/70 border-b border-border">
        <div className="container max-w-3xl flex items-center justify-between py-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-romance flex items-center justify-center shadow-glow">
              <Heart className="w-5 h-5 text-primary-foreground fill-current" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Maryas</h1>
              <p className="text-xs text-muted-foreground">Em sintonia</p>
            </div>
          </motion.div>
          <UserSwitcher currentUser={currentUser} onChange={setCurrentUser} />
        </div>
      </header>

      <main className="container max-w-3xl py-6 px-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Conectando ao backend...
          </div>
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as "upload" | "swipe")}>
            <TabsList className="grid grid-cols-2 w-full bg-secondary p-1 h-auto rounded-2xl">
              <TabsTrigger
                value="swipe"
                className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-soft py-2.5"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Avaliar ({toRate.length})
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-soft py-2.5"
              >
                <ImagePlus className="w-4 h-4 mr-2" />
                Suas fotos ({ownPhotos.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="swipe" className="mt-8">
              <SwipeArea
                currentUser={currentUser}
                photos={toRate}
                totalReceived={totalReceived}
                onRate={handleRate}
                onResetMyRatings={async () => {
                  await resetRatings(currentUser);
                  toast.success("Avaliações resetadas");
                }}
              />
              {myLikes > 0 && (
                <p className="text-center text-sm text-muted-foreground mt-6">
                  Você já deu <span className="text-primary font-semibold">{myLikes}</span> like(s) 💖
                </p>
              )}
            </TabsContent>

            <TabsContent value="upload" className="mt-8 space-y-6">
              {/* Painel de feedback do par */}
              {ownPhotos.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-card shadow-soft p-4 text-center">
                    <p className="text-xs text-muted-foreground">Likes recebidos</p>
                    <p className="text-2xl font-bold text-like flex items-center justify-center gap-1.5">
                      <Heart className="w-5 h-5 fill-current" />
                      {likesReceived}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-card shadow-soft p-4 text-center">
                    <p className="text-xs text-muted-foreground">Dislikes recebidos</p>
                    <p className="text-2xl font-bold text-nope">{dislikesReceived}</p>
                  </div>
                </div>
              )}

              <Upload
                currentUser={currentUser}
                ownPhotos={ownPhotos}
                ratings={ratings}
                onAdded={addPhoto}
                onRemove={removePhoto}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default Index;
