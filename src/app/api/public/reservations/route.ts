import { HTTP_STATUS } from '@/constants/api';
import { supabase, Reservation } from '@/lib/supabase';
import {
  requireValidTenant,
  TenantValidationError,
} from '@/lib/tenant-validation';
import {
  createApiResponse,
  createErrorResponse,
  createNotFoundResponse,
  createValidationErrorResponse,
} from '@/utils/api';
import { NextRequest } from 'next/server';

// API response type definitions
export type ReservationsApiResponse = Pick<Reservation, 'id' | 'user_id' | 'name' | 'datetime' | 'note' | 'member_type' | 'reservation_menu_id' | 'duration_minutes' | 'is_created_by_user' | 'created_at'>[];

export type CreateReservationApiResponse = Pick<Reservation, 'id' | 'user_id' | 'name' | 'datetime' | 'note' | 'member_type' | 'admin_note' | 'reservation_menu_id' | 'duration_minutes' | 'staff_member_id' | 'is_created_by_user' | 'created_at'>;

export type UpdateReservationApiResponse = Pick<Reservation, 'id' | 'user_id' | 'name' | 'datetime' | 'note' | 'member_type' | 'admin_note' | 'reservation_menu_id' | 'duration_minutes' | 'staff_member_id' | 'is_created_by_user' | 'created_at'>;

export async function GET(request: NextRequest) {
  try {
    let tenant;
    try {
      tenant = await requireValidTenant(request);
    } catch (error) {
      if (error instanceof TenantValidationError) {
        return createValidationErrorResponse({ tenant: error.message });
      }
      throw error;
    }

    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return createValidationErrorResponse({
        user_id: 'user_id parameter is required',
      });
    }

    const now = new Date().toISOString();

    const { data: reservations, error } = await supabase
      .from('reservations')
      .select(
        'id, user_id, name, datetime, note, member_type, reservation_menu_id, duration_minutes, is_created_by_user, created_at'
      )
      .eq('tenant_id', tenant.id)
      .eq('user_id', user_id)
      .gt('datetime', now)
      .order('datetime', { ascending: true });

    if (error) {
      console.error('Reservation fetch error:', error);
      return createErrorResponse('Failed to fetch reservations');
    }

    return createApiResponse(reservations);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}

