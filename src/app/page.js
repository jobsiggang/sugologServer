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
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      // 로그인 안되어 있으면 직원 로그인 페이지로
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      // 직원만 접근 가능
      if (user.role === 'employee') {
        router.push('/upload');
      } else {
        // 다른 역할은 직원 로그인 페이지로
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-800">
      <div className="text-white text-xl">로딩 중...</div>
    </div>
  );
}
