import React, { useState, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import Spinner from './components/Spinner';
import ResultsList from './components/ResultsList';
import Tabs from './components/Tabs';
import ReceiptsViewer from './components/ReceiptsViewer';
import Login from './components/Login';
import DateToggle from './components/DateToggle';
import ConfirmDialog from './components/ConfirmDialog';
import { ReceiptConfirmationModal } from './components/ReceiptConfirmationModal';
import { googleAuthService } from './services/googleAuthService';
import { useAuth } from './contexts/AuthContext';
import { useReceiptProcessor } from './hooks/useReceiptProcessor';

const App: React.FC = () => {
  const { user, loading, isAuthorized, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('scanner');
  
  const [receiptsVersion, setReceiptsVersion] = useState(0); 
  const [useTodayDate, setUseTodayDate] = useState<boolean>(false);
  const [showDateConfirmDialog, setShowDateConfirmDialog] = useState<boolean>(false);
  const [showClearConfirmDialog, setShowClearConfirmDialog] = useState<boolean>(false);
  const [googleAuthInitialized, setGoogleAuthInitialized] = useState<boolean>(false);

  const {
    results,
    isProcessing,
    isSaving,
    addFiles,
    clearAll,
    analyzeAll,
    openReviewModal,
    confirmReceiptSave,
    cancelReceiptReview,
    isReviewModalOpen,
    pendingReceiptData,
    pendingImagePreview
  } = useReceiptProcessor(googleAuthInitialized);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            registration.update();
          })
          .catch(error => console.error('Service Worker registration failed:', error));
      });
    }
  }, []);

  useEffect(() => {
    googleAuthService.initialize()
      .then(() => {
        setGoogleAuthInitialized(true);
      })
      .catch((error) => {});
  }, []);

  const handleClear = () => {
    setShowClearConfirmDialog(true);
  };

  const handleClearConfirm = () => {
    clearAll();
    setUseTodayDate(false);
    setShowClearConfirmDialog(false);
    setReceiptsVersion(v => v + 1);
  };

  const handleClearCancel = () => {
    setShowClearConfirmDialog(false);
  };

  const getTodayDateFormatted = () => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  const handleAnalyzeClick = () => {
    if (results.length === 0) return;
    if (useTodayDate) {
      setShowDateConfirmDialog(true);
    } else {
      analyzeAll(false);
    }
  };

  const handleDateConfirmDialogConfirm = async () => {
    setShowDateConfirmDialog(false);
    await analyzeAll(true);
  };

  const handleDateConfirmDialogCancel = () => {
    setShowDateConfirmDialog(false);
    setUseTodayDate(false); 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1929] text-white flex items-center justify-center">
        <Spinner text="Loading..." />
      </div>
    );
  }

  if (!user) return <Login />;

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
          <button
            onClick={signOut}
            className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 mt-6"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const pendingCount = results.filter(r => r.status === 'pending').length;
  const showResults = results.length > 0;

  const renderScannerTab = () => (
    <>
      <ImageUploader 
        onImageSelect={addFiles} 
        onClear={handleClear} 
        resultsCount={results.length}
        isProcessing={isProcessing} 
      />

      {pendingCount > 0 && !isProcessing && (
        <>
          <DateToggle
            isEnabled={useTodayDate}
            onChange={setUseTodayDate}
            disabled={isProcessing}
          />
          <div className="flex justify-center mt-4 sm:mt-6 w-full">
            <button
              onClick={handleAnalyzeClick}
              disabled={isProcessing}
              className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 sm:px-8 rounded-lg transition-transform transform hover:scale-105 duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
            >
              {`Analyze ${pendingCount} Pending Receipt${pendingCount > 1 ? 's' : ''}`}
            </button>
          </div>
        </>
      )}

      {isProcessing && pendingCount === 0 && <Spinner text={`Processing receipts...`} />}

      {showResults && (
        <div className="w-full max-w-4xl mt-6">
          <ResultsList results={results} onReviewItem={openReviewModal} />
          {!isProcessing && pendingCount === 0 && (
            <div className="text-center mt-4 sm:mt-6 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 w-full">
              <button
                onClick={handleClear}
                className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 sm:px-8 rounded-lg transition-transform transform hover:scale-105 duration-300 text-sm sm:text-base min-h-[44px]"
              >
                Clear All
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

      <ConfirmDialog
        isOpen={showDateConfirmDialog}
        title="Confirm Date"
        message={`The receipt date will be saved as ${getTodayDateFormatted()}. Do you want to proceed?`}
        confirmLabel="Proceed"
        cancelLabel="Cancel"
        onConfirm={handleDateConfirmDialogConfirm}
        onCancel={handleDateConfirmDialogCancel}
      />

      <ConfirmDialog
        isOpen={showClearConfirmDialog}
        title="Clear All Results"
        message="Are you sure you want to clear all receipt results? This action cannot be undone."
        confirmLabel="Clear All"
        cancelLabel="Cancel"
        onConfirm={handleClearConfirm}
        onCancel={handleClearCancel}
        isDanger={true}
      />

      <ReceiptConfirmationModal
        isOpen={isReviewModalOpen}
        receiptData={pendingReceiptData}
        imagePreview={pendingImagePreview}
        onConfirm={(data) => confirmReceiptSave(data, () => setReceiptsVersion(v => v + 1))}
        onCancel={cancelReceiptReview}
        isLoading={isSaving}
      />
    </>
  );

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
              onClick={signOut}
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
        <p>© 2026 JPPonce</p>
      </footer>
    </div>
  );
};

export default App;