export async function POST(request: NextRequest) {
  try {
    // テナント検証
    let tenant;
    try {
      tenant = await requireValidTenant(request);
    } catch (error) {
      if (error instanceof TenantValidationError) {
        return createValidationErrorResponse({ tenant: error.message });
      }
      throw error;
    }

    const body = await request.json();
    let user_id = body.user_id;
    let name = body.name;
    let member_type = body.member_type;
    const {
      datetime,
      note,
      phone,
      admin_note,
      is_admin_mode,
      reservation_menu_id,
      staff_member_id,
    } = body;

    // 必須フィールドのバリデーション
    if (!user_id || !name || !datetime || !member_type) {
      return createValidationErrorResponse({
        fields: 'Missing required fields: user_id, name, datetime, member_type',
      });
    }

    // スタッフメンバーが指定されている場合、有効性をチェック
    if (staff_member_id) {
      const { data: staffMember, error: staffError } = await supabase
        .from('staff_members')
        .select('id')
        .eq('id', staff_member_id)
        .eq('tenant_id', tenant.id)
        .single();

      if (staffError || !staffMember) {
        return createValidationErrorResponse({
          staff_member_id: 'Invalid staff member',
        });
      }
    }

    // 予約メニューを取得
    let reservationMenu = null;
    let durationMinutes = 30; // デフォルト値

    if (reservation_menu_id) {
      const { data: menuData, error: menuError } = await supabase
        .from('reservation_menu')
        .select('*')
        .eq('id', reservation_menu_id)
        .eq('tenant_id', tenant.id)
        .single();

      if (menuError) {
        return createValidationErrorResponse({
          reservation_menu_id: 'Invalid reservation menu',
        });
      }

      reservationMenu = menuData;
      durationMinutes = menuData.duration_minutes;
    } else {
      // メニューが指定されていない場合は、デフォルトメニューを取得
      const { data: menuData } = await supabase
        .from('reservation_menu')
        .select('*')
        .eq('tenant_id', tenant.id)
        .limit(1)
        .single();

      if (menuData) {
        reservationMenu = menuData;
        durationMinutes = menuData.duration_minutes;
      }
    }

    // 予約の重複チェック（テナント内で）
    const { data: existingReservation } = await supabase
      .from('reservations')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user_id)
      .eq('datetime', datetime)
      .single();

    if (existingReservation) {
      return createErrorResponse(
        'You already have a reservation at this time',
        409
      );
    }

    // 管理者モードで新規ユーザーの場合、まずusersテーブルに追加
    if (is_admin_mode && user_id.startsWith('admin_')) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('user_id')
        .eq('tenant_id', tenant.id)
        .eq('user_id', user_id)
        .single();

      if (!existingUser) {
        const { error: userError } = await supabase.from('users').insert({
          tenant_id: tenant.id,
          user_id,
          name,
          phone: phone || null,
          member_type,
        });

        if (userError) {
          console.error('User creation error:', userError);
          return createErrorResponse('Failed to create user');
        }
      }
    }

    // ゲストユーザーの場合、usersテーブルに先に追加
    if (member_type === 'guest') {
      const { data: existingUser } = await supabase
        .from('users')
        .select('user_id')
        .eq('tenant_id', tenant.id)
        .eq('user_id', user_id)
        .single();

      if (!existingUser) {
        // 電話番号が提供されている場合、同じ電話番号のユーザーがいるかチェック
        if (phone && phone.trim()) {
          const { findMergeableUserByPhone, mergeUsers } = await import(
            '@/lib/user-merge'
          );

          const phoneUser = await findMergeableUserByPhone(
            phone.trim(),
            tenant.id
          );

          if (phoneUser) {
            // 統合処理を実行
            try {
              // まずゲストユーザーを作成
              const { error: guestUserError } = await supabase
                .from('users')
                .insert({
                  tenant_id: tenant.id,
                  user_id,
                  name,
                  phone,
                  member_type: 'guest',
                });

              if (guestUserError) {
                console.error('Guest user creation error:', guestUserError);
                return createErrorResponse('Failed to create guest user');
              }

              // 統合処理を実行
              const mergeResult = await mergeUsers({
                sourceUserId: user_id,
                targetUserId: phoneUser.user_id,
                tenantId: tenant.id,
              });

              if (mergeResult.success) {
                // 統合成功、正会員のIDで予約を作成
                user_id = phoneUser.user_id;
                member_type = phoneUser.member_type;
                name = phoneUser.name;
              } else {
                console.error('User merge failed:', mergeResult.error);
                return createErrorResponse(
                  mergeResult.error || 'Failed to merge users'
                );
              }
            } catch (mergeError) {
              console.error('User merge error:', mergeError);
              return createErrorResponse('Failed to merge users');
            }
          } else {
            // 電話番号重複なし、通常通りゲストユーザーを作成
            const { error: userError } = await supabase.from('users').insert({
              tenant_id: tenant.id,
              user_id,
              name,
              phone,
              member_type: 'guest',
            });

            if (userError) {
              console.error('User creation error:', userError);
              return createErrorResponse('Failed to create user');
            }
          }
        } else {
          // 電話番号なしの場合、通常通りゲストユーザーを作成
          const { error: userError } = await supabase.from('users').insert({
            tenant_id: tenant.id,
            user_id,
            name,
            phone,
            member_type: 'guest',
          });

          if (userError) {
            console.error('User creation error:', userError);
            return createErrorResponse('Failed to create user');
          }
        }
      }
    }

    // 予約データを挿入
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        tenant_id: tenant.id,
        user_id,
        name,
        datetime,
        note,
        member_type,
        admin_note,
        reservation_menu_id: reservationMenu?.id || null,
        duration_minutes: durationMinutes,
        staff_member_id: staff_member_id || null,
        is_created_by_user: !is_admin_mode,
      })
      .select()
      .single();

    if (reservationError) {
      console.error('Reservation error:', reservationError);
      return createErrorResponse('Failed to create reservation');
    }

    // 通知を作成
    try {
      const memberTypeText = member_type === 'regular' ? '会員' : '新規';
      const staffMemberName = staff_member_id
        ? (
            await supabase
              .from('staff_members')
              .select('name')
              .eq('id', staff_member_id)
              .single()
          ).data?.name || '-'
        : '-';

      const notificationTitle = `予約のお知らせ（${memberTypeText}）`;
      const notificationMessage = `新しい予約がありました。
${name}（${memberTypeText}）
日時：${new Date(datetime).toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })}
担当スタッフ：${staffMemberName}`;

      await supabase.from('notifications').insert({
        tenant_id: tenant.id,
        title: notificationTitle,
        message: notificationMessage,
      });
    } catch (notificationError) {
      console.error('Notification creation error:', notificationError);
    }

    return createApiResponse(reservation, HTTP_STATUS.CREATED);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}

