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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'supervisor') {
      alert('슈퍼바이저만 접근 가능합니다.');
      router.push('/login');
      return;
    }

    setUser(userData);
    fetchCompanies();
  };

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/supervisor/companies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setCompanies(data.companies);
      }
    } catch (error) {
      console.error('업체 목록 조회 실패:', error);
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
      const response = await fetch('/api/supervisor/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert(`업체 "${data.company.name}"와 관리자 계정이 생성되었습니다.`);
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
        alert(data.error || '업체 생성 실패');
      }
    } catch (error) {
      alert('오류가 발생했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
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
      alert('업체명을 입력해주세요.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/supervisor/companies/${editingCompany._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });

      const data = await response.json();
      if (data.success) {
        alert('업체 정보가 수정되었습니다.');
        setShowEditForm(false);
        setEditingCompany(null);
        fetchCompanies();
      } else {
        alert(data.error || '업체 수정 실패');
      }
    } catch (error) {
      console.error('업체 수정 오류:', error);
      alert('업체 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (company) => {
    if (!confirm(`"${company.name}" 업체를 삭제하시겠습니까?\n\n⚠️ 주의: 업체에 등록된 사용자가 있으면 삭제할 수 없습니다.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/supervisor/companies/${company._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('업체가 삭제되었습니다.');
        fetchCompanies();
      } else {
        alert(data.error || '업체 삭제 실패');
      }
    } catch (error) {
      console.error('업체 삭제 오류:', error);
      alert('업체 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleToggleActive = async (company) => {
    const newStatus = !company.isActive;
    const statusText = newStatus ? '활성화' : '비활성화';

    if (!confirm(`"${company.name}" 업체를 ${statusText}하시겠습니까?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/supervisor/companies/${company._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        alert(`업체가 ${statusText}되었습니다.`);
        fetchCompanies();
      } else {
        alert(data.error || '상태 변경 실패');
      }
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
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
            onClick={() => setActiveTab('companies')}
            className={`flex-shrink-0 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'companies'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            🏢 업체 관리
          </button>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="p-4">
        {activeTab === 'companies' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">등록된 업체 목록</h2>
              <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            {showAddForm ? '취소' : '+ 업체 추가'}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <h3 className="text-lg font-semibold mb-4">새 업체 및 관리자 등록</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업체명 <span className="text-red-500">*</span>
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
                    업체 설명
                  </label>
                  <textarea
                    value={formData.companyDescription}
                    onChange={(e) => setFormData({ ...formData, companyDescription: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 도배, 타일 전문 업체"
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
                  업체 및 관리자 등록
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
            <h3 className="text-lg font-semibold mb-4">업체 정보 수정</h3>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  업체명 <span className="text-red-500">*</span>
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
                  업체 설명
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 도배, 타일 전문 업체"
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
                  비활성화하면 해당 업체의 사용자들이 로그인할 수 없습니다.
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">등록된 업체가 없습니다.</p>
              <p className="text-sm text-gray-400 mt-2">위의 "업체 추가" 버튼을 눌러 새 업체를 등록하세요.</p>
            </div>
          ) : (
            companies.map((company) => (
              <div key={company._id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{company.name}</h3>
                    {!company.isActive && (
                      <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        비활성
                      </span>
                    )}
                  </div>
                  {company.googleSetupCompleted ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      설정완료
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      미설정
                    </span>
                  )}
                </div>

                {company.description && (
                  <p className="text-sm text-gray-600 mb-4">{company.description}</p>
                )}

                <div className="border-t pt-4 space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-20">관리자:</span>
                    <span className="font-medium">
                      {company.admin ? `${company.admin.name} (${company.admin.username})` : '없음'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-20">등록일:</span>
                    <span className="text-gray-700">
                      {new Date(company.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(company)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleToggleActive(company)}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg ${
                      company.isActive
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {company.isActive ? '비활성화' : '활성화'}
                  </button>
                  <button
                    onClick={() => handleDelete(company)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
          </div>
        )}
      </main>
    </div>
  );
}