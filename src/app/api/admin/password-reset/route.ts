import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function generateRandomPassword(length = 12): string {
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

function generateRandomDelay(): number {
  // Generate random delay between 1-3 seconds (1000-3000ms)
  return Math.floor(Math.random() * 2000) + 1000;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'メールアドレスが必要です' },
        { status: 400 }
      );
    }

    // Check if admin with this email exists
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (adminError || !admin) {
      // For security, add random delay to prevent timing attacks
      const randomDelay = generateRandomDelay();
      await delay(randomDelay);

      // Return success even if email doesn't exist
      return NextResponse.json(
        { message: 'パスワード再発行メールを送信しました' },
        { status: 200 }
      );
    }

    // Generate new random password
    const newPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update admin password in database
    const { error: updateError } = await supabase
      .from('admins')
      .update({ password_hash: hashedPassword })
      .eq('id', admin.id);

    if (updateError) {
      console.error('Error updating admin password:', updateError);
      return NextResponse.json(
        { message: 'パスワードの更新に失敗しました' },
        { status: 500 }
      );
    }

    // Send email with new password
    const { error: emailError } = await resend.emails.send({
      from: `FiLUP管理 <noreply@${process.env.RESEND_DOMAIN}>`,
      to: [email],
      subject: 'パスワード再発行のお知らせ',
      text: `パスワード再発行のお知らせ
${admin.name}様
パスワードの再発行を行いました。新しいパスワードは以下の通りです：

新しいパスワード: ${newPassword}

セキュリティのため、ログイン後に必ずパスワードを変更してください。
このメールに心当たりがない場合は、管理者にお問い合わせください。
このメールは自動送信されています。返信はできません。
`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2c3e50;">パスワード再発行のお知らせ</h2>
              <p>${admin.name}様</p>
              <p>パスワードの再発行を行いました。新しいパスワードは以下の通りです：</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="font-size: 16px; font-weight: bold; color: #495057;">新しいパスワード: ${newPassword}</p>
              </div>
              <p style="color: #dc3545; font-weight: bold;">セキュリティのため、ログイン後に必ずパスワードを変更してください。</p>
              <p>このメールに心当たりがない場合は、管理者にお問い合わせください。</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
              <p style="color: #6c757d; font-size: 14px;">
                このメールは自動送信されています。返信はできません。
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      return NextResponse.json(
        { message: 'メール送信に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'パスワード再発行メールを送信しました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { message: 'パスワード再発行に失敗しました' },
      { status: 500 }
    );
  }
}
