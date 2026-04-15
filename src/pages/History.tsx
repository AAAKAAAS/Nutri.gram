import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scan, ArrowLeft, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface ScanRecord {
  id: string;
  created_at: string;
  image_url: string;
  health_score: number;
  status: string;
  harmful_ingredients: string[];
  recommendations: string;
  nutrition_data: any;
}

const History = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [filteredScans, setFilteredScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterScore, setFilterScore] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchScans(session.user.id);
      }
    });
  }, []);

  useEffect(() => {
    applyFilters();
  }, [scans, filterScore, filterDate]);

  const fetchScans = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("scans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load scan history");
    } else {
      setScans(data || []);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...scans];

    // Filter by health score
    if (filterScore !== "all") {
      if (filterScore === "high") {
        filtered = filtered.filter((s) => s.health_score >= 7);
      } else if (filterScore === "medium") {
        filtered = filtered.filter((s) => s.health_score >= 4 && s.health_score < 7);
      } else if (filterScore === "low") {
        filtered = filtered.filter((s) => s.health_score < 4);
      }
    }

    // Filter by date
    if (filterDate !== "all") {
      const now = new Date();
      if (filterDate === "today") {
        filtered = filtered.filter((s) => {
          const scanDate = new Date(s.created_at);
          return scanDate.toDateString() === now.toDateString();
        });
      } else if (filterDate === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((s) => new Date(s.created_at) >= weekAgo);
      } else if (filterDate === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((s) => new Date(s.created_at) >= monthAgo);
      }
    }

    setFilteredScans(filtered);
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return "text-success";
    if (score >= 4) return "text-warning";
    return "text-danger";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 7) return <CheckCircle className="h-5 w-5" />;
    if (score >= 4) return <TrendingUp className="h-5 w-5" />;
    return <AlertTriangle className="h-5 w-5" />;
  };

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
              <Scan className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-health bg-clip-text text-transparent">
                Scan History
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={filterScore} onValueChange={setFilterScore}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scores</SelectItem>
              <SelectItem value="high">High (7-10)</SelectItem>
              <SelectItem value="medium">Medium (4-6)</SelectItem>
              <SelectItem value="low">Low (0-3)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterDate} onValueChange={setFilterDate}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto text-sm text-muted-foreground">
            {filteredScans.length} scan{filteredScans.length !== 1 ? "s" : ""} found
          </div>
        </div>

        {/* Scan List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-muted-foreground mt-4">Loading scans...</p>
          </div>
        ) : filteredScans.length === 0 ? (
          <Card className="p-12 text-center">
            <Scan className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No scans found</p>
            <p className="text-muted-foreground mb-6">
              {scans.length === 0
                ? "Start scanning nutrition labels to see your history"
                : "Try adjusting your filters"}
            </p>
            <Button onClick={() => navigate("/")}>Scan Your First Label</Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredScans.map((scan) => (
              <Card
                key={scan.id}
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer animate-fade-in"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex items-center gap-2 ${getScoreColor(scan.health_score)}`}>
                    {getScoreIcon(scan.health_score)}
                    <span className="text-2xl font-bold">{scan.health_score}/10</span>
                  </div>
                  <Badge
                    variant={
                      scan.status === "safe"
                        ? "default"
                        : scan.status === "warning"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {scan.status}
                  </Badge>
                </div>

                <img
                  src={scan.image_url}
                  alt="Nutrition label"
                  className="w-full h-32 object-cover rounded-md mb-3"
                />

                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    {new Date(scan.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>

                  {scan.harmful_ingredients?.length > 0 && (
                    <div>
                      <p className="font-medium text-danger mb-1">
                        {scan.harmful_ingredients.length} harmful ingredient
                        {scan.harmful_ingredients.length !== 1 ? "s" : ""}
                      </p>
                      <p className="text-muted-foreground line-clamp-2">
                        {scan.harmful_ingredients.join(", ")}
                      </p>
                    </div>
                  )}

                  {scan.recommendations && (
                    <p className="text-muted-foreground line-clamp-3">{scan.recommendations}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
