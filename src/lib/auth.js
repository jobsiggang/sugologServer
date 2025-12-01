import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const generateToken = (userId, role, companyId = null, teamId = null) => {
  return jwt.sign(
    { userId, role, companyId, teamId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const getTokenFromRequest = (request) => {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 쿠키에서도 토큰 확인
  const cookies = request.headers.get('cookie');
  if (cookies) {
    const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
  }
  
  return null;
};
