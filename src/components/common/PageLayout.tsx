import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  centerContent?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  className = '',
  centerContent = false,
}) => {
  const baseClasses = 'min-h-screen bg-gray-50 flex flex-col';
  const centerClasses = centerContent ? 'flex items-center justify-center' : '';

  return (
    <div className={`${baseClasses}`}>
      <div className={`flex-1 ${centerClasses} ${className}`}>{children}</div>
      <footer>
        <div className="w-full h-16 bg-primary flex items-center justify-center">
          <div className="text-xs text-gray-200 text-center">
            {`FiLUP © ${new Date().getFullYear()} 株式会社プラスツーシステム All Rights Reserved.`}
          </div>
        </div>
      </footer>
    </div>
  );
};
