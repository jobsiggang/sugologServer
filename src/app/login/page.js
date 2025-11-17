"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showSetupLink, setShowSetupLink] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);

  useEffect(() => {
    checkSupervisor();
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies/list');
      const data = await response.json();
      if (data.success) {
        setCompanies(data.companies);
      }
    } catch (error) {
      console.error('Companies fetch error:', error);
    }
  };

  const checkSupervisor = async () => {
    try {
      const response = await fetch('/api/admin/setup');
      
      if (!response.ok) {
        console.error('Setup API error:', response.status, response.statusText);
        return;
      }
      
      const data = await response.json();
      console.log('Setup check response:', data);
      
      if (data.needsSetup === true) {
        console.log('Showing setup link');
        setShowSetupLink(true);
      }
    } catch (error) {
      console.error('Supervisor check error:', error);
      // 에러가 발생해도 설정 링크를 보여줌 (안전장치)
      setShowSetupLink(true);
    }
  };

  const handleLogin = async () => {
    setError("");

    // 슈퍼바이저가 아닌 경우 회사 선택 필수
    if (!isSupervisor && !selectedCompany) {
      setError("회사를 선택해주세요.");
      return;
    }

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        username, 
        password,
        companyId: isSupervisor ? null : selectedCompany
      }),
    });

    const data = await res.json();

    if (data.success) {
      // 토큰과 사용자 정보 저장
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("authorName", username);
      localStorage.setItem("userRole", data.role);
      
      // 역할에 따라 리다이렉트
      if (data.role === 'supervisor') {
        router.push("/admin");
      } else if (data.role === 'company_admin') {
        router.push("/company/dashboard");
      } else {
        router.push("/upload");
      }
    } else {
      setError(data.message || "로그인 실패");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8f9fa",
        fontFamily: "Pretendard, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            marginBottom: "12px",
            color: "#222",
          }}
        >
          로그인
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: "#555",
            textAlign: "center",
            lineHeight: 1.5,
            marginBottom: "24px",
          }}
        >
          시스템 사용을 위해 로그인 후
          <br />
          사진 업로드페이지로 이동하세요.
        </p>

        {/* 슈퍼바이저 체크박스 */}
        <div style={{ width: "100%", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            id="isSupervisor"
            checked={isSupervisor}
            onChange={(e) => setIsSupervisor(e.target.checked)}
            style={{ width: "18px", height: "18px", cursor: "pointer" }}
          />
          <label htmlFor="isSupervisor" style={{ fontSize: "14px", color: "#555", cursor: "pointer" }}>
            슈퍼바이저 로그인
          </label>
        </div>

        {/* 회사 선택 (슈퍼바이저가 아닐 때만) */}
        {!isSupervisor && (
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              fontSize: "15px",
              marginBottom: "12px",
              outline: "none",
              color: "#000",
              fontWeight: "bold",
              backgroundColor: "#fff"
            }}
          >
            <option value="">회사를 선택하세요</option>
            {companies.map((company) => (
              <option key={company._id} value={company._id}>
                {company.name}
              </option>
            ))}
          </select>
        )}

        <input
          type="text"
          placeholder="사용자명"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid #ddd",
            fontSize: "15px",
            marginBottom: "12px",
            outline: "none",
            color : "#000",
            fontWeight : "bold"
          }}
        />

        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid #ddd",
            fontSize: "15px",
            marginBottom: "12px",
            outline: "none",
               color : "#000",
            fontWeight : "bold"
          }}
        />

        {error && (
          <p style={{ color: "#e63946", fontSize: "14px", marginBottom: "10px" }}>
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #007bff, #3399ff)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "10px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.15)")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.boxShadow = "0 3px 6px rgba(0,0,0,0.1)")
          }
        >
          로그인
        </button>

        {showSetupLink && (
          <div style={{ 
            marginTop: "20px", 
            textAlign: "center",
            padding: "15px",
            background: "linear-gradient(135deg, #ff6b6b, #ff8787)",
            borderRadius: "10px",
            border: "2px solid #ff5252"
          }}>
            <p style={{ 
              color: "#fff", 
              fontSize: "14px", 
              marginBottom: "10px",
              fontWeight: 500
            }}>
              관리자가 설정되지 않았습니다.
            </p>
            <a
              href="/admin/setup"
              style={{
                display: "inline-block",
                background: "#fff",
                color: "#ff5252",
                padding: "8px 20px",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 600,
                transition: "all 0.2s",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#fff9f9";
                e.currentTarget.style.boxShadow = "0 3px 8px rgba(0,0,0,0.15)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
              }}
            >
              🔧 관리자 초기 설정하기
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