export async function PUT(request: NextRequest) {
  try {
    // テナント検証
    let tenant;
    try {
      tenant = await requireValidTenant(request);
    } catch (error) {
      if (error instanceof TenantValidationError) {
        return createValidationErrorResponse({ tenant: error.message });
      }
      throw error;
    }

    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('id');

    if (!reservationId) {
      return createValidationErrorResponse({
        id: 'Reservation ID is required',
      });
    }

    const body = await request.json();
    const { staff_member_id, admin_note } = body;

    // 予約が存在し、テナントに属していることを確認
    const { data: existingReservation, error: fetchError } = await supabase
      .from('reservations')
      .select('id, tenant_id')
      .eq('id', reservationId)
      .eq('tenant_id', tenant.id)
      .single();

    if (fetchError || !existingReservation) {
      return createNotFoundResponse('Reservation');
    }

    // スタッフメンバーが指定されている場合、有効性をチェック
    if (staff_member_id) {
      const { data: staffMember, error: staffError } = await supabase
        .from('staff_members')
        .select('id')
        .eq('id', staff_member_id)
        .eq('tenant_id', tenant.id)
        .single();

      if (staffError || !staffMember) {
        return createValidationErrorResponse({
          staff_member_id: 'Invalid staff member',
        });
      }
    }

    // 予約を更新
    const updateData: Record<string, string | null> = {};
    if (staff_member_id !== undefined) {
      updateData.staff_member_id = staff_member_id || null;
    }
    if (admin_note !== undefined) {
      updateData.admin_note = admin_note || null;
    }

    const { data: reservation, error: updateError } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', reservationId)
      .eq('tenant_id', tenant.id)
      .select()
      .single();

    if (updateError) {
      console.error('Reservation update error:', updateError);
      return createErrorResponse('Failed to update reservation');
    }

    return createApiResponse(reservation);
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // テナント検証
    let tenant;
    try {
      tenant = await requireValidTenant(request);
    } catch (error) {
      if (error instanceof TenantValidationError) {
        return createValidationErrorResponse({ tenant: error.message });
      }
      throw error;
    }

    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('id');

    if (!reservationId) {
      return createValidationErrorResponse({
        id: 'Reservation ID is required',
      });
    }

    // 予約が存在し、テナントに属していることを確認
    const { data: existingReservation } = await supabase
      .from('reservations')
      .select('id, datetime, tenant_id')
      .eq('id', reservationId)
      .eq('tenant_id', tenant.id)
      .single();

    if (!existingReservation) {
      return createNotFoundResponse('Reservation');
    }

    // 予約を削除
    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservationId)
      .eq('tenant_id', tenant.id);

    if (deleteError) {
      console.error('Reservation deletion error:', deleteError);
      return createErrorResponse('Failed to delete reservation');
    }

    return createApiResponse({ message: 'Reservation deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse('Internal server error');
  }
}
