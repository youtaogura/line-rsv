import Link from 'next/link';
import React from 'react';

interface ActionButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success';
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  href,
  children,
  variant = 'primary',
  className = '',
}) => {
  const baseClasses =
    'w-full py-3 px-4 rounded-xs transition-colors text-center block font-medium';

  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-secondary text-white hover:bg-secondary/90',
    success: 'bg-success text-white hover:bg-success/90',
  };

  return (
    <Link
      href={href}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </Link>
  );
};
