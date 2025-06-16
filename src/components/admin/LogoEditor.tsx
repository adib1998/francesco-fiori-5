
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Save, RefreshCw } from "lucide-react";
import ImageUploader from "./ImageUploader";
import { useLogoSettings } from "@/hooks/use-settings";

const LogoEditor = () => {
  const [logoSettings, updateLogoSettings, isLoading] = useLogoSettings();
  
  const handleSaveSettings = async () => {
    const success = await updateLogoSettings(logoSettings);
    
    if (success) {
      toast({
        title: "Logo updated",
        description: "Your website logo has been changed",
      });
    } else {
      toast({
        title: "Logo updated locally",
        description: "Settings saved locally and will sync when connection is restored",
      });
    }
  };
  
  const handleImageUploaded = (imageUrl: string) => {
    updateLogoSettings({ ...logoSettings, logoUrl: imageUrl });
  };
  
  const defaultSettings = {
    logoUrl: "https://despodpgvkszyexvcbft.supabase.co/storage/v1/object/public/uploads/logos/1749735172947-oi6nr6gnk7.png",
    altText: "Francesco Fiori & Piante Logo",
  };
  
  const resetToDefault = async () => {
    const success = await updateLogoSettings(defaultSettings);
    
    if (success) {
      toast({
        title: "Logo reset",
        description: "Your logo has been reset to the default",
      });
    } else {
      toast({
        title: "Logo reset locally",
        description: "Settings reset locally and will sync when connection is restored",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-peach-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Logo Settings</h2>
        <Button onClick={handleSaveSettings} variant="default" className="flex items-center gap-2">
          <Save size={16} /> Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Website Logo</CardTitle>
          <CardDescription>
            Upload and customize your flower shop logo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="border rounded-md p-6 flex flex-col items-center justify-center space-y-4">
              <div className="bg-slate-100 p-3 rounded-full">
                <img 
                  src={logoSettings.logoUrl} 
                  alt={logoSettings.altText}
                  className="h-32 w-32 object-contain"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Current Logo</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Upload New Logo</Label>
              <ImageUploader 
                onImageSelected={handleImageUploaded}
                buttonLabel="Choose Logo Image"
                bucketName="uploads"
                folderPath="logos"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: Square image, at least 200x200 pixels, PNG or SVG with transparent background
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logo-alt-text">Alternative Text</Label>
              <Input
                id="logo-alt-text"
                value={logoSettings.altText}
                onChange={(e) => updateLogoSettings({ ...logoSettings, altText: e.target.value })}
                placeholder="Describe your logo for screen readers"
              />
              <p className="text-xs text-muted-foreground">
                This text helps with accessibility and SEO
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={resetToDefault}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} /> Reset to Default
          </Button>
          <Button
            type="button" 
            onClick={handleSaveSettings}
            className="flex items-center gap-2"
          >
            <Save size={16} /> Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LogoEditor;
