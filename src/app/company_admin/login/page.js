"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function SupervisorLogin() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      (async () => {
        try {
          const statusRes = await fetch('/api/userStatus', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const statusData = await statusRes.json();
          if (!statusData.success || statusData.isActive === false) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            toast.error('비활성화된 계정입니다. 관리자에게 문의하세요.');
          } else {
            router.replace('/company_admin');
          }
        } catch (err) {
          toast.error('사용자 상태 확인 중 오류가 발생했습니다.');
        }
      })();
    }
  }, [router]);
  const [companyInput, setCompanyInput] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  // 회사명으로 회사 조회
  const handleCompanyLookup = async (e) => {
    e.preventDefault();
    if (!companyInput) {
      toast.error("회사명을 입력해주세요.");
      return;
    }
    setLoading(true);
    setLookupError(null);
    try {
      const response = await fetch(`/api/companies/lookup?name=${encodeURIComponent(companyInput)}`);
      const data = await response.json();
      if (data.success && data.company) {
        setSelectedCompany(data.company);
      } else {
        setLookupError("일치하는 회사명을 찾을 수 없습니다.");
        toast.error("회사 조회 실패");
      }
    } catch (error) {
      setLookupError("네트워크 오류가 발생했습니다.");
      toast.error("조회 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  // 로그인 인증
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompany || !formData.username || !formData.password) {
      toast.error("모든 정보를 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      // 1️⃣ 기존 세션 정보 강제 삭제 (다중 계정 충돌 방지)
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.clear();

      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          companyId: selectedCompany._id
        }),
      });
      const data = await response.json();
      if (data.success) {
        if (data.role !== 'company_admin') {
          toast.error("회사 관리자 계정만 로그인할 수 있습니다.");
          return;
        }
        // 2️⃣ 새 토큰 및 사용자 정보 저장
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast.success("로그인 성공!");
        router.replace("/company_admin");
      } else {
        toast.error(data.message || "로그인 실패");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
      <Toaster position="top-center" />
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">회사 관리자 로그인</h1>
          <p className="text-gray-500 mt-2">회사 관리자 전용</p>
        </div>
        <form onSubmit={selectedCompany ? handleSubmit : handleCompanyLookup} className="space-y-6">
          {/* 회사명 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">회사 이름</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="정확한 회사명 입력"
                disabled={loading || !!selectedCompany}
                required
              />
              {selectedCompany && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCompany(null);
                    setFormData({ username: "", password: "" });
                  }}
                  className="text-xs px-3 py-2 bg-gray-200 rounded hover:bg-blue-100 text-gray-600"
                >
                  변경
                </button>
              )}
            </div>
            {lookupError && <p className="mt-2 text-sm text-red-600">{lookupError}</p>}
          </div>
          {/* 회사 조회 버튼 (회사 선택 전) */}
          {!selectedCompany && (
            <button
              type="submit"
              disabled={loading || !companyInput}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "회사 조회 중..." : "로그인 입력"}
            </button>
          )}
          {/* 회사 선택 후: 로그인 입력 */}
          {selectedCompany && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">아이디</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="회사 관리자 아이디"
                  disabled={loading}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="비밀번호"
                  disabled={loading}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !formData.username || !formData.password}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </>
          )}
        </form>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            ⚠️ 이 페이지는 회사 관리자 전용입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
