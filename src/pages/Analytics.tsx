import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scan, ArrowLeft, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface ScanRecord {
  id: string;
  created_at: string;
  health_score: number;
  status: string;
  harmful_ingredients: string[];
}

const Analytics = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchScans(session.user.id);
      }
    });
  }, []);

  const fetchScans = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("scans")
      .select("id, created_at, health_score, status, harmful_ingredients")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load analytics data");
    } else {
      setScans(data || []);
    }
    setLoading(false);
  };

  // Calculate statistics
  const avgHealthScore = scans.length
    ? (scans.reduce((sum, s) => sum + s.health_score, 0) / scans.length).toFixed(1)
    : "0";

  const recentScans = scans.slice(-5);
  const recentAvg = recentScans.length
    ? (recentScans.reduce((sum, s) => sum + s.health_score, 0) / recentScans.length).toFixed(1)
    : "0";

  const trend =
    scans.length >= 2
      ? parseFloat(recentAvg) - parseFloat(avgHealthScore) >= 0
        ? "up"
        : "down"
      : "neutral";

  // Prepare chart data - Health Score Trend
  const healthScoreTrend = scans.map((scan, index) => ({
    scan: `#${index + 1}`,
    date: new Date(scan.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: scan.health_score,
  }));

  // Status Distribution
  const statusCounts = scans.reduce((acc, scan) => {
    acc[scan.status] = (acc[scan.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
  }));

  const COLORS = {
    Safe: "hsl(var(--success))",
    Warning: "hsl(var(--warning))",
    Unsafe: "hsl(var(--danger))",
  };

  // Harmful Ingredients Count
  const harmfulIngredientsData = scans.slice(-10).map((scan, index) => ({
    scan: `#${scans.length - 9 + index}`,
    count: scan.harmful_ingredients?.length || 0,
  }));

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Activity className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-health bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-muted-foreground mt-4">Loading analytics...</p>
          </div>
        ) : scans.length === 0 ? (
          <Card className="p-12 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No data yet</p>
            <p className="text-muted-foreground mb-6">
              Start scanning nutrition labels to see your trends
            </p>
            <Button onClick={() => navigate("/")}>Scan Your First Label</Button>
          </Card>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
                  <Scan className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{scans.length}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgHealthScore}/10</div>
                  <p className="text-xs text-muted-foreground">Overall average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Recent Trend</CardTitle>
                  {trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : trend === "down" ? (
                    <TrendingDown className="h-4 w-4 text-danger" />
                  ) : (
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recentAvg}/10</div>
                  <p className="text-xs text-muted-foreground">Last 5 scans</p>
                </CardContent>
              </Card>
            </div>

            {/* Health Score Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Health Score Trend</CardTitle>
                <CardDescription>Your nutrition choices over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={healthScoreTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 10]} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Status Distribution</CardTitle>
                  <CardDescription>Breakdown by safety rating</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {statusData.map((entry) => (
                          <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Harmful Ingredients */}
              <Card>
                <CardHeader>
                  <CardTitle>Harmful Ingredients</CardTitle>
                  <CardDescription>Last 10 scans</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={harmfulIngredientsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="scan" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--danger))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;
