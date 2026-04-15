import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

interface ProfileSetupProps {
  userId: string;
  onComplete: () => void;
}

const HEALTH_GOALS = [
  "Weight Loss",
  "Muscle Gain",
  "Heart Health",
  "Diabetes Management",
  "General Wellness",
];

const RESTRICTIONS = [
  "Diabetes",
  "High Blood Pressure",
  "High Cholesterol",
  "Allergies",
  "Vegetarian",
  "Vegan",
];

export function ProfileSetup({ userId, onComplete }: ProfileSetupProps) {
  const [loading, setLoading] = useState(false);
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setAge(data.age?.toString() || "");
      setWeight(data.weight?.toString() || "");
      setSelectedGoals(data.health_goals || []);
      setSelectedRestrictions(data.restrictions || []);
    }
  };

  const toggleSelection = (item: string, list: string[], setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          age: age ? parseInt(age) : null,
          weight: weight ? parseFloat(weight) : null,
          health_goals: selectedGoals,
          restrictions: selectedRestrictions,
        })
        .eq("id", userId);

      if (error) throw error;
      toast.success("Profile updated successfully!");
      onComplete();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 shadow-glow max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold bg-gradient-health bg-clip-text text-transparent">
            Complete Your Profile
          </h2>
          <p className="text-muted-foreground">
            Help us personalize your nutrition recommendations
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              placeholder="25"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="70"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Health Goals</Label>
          <div className="flex flex-wrap gap-2">
            {HEALTH_GOALS.map((goal) => (
              <Badge
                key={goal}
                variant={selectedGoals.includes(goal) ? "default" : "outline"}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => toggleSelection(goal, selectedGoals, setSelectedGoals)}
              >
                {goal}
                {selectedGoals.includes(goal) && <X className="ml-1 h-3 w-3" />}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Health Restrictions</Label>
          <div className="flex flex-wrap gap-2">
            {RESTRICTIONS.map((restriction) => (
              <Badge
                key={restriction}
                variant={selectedRestrictions.includes(restriction) ? "default" : "outline"}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() =>
                  toggleSelection(restriction, selectedRestrictions, setSelectedRestrictions)
                }
              >
                {restriction}
                {selectedRestrictions.includes(restriction) && <X className="ml-1 h-3 w-3" />}
              </Badge>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Profile"
          )}
        </Button>
      </form>
    </Card>
  );
}
