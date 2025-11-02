
import React, { useState, useCallback, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import Spinner from './components/Spinner';
import ResultsList from './components/ResultsList';
import Tabs from './components/Tabs';
import ReceiptsViewer from './components/ReceiptsViewer';
import { analyzeReceipt } from './services/geminiService';
import { saveReceipt } from './services/receiptService';
import { ProcessResult } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('scanner');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingIndex, setProcessingIndex] = useState(0);
  const [receiptsVersion, setReceiptsVersion] = useState(0); // Used to trigger re-fetch in ReceiptsViewer

  useEffect(() => {
    // Register Service Worker for PWA.
    // We attach this to the window's `load` event to ensure the page is fully loaded
    // and the document is in a stable state, preventing registration errors.
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
      });
    }
  }, []);


  const handleImageSelect = (files: File[]) => {
    // Prevent duplicates
    const newFiles = files.filter(file => !imageFiles.some(existingFile => existingFile.name === file.name && existingFile.size === file.size));
    setImageFiles(currentFiles => [...currentFiles, ...newFiles]);
  };

  const handleClear = useCallback(() => {
    setImageFiles([]);
    setResults([]);
    setIsLoading(false);
    setProcessingIndex(0);
  }, []);

  const handleAnalyze = async () => {
    if (imageFiles.length === 0) return;
    
    setIsLoading(true);
    setProcessingIndex(0);
    const initialResults: ProcessResult[] = imageFiles.map(file => ({ file, status: 'pending' }));
    setResults(initialResults);
    let hasSaved = false;

    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        setProcessingIndex(i);

        const updateResult = (status: ProcessResult['status'], data?: ProcessResult['data'], error?: string) => {
            setResults(currentResults => {
                const newResults = [...currentResults];
                newResults[i] = { ...newResults[i], status, data, error };
                return newResults;
            });
        };

        try {
            updateResult('analyzing');
            const data = await analyzeReceipt(file);

            updateResult('saving', data);
            const { isDuplicate, error: saveError, notConfigured } = await saveReceipt(data);
            
            if (notConfigured) {
                updateResult('not_configured', data);
            } else if (isDuplicate) {
                updateResult('duplicate', data);
            } else if (saveError) {
                updateResult('error', data, 'Failed to save to database.');
            } else {
                updateResult('saved', data);
                hasSaved = true;
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
            updateResult('error', undefined, errorMessage);
        }
    }

    if (hasSaved) {
        setReceiptsVersion(v => v + 1); // Increment version to trigger re-fetch
    }
    setIsLoading(false);
  };
  
  const showResults = results.length > 0;

  const renderScannerTab = () => (
    <>
      {!showResults && (
          <ImageUploader onImageSelect={handleImageSelect} onClear={handleClear} isProcessing={isLoading}/>
      )}

      {imageFiles.length > 0 && !showResults && (
        <div className="flex space-x-4 mt-6">
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {`Analyze ${imageFiles.length} Receipt${imageFiles.length > 1 ? 's' : ''}`}
            </button>
        </div>
      )}

      {isLoading && <Spinner text={`Processing ${processingIndex + 1} of ${imageFiles.length}...`} />}
      
      {showResults && (
        <div className="w-full max-w-4xl">
          <ResultsList results={results} />
          {!isLoading && (
               <div className="text-center mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                  <button
                      onClick={handleClear}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 duration-300"
                    >
                      Scan More
                  </button>
                   <button
                      onClick={() => setActiveTab('myreceipts')}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 duration-300"
                    >
                      View All Receipts
                  </button>
              </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-500">
          Receipt Scanner AI
        </h1>
        <p className="mt-2 text-lg text-gray-400">Scan, analyze, and store your receipts with ease.</p>
      </header>
      
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="w-full flex flex-col items-center">
        {activeTab === 'scanner' && renderScannerTab()}
        {activeTab === 'myreceipts' && <ReceiptsViewer key={receiptsVersion} />}
      </main>
      
      <footer className="w-full text-center text-gray-600 mt-auto pt-8">
          <p>© 2025 JPPonce</p>
      </footer>
    </div>
  );
};

export default App;
