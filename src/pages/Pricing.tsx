import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDown, Send, DollarSign, Package, CheckCircle, Loader2, ArrowLeft, Sparkles, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAI } from "@/hooks/useAI";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

interface PricingItem {
  id: string;
  product: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface RFP {
  id: string;
  title: string;
  ai_summary: string | null;
  status: string;
}

const defaultTests = [
  { id: '1', test: "BEE Energy Rating Certification", cost: 1500 },
  { id: '2', test: "ISI Mark Compliance", cost: 1200 },
  { id: '3', test: "Safety & Performance Testing", cost: 2800 },
];

export default function Pricing() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rfpId = searchParams.get('rfp');
  
  const [items, setItems] = useState<PricingItem[]>([]);
  const [tests, setTests] = useState(defaultTests);
  const [rfp, setRfp] = useState<RFP | null>(null);
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState("");
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);
  const { generateProposal, isLoading: aiLoading } = useAI();
  const { user } = useAuth();

  useEffect(() => {
    if (rfpId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [rfpId]);

  const fetchData = async () => {
    try {
      // Fetch RFP
      const { data: rfpData, error: rfpError } = await supabase
        .from('rfps')
        .select('id, title, ai_summary, status')
        .eq('id', rfpId)
        .maybeSingle();

      if (rfpError) throw rfpError;
      setRfp(rfpData);

      // Fetch product matches
      const { data: matchData, error: matchError } = await supabase
        .from('product_matches')
        .select('*')
        .eq('rfp_id', rfpId);

      if (matchError) throw matchError;

      if (matchData && matchData.length > 0) {
        const pricingItems = matchData.map(m => ({
          id: m.id,
          product: m.product_name,
          sku: m.sku,
          quantity: m.quantity || 1,
          unitPrice: Number(m.unit_price) || 500,
          total: (m.quantity || 1) * (Number(m.unit_price) || 500)
        }));
        setItems(pricingItems);
      }

      // Fetch existing proposal
      const { data: proposalData } = await supabase
        .from('proposals')
        .select('content')
        .eq('rfp_id', rfpId)
        .maybeSingle();

      if (proposalData?.content) {
        setProposal(proposalData.content);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: string, quantity: number, unitPrice: number) => {
    const newItems = items.map(i =>
      i.id === id
        ? { ...i, quantity, unitPrice, total: quantity * unitPrice }
        : i
    );
    setItems(newItems);

    // Update in database
    try {
      await supabase
        .from('product_matches')
        .update({ quantity, unit_price: unitPrice })
        .eq('id', id);
    } catch (error) {
      console.error('Error updating:', error);
    }
  };

  const productSubtotal = items.reduce((sum, item) => sum + item.total, 0);
  const testSubtotal = tests.reduce((sum, test) => sum + test.cost, 0);
  const grandTotal = productSubtotal + testSubtotal;

  const handleGenerateProposal = async () => {
    if (!rfp?.ai_summary) {
      toast.error('Please generate an AI summary first');
      return;
    }

    if (items.length === 0) {
      toast.error('No products to include in proposal');
      return;
    }

    try {
      const proposalContent = await generateProposal(
        rfp.ai_summary,
        items.map(i => ({ name: i.product, sku: i.sku, quantity: i.quantity, unitPrice: i.unitPrice, total: i.total })),
        [...items.map(i => ({ item: i.product, cost: i.total })), ...tests.map(t => ({ item: t.test, cost: t.cost }))]
      );

      setProposal(proposalContent);
      setProposalDialogOpen(true);

      // Save proposal
      const { data: existing } = await supabase
        .from('proposals')
        .select('id')
        .eq('rfp_id', rfpId)
        .maybeSingle();

      if (existing) {
        await supabase.from('proposals')
          .update({ content: proposalContent, total_amount: grandTotal })
          .eq('id', existing.id);
      } else {
        await supabase.from('proposals')
          .insert({ rfp_id: rfpId, content: proposalContent, total_amount: grandTotal, user_id: user?.id });
      }

      toast.success('Proposal generated and saved!');
    } catch (error) {
      console.error('Error generating proposal:', error);
    }
  };

  const submitProposal = async () => {
    if (!rfpId) return;

    try {
      await supabase.from('rfps')
        .update({ status: 'submitted' })
        .eq('id', rfpId);

      await supabase.from('proposals')
        .update({ status: 'submitted' })
        .eq('rfp_id', rfpId);

      toast.success('Proposal submitted successfully!');
      navigate('/rfp-intake');
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error('Failed to submit proposal');
    }
  };

  const exportPDF = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Proposal - ${rfp?.title || 'RFP'}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
              h1 { color: #1a365d; }
              pre { white-space: pre-wrap; font-family: inherit; }
              .total { font-size: 24px; font-weight: bold; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>Proposal: ${rfp?.title || 'RFP Response'}</h1>
            <pre>${proposal}</pre>
            <div class="total">Grand Total: $${grandTotal.toLocaleString()}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          {rfpId && (
            <Button variant="ghost" size="icon" onClick={() => navigate(`/product-matching?rfp=${rfpId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-primary" />
              Pricing & Proposal
            </h1>
            <p className="text-muted-foreground text-lg">Generate pricing tables and proposal documents</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="lg" className="shadow-sm" onClick={exportPDF} disabled={!proposal}>
            <FileDown className="h-5 w-5 mr-2" />
            Export PDF
          </Button>
          <Button size="lg" className="shadow-lg" onClick={submitProposal} disabled={!proposal}>
            <Send className="h-5 w-5 mr-2" />
            Submit Proposal
          </Button>
        </div>
      </div>

      {!rfpId && (
        <Card className="shadow-lg border-0 border-l-4 border-l-warning">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Select an RFP and run product matching first. Go to <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/rfp-intake')}>RFP Intake</Button> to get started.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="px-4 py-2 text-sm">
          <Package className="h-3 w-3 mr-2" />
          {items.length} Products
        </Badge>
        <Badge variant="outline" className="px-4 py-2 text-sm">
          <CheckCircle className="h-3 w-3 mr-2" />
          {tests.length} Tests
        </Badge>
        <Badge variant="secondary" className="px-4 py-2 text-sm">
          <DollarSign className="h-3 w-3 mr-2" />
          ${grandTotal.toLocaleString()} Total
        </Badge>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Product Pricing</CardTitle>
          </div>
          <CardDescription className="mt-2">Edit quantities and pricing for matched products</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No products matched yet</p>
              <Button variant="link" onClick={() => navigate(`/product-matching?rfp=${rfpId}`)}>
                Run product matching first
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price ($)</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product}</TableCell>
                    <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={item.quantity}
                        className="w-20 text-right ml-auto"
                        onChange={(e) => updateItem(item.id, parseInt(e.target.value) || 0, item.unitPrice)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={item.unitPrice}
                        className="w-24 text-right ml-auto"
                        onChange={(e) => updateItem(item.id, item.quantity, parseInt(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell className="text-right font-semibold">${item.total.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-semibold">Product Subtotal</TableCell>
                  <TableCell className="text-right font-bold">${productSubtotal.toLocaleString()}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <CardTitle className="text-xl">Testing & Certification Costs</CardTitle>
          </div>
          <CardDescription className="mt-2">Required tests and compliance certifications</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test/Certification</TableHead>
                <TableHead className="text-right">Cost ($)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell className="font-medium">{test.test}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={test.cost}
                      className="w-32 text-right ml-auto"
                      onChange={(e) => {
                        const newCost = parseInt(e.target.value) || 0;
                        setTests(tests.map(t =>
                          t.id === test.id ? { ...t, cost: newCost } : t
                        ));
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="text-right font-semibold">Testing Subtotal</TableCell>
                <TableCell className="text-right font-bold">${testSubtotal.toLocaleString()}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-xl border-0 bg-gradient-to-br from-primary/5 via-accent/5 to-success/5 border-l-4 border-l-primary">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-primary/10">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-foreground">Grand Total</h3>
                <p className="text-sm text-muted-foreground mt-1">Total proposal value including all costs</p>
              </div>
            </div>
            <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ${grandTotal.toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                AI Proposal Generator
              </CardTitle>
              <CardDescription>Generate a complete proposal document with AI</CardDescription>
            </div>
            <Button 
              onClick={handleGenerateProposal} 
              disabled={aiLoading || items.length === 0 || !rfp?.ai_summary}
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Proposal
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {proposal ? (
            <div className="space-y-4">
              <Textarea
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
              <Button variant="outline" onClick={() => setProposalDialogOpen(true)}>
                View Full Proposal
              </Button>
            </div>
          ) : (
            <div className="p-6 bg-muted rounded-lg border border-border text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary/50" />
              <p className="text-muted-foreground">
                Click "Generate Proposal" to create a complete AI-powered proposal document
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={proposalDialogOpen} onOpenChange={setProposalDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generated Proposal</DialogTitle>
            <DialogDescription>Review and edit your AI-generated proposal</DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm">{proposal}</pre>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={exportPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={submitProposal}>
              <Send className="h-4 w-4 mr-2" />
              Submit Proposal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
