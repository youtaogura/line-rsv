import { UI_TEXT } from '@/constants/ui';

interface ErrorMessageProps {
  message?: string;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message = UI_TEXT.ERROR,
  className = "text-red-600 text-center"
}) => {
  return (
    <div className={className}>
      {message}
    </div>
  );
};