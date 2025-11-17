"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(localStorage.getItem("user"));
    setUser(userData);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (!user) return <div className="p-4">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">설정</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4">사용자 정보</h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600">이름:</span>
              <span className="ml-2 font-medium">{user.name}</span>
            </div>
            <div>
              <span className="text-gray-600">사용자명:</span>
              <span className="ml-2 font-medium">{user.username}</span>
            </div>
            <div>
              <span className="text-gray-600">역할:</span>
              <span className="ml-2 font-medium">
                {user.role === "supervisor"
                  ? "슈퍼바이저"
                  : user.role === "company_admin"
                  ? "업체관리자"
                  : "직원"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">계정</h2>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
