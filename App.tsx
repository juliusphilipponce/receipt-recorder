
import React, { useState, useCallback, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import Spinner from './components/Spinner';
import ResultsList from './components/ResultsList';
import Tabs from './components/Tabs';
import ReceiptsViewer from './components/ReceiptsViewer';
import Login from './components/Login';
import DateToggle from './components/DateToggle';
import ConfirmDialog from './components/ConfirmDialog';
import { ReceiptConfirmationModal } from './components/ReceiptConfirmationModal';
import { analyzeReceipt } from './services/geminiService';
import { saveReceipt } from './services/receiptService';
import { googleAuthService } from './services/googleAuthService';
import { googleDriveService } from './services/googleDriveService';
import { googleSheetsService } from './services/googleSheetsService';
import { ProcessResult, ReceiptData } from './types';
import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
  const { user, loading, isAuthorized, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('scanner');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingIndex, setProcessingIndex] = useState(0);
  const [receiptsVersion, setReceiptsVersion] = useState(0); // Used to trigger re-fetch in ReceiptsViewer
  const [useTodayDate, setUseTodayDate] = useState<boolean>(false);
  const [showDateConfirmDialog, setShowDateConfirmDialog] = useState<boolean>(false);

  // Version 2.0: Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [pendingReceiptData, setPendingReceiptData] = useState<ReceiptData | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [googleAuthInitialized, setGoogleAuthInitialized] = useState<boolean>(false);

  // Register Service Worker for PWA - must be called before any conditional returns
  useEffect(() => {
    // Register service worker in both dev and production for PWA installation
    // The service worker itself handles caching differently based on environment
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
            // Force update check on page load
            registration.update();
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  // Initialize Google Auth Service
  useEffect(() => {
    googleAuthService.initialize()
      .then(() => {
        setGoogleAuthInitialized(true);
        console.log('✅ Google Auth initialized');
      })
      .catch((error) => {
        console.warn('⚠️ Google Auth initialization failed:', error);
        // App will continue to work without Google integration
      });
  }, []);

  // All callbacks must be defined before conditional returns
  const handleClear = useCallback(() => {
    setImageFiles([]);
    setResults([]);
    setIsLoading(false);
    setProcessingIndex(0);
    setUseTodayDate(false); // Reset toggle when clearing
  }, []);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1929] text-white flex items-center justify-center">
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
            Your account <span className="font-semibold text-[#0ea5e9]">{user.email}</span> is not authorized to access this app.
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

  // Helper function to format today's date in 'MMMM D YYYY' format
  const getTodayDateFormatted = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return today.toLocaleDateString('en-US', options);
  };

  const handleAnalyze = async () => {
    if (imageFiles.length === 0) return;

    // If useTodayDate is enabled, show confirmation dialog first
    if (useTodayDate) {
      setShowDateConfirmDialog(true);
      return;
    }

    // Otherwise, proceed with normal analysis
    await performAnalysis();
  };

  const performAnalysis = async () => {
    if (imageFiles.length === 0) return;

    setIsLoading(true);
    setProcessingIndex(0);
    const initialResults: ProcessResult[] = imageFiles.map(file => ({ file, status: 'pending' }));
    setResults(initialResults);

    // Start processing the first receipt
    processCurrentReceipt(0);
  };

  // Process a single receipt at the given index
  const processCurrentReceipt = async (index: number) => {
    if (index >= imageFiles.length) {
      setIsLoading(false);
      return;
    }

    const file = imageFiles[index];
    setProcessingIndex(index);

    const updateResult = (status: ProcessResult['status'], data?: ProcessResult['data'], error?: string) => {
      setResults(currentResults => {
        const newResults = [...currentResults];
        newResults[index] = { ...newResults[index], status, data, error };
        return newResults;
      });
    };

    try {
      // Analyze receipt with Gemini
      updateResult('analyzing');
      const data = await analyzeReceipt(file, useTodayDate);

      // Create image preview URL
      const imagePreview = URL.createObjectURL(file);
      console.log('📸 Created image preview URL:', imagePreview);
      console.log('📄 File details:', { name: file.name, type: file.type, size: file.size });

      // Store pending data and show confirmation modal
      setPendingReceiptData(data);
      setPendingImageFile(file);
      setPendingImagePreview(imagePreview);
      setShowConfirmModal(true);
      setIsLoading(false); // Pause loading while waiting for user confirmation

      // The actual save will happen in handleConfirmSave
      // Processing will continue when user confirms or cancels

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      updateResult('error', undefined, errorMessage);

      // Continue with next receipt on error
      if (index + 1 < imageFiles.length) {
        setTimeout(() => processCurrentReceipt(index + 1), 100);
      } else {
        setIsLoading(false);
      }
    }
  };

  // Version 2.0: Handle confirmed save with Google integration
  const handleConfirmSave = async (editedData: ReceiptData) => {
    setIsSaving(true);

    const currentIndex = processingIndex;
    const updateResult = (status: ProcessResult['status'], data?: ProcessResult['data'], error?: string) => {
      setResults(currentResults => {
        const newResults = [...currentResults];
        newResults[currentIndex] = { ...newResults[currentIndex], status, data, error };
        return newResults;
      });
    };

    try {
      updateResult('saving', editedData);

      let driveFileId: string | undefined;
      let imageUrl: string | undefined;

      // Step 1: Upload to Google Drive (if authenticated)
      if (googleAuthInitialized && pendingImageFile) {
        try {
          const uploadResult = await googleDriveService.uploadImage(
            pendingImageFile,
            editedData.merchantName,
            editedData.date
          );
          driveFileId = uploadResult.fileId;
          imageUrl = uploadResult.webViewLink;
          console.log('✅ Uploaded to Google Drive');
        } catch (driveError) {
          console.warn('⚠️ Google Drive upload failed:', driveError);
          // Continue without Drive link
        }
      }

      // Step 2: Add to Google Sheets (if authenticated)
      if (googleAuthInitialized) {
        try {
          await googleSheetsService.addReceipt(editedData, imageUrl);
          console.log('✅ Added to Google Sheets');
        } catch (sheetsError) {
          console.warn('⚠️ Google Sheets logging failed:', sheetsError);
          // Continue without Sheets entry
        }
      }

      // Step 3: Save to Supabase with Google Drive info
      const dataWithGoogleInfo = {
        ...editedData,
        driveFileId,
        imageUrl
      };

      const { isDuplicate, error: saveError, notConfigured } = await saveReceipt(dataWithGoogleInfo);

      if (notConfigured) {
        updateResult('not_configured', dataWithGoogleInfo);
      } else if (isDuplicate) {
        updateResult('duplicate', dataWithGoogleInfo);
      } else if (saveError) {
        updateResult('error', dataWithGoogleInfo, 'Failed to save to database.');
      } else {
        updateResult('saved', dataWithGoogleInfo);
        setReceiptsVersion(v => v + 1); // Trigger re-fetch
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      updateResult('error', editedData, errorMessage);
    } finally {
      setIsSaving(false);
      setShowConfirmModal(false);
      setPendingReceiptData(null);
      setPendingImageFile(null);
      if (pendingImagePreview) {
        URL.revokeObjectURL(pendingImagePreview);
      }
      setPendingImagePreview(null);

      // Continue with next image if there are more
      if (processingIndex + 1 < imageFiles.length) {
        setIsLoading(true);
        // Process next receipt
        setTimeout(() => processCurrentReceipt(processingIndex + 1), 100);
      }
    }
  };

  // Handle modal cancel
  const handleCancelConfirmation = () => {
    setShowConfirmModal(false);
    setPendingReceiptData(null);
    setPendingImageFile(null);
    if (pendingImagePreview) {
      URL.revokeObjectURL(pendingImagePreview);
    }
    setPendingImagePreview(null);

    // Mark current as cancelled and continue with next
    const currentIndex = processingIndex;
    setResults(currentResults => {
      const newResults = [...currentResults];
      newResults[currentIndex] = { ...newResults[currentIndex], status: 'error', error: 'Cancelled by user' };
      return newResults;
    });

    if (processingIndex + 1 < imageFiles.length) {
      setIsLoading(true);
      // Process next receipt
      setTimeout(() => processCurrentReceipt(processingIndex + 1), 100);
    }
  };

  const handleDateConfirmDialogConfirm = async () => {
    setShowDateConfirmDialog(false);
    await performAnalysis();
  };

  const handleDateConfirmDialogCancel = () => {
    setShowDateConfirmDialog(false);
    setUseTodayDate(false); // Turn toggle back OFF when user cancels
  };

  const showResults = results.length > 0;

  const renderScannerTab = () => (
    <>
      {!showResults && (
        <ImageUploader onImageSelect={handleImageSelect} onClear={handleClear} isProcessing={isLoading} />
      )}

      {imageFiles.length > 0 && !showResults && (
        <>
          <DateToggle
            isEnabled={useTodayDate}
            onChange={setUseTodayDate}
            disabled={isLoading}
          />
          <div className="flex justify-center mt-4 sm:mt-6 w-full">
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 sm:px-8 rounded-lg transition-transform transform hover:scale-105 duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
            >
              {`Analyze ${imageFiles.length} Receipt${imageFiles.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </>
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
                className="w-full sm:w-auto bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold py-3 px-6 sm:px-8 rounded-lg transition-transform transform hover:scale-105 duration-300 text-sm sm:text-base min-h-[44px]"
              >
                View All Receipts
              </button>
            </div>
          )}
        </div>
      )}

      {/* Date Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDateConfirmDialog}
        title="Confirm Date"
        message={`The receipt date will be saved as ${getTodayDateFormatted()}. Do you want to proceed?`}
        confirmLabel="Proceed"
        cancelLabel="Cancel"
        onConfirm={handleDateConfirmDialogConfirm}
        onCancel={handleDateConfirmDialogCancel}
      />

      {/* Version 2.0: Receipt Confirmation Modal */}
      <ReceiptConfirmationModal
        isOpen={showConfirmModal}
        receiptData={pendingReceiptData}
        imagePreview={pendingImagePreview}
        onConfirm={handleConfirmSave}
        onCancel={handleCancelConfirmation}
        isLoading={isSaving}
      />
    </>
  );

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-[#0a1929] text-white flex flex-col items-center p-3 sm:p-6 lg:p-8">
      <header className="w-full max-w-4xl mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 mb-3 sm:mb-4">
          <div className="hidden sm:block sm:flex-1"></div>
          <div className="flex-1 text-center w-full sm:w-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#0ea5e9]">
              Receipt Scanner AI
            </h1>
          </div>
          <div className="w-full sm:w-auto sm:flex-1 flex justify-center sm:justify-end">
            <button
              onClick={handleSignOut}
              className="bg-[#1e3a5f] hover:bg-[#2d4a6f] text-white font-medium py-2 px-4 sm:px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base"
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
