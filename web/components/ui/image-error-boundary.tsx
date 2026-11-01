import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, ImageOff } from "lucide-react";

interface ImageErrorBoundaryProps {
  error?: Error;
  reset?: () => void;
  title?: string;
  description?: string;
}

export default function ImageErrorBoundary({
  error,
  reset,
  title = "Image Loading Error",
  description = "There was a problem loading the images. This might be due to network issues or server problems."
}: ImageErrorBoundaryProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-red-100 rounded-full">
            <ImageOff className="w-8 h-8 text-red-600" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">
              {description}
            </p>
          </div>

          {error && (
            <details className="w-full">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                Technical Details
              </summary>
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 font-mono">
                {error.message}
              </div>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {reset && (
              <Button onClick={reset} className="flex-1 gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex-1 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </Button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>Troubleshooting tips:</p>
            <ul className="text-left space-y-1">
              <li>• Check your internet connection</li>
              <li>• Try refreshing the page</li>
              <li>• Clear browser cache and cookies</li>
              <li>• Contact support if the problem persists</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}