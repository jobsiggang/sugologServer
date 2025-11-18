'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminEntry() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      // 로그인 안되어 있으면 관리자 로그인 페이지로
      router.push('/admin/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      // 업체 관리자만 접근 가능
      if (user.role === 'company_admin') {
        router.push('/company/dashboard');
      } else {
        // 다른 역할은 관리자 로그인 페이지로
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/admin/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800">
      <div className="text-white text-xl">로딩 중...</div>
    </div>
  );
}
