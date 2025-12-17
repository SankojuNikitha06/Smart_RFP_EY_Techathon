import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Sparkles, CheckCircle, Calendar, Tag, Building2, Loader2, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAI } from "@/hooks/useAI";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RFP {
  id: string;
  title: string;
  status: string;
  deadline: string | null;
  source: string;
  category: string;
  content: string | null;
  ai_summary: string | null;
  created_at: string;
}

export default function RFPDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { summarizeRFP, isLoading: aiLoading } = useAI();
  
  const [rfp, setRfp] = useState<RFP | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedSummary, setEditedSummary] = useState("");
  const [editedContent, setEditedContent] = useState("");

  useEffect(() => {
    if (id) fetchRFP();
  }, [id]);

  const fetchRFP = async () => {
    try {
      const { data, error } = await supabase
        .from('rfps')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('RFP not found');
        navigate('/rfp-intake');
        return;
      }

      setRfp(data);
      setEditedSummary(data.ai_summary || "");
      setEditedContent(data.content || "");
    } catch (error: any) {
      console.error('Error fetching RFP:', error);
      toast.error('Failed to load RFP');
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!rfp?.content) {
      toast.error('Please add RFP content first');
      return;
    }

    try {
      const summary = await summarizeRFP(rfp.content, rfp.title);
      setEditedSummary(summary);
      
      // Save to database
      const { error } = await supabase
        .from('rfps')
        .update({ ai_summary: summary, status: 'in_progress' })
        .eq('id', id);

      if (error) throw error;
      
      setRfp({ ...rfp, ai_summary: summary, status: 'in_progress' });
    } catch (error) {
      console.error('Summarization error:', error);
    }
  };

  const saveChanges = async () => {
    if (!rfp) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('rfps')
        .update({ 
          content: editedContent,
          ai_summary: editedSummary 
        })
        .eq('id', id);

      if (error) throw error;
      
      setRfp({ ...rfp, content: editedContent, ai_summary: editedSummary });
      toast.success('Changes saved');
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!rfp) return;
    
    try {
      const { error } = await supabase
        .from('rfps')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setRfp({ ...rfp, status: newStatus });
      toast.success('Status updated');
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusForBadge = (status: string) => {
    return status.replace('_', '-') as "new" | "in-progress" | "waiting-approval" | "submitted";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!rfp) {
    return (
      <div className="text-center py-12">
        <p>RFP not found</p>
        <Button onClick={() => navigate('/rfp-intake')} className="mt-4">
          Back to RFPs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/rfp-intake")} className="hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-foreground">{rfp.title}</h1>
            <StatusBadge status={getStatusForBadge(rfp.status)} />
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created {new Date(rfp.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {rfp.source}
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={saveChanges} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg border-0 border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              RFP Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Select value={rfp.status} onValueChange={updateStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="waiting_approval">Waiting Approval</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Source</p>
              <p className="font-semibold text-foreground text-lg">{rfp.source}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Category</p>
              <Badge variant="outline" className="text-base font-normal">
                <Tag className="h-4 w-4 mr-2" />
                {rfp.category}
              </Badge>
            </div>
            {rfp.deadline && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Deadline</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-warning" />
                  <p className="font-semibold text-foreground text-lg">{new Date(rfp.deadline).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Sparkles className="h-5 w-5 text-accent" />
                  </div>
                  AI-Generated Summary
                </CardTitle>
                <CardDescription className="mt-2">Automated extraction of key requirements</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="shadow-sm" 
                onClick={handleSummarize}
                disabled={aiLoading || !rfp.content}
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {editedSummary ? 'Regenerate' : 'Generate Summary'}
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={editedSummary}
              onChange={(e) => setEditedSummary(e.target.value)}
              placeholder={rfp.content ? "Click 'Generate Summary' to analyze this RFP with AI..." : "Add RFP content below first, then generate AI summary"}
              className="min-h-[300px] font-mono text-sm"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            RFP Content
          </CardTitle>
          <CardDescription className="mt-2">Full RFP document content for AI analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder="Paste the full RFP document text here for AI analysis..."
            className="min-h-[300px]"
          />
        </CardContent>
      </Card>

      <Card className="shadow-xl border-0 bg-gradient-to-br from-success/5 to-accent/5 border-l-4 border-l-success">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-success/10">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-foreground">Ready for next steps</h3>
                <p className="text-sm text-muted-foreground mt-1">Proceed to product matching and pricing</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="lg" 
                className="shadow-sm" 
                onClick={() => navigate(`/product-matching?rfp=${id}`)}
                disabled={!editedSummary}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Product Matching
              </Button>
              <Button 
                size="lg" 
                className="shadow-md" 
                onClick={() => navigate(`/pricing?rfp=${id}`)}
                disabled={!editedSummary}
              >
                Generate Pricing
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
