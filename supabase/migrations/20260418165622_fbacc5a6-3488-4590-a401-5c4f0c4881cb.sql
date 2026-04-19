
CREATE TABLE public.photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner TEXT NOT NULL CHECK (owner IN ('A','B')),
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_photos_owner ON public.photos(owner);
CREATE INDEX idx_photos_created_at ON public.photos(created_at);

CREATE TABLE public.ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  rater TEXT NOT NULL CHECK (rater IN ('A','B')),
  rating TEXT NOT NULL CHECK (rating IN ('like','dislike')),
  rated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (photo_id, rater)
);
CREATE INDEX idx_ratings_photo ON public.ratings(photo_id);
CREATE INDEX idx_ratings_rater ON public.ratings(rater);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photos readable by anyone" ON public.photos FOR SELECT USING (true);
CREATE POLICY "Photos insertable by anyone" ON public.photos FOR INSERT WITH CHECK (owner IN ('A','B'));
CREATE POLICY "Photos deletable by anyone" ON public.photos FOR DELETE USING (true);

CREATE POLICY "Ratings readable by anyone" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Ratings insertable when not own photo" ON public.ratings
  FOR INSERT WITH CHECK (
    rater IN ('A','B')
    AND rating IN ('like','dislike')
    AND NOT EXISTS (SELECT 1 FROM public.photos p WHERE p.id = photo_id AND p.owner = rater)
  );
CREATE POLICY "Ratings updatable by anyone" ON public.ratings
  FOR UPDATE USING (true) WITH CHECK (
    NOT EXISTS (SELECT 1 FROM public.photos p WHERE p.id = photo_id AND p.owner = rater)
  );
CREATE POLICY "Ratings deletable by anyone" ON public.ratings FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.photos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ratings;
ALTER TABLE public.photos REPLICA IDENTITY FULL;
ALTER TABLE public.ratings REPLICA IDENTITY FULL;

INSERT INTO storage.buckets (id, name, public) VALUES ('couple-photos', 'couple-photos', true);

CREATE POLICY "Couple photos public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'couple-photos');
CREATE POLICY "Couple photos anyone can upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'couple-photos');
CREATE POLICY "Couple photos anyone can delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'couple-photos');
