import React from 'react';

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = ['Scanner', 'My Receipts'];

  return (
    <div className="w-full max-w-4xl mb-4 sm:mb-6">
      <div className="flex border-b border-[#1e3a5f]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab.toLowerCase().replace(' ', ''))}
            className={`flex-1 sm:flex-none py-2 sm:py-3 px-4 sm:px-6 text-base sm:text-lg font-medium transition-colors duration-300
              ${activeTab === tab.toLowerCase().replace(' ', '')
                ? 'border-b-2 border-[#00d4ff] text-[#00d4ff]'
                : 'text-[#64748b] hover:text-white'
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
