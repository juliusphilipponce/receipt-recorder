
import React, { useState, useCallback, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import Spinner from './components/Spinner';
import ResultsList from './components/ResultsList';
import Tabs from './components/Tabs';
import ReceiptsViewer from './components/ReceiptsViewer';
import Login from './components/Login';
import { analyzeReceipt } from './services/geminiService';
import { saveReceipt } from './services/receiptService';
import { ProcessResult } from './types';
import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
  const { user, loading, isAuthorized, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('scanner');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingIndex, setProcessingIndex] = useState(0);
  const [receiptsVersion, setReceiptsVersion] = useState(0); // Used to trigger re-fetch in ReceiptsViewer

  // Register Service Worker for PWA - must be called before any conditional returns
  useEffect(() => {
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

  // All callbacks must be defined before conditional returns
  const handleClear = useCallback(() => {
    setImageFiles([]);
    setResults([]);
    setIsLoading(false);
    setProcessingIndex(0);
  }, []);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Spinner text="Loading..." />
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <Login />;
  }

  // Show unauthorized message if user is not in the allowed list
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-gray-300 mb-2">
            Your account <span className="font-semibold text-teal-400">{user.email}</span> is not authorized to access this app.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            This is a personal app. Please contact the owner if you believe this is an error.
          </p>
          <button
            onClick={signOut}
            className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }


  const handleImageSelect = (files: File[]) => {
    // Prevent duplicates
    const newFiles = files.filter(file => !imageFiles.some(existingFile => existingFile.name === file.name && existingFile.size === file.size));
    setImageFiles(currentFiles => [...currentFiles, ...newFiles]);
  };

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
        <div className="flex justify-center mt-4 sm:mt-6 w-full">
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 sm:px-8 rounded-lg transition-transform transform hover:scale-105 duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
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
               <div className="text-center mt-4 sm:mt-6 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 w-full">
                  <button
                      onClick={handleClear}
                      className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 sm:px-8 rounded-lg transition-transform transform hover:scale-105 duration-300 text-sm sm:text-base min-h-[44px]"
                    >
                      Scan More
                  </button>
                   <button
                      onClick={() => setActiveTab('myreceipts')}
                      className="w-full sm:w-auto bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 sm:px-8 rounded-lg transition-transform transform hover:scale-105 duration-300 text-sm sm:text-base min-h-[44px]"
                    >
                      View All Receipts
                  </button>
              </div>
          )}
        </div>
      )}
    </>
  );

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-3 sm:p-6 lg:p-8">
      <header className="w-full max-w-4xl mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 mb-3 sm:mb-4">
          <div className="hidden sm:block sm:flex-1"></div>
          <div className="flex-1 text-center w-full sm:w-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-500">
              Receipt Scanner AI
            </h1>
          </div>
          <div className="w-full sm:w-auto sm:flex-1 flex justify-center sm:justify-end">
            <button
              onClick={handleSignOut}
              className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 sm:px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base"
            >
              Sign Out
            </button>
          </div>
        </div>
        <p className="text-center text-base sm:text-lg text-gray-400">Scan, analyze, and store your receipts with ease.</p>
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
