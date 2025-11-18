"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log('Home page: checkAuth 시작');
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    console.log('Home page: token, user 존재?', !!token, !!userStr);

    if (!token || !userStr) {
      // 로그인 안되어 있으면 직원 로그인 페이지로
      console.log('Home page: 로그인 안됨 → /login');
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      console.log('Home page: 사용자 역할:', user.role);
      
      // 직원만 접근 가능
      if (user.role === 'employee') {
        console.log('Home page: 직원 → /upload');
        router.push('/upload');
      } else {
        // 다른 역할은 직원 로그인 페이지로
        console.log('Home page: 직원 아님 → 로그아웃 후 /login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      }
    } catch (error) {
      console.error('Home page: Auth check error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-800">
      <div className="text-white text-xl">로딩 중...</div>
    </div>
  );
}
