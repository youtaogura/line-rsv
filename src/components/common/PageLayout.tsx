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
  const baseClasses = 'min-h-screen bg-gray-50';
  const centerClasses = centerContent ? 'flex items-center justify-center' : '';
  
  return (
    <div className={`${baseClasses} ${centerClasses} ${className}`}>
      {children}
    </div>
  );
};