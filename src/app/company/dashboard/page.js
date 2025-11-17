'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CompanyDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('google');

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
    if (!userData || userData.role !== 'company_admin') {
      alert('업체관리자만 접근 가능합니다.');
      router.push('/login');
      return;
    }

    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 세로 사이드바 메뉴 */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-800">업체 관리</h1>
          <p className="text-sm text-gray-600 mt-1">{user.name}님</p>
          <p className="text-xs text-gray-500">{user.companyId?.name || '업체명'}</p>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveTab('google')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'google'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            📱 Google 설정
          </button>

          <button
            onClick={() => setActiveTab('sites')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'sites'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            🏗️ 현장 관리
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'employees'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            👥 직원 관리
          </button>

          <button
            onClick={() => setActiveTab('forms')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'forms'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            📋 입력양식 관리
          </button>

          <button
            onClick={() => setActiveTab('keys')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'keys'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            🔑 유사키 관리
          </button>
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t bg-white">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 컨텐츠 영역 */}
      <main className="flex-1 p-8">
        {activeTab === 'google' && <GoogleSettings user={user} />}
        {activeTab === 'sites' && <SiteManagement user={user} />}
        {activeTab === 'employees' && <EmployeeManagement user={user} />}
        {activeTab === 'forms' && <FormManagement user={user} />}
        {activeTab === 'keys' && <KeyMappingManagement user={user} />}
      </main>
    </div>
  );
}

// Google 설정 컴포넌트
function GoogleSettings({ user }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [formData, setFormData] = useState({
    webAppUrl: '',
    spreadsheetId: '',
    driveFolderId: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/companies/${user.companyId}/google-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        setFormData({
          webAppUrl: data.settings.webAppUrl || '',
          spreadsheetId: data.settings.spreadsheetId || '',
          driveFolderId: data.settings.driveFolderId || ''
        });
      }
    } catch (error) {
      console.error('설정 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/companies/${user.companyId}/google-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert('Google 설정이 저장되었습니다.');
        fetchSettings();
      } else {
        alert(data.error || '저장 실패');
      }
    } catch (error) {
      alert('오류가 발생했습니다.');
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/companies/${user.companyId}/google-settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        alert(`연결 테스트 성공!\n조회된 데이터: ${data.data?.length || 0}건`);
      } else {
        alert('연결 테스트 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      alert('테스트 중 오류가 발생했습니다.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="text-center py-10">로딩 중...</div>;

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">Google Apps Script 설정</h2>

      {settings?.setupCompleted && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">✅ Google 설정이 완료되었습니다</p>
          <p className="text-sm text-green-600 mt-1">
            마지막 동기화: {settings.lastSync ? new Date(settings.lastSync).toLocaleString('ko-KR') : '없음'}
          </p>
        </div>
      )}

      {!settings?.setupCompleted && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 font-medium">⚠️ Google 설정이 필요합니다</p>
          <p className="text-sm text-yellow-600 mt-1">
            아래 설정을 완료해야 직원들이 사진을 업로드할 수 있습니다.
          </p>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Apps Script 웹앱 URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={formData.webAppUrl}
              onChange={(e) => setFormData({ ...formData, webAppUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://script.google.com/macros/s/..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Spreadsheet ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.spreadsheetId}
              onChange={(e) => setFormData({ ...formData, spreadsheetId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="스프레드시트 URL의 ID 부분"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Drive 폴더 ID
            </label>
            <input
              type="text"
              value={formData.driveFolderId}
              onChange={(e) => setFormData({ ...formData, driveFolderId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="드라이브 폴더 URL의 ID 부분 (선택사항)"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              설정 저장
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !formData.webAppUrl}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400"
            >
              {testing ? '테스트 중...' : '연결 테스트'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 현장 관리 컴포넌트 (엑셀 스타일)
function SiteManagement({ user }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSites(data.sites);
      }
    } catch (error) {
      console.error('현장 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    const newSite = {
      _id: 'new',
      siteName: '',
      projectName: '',
      workTypeCode: '',
      workTypeName: '',
      constructionStage: '시작전'
    };
    setSites([newSite, ...sites]);
    setEditingId('new');
    setEditData(newSite);
  };

  const handleEdit = (site) => {
    setEditingId(site._id);
    setEditData({ ...site });
  };

  const handleCancel = () => {
    if (editingId === 'new') {
      setSites(sites.filter(s => s._id !== 'new'));
    }
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const isNew = editingId === 'new';
      const url = isNew ? '/api/sites' : `/api/sites/${editingId}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      });

      const data = await response.json();
      if (data.success) {
        setEditingId(null);
        setEditData({});
        fetchSites();
      } else {
        alert(data.error || '저장 실패');
      }
    } catch (error) {
      alert('오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sites/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchSites();
      }
    } catch (error) {
      alert('삭제 실패');
    }
  };

  const handleCellChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  if (loading) return <div className="text-center py-10">로딩 중...</div>;

  return (
    <div className="max-w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">현장 관리</h2>
        <button
          onClick={handleAddRow}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + 행 추가
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r w-12">No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r min-w-[200px]">현장명</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r min-w-[200px]">프로젝트명</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r w-32">공종코드</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r w-32">공종명</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r w-32">공사단계</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-40">작업</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site, index) => (
              <tr key={site._id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 text-sm border-r text-gray-600">{index + 1}</td>
                
                <td className="px-2 py-2 border-r">
                  {editingId === site._id ? (
                    <input
                      type="text"
                      value={editData.siteName || ''}
                      onChange={(e) => handleCellChange('siteName', e.target.value)}
                      className="w-full px-2 py-1 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="현장명"
                    />
                  ) : (
                    <span className="text-sm">{site.siteName}</span>
                  )}
                </td>

                <td className="px-2 py-2 border-r">
                  {editingId === site._id ? (
                    <input
                      type="text"
                      value={editData.projectName || ''}
                      onChange={(e) => handleCellChange('projectName', e.target.value)}
                      className="w-full px-2 py-1 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="프로젝트명"
                    />
                  ) : (
                    <span className="text-sm">{site.projectName}</span>
                  )}
                </td>

                <td className="px-2 py-2 border-r">
                  {editingId === site._id ? (
                    <input
                      type="text"
                      value={editData.workTypeCode || ''}
                      onChange={(e) => handleCellChange('workTypeCode', e.target.value)}
                      className="w-full px-2 py-1 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="코드"
                    />
                  ) : (
                    <span className="text-sm">{site.workTypeCode}</span>
                  )}
                </td>

                <td className="px-2 py-2 border-r">
                  {editingId === site._id ? (
                    <input
                      type="text"
                      value={editData.workTypeName || ''}
                      onChange={(e) => handleCellChange('workTypeName', e.target.value)}
                      className="w-full px-2 py-1 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="공종명"
                    />
                  ) : (
                    <span className="text-sm">{site.workTypeName}</span>
                  )}
                </td>

                <td className="px-2 py-2 border-r">
                  {editingId === site._id ? (
                    <select
                      value={editData.constructionStage || '시작전'}
                      onChange={(e) => handleCellChange('constructionStage', e.target.value)}
                      className="w-full px-2 py-1 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="시작전">시작전</option>
                      <option value="진행중">진행중</option>
                      <option value="완료">완료</option>
                    </select>
                  ) : (
                    <span className={`text-sm px-2 py-1 rounded ${
                      site.constructionStage === '완료' ? 'bg-green-100 text-green-800' :
                      site.constructionStage === '진행중' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {site.constructionStage}
                    </span>
                  )}
                </td>

                <td className="px-2 py-2 text-center">
                  {editingId === site._id ? (
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={handleSave}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        저장
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-3 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => handleEdit(site)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(site._id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sites.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            등록된 현장이 없습니다. "행 추가" 버튼을 눌러 현장을 추가하세요.
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>💡 팁: 각 행을 더블클릭하거나 "수정" 버튼을 눌러 편집할 수 있습니다.</p>
        <p>💡 엑셀처럼 셀을 직접 수정한 후 "저장" 버튼을 눌러주세요.</p>
      </div>
    </div>
  );
}

// 직원 관리 컴포넌트
function EmployeeManagement({ user }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'employee'
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees);
      }
    } catch (error) {
      console.error('직원 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert('직원이 등록되었습니다.');
        setShowAddForm(false);
        setFormData({ username: '', password: '', name: '', role: 'employee' });
        fetchEmployees();
      } else {
        alert(data.error || '등록 실패');
      }
    } catch (error) {
      alert('오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('삭제되었습니다.');
        fetchEmployees();
      }
    } catch (error) {
      alert('삭제 실패');
    }
  };

  if (loading) return <div className="text-center py-10">로딩 중...</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">직원 관리</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showAddForm ? '취소' : '+ 직원 추가'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">새 직원 등록</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">사용자명</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              등록
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">이름</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">사용자명</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">역할</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {employees.map((emp) => (
              <tr key={emp._id}>
                <td className="px-6 py-4 text-sm">{emp.name}</td>
                <td className="px-6 py-4 text-sm">{emp.username}</td>
                <td className="px-6 py-4 text-sm">
                  {emp.role === 'employee' ? '직원' : '관리자'}
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => handleDelete(emp._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 입력양식 관리 컴포넌트
function FormManagement({ user }) {
  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">입력양식 관리</h2>
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-gray-500">입력양식 관리 기능은 준비 중입니다.</p>
      </div>
    </div>
  );
}

// 유사키 관리 컴포넌트
function KeyMappingManagement({ user }) {
  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">유사키 관리</h2>
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-gray-500">유사키 관리 기능은 준비 중입니다.</p>
      </div>
    </div>
  );
}