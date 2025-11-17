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
      <ImageEditor author={user.name} />
    </div>
  );
}
