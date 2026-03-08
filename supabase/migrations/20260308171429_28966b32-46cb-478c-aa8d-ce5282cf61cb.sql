
-- Add permissive SELECT policy on coaches for public/anon access (needed for login & signup flows)
CREATE POLICY "Public can read coaches for login"
ON public.coaches
FOR SELECT
TO anon, authenticated
USING (true);
