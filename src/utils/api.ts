import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/constants/api';

export function createApiResponse(
  data: unknown,
  status: number = HTTP_STATUS.OK
) {
  return NextResponse.json(data, { status });
}

export function createErrorResponse(
  message: string,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
) {
  return NextResponse.json({ error: message }, { status });
}

export function createValidationErrorResponse(errors: Record<string, string>) {
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: errors,
    },
    {
      status: HTTP_STATUS.BAD_REQUEST,
    }
  );
}

export function createNotFoundResponse(resource: string = 'Resource') {
  return NextResponse.json(
    {
      error: `${resource} not found`,
    },
    {
      status: HTTP_STATUS.NOT_FOUND,
    }
  );
}

export function createUnauthorizedResponse() {
  return NextResponse.json(
    {
      error: 'Unauthorized',
    },
    {
      status: HTTP_STATUS.UNAUTHORIZED,
    }
  );
}

export function createMethodNotAllowedResponse(allowedMethods: string[]) {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      allowedMethods,
    },
    {
      status: HTTP_STATUS.METHOD_NOT_ALLOWED,
    }
  );
}
