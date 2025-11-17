"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ImageEditor from "@/components/ImageEditor";

export default function HomePage() {
  const router = useRouter();
  const [author, setAuthor] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 기존 로그인 정보 확인 및 역할 기반 동작
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const u = JSON.parse(userStr);
        setUser(u);
        console.log('기존 로그인 감지, 역할:', u.role);

        // 관리자(데스크톱)는 전용 대시보드로 이동
        if (u.role === 'supervisor') {
          router.push('/admin');
          return;
        } else if (u.role === 'company_admin') {
          router.push('/company/dashboard');
          return;
        }

        // 직원(employee)은 메인 페이지에서 업로드 UI를 사용하도록 그대로 둠
        // (따라서 추가 리다이렉트는 하지 않음)
      } catch (error) {
        console.error('기존 로그인 정보 파싱 실패:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    // 구 버전 호환성: authorName만 있는 경우
    const saved = localStorage.getItem("authorName");
    if (saved) setAuthor(saved);
  }, [router]);

  // 로그인으로 이동
  const handleLogin = () => router.push("/login");

  // 로그아웃
  const handleLogout = () => {
    localStorage.removeItem("authorName");
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthor("");
    setUser(null);
    router.push('/');
  };

  // 직원 사용자라면 메인에서 바로 업로드 UI를 보여줌 (모바일 우선)
  if (user && user.role === 'employee') {
    return (
      <div className="min-h-screen bg-gray-50">
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
        <main>
          <ImageEditor author={user.name} />
        </main>
      </div>
    );
  }

  // 기본 홈 (비로그인 또는 관리자 외의 사용자)
  return (
    <div style={{ padding: 30, fontFamily: "Pretendard, 돋움, sans-serif", maxWidth: 700, margin: "60px auto", background: '#f0f0f0', borderRadius: 16, textAlign: 'center', color: '#222' }}>
      <h1 style={{ fontSize: 'clamp(28px, 5vw, 38px)', marginBottom: 8, color: '#333', fontWeight: 800 }}>🏗️ 공정한 Works</h1>
      <p style={{ fontSize: 16, color: '#666', marginBottom: 30, fontWeight: 500, lineHeight: 1.6 }}>🏘️ 현장 사진 업로드와 기록 관리를 쉽고 빠르게!</p>

      {author ? (
        <>
          <div style={{ fontSize: 18, lineHeight: 1.5, marginBottom: 25, color: '#1c2874', fontWeight: 'bold' }}>{author}님, 안녕하세요!</div>
          <button onClick={() => router.push('/login')} style={{ width: '70%', padding: '10px 0', borderRadius: 10, backgroundColor: '#ffffff', color: '#111', border: '1px solid #bbb', fontWeight: 700, cursor: 'pointer', marginBottom: 14, fontSize: 15 }}>로그인</button>
        </>
      ) : (
        <button onClick={handleLogin} style={{ width: '70%', padding: '10px 0', borderRadius: 10, backgroundColor: '#ffffff', color: '#111', border: '1px solid #bbb', fontWeight: 700, cursor: 'pointer', marginBottom: 14, fontSize: 15 }}>로그인</button>
      )}
    </div>
  );
}
