'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CompanyAdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]); // 🏢 팀 목록 상태
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // 💡 [팀 수정 관련]
  const [editingTeam, setEditingTeam] = useState(null); // 수정할 팀 객체
  const [showEditForm, setShowEditForm] = useState(false); // 수정 폼 표시 여부
  const [expandedId, setExpandedId] = useState(null); // 상세 정보 확장된 팀 ID
    
  // 💡 [팀 생성 폼 데이터]
  const [formData, setFormData] = useState({
    name: '', // 팀명
    description: '',
    adminUsername: '', // 팀 책임자 정보
    adminPassword: '',
    adminName: ''
  });
    
  // 💡 [팀 수정 폼 데이터]
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });

  // 🔑 비밀번호 변경 관련 상태
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/company_admin/login');
      return;
    }

    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || (userData.role !== 'company_admin' ) || !userData.companyId) {
      alert('회사 관리자만 접근 가능합니다.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/company_admin/login');
      return;
    }

    setUser(userData);
    fetchTeams(userData.companyId, token); // 현재 회사의 ID를 전달
  };

  // 🟢 팀 목록 조회 함수
  const fetchTeams = async (companyId, token) => {
    try {
      if (!companyId || !token) return;
      setLoading(true);
      // API 경로: /api/companies/[companyId]/teams
      const response = await fetch(`/api/companies/${companyId}/teams`, { 
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setTeams(data.teams); // 🏢 teams 상태 업데이트
      } else {
        setTeams([]);
      }
    } catch (error) {
      console.error('팀 목록 조회 실패:', error);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 [수정] 팀 생성 함수
  const handleAddTeam = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.adminUsername || !formData.adminName || !formData.adminPassword) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    if (formData.adminPassword.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    // 중복 확인: 같은 회사에서 동일한 username이 있는지 확인
    try {
      const token = localStorage.getItem('token');
      const checkResponse = await fetch(`/api/companies/${user.companyId}/check-username?username=${encodeURIComponent(formData.adminUsername)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const checkData = await checkResponse.json();
      if (checkData.exists) {
        alert(`이미 사용 중인 ID입니다: ${formData.adminUsername}`);
        return;
      }
    } catch (error) {
      console.error('중복 확인 오류:', error);
      // 중복 확인 실패하면 계속 진행
    }

    try {
      const token = localStorage.getItem('token');
      // API 경로: /api/companies/[companyId]/teams (POST)
      const response = await fetch(`/api/companies/${user.companyId}/teams`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert(`팀 "${data.team.name}"와 책임자 계정이 생성되었습니다.`);
        setShowAddForm(false);
        setFormData({ name: '', description: '', adminUsername: '', adminPassword: '', adminName: '' });
        fetchTeams(user.companyId, token); // 목록 새로고침
      } else {
        alert(data.error || '팀 생성 실패');
      }
    } catch (error) {
      alert('오류가 발생했습니다.');
    }
  };  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/company_admin/login');
  };

  // 🟢 팀 수정 폼 초기화 및 표시
  const handleEdit = (team) => {
    setEditingTeam(team);
    setEditFormData({
      name: team.name,
      description: team.description || '',
      isActive: team.isActive
    });
    setShowEditForm(true);
    setShowAddForm(false); // 팀 추가 폼 숨기기
    setExpandedId(null); // 상세 정보 숨기기
  };

  // 🟢 [수정] 팀 수정 제출
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    if (!editFormData.name) {
      alert('팀명을 입력해주세요.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // API 경로: /api/companies/[companyId]/teams (PUT)
      const response = await fetch(`/api/companies/${user.companyId}/teams`, { 
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...editFormData, teamId: editingTeam._id }) // 팀 ID와 수정 데이터 전송
      });

      const data = await response.json();
      if (data.success) {
        alert('팀 정보가 수정되었습니다.');
        setShowEditForm(false);
        setEditingTeam(null);
        fetchTeams(user.companyId, token); // 목록 새로고침
      } else {
        alert(data.error || '팀 수정 실패');
      }
    } catch (error) {
      console.error('팀 수정 오류:', error);
      alert('팀 수정 중 오류가 발생했습니다.');
    }
  };

  // 🟢 팀 삭제
  const handleDelete = async (team) => {
    if (!confirm(`"${team.name}" 팀을 삭제하시겠습니까?\n\n⚠️ 주의: 팀에 등록된 사용자가 있으면 삭제할 수 없습니다.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // API 경로: /api/companies/[companyId]/teams (DELETE)
      const response = await fetch(`/api/companies/${user.companyId}/teams`, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ teamId: team._id }) // 팀 ID 전송
      });

      const data = await response.json();
      if (data.success) {
        alert('팀이 삭제되었습니다.');
        fetchTeams(user.companyId, token);
      } else {
        alert(data.error || '팀 삭제 실패');
      }
    } catch (error) {
      console.error('팀 삭제 오류:', error);
      alert('팀 삭제 중 오류가 발생했습니다.');
    }
  };

  // 🟢 팀 상태 토글
  const handleToggleActive = async (team) => {
    const newStatus = !team.isActive;
    const statusText = newStatus ? '활성화' : '비활성화';

    if (!confirm(`"${team.name}" 팀을 ${statusText}하시겠습니까?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // API 경로: /api/companies/[companyId]/teams (PUT)
      const response = await fetch(`/api/companies/${user.companyId}/teams`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: newStatus, teamId: team._id }) // 팀 ID와 상태 전송
      });

      const data = await response.json();
      if (data.success) {
        alert(`팀이 ${statusText}되었습니다.`);
        fetchTeams(user.companyId, token);
      } else {
        alert(data.error || '상태 변경 실패');
      }
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 🟢 상세 정보 토글
  const toggleExpand = (teamId) => {
    if (expandedId === teamId) {
      setExpandedId(null);
      setEditingTeam(null); // 숨길 때 수정 상태도 해제
    } else {
      setExpandedId(teamId);
      // 🚨 teams 배열에서 해당 팀 정보를 찾아 currentTeam에 할당
      setEditingTeam(teams.find(t => t._id === teamId)); 
      setShowEditForm(false); // 수정 폼 닫기
      setShowAddForm(false); // 추가 폼 닫기
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('모든 항목을 입력하세요.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert('새 비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('새 비밀번호와 확인이 일치하지 않습니다.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/company_admin/changePassword', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword })
      });
      const data = await response.json();
      if (data.success) {
        alert('비밀번호가 변경되었습니다. 다시 로그인 해주세요.');
        handleLogout();
      } else {
        alert(data.error || '비밀번호 변경 실패');
      }
    } catch (error) {
      alert('비밀번호 변경 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">로딩 중...</div>
      </div>
    );
  }
    
  // 🟢 현재 확장된 팀 객체 (상세 정보 렌더링 및 수정 폼에 사용)
  const currentTeam = teams.find(t => t._id === expandedId);


  return (
  <div className="min-h-screen bg-[#f8fafb]">
      {/* 상단 헤더 */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-[#03c75a]/10 text-[#03c75a] text-base font-bold mr-1">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="6" fill="#03c75a" opacity=".12"/><path d="M8 16V8h2.5l3.5 5.5V8H16v8h-2.5l-3.5-5.5V16H8z" fill="#03c75a"/></svg>
            </span>
            <div>
              <h1 className="text-base font-bold text-gray-900 tracking-tight">
                {user?.companyName ? `${user.companyName} 팀 관리` : '팀 관리 대시보드'}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">{user?.name} 관리자</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPasswordForm((v) => !v)}
              className="px-2 py-1 text-xs font-medium bg-gray-200 border border-gray-300 rounded hover:bg-gray-300 text-gray-700 transition"
            >
              비밀번호 변경
            </button>
            <button
              onClick={handleLogout}
              className="px-2 py-1 text-xs font-medium bg-white border border-gray-300 rounded hover:bg-gray-100 text-gray-700 transition"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {showPasswordForm && (
  <div className="max-w-md mx-auto bg-white p-4 mt-6 rounded shadow border border-gray-100">
    <h3 className="text-sm font-bold mb-3 text-[#03c75a]">비밀번호 변경</h3>
    <form onSubmit={handlePasswordChange} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">기존 비밀번호</label>
        <input
          type="password"
          value={passwordForm.oldPassword}
          onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#03c75a] bg-gray-50 text-xs"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">새 비밀번호</label>
        <input
          type="password"
          value={passwordForm.newPassword}
          onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#03c75a] bg-gray-50 text-xs"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
        <input
          type="password"
          value={passwordForm.confirmPassword}
          onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#03c75a] bg-gray-50 text-xs"
          required
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 bg-[#03c75a] text-white py-1.5 rounded text-xs font-semibold hover:bg-[#02b152] transition"
        >
          변경
        </button>
        <button
          type="button"
          onClick={() => setShowPasswordForm(false)}
          className="flex-1 bg-gray-200 text-gray-700 py-1.5 rounded text-xs font-semibold hover:bg-gray-300 transition"
        >
          취소
        </button>
      </div>
    </form>
  </div>
)}

      {/* 메인 컨텐츠 */}
  <main className="max-w-3xl mx-auto p-3">
     
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-gray-800">소속 팀 목록</h2>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowEditForm(false);
              setExpandedId(null);
            }}
            className="px-3 py-1 bg-[#03c75a] text-white rounded text-xs font-semibold hover:bg-[#02b152] transition"
          >
            {showAddForm ? '취소' : '+ 팀 추가'}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white p-4 rounded shadow border border-gray-100 mb-4">
            <h3 className="text-sm font-bold mb-3 text-[#03c75a]">새 팀 및 책임자 등록</h3>
            <form onSubmit={handleAddTeam} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">팀명 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#03c75a] bg-gray-50 text-xs"
                    placeholder="예: 도배팀"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#03c75a] bg-gray-50 text-xs"
                    placeholder="예: 2공구 담당 팀"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">책임자 아이디 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.adminUsername}
                    onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#03c75a] bg-gray-50 text-xs"
                    placeholder="로그인 ID"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">책임자 이름 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#03c75a] bg-gray-50 text-xs"
                    placeholder="예: 김팀장"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">책임자 비밀번호 <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-[#03c75a] bg-gray-50 text-xs"
                    placeholder="최소 6자 이상"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#03c75a] text-white py-1.5 rounded text-xs font-semibold hover:bg-[#02b152] transition"
                >
                  팀 등록
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-1.5 rounded text-xs font-semibold hover:bg-gray-300 transition"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {showEditForm && editingTeam && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <h3 className="text-lg font-semibold mb-4">팀 정보 수정: {editingTeam.name}</h3>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  팀명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 타일팀"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 2공구 담당 팀"
                  rows={3}
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editFormData.isActive}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">활성 상태</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  비활성화하면 해당 팀의 사용자들(직원 및 관리자)이 로그인할 수 없습니다.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium"
                >
                  수정 완료
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingTeam(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 font-medium"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {teams.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">등록된 팀이 없습니다.</p>
              <p className="text-sm text-gray-400 mt-2">위의 "+ 팀 추가" 버튼을 눌러 새 팀을 등록하세요.</p>
            </div>
          ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">팀명</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">설명</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">팀장</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">상태</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {teams.map((team, index) => (
                        <tr
                          key={team._id}
                          className={`hover:bg-gray-50 transition-colors ${expandedId === team._id ? 'bg-blue-50' : ''}`}
                        >
                          <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                          <td
                            onClick={() => toggleExpand(team._id)}
                            className="px-4 py-3 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{team.name}</span>
                              <span className={`w-2 h-2 rounded-full ${expandedId === team._id ? 'bg-blue-600' : 'bg-gray-400'}`}></span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{team.description || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{team.admin ? `${team.admin.name} (${team.admin.username})` : '-'}</td>
                          <td className="px-4 py-3 text-center">
                            {team.isActive ? (
                              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">활성</span>
                            ) : (
                              <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">비활성</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {expandedId === team._id ? (
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(team);
                                  }}
                                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                  title="수정"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleActive(team);
                                  }}
                                  className={`px-2 py-1 text-xs rounded ${team.isActive ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                  title={team.isActive ? '비활성화' : '활성화'}
                                >
                                  {team.isActive ? '🔒' : '🔓'}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(team);
                                  }}
                                  className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                  title="삭제"
                                >
                                  🗑️
                                </button>
                              </div>
                            ) : (
                              <div className="text-center text-gray-400 text-xs">클릭</div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded">
          <p>💡 <strong>팀명</strong>을 클릭하면 관리 버튼이 표시됩니다.</p>
        </div>
      </main>
    </div>
  );
}