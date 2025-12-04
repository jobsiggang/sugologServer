'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

// API 경로 및 유틸리티는 외부에서 import된다고 가정합니다.
// import API from '../config/api'; 

export default function EmployeeLogin() {
    const router = useRouter();
    // 회사 및 팀 상태
    const [companyInput, setCompanyInput] = useState('');
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [teams, setTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState('');
    // 로그인 상태
    const [formData, setFormData] = useState({ username: '', password: '' });
    // UI 상태
    const [loading, setLoading] = useState(false);
    const [lookupError, setLookupError] = useState(null);


    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            router.replace('/company_team/dashboard');
        }
    }, [router]);

    // 회사명으로 회사 조회 및 팀 목록 불러오기
    const handleCompanyLookup = async (e) => {
        e.preventDefault();
        if (!companyInput) {
            toast.error('회사명을 입력해주세요.');
            return;
        }
        setLoading(true);
        setLookupError(null);
        try {
            const response = await fetch(`/api/companies/lookup?name=${encodeURIComponent(companyInput)}`);
            const data = await response.json();
            if (data.success && data.company) {
                setSelectedCompany(data.company);
                fetchTeams(data.company._id);
            } else {
                setLookupError('일치하는 회사명을 찾을 수 없습니다.');
                toast.error('회사 조회 실패');
            }
        } catch (error) {
            setLookupError('네트워크 오류가 발생했습니다.');
            toast.error('조회 중 오류 발생');
        } finally {
            setLoading(false);
        }
    };
    
    // 팀 목록 조회
    const fetchTeams = async (companyId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/companies/${companyId}/teams/list`);
            const data = await response.json();
            if (data.success) {
                setTeams(data.teams);
                if (data.teams.length > 0) setSelectedTeamId(data.teams[0]._id);
            } else {
                setTeams([]);
                toast.error('팀 목록 조회 실패');
            }
        } catch (error) {
            setTeams([]);
            toast.error('팀 목록 조회 중 오류 발생');
        } finally {
            setLoading(false);
        }
    };


    // 로그인 인증
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCompany || !selectedTeamId || !formData.username || !formData.password) {
            toast.error('모든 정보를 선택/입력해주세요.');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                    companyId: selectedCompany._id,
                    teamId: selectedTeamId,
                }),
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                toast.success("로그인 성공!");
                router.replace("/company_team/dashboard");
            } else {
                toast.error(data.message || "로그인 실패: 자격 증명을 확인하세요.");
            }
        } catch (error) {
            console.error("Login error:", error);
            toast.error("로그인 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 회사명 입력, 조회, 팀 선택, 로그인까지 한 화면에서 처리
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-200 to-green-400">
            <Toaster position="top-center" />
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">현장 기록 시스템</h1>
                    <p className="text-gray-500 mt-2">팀장 로그인</p>
                </div>
                <form
                    onSubmit={selectedCompany ? handleSubmit : handleCompanyLookup}
                    className="space-y-6"
                >
                    {/* 회사명 입력 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">회사 이름</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={companyInput}
                                onChange={(e) => setCompanyInput(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                                placeholder="정확한 회사명 입력"
                                disabled={loading || !!selectedCompany}
                                required
                            />
                            {selectedCompany && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedCompany(null);
                                        setTeams([]);
                                        setSelectedTeamId('');
                                        setFormData({ username: '', password: '' });
                                    }}
                                    className="text-xs px-3 py-2 bg-gray-200 rounded hover:bg-green-100 text-gray-600"
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
                            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? "회사 조회 중..." : "팀/로그인 입력"}
                        </button>
                    )}
                    {/* 회사 선택 후: 팀 선택 + 로그인 입력 */}
                    {selectedCompany && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">소속 팀</label>
                                <select
                                    value={selectedTeamId}
                                    onChange={(e) => setSelectedTeamId(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                                    disabled={loading || teams.length === 0}
                                    required
                                >
                                    <option value="" disabled>팀을 선택하세요</option>
                                    {teams.map((team) => (
                                        <option key={team._id} value={team._id}>{team.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">아이디</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                                    placeholder="팀장 아이디"
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                                    placeholder="비밀번호"
                                    disabled={loading}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !formData.username || !formData.password || !selectedTeamId}
                                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {loading ? "로그인 중..." : "로그인"}
                            </button>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}