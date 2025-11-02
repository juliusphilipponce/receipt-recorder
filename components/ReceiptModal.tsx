import React from 'react';
import { ReceiptData } from '../types';
import ReceiptDetails from './ReceiptDetails';

interface ReceiptModalProps {
  receipt: ReceiptData;
  onClose: () => void;
  onUpdate?: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose, onUpdate }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 animate-fade-in-fast"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      <div
        className="relative w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <button
          onClick={onClose}
          className="absolute -top-4 -right-2 md:-top-3 md:-right-3 z-10 bg-gray-800 rounded-full p-2 text-white hover:bg-red-600 transition-colors"
          aria-label="Close receipt details"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div id="receipt-modal-title" className="sr-only">Receipt Details for {receipt.merchantName}</div>
        <ReceiptDetails data={receipt} onUpdate={onUpdate} />
      </div>
    </div>
  );
};

export default ReceiptModal;
