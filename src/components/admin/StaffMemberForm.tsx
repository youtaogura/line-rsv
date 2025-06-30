import React, { useState } from 'react';

interface StaffMemberFormProps {
  onCreateStaffMember: (name: string) => Promise<boolean>;
}

export const StaffMemberForm: React.FC<StaffMemberFormProps> = ({
  onCreateStaffMember,
}) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const success = await onCreateStaffMember(name.trim());
    if (success) {
      setName('');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        新しいスタッフを追加
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            スタッフ名
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="スタッフ名を入力"
            required
          />
        </div>
        <button
          type="submit"
          disabled={!name.trim() || isSubmitting}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSubmitting ? '追加中...' : 'スタッフを追加'}
        </button>
      </form>
    </div>
  );
};
