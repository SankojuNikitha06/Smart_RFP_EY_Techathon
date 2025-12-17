import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, Upload, FileText, Calendar, Tag, Loader2, Plus, X, File } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface RFP {
  id: string;
  title: string;
  status: string;
  deadline: string | null;
  source: string;
  category: string;
  content: string | null;
  created_at: string;
  file_path?: string | null;
}

export default function RFPIntake() {
  const [searchQuery, setSearchQuery] = useState("");
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form state
  const [newRfp, setNewRfp] = useState({
    title: "",
    content: "",
    source: "Manual Upload",
    category: "General",
    deadline: "",
    filePath: ""
  });

  useEffect(() => {
    fetchRFPs();
  }, []);

  const fetchRFPs = async () => {
    try {
      const { data, error } = await supabase
        .from('rfps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRfps(data || []);
    } catch (error: any) {
      console.error('Error fetching RFPs:', error);
      toast.error('Failed to load RFPs');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      if (!newRfp.title) {
        setNewRfp(prev => ({ ...prev, title: file.name.replace('.pdf', '') }));
      }
    }
  };

  const extractPdfText = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      setUploadProgress(30);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf-text`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      setUploadProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract PDF text');
      }

      const data = await response.json();
      setUploadProgress(100);

      setNewRfp(prev => ({
        ...prev,
        content: data.extractedText,
        filePath: data.filePath,
        source: 'PDF Upload'
      }));

      toast.success('PDF text extracted successfully!');
    } catch (error: any) {
      console.error('Error extracting PDF:', error);
      toast.error(error.message || 'Failed to extract PDF text');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const createRFP = async () => {
    if (!newRfp.title.trim()) {
      toast.error('Please enter an RFP title');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('rfps')
        .insert({
          title: newRfp.title,
          content: newRfp.content || null,
          source: newRfp.source,
          category: newRfp.category,
          deadline: newRfp.deadline || null,
          status: 'new',
          file_path: newRfp.filePath || null,
          user_id: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('RFP created successfully!');
      setRfps([data, ...rfps]);
      setDialogOpen(false);
      setNewRfp({ title: "", content: "", source: "Manual Upload", category: "General", deadline: "", filePath: "" });
      setSelectedFile(null);
      
      // Navigate to details to run AI summarization
      navigate(`/rfp-details/${data.id}`);
    } catch (error: any) {
      console.error('Error creating RFP:', error);
      toast.error('Failed to create RFP');
    } finally {
      setCreating(false);
    }
  };

  const deleteRFP = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this RFP?')) return;

    try {
      const { error } = await supabase.from('rfps').delete().eq('id', id);
      if (error) throw error;
      
      setRfps(rfps.filter(r => r.id !== id));
      toast.success('RFP deleted');
    } catch (error: any) {
      console.error('Error deleting RFP:', error);
      toast.error('Failed to delete RFP');
    }
  };

  const filteredRFPs = rfps.filter(rfp =>
    rfp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rfp.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusForBadge = (status: string) => {
    return status.replace('_', '-') as "new" | "in-progress" | "waiting-approval" | "submitted";
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">RFP Intake & Management</h1>
          <p className="text-muted-foreground text-lg">Manage all incoming and active RFPs</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              Create RFP
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New RFP</DialogTitle>
              <DialogDescription>
                Add RFP details and content. AI will automatically summarize and extract requirements.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">RFP Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Home Appliances Procurement Q1 2025"
                  value={newRfp.title}
                  onChange={(e) => setNewRfp({ ...newRfp, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Select value={newRfp.source} onValueChange={(v) => setNewRfp({ ...newRfp, source: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manual Upload">Manual Upload</SelectItem>
                      <SelectItem value="Government Portal">Government Portal</SelectItem>
                      <SelectItem value="Direct Email">Direct Email</SelectItem>
                      <SelectItem value="Tender Portal">Tender Portal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newRfp.category} onValueChange={(v) => setNewRfp({ ...newRfp, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Appliances">Appliances</SelectItem>
                      <SelectItem value="Cooling">Cooling</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Kitchen">Kitchen</SelectItem>
                      <SelectItem value="Laundry">Laundry</SelectItem>
                      <SelectItem value="Heating">Heating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newRfp.deadline}
                  onChange={(e) => setNewRfp({ ...newRfp, deadline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Upload PDF Document</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-primary">
                        <File className="h-8 w-8" />
                        <span className="font-medium">{selectedFile.name}</span>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null);
                            setNewRfp(prev => ({ ...prev, content: '', filePath: '' }));
                          }}
                        >
                          Remove
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={extractPdfText}
                          disabled={uploading || !!newRfp.content}
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Extracting...
                            </>
                          ) : newRfp.content ? (
                            'Text Extracted'
                          ) : (
                            'Extract Text'
                          )}
                        </Button>
                      </div>
                      {uploading && (
                        <Progress value={uploadProgress} className="h-2" />
                      )}
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-20"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-muted-foreground">Click to upload PDF</span>
                      </div>
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">RFP Content {selectedFile && '(extracted from PDF)'}</Label>
                <Textarea
                  id="content"
                  placeholder="Paste the full RFP document text here or upload a PDF above. AI will extract requirements, specifications, and generate a summary..."
                  value={newRfp.content}
                  onChange={(e) => setNewRfp({ ...newRfp, content: e.target.value })}
                  className="min-h-[200px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={createRFP} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Create & Analyze
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="px-4 py-2 text-sm">
          <FileText className="h-3 w-3 mr-2" />
          {filteredRFPs.length} Total RFPs
        </Badge>
        <Badge variant="secondary" className="px-4 py-2 text-sm">
          <Tag className="h-3 w-3 mr-2" />
          7 Categories
        </Badge>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader className="pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                All RFPs
              </CardTitle>
              <CardDescription className="mt-2">Search, filter, and manage your RFP pipeline</CardDescription>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-96">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by title or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base shadow-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredRFPs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No RFPs found</p>
              <p className="text-sm mt-2">Create your first RFP to get started with AI-powered analysis</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Title</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Source</TableHead>
                  <TableHead className="font-semibold">Deadline</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRFPs.map((rfp) => (
                  <TableRow
                    key={rfp.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/rfp-details/${rfp.id}`)}
                  >
                    <TableCell className="font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        {rfp.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={getStatusForBadge(rfp.status)} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        <Tag className="h-3 w-3 mr-1" />
                        {rfp.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{rfp.source}</TableCell>
                    <TableCell>
                      {rfp.deadline ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(rfp.deadline).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/rfp-details/${rfp.id}`);
                        }}>
                          View
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-destructive/10 hover:text-destructive" onClick={(e) => deleteRFP(rfp.id, e)}>
                          <X className="h-4 w-4" />
                        </Button>
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
