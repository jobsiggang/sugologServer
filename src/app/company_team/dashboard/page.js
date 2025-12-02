'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CompanyDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('employees');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/company_team/login');
      return;
    }

    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'team_admin') {
      alert('회사의 팀장만 접근 가능합니다.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/company_team/login');
      return;
    }

    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/company_team/login');
  };

  if (!user) {
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
            <h1 className="text-lg font-bold text-gray-800">{user.companyName}</h1>
            <p className="text-xs text-gray-500">{user.name} 관리자</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            로그아웃
          </button>
        </div>

        {/* 가로 탭 메뉴 */}
        <div className="flex overflow-x-auto bg-white">
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex-shrink-0 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'employees'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            👥 직원 관리
          </button>
          <button
            onClick={() => setActiveTab('forms')}
            className={`flex-shrink-0 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'forms'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            📋 입력양식 관리
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`flex-shrink-0 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'google'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            📱 Google 설정
          </button>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="p-4">
        {activeTab === 'google' && <GoogleSettings user={user} />}
        {activeTab === 'employees' && <EmployeeManagement user={user} />}
        {activeTab === 'forms' && <FormManagement user={user} />}
      </main>
    </div>
  );
}

// Google 설정 컴포넌트
function GoogleSettings({ user }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    webAppUrl: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/companies/${user.companyId}/teams/${user.teamId}/googlesettings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Google 설정 조회 응답:', data);
      
      if (data.success && data.googleSettings) {
        setSettings(data.googleSettings);
        setFormData({
          webAppUrl: data.googleSettings.webAppUrl || ''
        });
        // 설정이 없으면 자동으로 편집 모드
        if (!data.googleSettings.setupCompleted) {
          setEditing(true);
        }
      }
    } catch (error) {
      console.error('설정 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    console.log('Google 설정 저장 시도:', formData);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/companies/${user.companyId}/teams/${user.teamId}/googlesettings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('Google 설정 저장 응답:', data);
      
      if (data.success) {
        alert('Google 설정이 저장되었습니다.');
        setEditing(false);
        fetchSettings();
      } else {
        alert(data.error || '저장 실패');
      }
    } catch (error) {
      console.error('저장 중 오류:', error);
      alert('오류가 발생했습니다.');
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/companies/${user.companyId}/teams/${user.teamId}/googlesettings`, {
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

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      webAppUrl: settings?.webAppUrl || ''
    });
  };

  if (loading) return <div className="text-center py-10">로딩 중...</div>;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Google Apps Script 설정</h2>
        {settings?.setupCompleted && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            ✏️ 수정
          </button>
        )}
      </div>

      {settings?.setupCompleted && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">✅ Google 설정 완료</p>
          <p className="text-xs text-green-600 mt-1">
            마지막 동기화: {settings.lastSync ? new Date(settings.lastSync).toLocaleString('ko-KR') : '없음'}
          </p>
        </div>
      )}

      {!settings?.setupCompleted && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">⚠️ Google 설정 필요</p>
          <p className="text-xs text-yellow-600 mt-1">
            설정을 완료해야 사진 업로드가 가능합니다.
          </p>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow">
        {!editing && settings?.setupCompleted ? (
          // 조회 모드
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Apps Script 웹앱 URL
              </label>
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm break-all">
                {settings.webAppUrl || '(없음)'}
              </div>
            </div>

            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400"
            >
              {testing ? '테스트 중...' : '🔍 연결 테스트'}
            </button>
          </div>
        ) : (
          // 편집 모드
          <form onSubmit={handleUpdate} className="space-y-4">
            {/* 설정 안내 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                📚 Google Apps Script 설정 가이드
              </h3>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li>
                  <strong>템플릿 복사:</strong>{' '}
                  <a 
                    href="https://docs.google.com/spreadsheets/d/YOUR_TEMPLATE_ID/copy" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    구글 시트 템플릿
                  </a>
                  에서 "사본 만들기" 클릭
                </li>
                <li>
                  <strong>스크립트 열기:</strong> 확장 프로그램 → Apps Script 메뉴 클릭
                </li>
                <li>
                  <strong>배포:</strong> 상단 "배포" 버튼 → "새 배포" 클릭
                </li>
                <li>
                  <strong>설정:</strong> 유형 = "웹 앱", 액세스 = "모든 사용자"로 설정
                </li>
                <li>
                  <strong>URL 복사:</strong> 배포 후 생성된 웹 앱 URL을 아래에 붙여넣기
                </li>
              </ol>
              <div className="mt-3 pt-3 border-t border-blue-300">
                <p className="text-xs text-blue-700">
                  💡 <strong>참고:</strong> 시트 ID나 폴더 ID는 입력할 필요 없습니다. 
                  Apps Script가 자동으로 연결된 시트를 사용하고 "공정한웍스" 폴더를 생성합니다.
                </p>
              </div>
            </div>

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
                Apps Script 배포 후 받은 웹 앱 URL 전체를 붙여넣으세요
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                💾 설정 저장
              </button>
              {settings?.setupCompleted && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-gray-400 text-white py-3 rounded-lg hover:bg-gray-500 font-medium"
                >
                  ✖️ 취소
                </button>
              )}
            </div>

            {formData.webAppUrl && (
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400 mt-2"
              >
                {testing ? '테스트 중...' : '🔍 연결 테스트'}
              </button>
            )}
          </form>
        )}
      </div>

      {/* 설정 가이드 */}
      <div className="mt-6 space-y-4">
        {/* Google Sheets 템플릿 */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="text-sm font-bold text-purple-900 mb-2">📊 Google Sheets 템플릿</h3>
          <p className="text-xs text-purple-800 mb-3">
            아래 버튼을 클릭하여 Google Sheets 템플릿 사본을 만드세요. 이 시트는 업로드된 데이터를 자동으로 기록합니다.
          </p>
          <a
            href={process.env.NEXT_PUBLIC_GOOGLE_SHEETS_TEMPLATE_URL || 'https://docs.google.com/spreadsheets/d/12pF-9Y8c_CYw2GxzkIVn7Yyyyx3mmMGdpdVuL4M8N3k/copy'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full text-center bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 font-medium"
          >
            📄 Google Sheets 템플릿 사본 만들기
          </a>
        </div>

        {/* 설정 가이드 */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-bold text-blue-900 mb-2">📖 설정 가이드</h3>
          <ol className="text-xs text-blue-800 space-y-2 list-decimal list-inside">
            <li>
              <strong>Google Sheets 템플릿 사본 만들기</strong>
              <p className="ml-5 text-blue-700">위 버튼을 클릭하여 사본을 생성합니다</p>
            </li>

                <li>
              <strong>Apps Script 배포</strong>
              <p className="ml-5 text-blue-700">
                확장 프로그램 &gt; Apps Script &gt;
                배포 &gt; 새 배포 &gt; 웹 앱<br />
                실행 사용자: 나<br />
                액세스 권한: <span className="bg-yellow-200 px-1 rounded font-bold">모든 사용자</span> ⚠️
              </p>
            </li>
            <li>
              <strong>웹앱 URL 복사</strong>
              <p className="ml-5 text-blue-700">배포 완료 후 받은 웹앱 URL을 위 설정에 입력</p>
            </li>
            <li>
              <strong>설정 저장 및 테스트</strong>
              <p className="ml-5 text-blue-700">"설정 저장" 후 "연결 테스트"로 확인</p>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// 직원 관리 컴포넌트 (엑셀 스타일 + 업로드 데이터 조회)
function EmployeeManagement({ user }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [uploads, setUploads] = useState({});
  const [loadingUploads, setLoadingUploads] = useState({});

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/companies/${user.companyId}/teams/${user.teamId}/employees`, {
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

  const fetchUploads = async (employeeId) => {
    setLoadingUploads(prev => ({ ...prev, [employeeId]: true }));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/uploads?userId=${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUploads(prev => ({ ...prev, [employeeId]: data.uploads }));
      }
    } catch (error) {
      console.error('업로드 데이터 조회 실패:', error);
    } finally {
      setLoadingUploads(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  const handleAddRow = () => {
    const newEmployee = {
      _id: 'new',
      username: '',
      password: '',
      name: '',
      role: 'employee',
      isActive: true
    };
    setEmployees([newEmployee, ...employees]);
    setEditingId('new');
    setEditData(newEmployee);
    setExpandedId('new');
  };

  const handleEdit = (emp) => {
    setEditingId(emp._id);
    setEditData({ ...emp, password: '' });
  };

  const handleCancel = () => {
    if (editingId === 'new') {
      setEmployees(employees.filter(e => e._id !== 'new'));
      setExpandedId(null);
    }
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const isNew = editingId === 'new';
      const url = isNew ? `/api/companies/${user.companyId}/teams/${user.teamId}/employees` : `/api/companies/${user.companyId}/teams/${user.teamId}/employees/${editingId}`;
      const method = isNew ? 'POST' : 'PUT';

      const dataToSend = { ...editData };
      if (!isNew && !dataToSend.password) {
        delete dataToSend.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();
      if (data.success) {
        setEditingId(null);
        setEditData({});
        fetchEmployees();
      } else {
        alert(data.error || '저장 실패');
      }
    } catch (error) {
      alert('오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id, employee) => {
    // 활성화된 직원은 삭제 불가
    if (employee.isActive) {
      alert('활성화된 직원은 삭제할 수 없습니다. 먼저 비활성화해주세요.');
      return;
    }

    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/companies/${user.companyId}/teams/${user.teamId}/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchEmployees();
        setExpandedId(null);
      } else {
        alert(data.error || '삭제 실패');
      }
    } catch (error) {
      alert('삭제 실패');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    const action = currentStatus ? '비활성화' : '활성화';
    if (!confirm(`정말 ${action}하시겠습니까?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/companies/${user.companyId}/teams/${user.teamId}/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      const data = await response.json();
      if (data.success) {
        fetchEmployees();
      } else {
        alert(data.error || `${action} 실패`);
      }
    } catch (error) {
      alert(`${action} 실패`);
    }
  };

  const handleCellChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  const toggleExpand = (empId) => {
    if (expandedId === empId) {
      setExpandedId(null);
    } else {
      setExpandedId(empId);
      if (!uploads[empId] && empId !== 'new') {
        fetchUploads(empId);
      }
    }
  };

  if (loading) return <div className="text-center py-10">로딩 중...</div>;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">직원 관리</h2>
        <button
          onClick={handleAddRow}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + 추가
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {employees.map((emp, index) => (
          <div key={emp._id} className="border-b last:border-b-0">
            {/* 직원 정보 행 - 클릭으로 펼치기/접기 */}
            <div
              onClick={() => editingId !== emp._id && toggleExpand(emp._id)}
              className={`px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${
                expandedId === emp._id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-sm text-gray-500 w-8 flex-shrink-0">{index + 1}</span>
                <span className="text-sm font-medium truncate">{emp.name}</span>
                <span className="text-sm text-gray-600 truncate">({emp.username})</span>
                {!emp.isActive && (
                  <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                    비활성
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`w-2 h-2 rounded-full ${
                  expandedId === emp._id ? 'bg-blue-600' : 'bg-gray-400'
                }`}></span>
              </div>
            </div>

            {/* 펼쳐진 상세 정보 */}
            {expandedId === emp._id && (
              <div className="px-4 py-4 bg-gray-50 border-t">
                {editingId === emp._id ? (
                  // 편집 모드
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">이름</label>
                      <input
                        type="text"
                        value={editData.name || ''}
                        onChange={(e) => handleCellChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="홍길동"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">사용자ID</label>
                      <input
                        type="text"
                        value={editData.username || ''}
                        onChange={(e) => handleCellChange('username', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="worker01"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        비밀번호 {editingId !== 'new' && '(변경시만 입력)'}
                      </label>
                      <input
                        type="password"
                        value={editData.password || ''}
                        onChange={(e) => handleCellChange('password', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={editingId === 'new' ? '비밀번호' : '변경시만 입력'}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        💾 저장
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 px-4 py-2 bg-gray-400 text-white text-sm rounded hover:bg-gray-500"
                      >
                        ✖️ 취소
                      </button>
                    </div>
                  </div>
                ) : (
                  // 일반 보기 모드
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">성명:</span>
                        <span className="ml-2 font-medium">{emp.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">아이디:</span>
                        <span className="ml-2">{emp.username}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">역할:</span>
                        <span className="ml-2">{emp.role === 'employee' ? '직원' : '관리자'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">상태:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          emp.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {emp.isActive ? '활성' : '비활성'}
                        </span>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2 pt-2 border-t">
                      <button
                        onClick={() => handleEdit(emp)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        ✏️ 수정
                      </button>
                      <button
                        onClick={() => handleToggleActive(emp._id, emp.isActive)}
                        className={`flex-1 px-4 py-2 text-white text-sm rounded ${
                          emp.isActive 
                            ? 'bg-yellow-600 hover:bg-yellow-700' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {emp.isActive ? '⏸️ 비활성화' : '▶️ 활성화'}
                      </button>
                      <button
                        onClick={() => handleDelete(emp._id, emp)}
                        disabled={emp.isActive}
                        className={`flex-1 px-4 py-2 text-white text-sm rounded ${
                          emp.isActive
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                        title={emp.isActive ? '비활성화 후 삭제 가능' : '완전 삭제'}
                      >
                        🗑️ 삭제
                      </button>
                    </div>

                    {/* 전송기록 */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-semibold mb-2">📋 전송기록</h4>
                      {loadingUploads[emp._id] ? (
                        <div className="text-center py-4 text-sm text-gray-500">로딩 중...</div>
                      ) : !uploads[emp._id] || uploads[emp._id].length === 0 ? (
                        <div className="text-center py-4 text-sm text-gray-500">
                          업로드한 데이터가 없습니다.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {uploads[emp._id].map((upload, idx) => (
                            <div key={upload._id} className="p-3 bg-white rounded border text-xs">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <div className="font-medium">{upload.siteName} - {upload.formName}</div>
                                  <div className="text-gray-500 mt-1">
                                    {new Date(upload.createdAt).toLocaleString('ko-KR')}
                                  </div>
                                  <div className="text-blue-600 mt-1 font-medium">
                                    📷 이미지 {upload.imageCount || 0}개
                                  </div>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  upload.status === 'uploaded' ? 'bg-green-100 text-green-800' :
                                  upload.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {upload.status === 'uploaded' ? '완료' :
                                   upload.status === 'pending' ? '대기' : '실패'}
                                </span>
                              </div>
                              
                              {/* 썸네일 이미지 표시 */}
                              {upload.thumbnails && upload.thumbnails.length > 0 && (
                                <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
                                  {upload.thumbnails.map((thumb, thumbIdx) => (
                                    <img 
                                      key={thumbIdx}
                                      src={thumb}
                                      alt={`썸네일 ${thumbIdx + 1}`}
                                      className="w-12 h-12 object-cover rounded border border-gray-300"
                                    />
                                  ))}
                                </div>
                              )}
                              
                              <details className="cursor-pointer">
                                <summary className="text-blue-600 hover:text-blue-800">
                                  상세보기
                                </summary>
                                <div className="mt-2 p-2 bg-gray-50 rounded">
                                  {Object.entries(upload.data || {}).map(([key, value]) => (
                                    <div key={key} className="mb-1">
                                      <span className="font-medium">{key}:</span> {value}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>💡 직원 이름을 클릭하면 상세정보와 전송기록이 펼쳐집니다.</p>
      </div>
    </div>
  );
}

// 입력양식 관리 컴포넌트
function FormManagement({ user }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [fieldInput, setFieldInput] = useState('');
  const [optionInputs, setOptionInputs] = useState({});

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/companies/${user.companyId}/teams/${user.teamId}/forms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setForms(data.forms);
   
      }
    } catch (error) {
      console.error('입력양식 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    const newForm = {
      _id: 'new',
      formName: '',
      fields: [],
      fieldOptions: {},
      folderStructure: [],
      isActive: true
    };
    setForms([newForm, ...forms]);
    setEditingId('new');
    setEditData(newForm);
    setExpandedId('new');
  };

  const handleEdit = (form) => {
    setEditingId(form._id);
    // fieldOptions가 없으면 빈 객체로 초기화
    const fieldOptions = form.fieldOptions || {};
    setEditData({ 
      ...form,
      fields: Array.isArray(form.fields) ? form.fields : [],
      fieldOptions: fieldOptions,
      folderStructure: Array.isArray(form.folderStructure) ? form.folderStructure : []
    });
    setFieldInput('');
    setOptionInputs({});
  };

  const handleCancel = () => {
    if (editingId === 'new') {
      setForms(forms.filter(f => f._id !== 'new'));
      setExpandedId(null);
    }
    setEditingId(null);
    setEditData({});
    setFieldInput('');
    setOptionInputs({});
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const isNew = editingId === 'new';
      const url = isNew ? `/api/companies/${user.companyId}/teams/${user.teamId}/forms` : `/api/companies/${user.companyId}/teams/${user.teamId}/forms/${editingId}`;
      const method = isNew ? 'POST' : 'PUT';

      // fieldOptions를 명시적으로 복사 (프로토타입 체인 문제 해결)
      const payload = {
        ...editData,
        fieldOptions: editData.fieldOptions ? {...editData.fieldOptions} : {}
      };

      console.log('양식 저장 요청:', payload);
      console.log('📝 fieldOptions 전송:', JSON.stringify(payload.fieldOptions, null, 2));

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('양식 저장 응답:', data);
      console.log('📝 저장된 form.fieldOptions:', data.form?.fieldOptions);
      
      if (data.success) {
        setEditingId(null);
        setEditData({});
        fetchForms();
      } else {
        alert(data.error || data.details || '저장 실패');
        console.error('저장 실패:', data);
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('오류가 발생했습니다: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/companies/${user.companyId}/teams/${user.teamId}/forms/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchForms();
        setExpandedId(null);
      }
    } catch (error) {
      alert('삭제 실패');
    }
  };

  const handleCellChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  const handleAddField = () => {
    if (!fieldInput.trim()) return;
    // 콤마로 구분된 항목들을 { name } 객체 배열로 변환
    const newFields = fieldInput
      .split(',')
      .map(f => f.trim())
      .filter(f => f)
      .map(name => ({ name }));
    const currentFields = editData.fields || [];
    setEditData({
      ...editData,
      fields: [...currentFields, ...newFields]
    });
    setFieldInput('');
  };

  const handleRemoveField = (index) => {
    const newFields = [...editData.fields];
    const removedField = newFields[index];
    newFields.splice(index, 1);
    
    // 해당 필드의 옵션도 제거
    const newFieldOptions = { ...editData.fieldOptions };
    delete newFieldOptions[removedField];
    
    setEditData({
      ...editData,
      fields: newFields,
      fieldOptions: newFieldOptions
    });
  };

  const handleAddFieldOption = (fieldName) => {
    const optionValue = optionInputs[fieldName] || '';
    if (!optionValue.trim()) return;
    // 콤마로 구분된 옵션들을 배열로 변환
    const newOptions = optionValue.split(',').map(o => o.trim()).filter(o => o);
    const prev = editData.fieldOptions && editData.fieldOptions[fieldName];
    const prevType = (prev && prev.type) || 'text';
    const prevOptions = (prev && prev.options) || [];
    setEditData({
      ...editData,
      fieldOptions: {
        ...editData.fieldOptions,
        [fieldName]: {
          type: prevType,
          options: [...prevOptions, ...newOptions]
        }
      }
    });
    setOptionInputs({
      ...optionInputs,
      [fieldName]: ''
    });
  };

  const handleRemoveFieldOption = (fieldName, optionIndex) => {
    const prev = editData.fieldOptions && editData.fieldOptions[fieldName];
    const prevType = (prev && prev.type) || 'text';
    const prevOptions = (prev && prev.options) || [];
    const options = [...prevOptions];
    options.splice(optionIndex, 1);
    setEditData({
      ...editData,
      fieldOptions: {
        ...editData.fieldOptions,
        [fieldName]: {
          type: prevType,
          options
        }
      }
    });
  };

  const handleFieldsChange = (value) => {
    // 세미콜론으로 구분된 문자열을 배열로 변환 (레거시 지원)
    const fieldsArray = value.split(';').map(f => f.trim()).filter(f => f);
    setEditData({ ...editData, fields: fieldsArray });
  };

  const handleFieldOptionChange = (fieldName, value) => {
    // 세미콜론으로 구분된 문자열을 배열로 변환 (레거시 지원)
    const optionsArray = value.split(';').map(o => o.trim()).filter(o => o);
    setEditData({
      ...editData,
      fieldOptions: {
        ...editData.fieldOptions,
        [fieldName]: optionsArray
      }
    });
  };

  const handleAddFolderItem = () => {
    const folderStructure = editData.folderStructure || [];
    setEditData({
      ...editData,
      folderStructure: [...folderStructure, '']
    });
  };

  const handleFolderItemChange = (index, value) => {
    const folderStructure = [...(editData.folderStructure || [])];
    folderStructure[index] = value;
    setEditData({
      ...editData,
      folderStructure
    });
  };

  const handleRemoveFolderItem = (index) => {
    const folderStructure = [...(editData.folderStructure || [])];
    folderStructure.splice(index, 1);
    setEditData({
      ...editData,
      folderStructure
    });
  };

  const toggleExpand = (formId) => {
    if (expandedId === formId) {
      setExpandedId(null);
    } else {
      setExpandedId(formId);
    }
  };

  if (loading) return <div className="text-center py-10">로딩 중...</div>;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">입력양식 관리</h2>
        <button
          onClick={handleAddRow}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + 추가
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {forms.map((form, index) => (
          <div key={form._id} className="border-b last:border-b-0">
            <div
              onClick={() => editingId !== form._id && toggleExpand(form._id)}
              className={`px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${
                expandedId === form._id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-sm text-gray-500 w-8 flex-shrink-0">{index + 1}</span>
                <span className="text-sm font-medium truncate">{form.formName}</span>
                <span className="text-xs text-gray-500">
                  [{Array.isArray(form.fields) ? form.fields.map(f => f.name).join('; ') : ''}]
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`w-2 h-2 rounded-full ${
                  expandedId === form._id ? 'bg-blue-600' : 'bg-gray-400'
                }`}></span>
              </div>
            </div>

            {expandedId === form._id && (
              <div className="px-4 py-4 bg-gray-50 border-t">
                {editingId === form._id ? (
                  <div className="space-y-4">
                    {/* 1. 양식명 */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        1. 입력양식명
                      </label>
                      <input
                        type="text"
                        value={editData.formName || ''}
                        onChange={(e) => handleCellChange('formName', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="예: DL연간단가"
                      />
                    </div>

                    {/* 2. 항목명 추가 */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        2. 항목명 추가 (콤마로 구분하여 입력)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={fieldInput}
                          onChange={(e) => setFieldInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddField();
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="예: 현장명, 일자, 위치, 공종"
                        />
                        <button
                          type="button"
                          onClick={handleAddField}
                          className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 whitespace-nowrap"
                        >
                          완료
                        </button>
                      </div>
                      {Array.isArray(editData.fields) && editData.fields.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {editData.fields.map((field, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                            >
                              {field.name}
                              <button
                                type="button"
                                onClick={() => handleRemoveField(idx)}
                                className="text-blue-600 hover:text-blue-900 font-bold"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 3. 항목별 자동 목록 추가 */}
                    {Array.isArray(editData.fields) && editData.fields.length > 0 && (
                      <div className="border-t pt-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          3. 항목별 자동 목록 추가 (선택사항)
                        </label>
                        <div className="space-y-3">
                          {editData.fields.map((field, idx) => {
                            const fieldName = field.name;
                            const optionObj = editData.fieldOptions && editData.fieldOptions[fieldName];
                            const optionType = (optionObj && optionObj.type) || 'text';
                            const optionList = (optionObj && optionObj.options) || [];
                            return (
                              <div key={idx} className="bg-gray-50 p-3 rounded">
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                  {fieldName}
                                </label>
                                <div className="flex gap-2 mb-2 items-center">
                                  <input
                                    type="text"
                                    value={optionInputs[fieldName] || ''}
                                    onChange={(e) => setOptionInputs({
                                      ...optionInputs,
                                      [fieldName]: e.target.value
                                    })}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddFieldOption(fieldName);
                                      }
                                    }}
                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder={
                                      fieldName === '현장명' ? '예: 양주신도시, 옥정더퍼스트' :
                                      fieldName === '공종' ? '예: 타일, 목공, 철근' :
                                      '옵션을 콤마로 구분하여 입력'
                                    }
                                  />
                                  <select
                                    value={optionType}
                                    onChange={e => {
                                      setEditData({
                                        ...editData,
                                        fieldOptions: {
                                          ...editData.fieldOptions,
                                          [fieldName]: {
                                            type: e.target.value,
                                            options: optionList
                                          }
                                        }
                                      });
                                    }}
                                    className="px-2 py-1 text-xs border border-gray-300 rounded"
                                  >
                                    <option value="text">텍스트</option>
                                    <option value="date">날짜</option>
                                    <option value="number">숫자</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleAddFieldOption(fieldName)}
                                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 whitespace-nowrap"
                                  >
                                    + 추가
                                  </button>
                                </div>
                                {optionList.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {optionList.map((option, optIdx) => (
                                      <span
                                        key={optIdx}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                                      >
                                        {option}
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveFieldOption(fieldName, optIdx)}
                                          className="text-green-600 hover:text-green-900 font-bold"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 4. 파일 저장 폴더 구조 */}
                    {Array.isArray(editData.fields) && editData.fields.length > 0 && (
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            4. 📁 파일저장 폴더 구조 설정
                          </label>
                          <button
                            type="button"
                            onClick={handleAddFolderItem}
                            className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                          >
                            + 추가
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          💡 Google Drive 폴더 구조 순서 (예: 일자 &gt; 현장명 &gt; 위치)
                        </p>
                        <div className="space-y-2">
                          {(editData.folderStructure || []).map((folderItem, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 w-6">{idx + 1}.</span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-400">{idx === 0 ? '상위' : idx === ((editData.folderStructure||[]).length - 1) ? '하위' : '중간'}</span>
                                  <span className="text-xs text-gray-400">{idx + 1} 단계</span>
                                </div>
                                <select
                                  value={folderItem}
                                  onChange={(e) => handleFolderItemChange(idx, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                >
                                  <option value="">항목 선택</option>
                                  <option value="직원명">직원명</option>
                                  {editData.fields.map((field) => (
                                    <option key={field.name} value={field.name}>{field.name}</option>
                                  ))}
                                </select>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFolderItem(idx)}
                                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                              >
                                삭제
                              </button>
                            </div>
                          ))}
                          {(!editData.folderStructure || editData.folderStructure.length === 0) && (
                            <p className="text-xs text-gray-400 italic">
                              "+ 추가" 버튼을 눌러 폴더 구조를 설정하세요
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 5. 활성화 선택 */}
                    <div className="border-t pt-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        5. 활성화 선택
                      </label>
                      <select
                        value={editData.isActive ? 'active' : 'inactive'}
                        onChange={(e) => handleCellChange('isActive', e.target.value === 'active')}
                        className="w-full px-3 py-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">✅ 활성</option>
                        <option value="inactive">❌ 비활성</option>
                      </select>
                    </div>

                    {/* 저장/취소 버튼 */}
                    <div className="flex gap-2 pt-3 border-t">
                      <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded hover:bg-green-700"
                      >
                        💾 저장
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 px-4 py-3 bg-gray-400 text-white font-semibold rounded hover:bg-gray-500"
                      >
                        ✖️ 취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600 font-semibold">양식명:</span>
                        <span className="ml-2 font-medium">{form.formName}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 font-semibold">항목명:</span>
                        <span className="ml-2 text-blue-600">
                          [{Array.isArray(form.fields) ? form.fields.map(f => f.name).join('; ') : ''}]
                        </span>
                      </div>
                      
                      {/* 항목별 옵션 리스트 표시 */}
                      {form.fieldOptions && Object.keys(form.fieldOptions).length > 0 && (
                        <div className="border-t pt-2 mt-2">
                          <span className="text-gray-600 font-semibold block mb-2">항목별 옵션:</span>
                          <div className="space-y-1 pl-4">
                            {Object.entries(form.fieldOptions).map(([fieldName, options]) => (
                              <div key={fieldName} className="text-xs">
                                <span className="font-medium text-gray-700">{fieldName}:</span>
                                <span className="ml-2 text-green-600">
                                  [{Array.isArray(options) ? options.join('; ') : ''}]
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 파일 저장 폴더 구조 표시 */}
                      {form.folderStructure && form.folderStructure.length > 0 && (
                        <div className="border-t pt-2 mt-2">
                          <span className="text-gray-600 font-semibold block mb-2">📁 폴더 구조:</span>
                          <div className="pl-4 text-sm">
                            <span className="text-purple-600 font-mono">
                              {form.folderStructure.join(' > ')}
                            </span>
                          </div>
                        </div>
                      )}

                      <div>
                        <span className="text-gray-600">상태:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {form.isActive ? '활성' : '비활성'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <button
                        onClick={() => handleEdit(form)}
                        className="flex-1 px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        ✏️ 수정
                      </button>
                      { !form.isActive ? (
                        <button
                          onClick={() => handleDelete(form._id)}
                          className="flex-1 px-4 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          🗑️ 삭제
                        </button>
                      ) : (
                        <button
                          disabled
                          title="비활성화 상태에서만 삭제 가능"
                          className="flex-1 px-4 py-1.5 bg-gray-300 text-white text-sm rounded opacity-60 cursor-not-allowed"
                        >
                          🗑️ 삭제
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>💡 양식명을 클릭하면 상세정보가 펼쳐집니다.</p>
        <p>💡 항목별 옵션을 설정하면 입력 시 선택 목록이 표시됩니다.</p>
      </div>
    </div>
  );
}