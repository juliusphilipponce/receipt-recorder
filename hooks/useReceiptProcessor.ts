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
      const updatedFiles = [...currentFiles, ...filtered];
      // Sync results array length
      setResults(prev => [
        ...prev,
        ...filtered.map(f => ({ file: f, status: 'pending' as ProcessResult['status'] }))
      ]);
      return updatedFiles;
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
          newResults[index] = { ...newResults[index], status: 'analyzing' };
          return newResults;
        });

        try {
          // Send to Netlify backend
          const data = await analyzeReceipt(file, useTodayDate);
          setResults(current => {
            const newResults = [...current];
            // Change status to needs_review instead of stopping the world
            newResults[index] = { ...newResults[index], status: 'needs_review', data };
            return newResults;
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
          setResults(current => {
            const newResults = [...current];
            newResults[index] = { ...newResults[index], status: 'error', error: errorMessage };
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

    const updateResultStatus = (status: ProcessResult['status'], data?: ProcessResult['data'], error?: string) => {
      setResults(curr => {
        const newer = [...curr];
        newer[index] = { ...newer[index], status, data, error };
        return newer;
      });
    };

    try {
      updateResultStatus('saving', editedData);

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
        } catch (error) {
          console.warn('Google Drive upload failed', error);
        }
      }

      if (googleAuthInitialized) {
        try {
          await googleSheetsService.addReceipt(editedData, imageUrl);
        } catch (error) {
          console.warn('Google Sheets logging failed', error);
        }
      }

      const dataWithGoogleInfo = { ...editedData, driveFileId, imageUrl };
      const { isDuplicate, error: saveError, notConfigured } = await saveReceipt(dataWithGoogleInfo);

      if (notConfigured) {
        updateResultStatus('not_configured', dataWithGoogleInfo);
      } else if (isDuplicate) {
        updateResultStatus('duplicate', dataWithGoogleInfo);
      } else if (saveError) {
        updateResultStatus('error', dataWithGoogleInfo, 'Failed to save to database.');
      } else {
        updateResultStatus('saved', dataWithGoogleInfo);
        if (onSaveSuccess) onSaveSuccess();
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      updateResultStatus('error', editedData, errorMessage);
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
        newer[index] = { ...newer[index], status: 'error', error: 'Cancelled by user' };
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
