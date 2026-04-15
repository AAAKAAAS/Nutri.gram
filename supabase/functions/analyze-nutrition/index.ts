import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HF_API_KEY = Deno.env.get("HF_API_KEY");

async function hfRequest(model: string, payload: any) {
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) throw new Error(`HF Model ${model} failed`);
  return response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();

    // 1. DONUT - OCR + Document Parsing
    const donutOutput = await hfRequest(
      "naver-clova-ix/donut-base",
      { image: imageUrl }
    );

    const ocrText =
      donutOutput?.predictions?.[0]?.parsed ||
      JSON.stringify(donutOutput);

    // 2. Nutrition Extraction
    const nutritionOutput = await hfRequest(
      "m3hrdadfi/nutrition-label-extraction",
      { inputs: ocrText }
    );

    // 3. Harmful Ingredient Detection
    const harmfulKeywords = [
      "msg","monosodium glutamate","palm oil",
      "aspartame","yellow 5","yellow 6","tbhq",
      "sodium benzoate","trans fat","hydrogenated",
      "bht","bpa"
    ];

    const harmfulList = harmfulKeywords.filter((k) =>
      ocrText.toLowerCase().includes(k)
    );

    // 4. Food Classification (Food-101 model)
    const foodClass = await hfRequest(
      "nateraw/food",
      { image: imageUrl }
    );

    const foodPrediction = foodClass?.[0]?.label || "Unknown Food";

    // 5. Health Score
    let score = 100;
    if (nutritionOutput.sugars > 20) score -= 20;
    if (nutritionOutput.fat > 15) score -= 15;
    if (nutritionOutput.calories > 300) score -= 20;
    score -= harmfulList.length * 10;
    if (score < 0) score = 0;

    // 6. Recommendations
    const rec = [];
    if (nutritionOutput.sugars > 20)
      rec.push("High sugar — limit sugary foods.");
    if (nutritionOutput.fat > 15)
      rec.push("High fat — choose low-fat alternatives.");
    if (harmfulList.includes("palm oil"))
      rec.push("Palm oil detected — avoid processed snacks.");

    return new Response(
      JSON.stringify({
        status: "success",
        ocr_text: ocrText,
        nutrition_data: nutritionOutput,
        harmful_ingredients: harmfulList,
        food_prediction: foodPrediction,
        health_score: score,
        recommendations: rec
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});