import { UI_TEXT } from '@/constants/ui';

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  text = UI_TEXT.LOADING,
  className = "min-h-screen flex items-center justify-center"
}) => {
  return (
    <div className={className}>
      <div className="text-xl">{text}</div>
    </div>
  );
};