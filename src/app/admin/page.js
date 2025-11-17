'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('employees');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 로컬스토리지에서 사용자 정보 가져오기
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    if (!['supervisor', 'company_admin'].includes(userData.role)) {
      alert('관리자 권한이 필요합니다.');
      router.push('/');
      return;
    }

    setUser(userData);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
              <p className="text-sm text-gray-500 mt-1">
                {user?.name} ({user?.role === 'supervisor' ? '슈퍼바이저' : '업체관리자'})
                {user?.companyName && ` - ${user.companyName}`}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('employees')}
              className={`${
                activeTab === 'employees'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              직원 관리
            </button>
            <button
              onClick={() => setActiveTab('sites')}
              className={`${
                activeTab === 'sites'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              현장 관리
            </button>
            <button
              onClick={() => setActiveTab('google')}
              className={`${
                activeTab === 'google'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Google 설정
            </button>
            <button
              onClick={() => setActiveTab('forms')}
              className={`${
                activeTab === 'forms'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              입력양식 관리
            </button>
            <button
              onClick={() => setActiveTab('keys')}
              className={`${
                activeTab === 'keys'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              유사키 관리
            </button>
          </nav>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="mt-6 pb-10">
          {activeTab === 'employees' && <EmployeeManagement user={user} />}
          {activeTab === 'sites' && <SiteManagement user={user} />}
          {activeTab === 'google' && <GoogleSettings user={user} />}
          {activeTab === 'forms' && <FormManagement user={user} />}
          {activeTab === 'keys' && <KeyMappingManagement user={user} />}
        </div>
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">직원 목록</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showAddForm ? '취소' : '직원 추가'}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="employee">직원</option>
                {user?.role === 'supervisor' && <option value="company_admin">업체관리자</option>}
              </select>
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              등록
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">사용자명</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">역할</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">업체</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((emp) => (
              <tr key={emp._id}>
                <td className="px-6 py-4 whitespace-nowrap">{emp.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{emp.username}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {emp.role === 'company_admin' ? '업체관리자' : '직원'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{emp.companyId?.name || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${emp.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {emp.isActive ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleDelete(emp._id)}
                    className="text-red-600 hover:text-red-900"
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

// 현장 관리 컴포넌트 (간략 버전)
function SiteManagement({ user }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">현장 관리</h2>
      <p className="text-gray-600">현장 관리 기능이 여기에 표시됩니다.</p>
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
      if (data.success) {
        setSettings(data.googleSettings);
        setFormData({
          webAppUrl: data.googleSettings.webAppUrl || '',
          spreadsheetId: data.googleSettings.spreadsheetId || '',
          driveFolderId: data.googleSettings.driveFolderId || ''
        });
      }
    } catch (error) {
      console.error('Google 설정 조회 실패:', error);
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
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Google Apps Script 설정</h2>
        
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
            <p className="text-xs text-gray-500 mt-1">
              Google Apps Script 배포 후 받은 웹앱 URL을 입력하세요
            </p>
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
              placeholder="1abc...xyz"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Google Sheets URL의 /d/ 다음 부분 (예: 1abc...xyz)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Drive 폴더 ID (선택사항)
            </label>
            <input
              type="text"
              value={formData.driveFolderId}
              onChange={(e) => setFormData({ ...formData, driveFolderId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="1def...uvw"
            />
            <p className="text-xs text-gray-500 mt-1">
              이미지가 저장될 Google Drive 폴더 ID (스크립트가 자동 생성하므로 선택사항)
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              설정 저장
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={!formData.webAppUrl || testing}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {testing ? '테스트 중...' : '연결 테스트'}
            </button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">📖 설정 가이드</h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>샘플 Google Sheets 템플릿을 복사하세요</li>
            <li>시트에서 확장 프로그램 &gt; Apps Script를 엽니다</li>
            <li>제공된 스크립트 코드를 붙여넣습니다</li>
            <li>배포 &gt; 새 배포 &gt; 웹 앱으로 배포</li>
            <li>액세스 권한을 "모든 사용자"로 설정</li>
            <li>배포 후 받은 웹앱 URL을 위에 입력</li>
          </ol>
          <a 
            href="/docs/google-setup-guide.md" 
            target="_blank"
            className="inline-block mt-3 text-blue-600 hover:underline"
          >
            자세한 설정 가이드 보기 →
          </a>
        </div>
      </div>
    </div>
  );
}

// 양식 관리 컴포넌트 (간략 버전)
function FormManagement({ user }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">입력양식 관리</h2>
      <p className="text-gray-600">입력양식 관리 기능이 여기에 표시됩니다.</p>
    </div>
  );
}

// 유사키 관리 컴포넌트 (간략 버전)
function KeyMappingManagement({ user }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">유사키 관리</h2>
      <p className="text-gray-600">유사키 관리 기능이 여기에 표시됩니다.</p>
    </div>
  );
}
