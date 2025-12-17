import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { FileText, Clock, TrendingUp, CheckCircle, AlertCircle, Upload, Zap, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RFP {
  id: string;
  title: string;
  status: "new" | "in_progress" | "waiting_approval" | "submitted";
  deadline: string | null;
  source: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    inProgress: 0,
    new: 0
  });

  useEffect(() => {
    fetchRFPs();
  }, []);

  const fetchRFPs = async () => {
    try {
      const { data, error } = await supabase
        .from('rfps')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;

      const formattedRfps = (data || []).map(rfp => ({
        ...rfp,
        status: rfp.status.replace('_', '-') as any
      }));

      setRfps(formattedRfps);

      // Calculate stats
      const { count: total } = await supabase.from('rfps').select('*', { count: 'exact', head: true });
      const { count: submitted } = await supabase.from('rfps').select('*', { count: 'exact', head: true }).eq('status', 'submitted');
      const { count: inProgress } = await supabase.from('rfps').select('*', { count: 'exact', head: true }).eq('status', 'in_progress');
      const { count: newCount } = await supabase.from('rfps').select('*', { count: 'exact', head: true }).eq('status', 'new');

      setStats({
        total: total || 0,
        submitted: submitted || 0,
        inProgress: inProgress || 0,
        new: newCount || 0
      });
    } catch (error: any) {
      console.error('Error fetching RFPs:', error);
      toast.error('Failed to load RFPs');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "Active RFPs", value: stats.total.toString(), icon: FileText, color: "text-primary" },
    { title: "In Progress", value: stats.inProgress.toString(), icon: Clock, color: "text-accent" },
    { title: "Submitted", value: stats.submitted.toString(), icon: TrendingUp, color: "text-success" },
    { title: "New RFPs", value: stats.new.toString(), icon: CheckCircle, color: "text-warning" },
  ];

  const getStatusForBadge = (status: string) => {
    return status.replace('_', '-') as "new" | "in-progress" | "waiting-approval" | "submitted";
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Welcome back!</h1>
          <p className="text-muted-foreground text-lg">Here's what's happening with your RFPs today</p>
        </div>
        <Button size="lg" className="shadow-lg" onClick={() => navigate("/rfp-intake")}>
          <Upload className="h-5 w-5 mr-2" />
          Upload New RFP
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/50 hover:border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{loading ? "-" : stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-lg border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Recent RFPs</CardTitle>
              </div>
              <Badge variant="secondary" className="text-xs">{rfps.length} shown</Badge>
            </div>
            <CardDescription>Latest RFPs requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : rfps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No RFPs yet. Upload your first RFP to get started!</p>
                <Button className="mt-4" onClick={() => navigate("/rfp-intake")}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload RFP
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {rfps.map((rfp) => (
                  <div
                    key={rfp.id}
                    className="group relative flex items-center justify-between p-5 border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer bg-card"
                    onClick={() => navigate(`/rfp-details/${rfp.id}`)}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">{rfp.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {rfp.source}
                        </span>
                        {rfp.deadline && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(rfp.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={getStatusForBadge(rfp.status)} />
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" className="w-full mt-6 border-dashed" onClick={() => navigate("/rfp-intake")}>
              View All RFPs
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              <CardTitle className="text-xl">Urgent Notifications</CardTitle>
            </div>
            <CardDescription>Items requiring immediate action</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-br from-warning/10 to-warning/5 border-l-4 border-warning rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-warning mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">AI Processing Ready</p>
                    <p className="text-xs text-muted-foreground mt-1">Upload RFPs to auto-summarize with AI</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 border-l-4 border-accent rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <Zap className="h-4 w-4 text-accent mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Smart Matching Enabled</p>
                    <p className="text-xs text-muted-foreground mt-1">AI will match FMEG products automatically</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-success/10 to-success/5 border-l-4 border-success rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Proposal Generator</p>
                    <p className="text-xs text-muted-foreground mt-1">Generate complete proposals with one click</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-muted/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Quick Actions</CardTitle>
          </div>
          <CardDescription>Jump to key tasks and workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button size="lg" className="h-auto py-6 flex-col gap-2 shadow-md" onClick={() => navigate("/rfp-intake")}>
              <Upload className="h-6 w-6" />
              <span className="font-semibold">Upload New RFP</span>
            </Button>
            <Button variant="outline" size="lg" className="h-auto py-6 flex-col gap-2 hover:shadow-md transition-shadow" onClick={() => navigate("/product-matching")}>
              <CheckCircle className="h-6 w-6" />
              <span className="font-semibold">View Matching Queue</span>
            </Button>
            <Button variant="outline" size="lg" className="h-auto py-6 flex-col gap-2 hover:shadow-md transition-shadow" onClick={() => navigate("/pricing")}>
              <FileText className="h-6 w-6" />
              <span className="font-semibold">Generate Proposals</span>
            </Button>
            <Button variant="outline" size="lg" className="h-auto py-6 flex-col gap-2 hover:shadow-md transition-shadow" onClick={() => navigate("/analytics")}>
              <BarChart3 className="h-6 w-6" />
              <span className="font-semibold">View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
