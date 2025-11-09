import React from 'react';

interface DateToggleProps {
  isEnabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

const DateToggle: React.FC<DateToggleProps> = ({ isEnabled, onChange, disabled = false }) => {
  return (
    <div className="flex items-center justify-center gap-3 p-3 sm:p-4 bg-gray-800 rounded-lg border border-gray-700 mb-4 sm:mb-6">
      <label
        htmlFor="use-today-date-toggle"
        className="flex items-center gap-3 cursor-pointer select-none"
      >
        {/* Toggle Switch */}
        <div className="relative">
          <input
            id="use-today-date-toggle"
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="sr-only peer"
            aria-label="Use today's date for receipt"
          />
          <div
            className={`
              w-11 h-6 rounded-full transition-colors duration-300
              ${isEnabled ? 'bg-teal-500' : 'bg-gray-600'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              peer-focus:ring-2 peer-focus:ring-teal-500 peer-focus:ring-offset-2 peer-focus:ring-offset-gray-900
            `}
          ></div>
          <div
            className={`
              absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300
              ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
            `}
          ></div>
        </div>

        {/* Label Text */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className={`text-sm sm:text-base font-medium ${disabled ? 'text-gray-500' : 'text-white'}`}>
            Use Today's Date
          </span>
          <span className={`text-xs ${disabled ? 'text-gray-600' : 'text-gray-400'}`}>
            (Skip date extraction from receipt)
          </span>
        </div>
      </label>

      {/* Info Icon with Tooltip */}
      <div className="relative group">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors cursor-help"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10 w-64 sm:w-72">
          <div className="bg-gray-700 text-white text-xs rounded-lg p-3 shadow-lg border border-gray-600">
            <p className="mb-1 font-semibold">When enabled:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              <li>Receipt date will be set to today's date</li>
              <li>You'll be asked to confirm before analysis</li>
              <li>Date extraction from image will be skipped</li>
            </ul>
            <div className="absolute top-full right-4 -mt-1">
              <div className="border-8 border-transparent border-t-gray-700"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateToggle;

