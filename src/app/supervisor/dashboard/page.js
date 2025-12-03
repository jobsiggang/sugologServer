'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
export default function SupervisorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('companies');
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [formData, setFormData] = useState({
    companyName: '',
    companyDescription: '',
    adminUsername: '',
    adminPassword: '',
    adminName: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

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
    fetchCompanies();
  };

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/companies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setCompanies(data.companies);
      }
    } catch (error) {
      console.error('회사 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.companyName || !formData.adminUsername || !formData.adminPassword || !formData.adminName) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    if (formData.adminPassword.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert(`회사 "${data.company.name}"와 관리자 계정이 생성되었습니다.`);
        setShowAddForm(false);
        setFormData({
          companyName: '',
          companyDescription: '',
          adminUsername: '',
          adminPassword: '',
          adminName: ''
        });
        fetchCompanies();
      } else {
        alert(data.error || '회사 생성 실패');
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

  const handleEdit = (company) => {
    setEditingCompany(company);
    setEditFormData({
      name: company.name,
      description: company.description || '',
      isActive: company.isActive
    });
    setShowEditForm(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    if (!editFormData.name) {
      alert('회사명을 입력해주세요.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/companies/${editingCompany._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });

      const data = await response.json();
      if (data.success) {
        alert('회사 정보가 수정되었습니다.');
        setShowEditForm(false);
        setEditingCompany(null);
        fetchCompanies();
      } else {
        alert(data.error || '회사 수정 실패');
      }
    } catch (error) {
      console.error('회사 수정 오류:', error);
      alert('회사 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (company) => {
    if (!confirm(`"${company.name}" 회사를 삭제하시겠습니까?\n\n⚠️ 주의: 회사에 등록된 사용자가 있으면 삭제할 수 없습니다.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/companies/${company._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('회사가 삭제되었습니다.');
        fetchCompanies();
      } else {
        alert(data.error || '회사 삭제 실패');
      }
    } catch (error) {
      console.error('회사 삭제 오류:', error);
      alert('회사 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleToggleActive = async (company) => {
    const newStatus = !company.isActive;
    const statusText = newStatus ? '활성화' : '비활성화';

    if (!confirm(`"${company.name}" 회사를 ${statusText}하시겠습니까?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/companies/${company._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        alert(`회사가 ${statusText}되었습니다.`);
        fetchCompanies();
      } else {
        alert(data.error || '상태 변경 실패');
      }
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const toggleExpand = (companyId) => {
    if (expandedId === companyId) {
      setExpandedId(null);
    } else {
      setExpandedId(companyId);
      setShowEditForm(false);
      setEditingCompany(null);
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
      const response = await fetch('/api/supervisor/changePassword', {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h1 className="text-lg font-bold text-gray-800">슈퍼바이저 관리</h1>
            <p className="text-xs text-gray-500">{user?.name}님</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPasswordForm((v) => !v)}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              비밀번호 변경
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 가로 탭 메뉴 */}
        <div className="flex overflow-x-auto bg-white border-b">
          <button
            onClick={() => setActiveTab('companies')}
            className={`flex-shrink-0 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'companies'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            🏢 회사 관리
          </button>
        </div>
      </header>

      {showPasswordForm && (
        <div className="max-w-md mx-auto bg-white p-4 mt-6 rounded shadow border border-gray-100">
          <h3 className="text-sm font-bold mb-3 text-blue-600">비밀번호 변경</h3>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">기존 비밀번호</label>
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-600 bg-gray-50 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">새 비밀번호</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-600 bg-gray-50 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-600 bg-gray-50 text-xs"
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-1.5 rounded text-xs font-semibold hover:bg-blue-700 transition"
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
      <main className="p-4">
        {activeTab === 'companies' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">등록된 회사 목록</h2>
              <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            {showAddForm ? '취소' : '+ 회사 추가'}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <h3 className="text-lg font-semibold mb-4">새 회사 및 관리자 등록</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    회사명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="예: DL건설"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    회사 설명
                  </label>
                  <textarea
                    value={formData.companyDescription}
                    onChange={(e) => setFormData({ ...formData, companyDescription: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 도배, 타일 전문 회사"
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
                  회사 및 관리자 등록
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

        {showEditForm && editingCompany && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <h3 className="text-lg font-semibold mb-4">회사 정보 수정</h3>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  회사명 <span className="text-red-500">*</span>
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
                  회사 설명
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 도배, 타일 전문 회사"
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
                  비활성화하면 해당 회사의 사용자들이 로그인할 수 없습니다.
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
                    setEditingCompany(null);
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
          {companies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">등록된 회사가 없습니다.</p>
              <p className="text-sm text-gray-400 mt-2">위의 "회사 추가" 버튼을 눌러 새 회사를 등록하세요.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">회사명</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">관리자</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">설명</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {companies.map((company, index) => (
                    <tr 
                      key={company._id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        expandedId === company._id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                      <td 
                        onClick={() => toggleExpand(company._id)}
                        className="px-4 py-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{company.name}</span>
                          <span className={`w-2 h-2 rounded-full ${
                            expandedId === company._id ? 'bg-blue-600' : 'bg-gray-400'
                          }`}></span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {company.admin ? `${company.admin.name} (${company.admin.username})` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {company.description || '-'}
                      </td>
                     
                      <td className="px-4 py-3 text-center">
                        {company.isActive ? (
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
                        {expandedId === company._id ? (
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(company);
                              }}
                              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              title="수정"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleActive(company);
                              }}
                              className={`px-2 py-1 text-xs rounded ${
                                company.isActive
                                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                              title={company.isActive ? '비활성화' : '활성화'}
                            >
                              {company.isActive ? '🔒' : '🔓'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(company);
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
          <p>💡 <strong>회사명</strong>을 클릭하면 관리 버튼이 표시됩니다.</p>
        </div>
          </div>
        )}
      </main>
    </div>
  );
}
