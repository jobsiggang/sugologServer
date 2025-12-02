"use client";
// import ImageEditor from "@/components/ImageEditor";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      router.replace('/login');
      return;
    }
    try {
      const userData = JSON.parse(userStr);
      // 팀장과 직원만 접근 가능, 그 외는 모두 로그인 페이지로
      
      if ((userData.role === 'employee' || userData.role === 'team_admin') && userData.teamId) {
        setUser(userData);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.replace('/login');
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.replace('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">로딩 중...</div>
      </div>
    );
  }

  // 직원(팀 소속)만 이미지 에디터 사용 가능
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-2">
          <div>
            <h1 className="text-base font-bold text-gray-800">{user.teamName}</h1>
            <p className="text-xs text-gray-500">{user.name} ({user.username})</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            로그아웃
          </button>
        </div>
      </header>
      <main>
        {/* <ImageEditor author={user.name} userId={user._id} /> */}
        웹에서는 사진 업로드를 하지 않습니다. 앱에서 접속해 주세요
      </main>
    </div>
  );
}
