import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { CheckCircle, XCircle, AlertCircle, Sparkles, Download, Package, Loader2, ArrowLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAI } from "@/hooks/useAI";
import { useAuth } from "@/contexts/AuthContext";

interface ProductMatch {
  sku: string;
  name: string;
  matchScore: number;
  matchReason: string;
  gapAnalysis: string;
  recommended: boolean;
}

interface RFP {
  id: string;
  title: string;
  ai_summary: string | null;
}

export default function ProductMatching() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rfpId = searchParams.get('rfp');
  
  const [sensitivity, setSensitivity] = useState([70]);
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [rfp, setRfp] = useState<RFP | null>(null);
  const [loading, setLoading] = useState(true);
  const { matchProducts, isLoading: aiLoading } = useAI();
  const { user } = useAuth();

  useEffect(() => {
    if (rfpId) {
      fetchRFP();
      fetchExistingMatches();
    } else {
      setLoading(false);
    }
  }, [rfpId]);

  const fetchRFP = async () => {
    try {
      const { data, error } = await supabase
        .from('rfps')
        .select('id, title, ai_summary')
        .eq('id', rfpId)
        .maybeSingle();

      if (error) throw error;
      setRfp(data);
    } catch (error) {
      console.error('Error fetching RFP:', error);
    }
  };

  const fetchExistingMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('product_matches')
        .select('*')
        .eq('rfp_id', rfpId);

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedMatches = data.map(m => ({
          sku: m.sku,
          name: m.product_name,
          matchScore: m.match_score,
          matchReason: m.match_reason || '',
          gapAnalysis: m.gap_analysis || '',
          recommended: m.recommended || false
        }));
        setMatches(formattedMatches);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAIMatching = async () => {
    if (!rfp?.ai_summary) {
      toast.error('Please generate an AI summary first');
      return;
    }

    try {
      const result = await matchProducts(rfp.ai_summary, sensitivity[0] / 100);
      
      if (result.matches && Array.isArray(result.matches)) {
        setMatches(result.matches);

        // Save matches to database
        if (rfpId) {
          // Clear existing matches
          await supabase.from('product_matches').delete().eq('rfp_id', rfpId);

          // Insert new matches
          const matchesToInsert = result.matches.map((m: ProductMatch) => ({
            rfp_id: rfpId,
            sku: m.sku,
            product_name: m.name,
            match_score: m.matchScore,
            match_reason: m.matchReason,
            gap_analysis: m.gapAnalysis,
            recommended: m.recommended,
            unit_price: getDefaultPrice(m.sku),
            quantity: 1,
            user_id: user?.id
          }));

          const { error } = await supabase.from('product_matches').insert(matchesToInsert);
          if (error) throw error;
        }
      }
    } catch (error) {
      console.error('Matching error:', error);
    }
  };

  const getDefaultPrice = (sku: string) => {
    const prices: Record<string, number> = {
      'REF-5STAR-450': 850,
      'REF-4STAR-350': 650,
      'REF-3STAR-250': 450,
      'WM-5STAR-8KG': 520,
      'WM-4STAR-7KG': 380,
      'WM-SEMI-6KG': 220,
      'AC-5STAR-1.5T': 680,
      'AC-3STAR-1T': 450,
      'AC-WIN-1.5T': 350,
      'TV-4K-55': 750,
      'TV-FHD-43': 450,
      'MW-CONV-30': 280,
      'MW-SOLO-20': 150,
      'WH-INST-15': 180,
      'WH-STOR-25': 220
    };
    return prices[sku] || 500;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 75) return "text-primary";
    return "text-warning";
  };

  const getStatusIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-4 w-4 text-success" />;
    if (score >= 75) return <CheckCircle className="h-4 w-4 text-primary" />;
    return <AlertCircle className="h-4 w-4 text-warning" />;
  };

  const excellentCount = matches.filter(m => m.matchScore >= 90).length;
  const goodCount = matches.filter(m => m.matchScore >= 75 && m.matchScore < 90).length;
  const avgScore = matches.length > 0 
    ? Math.round(matches.reduce((sum, m) => sum + m.matchScore, 0) / matches.length)
    : 0;

  const exportTable = () => {
    const csv = [
      ['SKU', 'Product', 'Match Score', 'Reason', 'Gap Analysis', 'Recommended'],
      ...matches.map(m => [m.sku, m.name, m.matchScore, m.matchReason, m.gapAnalysis, m.recommended])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-matches.csv';
    a.click();
    toast.success('Table exported');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          {rfpId && (
            <Button variant="ghost" size="icon" onClick={() => navigate(`/rfp-details/${rfpId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              Product Matching
            </h1>
            <p className="text-muted-foreground text-lg">AI-powered matching of RFP requirements to available products</p>
          </div>
        </div>
        {rfp && (
          <Badge variant="secondary" className="px-4 py-2 text-base">
            <Package className="h-4 w-4 mr-2" />
            {rfp.title}
          </Badge>
        )}
      </div>

      {!rfpId && (
        <Card className="shadow-lg border-0 border-l-4 border-l-warning">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Select an RFP from the <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/rfp-intake')}>RFP Intake</Button> page to run AI product matching.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Matches</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{matches.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Products identified</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Excellent Matches</CardTitle>
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{excellentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">≥90% match score</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Good Matches</CardTitle>
            <div className="p-2 rounded-lg bg-accent/10">
              <CheckCircle className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{goodCount}</div>
            <p className="text-xs text-muted-foreground mt-1">75-89% match score</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Match Score</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{avgScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">Overall accuracy</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-muted/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">AI Matching Controls</CardTitle>
          </div>
          <CardDescription>Adjust the AI matching threshold and run analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <span className="text-sm font-semibold min-w-28 text-foreground">Threshold:</span>
              <Slider
                value={sensitivity}
                onValueChange={setSensitivity}
                max={100}
                step={5}
                className="flex-1"
              />
              <Badge variant="default" className="min-w-20 justify-center text-base py-2">
                {sensitivity[0]}%
              </Badge>
            </div>
            <div className="flex gap-4">
              <Button 
                size="lg" 
                onClick={runAIMatching} 
                disabled={aiLoading || !rfp?.ai_summary}
                className="shadow-md"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Matching...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Run AI Matching
                  </>
                )}
              </Button>
              {!rfp?.ai_summary && rfpId && (
                <p className="text-sm text-muted-foreground self-center">
                  Generate an AI summary first in <Button variant="link" className="p-0 h-auto" onClick={() => navigate(`/rfp-details/${rfpId}`)}>RFP Details</Button>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                Product Match Results
              </CardTitle>
              <CardDescription className="mt-2">AI-matched products from your FMEG catalog</CardDescription>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="lg" className="shadow-sm" onClick={exportTable} disabled={matches.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button 
                size="lg" 
                className="shadow-md" 
                onClick={() => navigate(`/pricing?rfp=${rfpId}`)}
                disabled={matches.length === 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Continue to Pricing
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No matches yet</p>
              <p className="text-sm mt-2">Run AI matching to find products that match the RFP requirements</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Match Score</TableHead>
                  <TableHead>Match Reason</TableHead>
                  <TableHead>Gap Analysis</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">{match.sku}</TableCell>
                    <TableCell className="font-medium">{match.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${getScoreColor(match.matchScore)}`}>
                          {match.matchScore}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={match.matchReason}>
                      {match.matchReason}
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={match.gapAnalysis}>
                      {match.gapAnalysis || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {getStatusIcon(match.matchScore)}
                        <span className="text-sm">{match.recommended ? 'Recommended' : 'Optional'}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
