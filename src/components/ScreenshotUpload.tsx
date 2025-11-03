'use client';

import { useState } from 'react';

interface ScreenshotUploadProps {
  screenshots: string[];
  onScreenshotsChange: (screenshots: string[]) => void;
}

export default function ScreenshotUpload({ screenshots, onScreenshotsChange }: ScreenshotUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
    
    // Update parent component
    const fileNames = files.map(f => f.name);
    onScreenshotsChange([...screenshots, ...fileNames]);
  };

  const removeScreenshot = (index: number) => {
    const newScreenshots = screenshots.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    // Revoke object URL to prevent memory leaks
    if (previews[index]) {
      URL.revokeObjectURL(previews[index]);
    }
    
    setPreviews(newPreviews);
    onScreenshotsChange(newScreenshots);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Upload Screenshots
      </label>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      
      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative">
              <img
                src={preview}
                alt={`Screenshot ${index + 1}`}
                className="w-full h-32 object-cover rounded border"
              />
              <button
                type="button"
                onClick={() => removeScreenshot(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      {screenshots.length > 0 && (
        <p className="text-sm text-gray-600 mt-2">
          {screenshots.length} screenshot(s) selected
        </p>
      )}
    </div>
  );
}
