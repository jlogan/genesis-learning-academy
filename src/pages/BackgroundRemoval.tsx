import { useState, useRef } from "react";
import { Upload, Download, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { removeBackground, loadImage } from "@/utils/backgroundRemoval";

const BackgroundRemoval = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Display original image
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setProcessedImage(null);
    };
    reader.readAsDataURL(file);

    // Process image
    setIsProcessing(true);
    setProgress("Loading AI model...");

    try {
      const imageElement = await loadImage(file);
      setProgress("Processing image...");
      
      const resultBlob = await removeBackground(imageElement);
      const resultUrl = URL.createObjectURL(resultBlob);
      
      setProcessedImage(resultUrl);
      setProgress("");
      toast.success('Background removed successfully!');
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to remove background. Please try again.');
      setProgress("");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'background-removed.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Image downloaded!');
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            AI Background Removal
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Remove backgrounds from images instantly using AI. All processing happens in your browser - no uploads, completely private.
          </p>
        </div>

        {/* Upload Section */}
        {!originalImage && (
          <Card className="p-12 border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer" onClick={handleUploadClick}>
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Upload className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload an Image</h3>
              <p className="text-muted-foreground mb-4">Click to select or drag and drop</p>
              <p className="text-sm text-muted-foreground">PNG, JPG, WEBP up to 10MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </Card>
        )}

        {/* Processing Status */}
        {isProcessing && (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <h3 className="text-xl font-semibold mb-2">{progress}</h3>
              <p className="text-muted-foreground">This may take a few moments...</p>
            </div>
          </Card>
        )}

        {/* Results Section */}
        {originalImage && !isProcessing && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Original Image */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Original
                  </h3>
                </div>
                <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                  <img src={originalImage} alt="Original" className="w-full h-full object-contain" />
                </div>
              </Card>

              {/* Processed Image */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Background Removed
                  </h3>
                  {processedImage && (
                    <Button onClick={handleDownload} size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
                <div className="relative aspect-square bg-muted rounded-lg overflow-hidden" style={{ backgroundImage: 'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--background)) 0% 50%) 50% / 20px 20px' }}>
                  {processedImage ? (
                    <img src={processedImage} alt="Processed" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Processing...
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Button onClick={handleUploadClick} variant="outline" size="lg">
                <Upload className="w-4 h-4 mr-2" />
                Upload Another Image
              </Button>
              {processedImage && (
                <Button onClick={handleDownload} variant="cta" size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Download Result
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Info Section */}
        <Card className="mt-12 p-8 bg-secondary/50">
          <h3 className="text-xl font-semibold mb-4">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h4 className="font-semibold mb-2">Upload Image</h4>
              <p className="text-sm text-muted-foreground">Select any image from your device</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <h4 className="font-semibold mb-2">AI Processing</h4>
              <p className="text-sm text-muted-foreground">Our AI identifies and removes the background locally in your browser</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h4 className="font-semibold mb-2">Download</h4>
              <p className="text-sm text-muted-foreground">Get your image with transparent background</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BackgroundRemoval;
