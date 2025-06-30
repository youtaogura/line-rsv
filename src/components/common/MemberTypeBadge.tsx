import React from 'react';
import { MEMBER_TYPES } from '@/constants/business';
import { UI_TEXT } from '@/constants/ui';

interface MemberTypeBadgeProps {
  memberType: string;
  className?: string;
}

export const MemberTypeBadge: React.FC<MemberTypeBadgeProps> = ({
  memberType,
  className = '',
}) => {
  const isRegular = memberType === MEMBER_TYPES.REGULAR;
  const text = isRegular ? UI_TEXT.MEMBER : UI_TEXT.GUEST;

  const baseClasses =
    'inline-flex px-2 py-1 text-xs font-semibold rounded-full';
  const variantClasses = isRegular
    ? 'bg-success/10 text-success'
    : 'bg-warning/10 text-warning';

  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {text}
    </span>
  );
};
