'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SupervisorEntry() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      // 로그인 안되어 있으면 슈퍼바이저 로그인 페이지로
      router.push('/supervisor/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      // 슈퍼바이저만 접근 가능
      if (user.role === 'supervisor') {
        router.push('/supervisor/dashboard');
      } else {
        // 다른 역할은 슈퍼바이저 로그인 페이지로
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/supervisor/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/supervisor/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="text-white text-xl">로딩 중...</div>
    </div>
  );
}
