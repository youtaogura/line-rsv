import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function validatePasswordChange(data: PasswordChangeData): { isValid: boolean; error?: string } {
  if (!data.currentPassword) {
    return { isValid: false, error: '現在のパスワードを入力してください' };
  }
  
  if (!data.newPassword) {
    return { isValid: false, error: '新しいパスワードを入力してください' };
  }
  
  if (data.newPassword.length < 8) {
    return { isValid: false, error: 'パスワードは8文字以上で入力してください' };
  }
  
  if (!data.confirmPassword) {
    return { isValid: false, error: 'パスワードの確認を入力してください' };
  }
  
  if (data.newPassword !== data.confirmPassword) {
    return { isValid: false, error: 'パスワードが一致しません' };
  }
  
  return { isValid: true };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.username) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = validatePasswordChange(body);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, password_hash')
      .eq('username', session.user.username)
      .single();

    if (adminError || !admin) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    if (!admin.password_hash) {
      return NextResponse.json(
        { error: 'パスワードが設定されていません' },
        { status: 400 }
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      body.currentPassword,
      admin.password_hash
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: '現在のパスワードが正しくありません' },
        { status: 400 }
      );
    }

    const hashedNewPassword = await bcrypt.hash(body.newPassword, 12);

    const { error: updateError } = await supabase
      .from('admins')
      .update({ password_hash: hashedNewPassword })
      .eq('id', admin.id);

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json(
        { error: 'パスワード変更に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'パスワードが正常に変更されました'
    });

  } catch (error) {
    console.error('Password change error:', error);
    
    return NextResponse.json(
      { error: 'パスワード変更に失敗しました' },
      { status: 500 }
    );
  }
}