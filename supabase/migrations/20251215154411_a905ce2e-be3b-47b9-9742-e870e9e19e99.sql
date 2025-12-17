-- Create storage bucket for RFP documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('rfp-documents', 'rfp-documents', false);

-- Allow authenticated users to upload files
CREATE POLICY "Allow public upload rfp documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'rfp-documents');

-- Allow public read access to uploaded files
CREATE POLICY "Allow public read rfp documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'rfp-documents');

-- Allow public delete access
CREATE POLICY "Allow public delete rfp documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'rfp-documents');

-- Add file_path column to rfps table to store uploaded document reference
ALTER TABLE public.rfps ADD COLUMN file_path TEXT;