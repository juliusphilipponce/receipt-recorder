import { useState, useCallback } from 'react';
import { ReceiptData, ProcessResult } from '../types';
import { analyzeReceipt } from '../services/geminiService';
import { googleDriveService } from '../services/googleDriveService';
import { googleSheetsService } from '../services/googleSheetsService';
import { saveReceipt } from '../services/receiptService';

export const useReceiptProcessor = (googleAuthInitialized: boolean) => {
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Track item that needs manual review by its ID:
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [pendingReceiptData, setPendingReceiptData] = useState<ReceiptData | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);

  const addFiles = useCallback((newFiles: File[]) => {
    setResults(prev => {
      const filtered = newFiles.filter(file => 
        !prev.some(existingResult => existingResult.file.name === file.name && existingResult.file.size === file.size)
      );
      if (filtered.length === 0) return prev;
      
      return [
        ...prev,
        ...filtered.map(f => ({ 
          id: `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          file: f, 
          status: 'pending' as ProcessResult['status'],
          logs: ['File added to queue. Pending analysis.']
        }))
      ];
    });
  }, []);

  const clearAll = useCallback(() => {
    setResults([]);
    setIsProcessing(false);
    setReviewingId(null);
    setPendingReceiptData(null);
    setPendingImageFile(null);
    setPendingImagePreview(null);
  }, []);

  const analyzeAll = useCallback(async (useTodayDate: boolean) => {
    const pendingItems = results.filter(r => r.status === 'pending' || r.status === 'error');
    if (pendingItems.length === 0) return;
    setIsProcessing(true);

    await Promise.allSettled(
      pendingItems.map(async (item) => {
        const { id, file } = item;
        
        setResults(current => 
          current.map(r => r.id === id 
            ? { ...r, status: 'analyzing', logs: [...(r.logs || []), 'Starting asynchronous analysis...'] }
            : r
          )
        );

        try {
          // Send to Netlify backend
          const receipts = await analyzeReceipt(file, useTodayDate);
          
          setResults(current => {
            const index = current.findIndex(r => r.id === id);
            if (index === -1) return current;
            
            const targetResult = current[index];
            
            if (receipts.length === 0) {
              const newResults = [...current];
              newResults[index] = {
                ...targetResult,
                status: 'error',
                error: 'No receipts detected in the image.',
                logs: [...(targetResult.logs || []), 'Analysis complete. No receipts detected.']
              };
              return newResults;
            } else if (receipts.length === 1) {
              const newResults = [...current];
              newResults[index] = {
                ...targetResult,
                status: 'needs_review',
                data: receipts[0],
                logs: [...(targetResult.logs || []), 'Analysis complete. Waiting for your review.']
              };
              return newResults;
            } else {
              // Multiple receipts detected! Splitting them into separate entries.
              const splitResults: ProcessResult[] = receipts.map((receipt, subIdx) => ({
                id: `${id}-${subIdx}`,
                file: targetResult.file,
                status: 'needs_review',
                data: receipt,
                logs: [...(targetResult.logs || []), `Split receipt ${subIdx + 1} of ${receipts.length} detected.`]
              }));
              
              const newResults = [...current];
              newResults.splice(index, 1, ...splitResults);
              return newResults;
            }
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
          setResults(current => 
            current.map(r => r.id === id 
              ? { 
                  ...r, 
                  status: 'error', 
                  error: errorMessage, 
                  logs: [...(r.logs || []), `Analysis failed: ${errorMessage}`] 
                }
              : r
            )
          );
        }
      })
    );
    setIsProcessing(false);
  }, [results]);

  const openReviewModal = useCallback((id: string) => {
    const item = results.find(r => r.id === id);
    if (!item || !item.data) return;

    setPendingReceiptData(item.data);
    setPendingImageFile(item.file);
    const previewUrl = URL.createObjectURL(item.file);
    setPendingImagePreview(previewUrl);
    setReviewingId(id);
  }, [results]);

  const closeReviewModal = useCallback(() => {
    setPendingReceiptData(null);
    setPendingImageFile(null);
    if (pendingImagePreview) {
      URL.revokeObjectURL(pendingImagePreview);
    }
    setPendingImagePreview(null);
    setReviewingId(null);
  }, [pendingImagePreview]);

  const confirmReceiptSave = async (editedData: ReceiptData, onSaveSuccess?: () => void) => {
    if (reviewingId === null) return;
    setIsSaving(true);
    const id = reviewingId;

    const updateResultStatus = (status: ProcessResult['status'], data?: ProcessResult['data'], error?: string, appendLog?: string) => {
      setResults(curr => 
        curr.map(r => r.id === id 
          ? { 
              ...r, 
              status, 
              data, 
              error, 
              logs: appendLog ? [...(r.logs || []), appendLog] : r.logs 
            }
          : r
        )
      );
    };

    try {
      updateResultStatus('saving', editedData, undefined, 'Saving receipt data...');

      let driveFileId: string | undefined;
      let imageUrl: string | undefined;

      if (googleAuthInitialized && pendingImageFile) {
        try {
          const uploadResult = await googleDriveService.uploadImage(
            pendingImageFile,
            editedData.merchantName,
            editedData.date
          );
          driveFileId = uploadResult.fileId;
          imageUrl = uploadResult.webViewLink;
          updateResultStatus('saving', editedData, undefined, 'Uploaded image to Google Drive.');
        } catch (error) {
          console.warn('Google Drive upload failed', error);
          updateResultStatus('saving', editedData, undefined, `Google Drive upload failed: ${(error as Error).message}`);
        }
      }

      if (googleAuthInitialized) {
        try {
          await googleSheetsService.addReceipt(editedData, imageUrl);
          updateResultStatus('saving', editedData, undefined, 'Logged data to Google Sheets.');
        } catch (error) {
          console.warn('Google Sheets logging failed', error);
          updateResultStatus('saving', editedData, undefined, `Google Sheets logging failed: ${(error as Error).message}`);
        }
      }

      const dataWithGoogleInfo = { ...editedData, driveFileId, imageUrl };
      const { isDuplicate, error: saveError, notConfigured } = await saveReceipt(dataWithGoogleInfo);

      if (notConfigured) {
        updateResultStatus('not_configured', dataWithGoogleInfo, undefined, 'Supabase not configured. Save skipped.');
      } else if (isDuplicate) {
        updateResultStatus('duplicate', dataWithGoogleInfo, undefined, 'Duplicate receipt detected.');
      } else if (saveError) {
        updateResultStatus('error', dataWithGoogleInfo, 'Failed to save to database.', 'Database save failed.');
      } else {
        updateResultStatus('saved', dataWithGoogleInfo, undefined, 'Successfully saved to database.');
        if (onSaveSuccess) onSaveSuccess();
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      updateResultStatus('error', editedData, errorMessage, `Error during save: ${errorMessage}`);
    } finally {
      setIsSaving(false);
      closeReviewModal();
    }
  };

  const cancelReceiptReview = () => {
    if (reviewingId !== null) {
      const id = reviewingId;
      setResults(curr => 
        curr.map(r => r.id === id 
          ? { 
              ...r, 
              status: 'needs_review', 
              error: undefined,
              logs: [...(r.logs || []), 'Review deferred by user.']
            }
          : r
        )
      );
    }
    closeReviewModal();
  };

  return {
    results,
    isProcessing,
    isSaving,
    addFiles,
    clearAll,
    analyzeAll,
    openReviewModal,
    confirmReceiptSave,
    cancelReceiptReview,
    
    // Modal states
    isReviewModalOpen: reviewingId !== null,
    pendingReceiptData,
    pendingImagePreview
  };
};
