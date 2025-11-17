import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from './auth';

export const authMiddleware = (handler, allowedRoles = []) => {
  return async (request, context) => {
    try {
      const token = getTokenFromRequest(request);
      
      if (!token) {
        return NextResponse.json(
          { error: '인증 토큰이 필요합니다.' },
          { status: 401 }
        );
      }

      const decoded = verifyToken(token);
      
      if (!decoded) {
        return NextResponse.json(
          { error: '유효하지 않은 토큰입니다.' },
          { status: 401 }
        );
      }

      // 역할 권한 확인
      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return NextResponse.json(
          { error: '접근 권한이 없습니다.' },
          { status: 403 }
        );
      }

      // request에 사용자 정보 추가
      request.user = decoded;
      
      return handler(request, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: '인증 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  };
};

export const requireAuth = (allowedRoles = []) => {
  return (handler) => authMiddleware(handler, allowedRoles);
};
