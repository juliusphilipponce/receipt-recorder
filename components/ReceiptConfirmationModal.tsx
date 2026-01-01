/**
 * Receipt Confirmation Modal
 * Allows users to review and edit receipt data before saving
 */

import React, { useState, useEffect } from 'react';
import { ReceiptData, ReceiptItem } from '../types';

interface ReceiptConfirmationModalProps {
    isOpen: boolean;
    receiptData: ReceiptData | null;
    imagePreview: string | null;
    onConfirm: (editedData: ReceiptData) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const ReceiptConfirmationModal: React.FC<ReceiptConfirmationModalProps> = ({
    isOpen,
    receiptData,
    imagePreview,
    onConfirm,
    onCancel,
    isLoading = false
}) => {
    const [editedData, setEditedData] = useState<ReceiptData | null>(null);

    // Initialize edited data when modal opens
    useEffect(() => {
        if (receiptData) {
            setEditedData({ ...receiptData });
            console.log('🔵 Modal opened with data:', receiptData);
            console.log('🖼️ Image preview URL:', imagePreview);
        }
    }, [receiptData, imagePreview]);

    if (!isOpen || !editedData) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(editedData);
    };

    const updateItem = (index: number, field: 'name' | 'price', value: string | number) => {
        const newItems = [...editedData.items];
        newItems[index] = {
            ...newItems[index],
            [field]: field === 'price' ? parseFloat(value as string) || 0 : value
        };
        setEditedData({ ...editedData, items: newItems });
    };

    const addItem = () => {
        setEditedData({
            ...editedData,
            items: [...editedData.items, { name: '', price: 0 }]
        });
    };

    const removeItem = (index: number) => {
        const newItems = editedData.items.filter((_, i) => i !== index);
        setEditedData({ ...editedData, items: newItems });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border border-gray-700 flex flex-col mx-auto">
                <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
                    {/* Header */}
                    <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-700 bg-gradient-to-r from-sky-500/20 to-blue-500/20">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">Confirm Receipt Details</h2>
                        <p className="text-gray-300 text-xs sm:text-sm mt-1">Review and edit the extracted information</p>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:items-start">
                            {/* Left Column - Image Preview */}
                            <div className="flex flex-col">
                                <div className="bg-gray-900/50 rounded-xl p-3 sm:p-4 border border-gray-700">
                                    <h3 className="text-lg font-semibold text-white mb-3">Receipt Image</h3>
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Receipt preview"
                                            className="w-full rounded-lg border border-gray-600"
                                            onError={(e) => {
                                                console.error('Image failed to load:', imagePreview);
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-64 flex items-center justify-center bg-gray-800 rounded-lg border border-gray-600">
                                            <p className="text-gray-400">No image preview available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column - Form Fields */}
                            <div className="flex flex-col space-y-3 sm:space-y-4">
                                {/* Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        value={editedData.date}
                                        onChange={(e) => setEditedData({ ...editedData, date: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                {/* Merchant Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Merchant Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editedData.merchantName}
                                        onChange={(e) => setEditedData({ ...editedData, merchantName: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                {/* Total Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Total Amount
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editedData.total}
                                        onChange={(e) => setEditedData({ ...editedData, total: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={editedData.notes || ''}
                                        onChange={(e) => setEditedData({ ...editedData, notes: e.target.value })}
                                        placeholder="Add any notes or descriptions..."
                                        rows={3}
                                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                                    />
                                </div>

                                {/* Items List */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-sm font-medium text-gray-300">
                                            Items
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 hover:text-sky-300 rounded-lg text-sm font-medium transition-colors border border-sky-500/30"
                                        >
                                            + Add Item
                                        </button>
                                    </div>
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                        {editedData.items.map((item, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                    placeholder="Item name"
                                                    className="flex-1 min-w-0 px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                                />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.price}
                                                    onChange={(e) => updateItem(index, 'price', e.target.value)}
                                                    placeholder="Price"
                                                    className="w-20 sm:w-24 px-2 sm:px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="shrink-0 w-9 h-9 flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-xl"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-700 bg-gray-800/50 flex justify-end gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-4 sm:px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 sm:px-6 py-2 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                'Confirm & Save'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
