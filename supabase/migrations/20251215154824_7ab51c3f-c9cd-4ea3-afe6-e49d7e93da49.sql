-- Add user_id columns to tables for ownership
ALTER TABLE public.rfps ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.product_matches ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.proposals ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow public read rfps" ON public.rfps;
DROP POLICY IF EXISTS "Allow public insert rfps" ON public.rfps;
DROP POLICY IF EXISTS "Allow public update rfps" ON public.rfps;
DROP POLICY IF EXISTS "Allow public delete rfps" ON public.rfps;

DROP POLICY IF EXISTS "Allow public read matches" ON public.product_matches;
DROP POLICY IF EXISTS "Allow public insert matches" ON public.product_matches;
DROP POLICY IF EXISTS "Allow public update matches" ON public.product_matches;
DROP POLICY IF EXISTS "Allow public delete matches" ON public.product_matches;

DROP POLICY IF EXISTS "Allow public read proposals" ON public.proposals;
DROP POLICY IF EXISTS "Allow public insert proposals" ON public.proposals;
DROP POLICY IF EXISTS "Allow public update proposals" ON public.proposals;
DROP POLICY IF EXISTS "Allow public delete proposals" ON public.proposals;

-- Create secure RLS policies for rfps
CREATE POLICY "Users can view their own rfps"
ON public.rfps FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own rfps"
ON public.rfps FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rfps"
ON public.rfps FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rfps"
ON public.rfps FOR DELETE
USING (auth.uid() = user_id);

-- Create secure RLS policies for product_matches
CREATE POLICY "Users can view their own matches"
ON public.product_matches FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own matches"
ON public.product_matches FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own matches"
ON public.product_matches FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own matches"
ON public.product_matches FOR DELETE
USING (auth.uid() = user_id);

-- Create secure RLS policies for proposals
CREATE POLICY "Users can view their own proposals"
ON public.proposals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own proposals"
ON public.proposals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proposals"
ON public.proposals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proposals"
ON public.proposals FOR DELETE
USING (auth.uid() = user_id);