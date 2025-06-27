import React, { useState, useEffect } from 'react'
import type { User } from '@/lib/supabase'
import { Modal } from './Modal'

interface UserEditModalProps {
  isOpen: boolean
  user: User | null
  onClose: () => void
  onUpdateUser: (updateData: {
    name: string
    phone: string
    member_type: 'regular' | 'guest'
  }) => Promise<boolean>
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  user,
  onClose,
  onUpdateUser
}) => {
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    member_type: 'guest' as 'regular' | 'guest'
  })
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (user) {
      setEditFormData({
        name: user.name,
        phone: user.phone || '',
        member_type: user.member_type
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsUpdating(true)
    
    try {
      await onUpdateUser(editFormData)
    } catch (error) {
      console.error('Error updating user:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClose = () => {
    setEditFormData({
      name: '',
      phone: '',
      member_type: 'guest'
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="ユーザー情報編集" className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            名前 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={editFormData.name}
            onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary hover:border-gray-400 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            電話番号
          </label>
          <input
            type="tel"
            value={editFormData.phone}
            onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary hover:border-gray-400 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            会員種別 <span className="text-red-500">*</span>
          </label>
          <select
            value={editFormData.member_type}
            onChange={(e) => setEditFormData({...editFormData, member_type: e.target.value as 'regular' | 'guest'})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary hover:border-gray-400 transition-colors"
          >
            <option value="guest">ゲスト</option>
            <option value="regular">会員</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUpdating}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isUpdating || !editFormData.name.trim()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isUpdating ? '更新中...' : '更新'}
          </button>
        </div>
      </form>
    </Modal>
  )
}