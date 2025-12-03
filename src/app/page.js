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

  // 달개비꽃을 연상하는 랜딩페이지: 앱 소개 + 관리자 진입 버튼만
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#b3c6f7] via-[#e3e6fa] to-[#c9b7e7]">
      <div className="flex flex-col items-center p-8 rounded-3xl shadow-xl bg-white/80 max-w-md w-full border border-[#b3c6f7]">
        {/* 달개비꽃 심볼 */}
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4">
          <circle cx="40" cy="40" r="36" fill="#b3c6f7" />
          <ellipse cx="40" cy="32" rx="18" ry="24" fill="#c9b7e7" />
          <ellipse cx="40" cy="48" rx="14" ry="18" fill="#e3e6fa" />
          <circle cx="40" cy="40" r="8" fill="#7b6fd6" />
        </svg>
        <h1 className="text-3xl font-extrabold text-[#7b6fd6] mb-2 tracking-tight">달개비</h1>
        <p className="text-base text-[#5a5a7a] mb-6 font-medium">현장 사진을 쉽고 안전하게 관리하는<br/>스마트 현장관리 플랫폼</p>
        <div className="flex flex-col gap-3 w-full">
          <button
            className="w-full px-4 py-3 bg-[#7b6fd6] text-white rounded-xl hover:bg-[#5a5a7a] text-base font-semibold shadow"
            onClick={() => router.replace('/company_admin/login')}
          >
            회사 관리자 로그인
          </button>
          <button
            className="w-full px-4 py-3 bg-[#b3c6f7] text-[#4a4a7a] rounded-xl hover:bg-[#a1b0e6] text-base font-semibold shadow"
            onClick={() => router.replace('/company_team/login')}
          >
            팀장 관리자 로그인
          </button>
        </div>
      </div>
      <div className="mt-8 text-xs text-[#7b6fd6] opacity-70">© {new Date().getFullYear()} 달개비. All rights reserved.</div>
    </div>
  );
  );
}
