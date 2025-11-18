"use client";
import ImageEditor from "@/components/ImageEditor";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

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
      const userData = JSON.parse(userStr);
      console.log('Home page: 사용자 역할:', userData.role);
      
      // 직원만 접근 가능
      if (userData.role === 'employee') {
        console.log('Home page: 직원 확인 → 업로드 페이지 표시');
        setUser(userData);
      } else {
        // 다른 역할은 각자의 페이지로
        console.log('Home page: 직원 아님 → 해당 페이지로 이동');
        if (userData.role === 'company_admin') {
          router.push('/admin');
        } else if (userData.role === 'supervisor') {
          router.push('/supervisor');
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Home page: Auth check error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // 로딩 중
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-800">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    );
  }

  // 직원 업로드 페이지
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-gray-800">{user.companyName}</h1>
            <p className="text-xs text-gray-500">{user.name} ({user.username})</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main>
        <ImageEditor author={user.name} />
      </main>
    </div>
  );
}
