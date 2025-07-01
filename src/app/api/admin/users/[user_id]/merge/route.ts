import {
  requireValidTenantFromSession,
  TenantValidationError,
} from '@/lib/tenant-validation';
import {
  createApiResponse,
  createErrorResponse,
  createNotFoundResponse,
  createValidationErrorResponse,
} from '@/utils/api';
import { NextRequest } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    // テナント検証
    let tenant;
    try {
      tenant = await requireValidTenantFromSession();
    } catch (error) {
      if (error instanceof TenantValidationError) {
        return createValidationErrorResponse({ tenant: error.message });
      }
      throw error;
    }

    const { user_id: sourceUserId } = await params;
    const body = await request.json();
    const { target_user_id: targetUserId } = body;

    // バリデーション
    if (!sourceUserId) {
      return createValidationErrorResponse({
        source_user_id: 'Source user ID is required',
      });
    }

    if (!targetUserId) {
      return createValidationErrorResponse({
        target_user_id: 'Target user ID is required',
      });
    }

    if (sourceUserId === targetUserId) {
      return createValidationErrorResponse({
        target_user_id: 'Source and target users cannot be the same',
      });
    }

    // 統合処理を実行
    const { mergeUsers } = await import('@/lib/user-merge');

    const mergeResult = await mergeUsers({
      sourceUserId,
      targetUserId,
      tenantId: tenant.id,
    });

    if (!mergeResult.success) {
      if (mergeResult.error?.includes('not found')) {
        return createNotFoundResponse(
          mergeResult.error.includes('Source') ? 'Source user' : 'Target user'
        );
      }
      if (
        mergeResult.error?.includes('guest users') ||
        mergeResult.error?.includes('regular member')
      ) {
        return createValidationErrorResponse({
          member_type: mergeResult.error,
        });
      }
      return createErrorResponse(
        mergeResult.error || 'Failed to complete merge process'
      );
    }

    return createApiResponse({
      message: 'User merge completed successfully',
      merged_reservations_count: mergeResult.mergedReservationsCount || 0,
      updated_user: mergeResult.updatedUser,
    });
  } catch (error) {
    console.error('Unexpected error during user merge:', error);
    return createErrorResponse('Internal server error during merge');
  }
}
