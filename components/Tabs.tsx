import React from 'react';

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = ['Scanner', 'My Receipts'];

  return (
    <div className="w-full max-w-4xl mb-6">
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab.toLowerCase().replace(' ', ''))}
            className={`py-3 px-6 text-lg font-medium transition-colors duration-300
              ${activeTab === tab.toLowerCase().replace(' ', '')
                ? 'border-b-2 border-teal-400 text-teal-300'
                : 'text-gray-400 hover:text-white'
              }
            `}
            aria-current={activeTab === tab.toLowerCase().replace(' ', '') ? 'page' : undefined}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
