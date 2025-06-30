import { NextRequest } from 'next/server';
import {
  createApiResponse,
  createUnauthorizedResponse,
  createValidationErrorResponse,
} from '@/utils/api';

export async function GET(request: NextRequest) {
  const lineUser = request.cookies.get('line_user')?.value;

  if (!lineUser) {
    return createUnauthorizedResponse();
  }

  try {
    const userData = JSON.parse(lineUser);
    return createApiResponse(userData);
  } catch (_error) {
    return createValidationErrorResponse({ user_data: 'Invalid user data' });
  }
}
