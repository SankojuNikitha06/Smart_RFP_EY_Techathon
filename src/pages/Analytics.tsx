import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Clock, Target, BarChart3, Award, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Analytics() {
  const kpiData = [
    { title: "Win Rate", value: "68%", change: "+5%", trend: "up", icon: Target },
    { title: "Avg Response Time", value: "4.2 days", change: "-0.8 days", trend: "up", icon: Clock },
    { title: "Active RFPs", value: "12", change: "+3", trend: "up", icon: TrendingUp },
    { title: "Monthly Submissions", value: "8", change: "-2", trend: "down", icon: TrendingDown },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Analytics & Reporting
          </h1>
          <p className="text-muted-foreground text-lg">Track performance metrics and trends</p>
        </div>
        <Badge variant="secondary" className="px-4 py-2 text-base">
          <Clock className="h-4 w-4 mr-2" />
          Last 30 days
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi) => (
          <Card key={kpi.title} className={`shadow-md hover:shadow-lg transition-all duration-200 border-l-4 ${kpi.trend === 'up' ? 'border-l-success' : 'border-l-warning'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <div className={`p-2 rounded-lg ${kpi.trend === 'up' ? 'bg-success/10' : 'bg-warning/10'}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.trend === 'up' ? 'text-success' : 'text-warning'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{kpi.value}</div>
              <div className="flex items-center gap-1 mt-2">
                {kpi.trend === 'up' ? <TrendingUp className="h-3 w-3 text-success" /> : <TrendingDown className="h-3 w-3 text-warning" />}
                <p className={`text-xs font-medium ${kpi.trend === 'up' ? 'text-success' : 'text-warning'}`}>
                  {kpi.change} from last month
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              <CardTitle className="text-xl">Response Time Trend</CardTitle>
            </div>
            <CardDescription className="mt-2">Average days to complete RFP response</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex flex-col items-center justify-center bg-gradient-to-br from-muted/50 to-muted/20 rounded-lg border border-border">
              <Zap className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Line chart visualization would appear here</p>
              <p className="text-xs text-muted-foreground mt-2">Showing trend over last 12 months</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-success" />
              <CardTitle className="text-xl">Win/Loss Ratio</CardTitle>
            </div>
            <CardDescription className="mt-2">Success rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex flex-col items-center justify-center bg-gradient-to-br from-muted/50 to-muted/20 rounded-lg border border-border">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Bar chart visualization would appear here</p>
              <p className="text-xs text-muted-foreground mt-2">Win rate comparison by quarter</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Spec Match Accuracy</CardTitle>
          </div>
          <CardDescription className="mt-2">AI matching performance by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex flex-col items-center justify-center bg-gradient-to-br from-muted/50 to-muted/20 rounded-lg border border-border">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Stacked area chart would appear here</p>
            <p className="text-xs text-muted-foreground mt-2">AI accuracy across product categories</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Historical RFP Performance
              </CardTitle>
              <CardDescription className="mt-2">Past 12 months activity</CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              3 months shown
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { month: "January", submitted: 8, won: 5, lost: 3 },
              { month: "December", submitted: 10, won: 7, lost: 3 },
              { month: "November", submitted: 6, won: 4, lost: 2 },
            ].map((data) => (
              <div key={data.month} className="flex items-center justify-between p-5 border border-border rounded-xl hover:shadow-md transition-shadow bg-gradient-to-r from-card to-muted/20">
                <span className="font-semibold text-foreground text-lg">{data.month}</span>
                <div className="flex gap-8 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                    <span className="text-muted-foreground">Submitted: <span className="font-semibold">{data.submitted}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <span className="text-success">Won: <span className="font-semibold">{data.won}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-destructive"></div>
                    <span className="text-destructive">Lost: <span className="font-semibold">{data.lost}</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
