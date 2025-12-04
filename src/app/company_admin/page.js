// src/app/company_admin/page.js
//나중에 회사 선택 페이지 필요
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
      // 로그인 안되어 있으면 회사 관리자 로그인 페이지로
      router.push('/company_admin/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      // 회사관리자만 접근 가능
      if (user.role === 'company_admin') {
        router.push('/company_admin/dashboard');
      } else {
        // 다른 역할은 회사 관리자 로그인 페이지로
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
      }
        
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="text-white text-xl">로딩 중...</div>
    </div>
  );
}
