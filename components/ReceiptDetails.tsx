
import React, { useState, useRef, useEffect } from 'react';
import { ReceiptData } from '../types';
import { formatCurrency } from '../utils/formatters';
import { updateReceiptDate } from '../services/receiptService';
import ConfirmDialog from './ConfirmDialog';

interface ReceiptDetailsProps {
  data: ReceiptData;
  onUpdate?: () => void;
}

const ReceiptDetails: React.FC<ReceiptDetailsProps> = ({ data, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDate, setEditedDate] = useState(data.date);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Focus the date input when entering edit mode
  useEffect(() => {
    if (isEditing && dateInputRef.current) {
      dateInputRef.current.focus();
    }
  }, [isEditing]);

  // Reset edited date when data changes
  useEffect(() => {
    setEditedDate(data.date);
  }, [data.date]);

  const handleEditClick = () => {
    setIsEditing(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedDate(data.date);
    setError(null);
  };

  const handleSaveClick = () => {
    // Validate date
    if (!editedDate || editedDate.trim() === '') {
      setError('Date cannot be empty');
      return;
    }

    // Validate date is not in the future
    const selectedDate = new Date(editedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

    if (selectedDate > today) {
      setError('Receipt date cannot be in the future');
      return;
    }

    // Check if date actually changed
    if (editedDate === data.date) {
      setIsEditing(false);
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    if (!data.id) {
      setError('Cannot update receipt: missing ID');
      setShowConfirmDialog(false);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateReceiptDate(data.id, editedDate);
      setSuccessMessage('Date updated successfully!');
      setIsEditing(false);
      setShowConfirmDialog(false);

      // Call the onUpdate callback to refresh the receipts list
      if (onUpdate) {
        onUpdate();
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update date');
      setShowConfirmDialog(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancelEdit();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveClick();
    }
  };

  return (
    <>
      <div className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 animate-fade-in">
        <div className="border-b-2 border-dashed border-gray-600 pb-4 mb-4">
          <h2 className="text-3xl font-bold text-teal-300 text-center tracking-wider">
            {data.merchantName || 'Merchant Unknown'}
          </h2>

          {/* Date Section with Edit Functionality */}
          <div className="mt-2 flex items-center justify-center gap-2">
            {!isEditing ? (
              <>
                <p className="text-center text-gray-400 text-sm">
                  {data.date || 'Date Unknown'}
                </p>
                <button
                  onClick={handleEditClick}
                  className="p-1 text-gray-400 hover:text-teal-300 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 rounded"
                  aria-label="Edit date"
                  title="Edit date"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                <input
                  ref={dateInputRef}
                  type="date"
                  value={editedDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setEditedDate(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full"
                  aria-label="Edit receipt date"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                    aria-label="Cancel editing"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveClick}
                    className="px-3 py-1 text-xs bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
                    aria-label="Save date"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-2 text-center text-red-400 text-sm bg-red-900/30 py-1 px-3 rounded">
              {error}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mt-2 text-center text-teal-300 text-sm bg-teal-900/30 py-1 px-3 rounded animate-fade-in">
              {successMessage}
            </div>
          )}
        </div>

        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
          {data.items && data.items.length > 0 ? (
            data.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-gray-300">
                <span className="flex-1 truncate pr-4">{item.name}</span>
                <span className="font-mono">{formatCurrency(item.price)}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center py-4">No items were extracted.</p>
          )}
        </div>

        <div className="border-t-2 border-dashed border-gray-600 pt-4 mt-6">
          <div className="flex justify-between items-center text-2xl font-bold text-white">
            <span>TOTAL</span>
            <span className="text-teal-300">{formatCurrency(data.total)}</span>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Confirm Date Change"
        message={`Are you sure you want to change the date from "${data.date}" to "${editedDate}"?`}
        confirmLabel="Save Changes"
        cancelLabel="Cancel"
        onConfirm={handleConfirmSave}
        onCancel={handleCancelConfirm}
        isLoading={isSaving}
      />
    </>
  );
};

export default ReceiptDetails;