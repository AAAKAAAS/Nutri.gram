import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultsDisplayProps {
  result: {
    health_score: number;
    nutrition_data: any;
    harmful_ingredients: string[];
    recommendations: string;
    status: "safe" | "unsafe" | "limits";
  };
}

export function ResultsDisplay({ result }: ResultsDisplayProps) {
  const statusConfig = {
    safe: {
      icon: CheckCircle,
      color: "text-success",
      bg: "bg-success/10",
      label: "Safe to Consume",
    },
    unsafe: {
      icon: AlertCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      label: "Not Recommended",
    },
    limits: {
      icon: AlertTriangle,
      color: "text-warning",
      bg: "bg-warning/10",
      label: "Consume in Moderation",
    },
  };

  const config = statusConfig[result.status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-5">
      {/* Health Score */}
      <Card className="p-6 shadow-glow border-2 border-primary/20">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Health Score</h3>
            <span className="text-4xl font-bold bg-gradient-health bg-clip-text text-transparent">
              {result.health_score}/10
            </span>
          </div>
          <Progress value={result.health_score * 10} className="h-3" />
        </div>
      </Card>

      {/* Status Badge */}
      <Card className={cn("p-6 shadow-soft", config.bg)}>
        <div className="flex items-center gap-3">
          <StatusIcon className={cn("h-8 w-8", config.color)} />
          <div>
            <h3 className="font-semibold text-lg">{config.label}</h3>
            <p className="text-sm text-muted-foreground">Based on your profile</p>
          </div>
        </div>
      </Card>

      {/* Nutrition Data */}
      {result.nutrition_data && (
        <Card className="p-6 shadow-soft">
          <h3 className="font-semibold text-lg mb-4">Nutritional Information</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(result.nutrition_data).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <p className="text-sm text-muted-foreground capitalize">{key}</p>
                <p className="font-semibold">{value as string}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Harmful Ingredients */}
      {result.harmful_ingredients.length > 0 && (
        <Card className="p-6 shadow-soft border-destructive/20">
          <h3 className="font-semibold text-lg mb-4 text-destructive">
            Harmful Ingredients Detected
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.harmful_ingredients.map((ingredient, idx) => (
              <Badge key={idx} variant="destructive">
                {ingredient}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="p-6 shadow-soft bg-secondary/50">
        <h3 className="font-semibold text-lg mb-3">Recommendations</h3>
        <p className="text-muted-foreground leading-relaxed">{result.recommendations}</p>
      </Card>
    </div>
  );
}
