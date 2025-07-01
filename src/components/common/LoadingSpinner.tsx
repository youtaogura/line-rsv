import { Loader } from 'lucide-react';

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className = 'fixed top-0 left-0 right-0 bottom-0 h-screen w-screen bg-white z-100 flex items-center justify-center',
}) => {
  return (
    <div className={className}>
      <div className="flex flex-col items-center space-y-4">
        <Loader className="animate-spin [animation-duration:2s]" />
      </div>
    </div>
  );
};
