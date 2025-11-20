import React, { useRef, useState, useCallback } from 'react';

interface ImageUploaderProps {
  onImageSelect: (files: File[]) => void;
  onClear: () => void;
  isProcessing: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, onClear, isProcessing }) => {
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const captureInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const newPreviews: string[] = [];
      
      let filesToProcess = fileArray.length;

      fileArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          filesToProcess--;
          if (filesToProcess === 0) {
            setImagePreviews(currentPreviews => [...currentPreviews, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
      onImageSelect(fileArray);
    }
     // Reset the input value to allow selecting the same file again
     if (event.target) {
        event.target.value = "";
     }
  }, [onImageSelect]);
  
  const handleClear = useCallback(() => {
      setImagePreviews([]);
      onClear();
      if(captureInputRef.current) {
          captureInputRef.current.value = "";
      }
      if(galleryInputRef.current) {
        galleryInputRef.current.value = "";
    }
  }, [onClear]);

  const triggerCaptureInput = () => {
    captureInputRef.current?.click();
  };
  
  const triggerGalleryInput = () => {
    galleryInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-4xl">
      <div className="bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 text-center">
        {imagePreviews.length === 0 ? (
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 sm:p-12 flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-gray-500 mb-3 sm:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Upload or Snap Receipts</h3>
            <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">You can upload multiple images or take a picture.</p>
            {/* Hidden file inputs */}
            <input
              type="file"
              aria-label="Capture photo"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              ref={captureInputRef}
              className="hidden"
              disabled={isProcessing}
            />
            <input
              type="file"
              aria-label="Upload files"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              ref={galleryInputRef}
              className="hidden"
              disabled={isProcessing}
            />
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={triggerCaptureInput}
                disabled={isProcessing}
                className="w-full sm:w-auto flex items-center justify-center bg-[#00d4ff] hover:bg-[#0ea5e9] text-white font-bold py-3 px-5 sm:px-6 rounded-lg transition-all transform hover:scale-105 duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Capture Photo
              </button>
              <button
                onClick={triggerGalleryInput}
                disabled={isProcessing}
                className="w-full sm:w-auto flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-5 sm:px-6 rounded-lg transition-transform transform hover:scale-105 duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Upload Files
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {imagePreviews.map((src, index) => (
                <div key={index} className="relative aspect-square bg-gray-700 rounded-lg overflow-hidden">
                    <img src={src} alt={`Receipt preview ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
             {/* Hidden file inputs needed here as well */}
            <input
              type="file"
              aria-label="Capture photo"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              ref={captureInputRef}
              className="hidden"
              disabled={isProcessing}
            />
            <input
              type="file"
              aria-label="Upload files"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              ref={galleryInputRef}
              className="hidden"
              disabled={isProcessing}
            />
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
               <button
                  onClick={triggerCaptureInput}
                  disabled={isProcessing}
                  className="w-full sm:w-auto flex items-center justify-center bg-[#00d4ff] hover:bg-[#0ea5e9] text-white font-bold py-2 px-4 sm:px-5 rounded-lg transition-all transform hover:scale-105 duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Add Camera
                </button>
                <button
                  onClick={triggerGalleryInput}
                  disabled={isProcessing}
                  className="w-full sm:w-auto flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 sm:px-5 rounded-lg transition-transform transform hover:scale-105 duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Add Upload
                </button>
               <button
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 sm:px-5 rounded-lg transition-transform transform hover:scale-105 duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                >
                  Clear All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;