'use client'

import { useState, Suspense, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useAdminSession, useUsers } from '@/hooks/useAdminData'
import { UserList } from '@/components/admin/UserList'
import { UserEditModal } from '@/components/admin/UserEditModal'
import type { User } from '@/lib/supabase'
import { formatDateTime } from '@/lib/admin-types'

function UsersContent() {
  const { session, isLoading, isAuthenticated } = useAdminSession()
  const { users, fetchUsers, updateUser } = useUsers()
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      const fetchData = async () => {
        await fetchUsers()
        setLoading(false)
      }
      fetchData()
    }
  }, [isAuthenticated, session, fetchUsers])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">認証確認中...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              認証が必要です
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              管理者としてログインしてください
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    )
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  const handleCloseModal = () => {
    setEditingUser(null)
    setIsEditModalOpen(false)
  }

  const handleUpdateUser = async (updateData: {
    name: string
    phone: string
    member_type: 'regular' | 'guest'
  }) => {
    if (!editingUser) return false

    const success = await updateUser(editingUser.user_id, updateData)
    if (success) {
      handleCloseModal()
    }
    return success
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ユーザー管理</h1>
            <p className="mt-2 text-gray-600">登録ユーザーの管理ができます</p>
            {session?.user && (
              <p className="text-sm text-gray-500 mt-1">
                ログイン中: {session.user.name} ({session.user.username})
              </p>
            )}
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => window.location.href = '/admin'}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              管理画面に戻る
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              ログアウト
            </button>
          </div>
        </div>

        <UserList
          users={users}
          onEditUser={handleEditUser}
          formatDateTime={formatDateTime}
        />

        <UserEditModal
          isOpen={isEditModalOpen}
          user={editingUser}
          onClose={handleCloseModal}
          onUpdateUser={handleUpdateUser}
        />
      </div>
    </div>
  )
}

export default function UsersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    }>
      <UsersContent />
    </Suspense>
  )
}