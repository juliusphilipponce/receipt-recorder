
import React from 'react';
import { ReceiptData } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ReceiptDetailsProps {
  data: ReceiptData;
}

const ReceiptDetails: React.FC<ReceiptDetailsProps> = ({ data }) => {
  return (
    <div className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 animate-fade-in">
      <div className="border-b-2 border-dashed border-gray-600 pb-4 mb-4">
        <h2 className="text-3xl font-bold text-teal-300 text-center tracking-wider">{data.merchantName || 'Merchant Unknown'}</h2>
        <p className="text-center text-gray-400 mt-2 text-sm">{data.date || 'Date Unknown'}</p>
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
  );
};

export default ReceiptDetails;