-- Create RFPs table
CREATE TABLE public.rfps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'Manual Upload',
  category TEXT NOT NULL DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'waiting_approval', 'submitted')),
  deadline TIMESTAMP WITH TIME ZONE,
  content TEXT,
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product matches table
CREATE TABLE public.product_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rfp_id UUID NOT NULL REFERENCES public.rfps(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  match_score INTEGER NOT NULL DEFAULT 0,
  match_reason TEXT,
  gap_analysis TEXT,
  recommended BOOLEAN DEFAULT false,
  unit_price DECIMAL(10,2),
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create proposals table
CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rfp_id UUID NOT NULL REFERENCES public.rfps(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  total_amount DECIMAL(12,2),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'submitted')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rfps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Create public access policies (since no auth yet)
CREATE POLICY "Allow public read rfps" ON public.rfps FOR SELECT USING (true);
CREATE POLICY "Allow public insert rfps" ON public.rfps FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update rfps" ON public.rfps FOR UPDATE USING (true);
CREATE POLICY "Allow public delete rfps" ON public.rfps FOR DELETE USING (true);

CREATE POLICY "Allow public read matches" ON public.product_matches FOR SELECT USING (true);
CREATE POLICY "Allow public insert matches" ON public.product_matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update matches" ON public.product_matches FOR UPDATE USING (true);
CREATE POLICY "Allow public delete matches" ON public.product_matches FOR DELETE USING (true);

CREATE POLICY "Allow public read proposals" ON public.proposals FOR SELECT USING (true);
CREATE POLICY "Allow public insert proposals" ON public.proposals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update proposals" ON public.proposals FOR UPDATE USING (true);
CREATE POLICY "Allow public delete proposals" ON public.proposals FOR DELETE USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers
CREATE TRIGGER update_rfps_updated_at
  BEFORE UPDATE ON public.rfps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();