import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAI = () => {
  const [isLoading, setIsLoading] = useState(false);

  const summarizeRFP = async (rfpContent: string, rfpTitle: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('rfp-summarize', {
        body: { rfpContent, rfpTitle }
      });

      if (error) throw error;
      
      toast.success('RFP summarized successfully');
      return data.summary;
    } catch (error: any) {
      console.error('Error summarizing RFP:', error);
      toast.error(error.message || 'Failed to summarize RFP');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const matchProducts = async (requirements: string, sensitivity: number = 0.7) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('product-match', {
        body: { requirements, sensitivity }
      });

      if (error) throw error;
      
      toast.success('Products matched successfully');
      return data;
    } catch (error: any) {
      console.error('Error matching products:', error);
      toast.error(error.message || 'Failed to match products');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const generateProposal = async (
    rfpSummary: string,
    matchedProducts: any[],
    pricing: any[]
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-proposal', {
        body: { rfpSummary, matchedProducts, pricing }
      });

      if (error) throw error;
      
      toast.success('Proposal generated successfully');
      return data.proposal;
    } catch (error: any) {
      console.error('Error generating proposal:', error);
      toast.error(error.message || 'Failed to generate proposal');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    summarizeRFP,
    matchProducts,
    generateProposal
  };
};
