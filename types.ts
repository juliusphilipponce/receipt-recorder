
export interface ReceiptItem {
  name: string;
  price: number;
}

export interface ReceiptData {
  id?: number;
  merchantName: string;
  date: string;
  total: number;
  items: ReceiptItem[];
  notes?: string;           // User-added notes/description
  imageUrl?: string;        // Google Drive link to receipt image
  driveFileId?: string;     // Google Drive file ID for reference
}

export type ProcessingStatus = 'pending' | 'analyzing' | 'needs_review' | 'saving' | 'saved' | 'duplicate' | 'error' | 'not_configured';

export interface ProcessResult {
  id: string;
  file: File;
  status: ProcessingStatus;
  data?: ReceiptData;
  error?: string;
  logs?: string[];
}