import { useState, useCallback } from 'react';
import { ReceiptData, ProcessResult } from '../types';
import { analyzeReceipt } from '../services/geminiService';
import { googleDriveService } from '../services/googleDriveService';
import { googleSheetsService } from '../services/googleSheetsService';
import { saveReceipt } from '../services/receiptService';

export const useReceiptProcessor = (googleAuthInitialized: boolean) => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Parallel track items that need manual review:
  const [needsReviewIndex, setNeedsReviewIndex] = useState<number | null>(null);
  const [pendingReceiptData, setPendingReceiptData] = useState<ReceiptData | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);

  const addFiles = useCallback((newFiles: File[]) => {
    setImageFiles(currentFiles => {
      const filtered = newFiles.filter(file => 
        !currentFiles.some(existingFile => existingFile.name === file.name && existingFile.size === file.size)
      );
      if (filtered.length === 0) return currentFiles;
      return [...currentFiles, ...filtered];
    });

    setResults(prev => {
      const filtered = newFiles.filter(file => 
        !prev.some(existingResult => existingResult.file.name === file.name && existingResult.file.size === file.size)
      );
      if (filtered.length === 0) return prev;
      
      return [
        ...prev,
        ...filtered.map(f => ({ 
          file: f, 
          status: 'pending' as ProcessResult['status'],
          logs: ['File added to queue. Pending analysis.']
        }))
      ];
    });
  }, []);

  const clearAll = useCallback(() => {
    setImageFiles([]);
    setResults([]);
    setIsProcessing(false);
    setNeedsReviewIndex(null);
    setPendingReceiptData(null);
    setPendingImageFile(null);
    setPendingImagePreview(null);
  }, []);

  const analyzeAll = useCallback(async (useTodayDate: boolean) => {
    if (imageFiles.length === 0) return;
    setIsProcessing(true);

    const pendingIndices = results
      .map((r, i) => (r.status === 'pending' || r.status === 'error' ? i : -1))
      .filter(i => i !== -1);

    await Promise.allSettled(
      pendingIndices.map(async (index) => {
        const file = imageFiles[index];
        setResults(current => {
          const newResults = [...current];
          newResults[index] = { 
            ...newResults[index], 
            status: 'analyzing',
            logs: [...(newResults[index].logs || []), 'Starting asynchronous analysis...']
          };
          return newResults;
        });

        try {
          // Send to Netlify backend
          const data = await analyzeReceipt(file, useTodayDate);
          setResults(current => {
            const newResults = [...current];
            newResults[index] = { 
              ...newResults[index], 
              status: 'needs_review', 
              data,
              logs: [...(newResults[index].logs || []), 'Analysis complete. Waiting for your review.']
            };
            return newResults;
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
          setResults(current => {
            const newResults = [...current];
            newResults[index] = { 
              ...newResults[index], 
              status: 'error', 
              error: errorMessage,
              logs: [...(newResults[index].logs || []), `Analysis failed: ${errorMessage}`]
            };
            return newResults;
          });
        }
      })
    );
    setIsProcessing(false);
  }, [imageFiles, results]);

  const openReviewModal = useCallback((index: number) => {
    const file = imageFiles[index];
    const data = results[index].data;
    if (!file || !data) return;

    setPendingReceiptData(data);
    setPendingImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPendingImagePreview(previewUrl);
    setNeedsReviewIndex(index);
  }, [imageFiles, results]);

  const closeReviewModal = useCallback(() => {
    setPendingReceiptData(null);
    setPendingImageFile(null);
    if (pendingImagePreview) {
      URL.revokeObjectURL(pendingImagePreview);
    }
    setPendingImagePreview(null);
    setNeedsReviewIndex(null);
  }, [pendingImagePreview]);

  const confirmReceiptSave = async (editedData: ReceiptData, onSaveSuccess?: () => void) => {
    if (needsReviewIndex === null) return;
    setIsSaving(true);
    const index = needsReviewIndex;

    const updateResultStatus = (status: ProcessResult['status'], data?: ProcessResult['data'], error?: string, appendLog?: string) => {
      setResults(curr => {
        const newer = [...curr];
        const newLogs = appendLog ? [...(newer[index].logs || []), appendLog] : newer[index].logs;
        newer[index] = { ...newer[index], status, data, error, logs: newLogs };
        return newer;
      });
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
    if (needsReviewIndex !== null) {
      const index = needsReviewIndex;
      setResults(curr => {
        const newer = [...curr];
        newer[index] = { 
          ...newer[index], 
          status: 'needs_review', 
          error: undefined,
          logs: [...(newer[index].logs || []), 'Review deferred by user.']
        };
        return newer;
      });
    }
    closeReviewModal();
  };

  return {
    imageFiles,
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
    isReviewModalOpen: needsReviewIndex !== null,
    pendingReceiptData,
    pendingImagePreview
  };
};
