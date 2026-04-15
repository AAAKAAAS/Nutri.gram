import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
}

export function ImageUpload({ onImageSelect, disabled }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageSelect(file);
    }
  };

  const clearImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {preview ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-primary/20 shadow-soft">
          <img src={preview} alt="Preview" className="w-full h-auto" />
          <Button
            onClick={clearImage}
            variant="destructive"
            size="icon"
            className="absolute top-4 right-4"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-2xl p-12 text-center space-y-4 transition-all",
            "border-primary/30 bg-secondary/50 hover:border-primary/50 hover:bg-secondary",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex justify-center gap-4">
            <Camera className="h-12 w-12 text-primary" />
            <Upload className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Upload Nutrition Label</h3>
            <p className="text-sm text-muted-foreground">
              Take a photo 
            </p>
          </div>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            size="lg"
            className="shadow-soft"
          >
            <Upload className="mr-2 h-5 w-5" />
            Choose Image
          </Button>
        </div>
      )}
    </div>
  );
}