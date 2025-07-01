import { Loader } from 'lucide-react';

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className = 'min-h-screen flex items-center justify-center',
}) => {
  return (
    <div className={className}>
      <div className="flex flex-col items-center space-y-4">
        <Loader className="animate-spin [animation-duration:2s]" />
      </div>
    </div>
  );
};
