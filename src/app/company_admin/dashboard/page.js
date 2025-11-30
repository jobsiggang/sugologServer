'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SupervisorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('teams');
  const [teams, setteams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingteam, setEditingteam] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [formData, setFormData] = useState({
    teamName: '',
    teamDescription: '',
    adminUsername: '',
    adminPassword: '',
    adminName: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/supervisor/login');
      return;
    }

    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'supervisor') {
      alert('슈퍼바이저만 접근 가능합니다.');
      router.push('/supervisor/login');
      return;
    }

    setUser(userData);
    fetchteams();
  };

  const fetchteams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/supervisor/teams', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setteams(data.teams);
      }
    } catch (error) {
      console.error('팀 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.teamName || !formData.adminUsername || !formData.adminPassword || !formData.adminName) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    if (formData.adminPassword.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/supervisor/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert(`팀 "${data.team.name}"와 관리자 계정이 생성되었습니다.`);
        setShowAddForm(false);
        setFormData({
          teamName: '',
          teamDescription: '',
          adminUsername: '',
          adminPassword: '',
          adminName: ''
        });
        fetchteams();
      } else {
        alert(data.error || '팀 생성 실패');
      }
    } catch (error) {
      alert('오류가 발생했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/supervisor/login');
  };

  const handleEdit = (team) => {
    setEditingteam(team);
    setEditFormData({
      name: team.name,
      description: team.description || '',
      isActive: team.isActive
    });
    setShowEditForm(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    if (!editFormData.name) {
      alert('팀명을 입력해주세요.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/supervisor/teams/${editingteam._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });

      const data = await response.json();
      if (data.success) {
        alert('팀 정보가 수정되었습니다.');
        setShowEditForm(false);
        setEditingteam(null);
        fetchteams();
      } else {
        alert(data.error || '팀 수정 실패');
      }
    } catch (error) {
      console.error('팀 수정 오류:', error);
      alert('팀 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (team) => {
    if (!confirm(`"${team.name}" 팀을 삭제하시겠습니까?\n\n⚠️ 주의: 팀에 등록된 사용자가 있으면 삭제할 수 없습니다.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/supervisor/companies/${companies._id}/teams/${team._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('팀이 삭제되었습니다.');
        fetchteams();
      } else {
        alert(data.error || '팀 삭제 실패');
      }
    } catch (error) {
      console.error('팀 삭제 오류:', error);
      alert('팀 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleToggleActive = async (team) => {
    const newStatus = !team.isActive;
    const statusText = newStatus ? '활성화' : '비활성화';

    if (!confirm(`"${team.name}" 팀을 ${statusText}하시겠습니까?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/supervisor/companies/${companies._id}/teams/${team._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        alert(`팀가 ${statusText}되었습니다.`);
        fetchteams();
      } else {
        alert(data.error || '상태 변경 실패');
      }
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const toggleExpand = (teamId) => {
    if (expandedId === teamId) {
      setExpandedId(null);
    } else {
      setExpandedId(teamId);
      setShowEditForm(false);
      setEditingteam(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h1 className="text-lg font-bold text-gray-800">슈퍼바이저 관리</h1>
            <p className="text-xs text-gray-500">{user?.name}님</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            로그아웃
          </button>
        </div>

        {/* 가로 탭 메뉴 */}
        <div className="flex overflow-x-auto bg-white border-b">
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex-shrink-0 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'teams'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            🏢 팀 관리
          </button>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="p-4">
        {activeTab === 'teams' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">등록된 팀 목록</h2>
              <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            {showAddForm ? '취소' : '+ 팀 추가'}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <h3 className="text-lg font-semibold mb-4">새 팀 및 관리자 등록</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    팀명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="예: DL건설"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    팀 설명
                  </label>
                  <textarea
                    value={formData.teamDescription}
                    onChange={(e) => setFormData({ ...formData, teamDescription: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 도배, 타일 전문 팀"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    관리자 사용자명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.adminUsername}
                    onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="로그인 ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    관리자 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 김관리"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    관리자 비밀번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="최소 6자 이상"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  팀 및 관리자 등록
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 font-medium"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {showEditForm && editingteam && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <h3 className="text-lg font-semibold mb-4">팀 정보 수정</h3>
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
                  placeholder="예: DL건설"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  팀 설명
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 도배, 타일 전문 팀"
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
                  비활성화하면 해당 팀의 사용자들이 로그인할 수 없습니다.
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
                    setEditingteam(null);
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
              <p className="text-sm text-gray-400 mt-2">위의 "팀 추가" 버튼을 눌러 새 팀을 등록하세요.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">업체명</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">관리자</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">설명</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Google</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {teams.map((team, index) => (
                    <tr 
                      key={team._id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        expandedId === team._id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                      <td 
                        onClick={() => toggleExpand(team._id)}
                        className="px-4 py-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{team.name}</span>
                          <span className={`w-2 h-2 rounded-full ${
                            expandedId === team._id ? 'bg-blue-600' : 'bg-gray-400'
                          }`}></span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {team.admin ? `${team.admin.name} (${team.admin.username})` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {team.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {team.googleSetupCompleted ? (
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            완료
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            미설정
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {team.isActive ? (
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            활성
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            비활성
                          </span>
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
                              className={`px-2 py-1 text-xs rounded ${
                                team.isActive
                                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
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
                          <div className="text-center text-gray-400 text-xs">
                            클릭
                          </div>
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
          </div>
        )}
      </main>
    </div>
  );
}
