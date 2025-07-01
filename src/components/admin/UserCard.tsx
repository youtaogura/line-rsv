import { User } from '@/lib/supabase';
import { Phone } from 'lucide-react';
import { MemberTypeBadge } from '../common';
import { Card, CardContent } from '../ui/card';

interface Props {
  user: User;
  onEditUser: (user: User) => void;
}

export function UserCard({ user, onEditUser }: Props) {
  return (
    <Card
      key={user.user_id}
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onEditUser(user)}
    >
      <CardContent className="px-3 py-1">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex gap-2">
              <h3 className="font-semibold text-md">{user.name}</h3>
              <MemberTypeBadge memberType={user.member_type} />
            </div>
            {user.phone ? (
              <a
                href={`tel:${user.phone}`}
                className="mt-2 flex items-center space-x-2 text-gray-800 hover:text-primary/80 transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span className="text-sm">{user.phone}</span>
              </a>
            ) : (
              <p className="mt-2 flex items-center space-x-2 text-gray-400 hover:text-primary/80 transition-colors">
                <Phone className="h-4 w-4" />
                <span className="text-sm">登録なし</span>
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
