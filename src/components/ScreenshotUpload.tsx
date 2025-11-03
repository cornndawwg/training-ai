'use client';

import { useState, useRef } from 'react';

interface ScreenshotUploadProps {
  screenshots: string[];
  onScreenshotsChange: (screenshots: string[], files: File[]) => void;
}

export default function ScreenshotUpload({ screenshots, onScreenshotsChange }: ScreenshotUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    
    // Create previews
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    const newFileNames = newFiles.map(f => f.name);
    
    setPreviews(prev => [...prev, ...newPreviews]);
    setFiles(prev => [...prev, ...newFiles]);
    
    // Update parent component with URLs (for display) and files (for upload)
    onScreenshotsChange([...screenshots, ...newFileNames], [...files, ...newFiles]);
  };

  const removeScreenshot = (index: number) => {
    // Revoke object URL to prevent memory leaks
    if (previews[index]) {
      URL.revokeObjectURL(previews[index]);
    }
    
    const newScreenshots = screenshots.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    const newFiles = files.filter((_, i) => i !== index);
    
    setPreviews(newPreviews);
    setFiles(newFiles);
    onScreenshotsChange(newScreenshots, newFiles);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Upload Screenshots
      </label>
      <input
        ref={fileInputRef}
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
