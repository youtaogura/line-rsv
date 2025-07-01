import { MEMBER_TYPES } from '@/constants/business';
import React from 'react';
import { Badge } from '../ui/badge';

interface MemberTypeBadgeProps {
  memberType: string;
  className?: string;
}

export const MemberTypeBadge: React.FC<MemberTypeBadgeProps> = ({
  memberType,
  className = '',
}) => {
  const isRegular = memberType === MEMBER_TYPES.REGULAR;
  const text = isRegular ? 'リピート' : '新規';

  const variantClasses = isRegular
    ? 'bg-blue-50 text-blue-800'
    : 'bg-amber-50 text-amber-800';

  return <Badge className={`${variantClasses} ${className}`}>{text}</Badge>;
};
