import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AuthForm } from "@/components/auth/AuthForm";
import { ImageUpload } from "@/components/scanner/ImageUpload";
import { ResultsDisplay } from "@/components/scanner/ResultsDisplay";
import { ProfileSetup } from "@/components/profile/ProfileSetup";
import { Scan, LogOut, User, Loader2, History, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowProfile(false);
    setResult(null);
  };

  const handleScan = async () => {
    if (!selectedFile || !user) return;

    setScanning(true);
    setResult(null);

    try {
      // Upload image to storage
      const fileName = `${user.id}/${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("nutrition-labels")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("nutrition-labels").getPublicUrl(fileName);

      // Call analysis function
      const { data, error } = await supabase.functions.invoke("analyze-nutrition", {
        body: { imageUrl: publicUrl },
      });

      if (error) throw error;

      // Save scan to database
      const { error: saveError } = await supabase.from("scans").insert({
        user_id: user.id,
        image_url: publicUrl,
        nutrition_data: data.nutrition_data,
        health_score: data.health_score,
        harmful_ingredients: data.harmful_ingredients,
        recommendations: data.recommendations,
        status: data.status,
      });

      if (saveError) throw saveError;

      setResult(data);
      toast.success("Analysis complete!");
    } catch (error: any) {
      toast.error(error.message || "Failed to analyze image");
    } finally {
      setScanning(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary/30 to-background">
        <AuthForm onSuccess={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scan className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-health bg-clip-text text-transparent">
              nutri.gram
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate("/history")} title="Scan History">
              <History className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate("/analytics")} title="Analytics">
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setShowProfile(!showProfile)} title="Profile">
              <User className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleSignOut} title="Sign Out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {showProfile ? (
          <ProfileSetup userId={user.id} onComplete={() => setShowProfile(false)} />
        ) : (
          <div className="space-y-8">
            {/* Hero Section */}
            {!result && (
              <div className="text-center space-y-4 py-8">
                <h2 className="text-4xl font-bold">
                  Scan. Analyze. <span className="bg-gradient-health bg-clip-text text-transparent">Eat Smart.</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Upload a nutrition label and get instant AI-powered health insights
                  personalized to your profile
                </p>
              </div>
            )}

            {/* Scanner Section */}
            {!result && (
              <div className="space-y-4">
                <ImageUpload onImageSelect={setSelectedFile} disabled={scanning} />
                {selectedFile && (
                  <Button
                    onClick={handleScan}
                    disabled={scanning}
                    size="lg"
                    className="w-full shadow-glow"
                  >
                    {scanning ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Scan className="mr-2 h-5 w-5" />
                        Analyze Nutrition
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Results Section */}
            {result && (
              <>
                <ResultsDisplay result={result} />
                <Button
                  onClick={() => {
                    setResult(null);
                    setSelectedFile(null);
                  }}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Scan Another Label
                </Button>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
