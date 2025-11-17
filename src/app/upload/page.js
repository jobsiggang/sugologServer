"use client";
import ImageEditor from "@/components/ImageEditor";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";


export default function UploadPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [router]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn("⚠️ 로그인 정보 없음 → 로그인 페이지로 이동");
      router.push("/login");
      return;
    }

    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
      router.push("/login");
      return;
    }

    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const goToDashboard = () => {
    if (user.role === 'employee') {
      router.push('/employee');
    } else if (user.role === 'company_admin') {
      router.push('/company/dashboard');
    }
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-600">로그인 정보를 불러오는 중...</p>
    </div>
  );

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

        {/* 탭 메뉴 (직원만) */}
        {user.role === 'employee' && (
          <div className="flex border-t border-gray-200">
            <button
              className="flex-1 px-4 py-3 text-sm font-medium bg-blue-50 text-blue-700"
            >
              📸 사진 업로드
            </button>
            <button
              onClick={goToDashboard}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 border-l border-gray-200"
            >
              📋 업로드 내역
            </button>
          </div>
        )}
      </header>

      {/* 메인 컨텐츠 */}
      <main>
        <ImageEditor author={user.name} />
      </main>
    </div>
  );
}
