"use client";
import ImageEditor from "@/components/ImageEditor";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";


export default function UploadPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuth = async () => {
    console.log('Upload page: checkAuth 시작');
    const token = localStorage.getItem('token');
    console.log('Upload page: token 존재?', !!token);
    
    if (!token) {
      console.warn("⚠️ 로그인 정보 없음 → 로그인 페이지로 이동");
      router.push("/login");
      return;
    }

    const userStr = localStorage.getItem('user');
    console.log('Upload page: user 존재?', !!userStr);
    
    if (!userStr) {
      console.warn("⚠️ 사용자 정보 없음 → 로그인 페이지로 이동");
      router.push("/login");
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      console.log('Upload page: 사용자 정보 파싱 성공', userData);
      setUser(userData);
    } catch (error) {
      console.error('Upload page: 사용자 정보 파싱 실패', error);
      router.push("/login");
    }
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
      </header>

      {/* 메인 컨텐츠 */}
      <main>
        <ImageEditor author={user.name} />
      </main>
    </div>
  );
}
