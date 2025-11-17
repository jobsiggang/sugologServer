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
            onClick={() => setActiveTab('sites')}
            className={`flex-shrink-0 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sites'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            🏗️ 현장 관리
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
            onClick={() => setActiveTab('keys')}
            className={`flex-shrink-0 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'keys'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            🔑 유사키 관리
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
  const [editing, setEditing] = useState(false);
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
      console.log('Google 설정 조회 응답:', data);
      
      if (data.success && data.googleSettings) {
        setSettings(data.googleSettings);
        setFormData({
          webAppUrl: data.googleSettings.webAppUrl || '',
          spreadsheetId: data.googleSettings.spreadsheetId || '',
          driveFolderId: data.googleSettings.driveFolderId || ''
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
      const response = await fetch(`/api/companies/${user.companyId}/google-settings`, {
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

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      webAppUrl: settings?.webAppUrl || '',
      spreadsheetId: settings?.spreadsheetId || '',
      driveFolderId: settings?.driveFolderId || ''
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Spreadsheet ID
              </label>
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                {settings.spreadsheetId || '(없음)'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Drive 폴더 ID
              </label>
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                {settings.driveFolderId || '(없음)'}
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
                placeholder="스프레드시트 URL의 ID 부분"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                예: https://docs.google.com/spreadsheets/d/<strong>YOUR_ID_HERE</strong>/edit
              </p>
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
              <p className="text-xs text-gray-500 mt-1">
                사진을 저장할 Google Drive 폴더 (선택사항)
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
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-bold text-blue-900 mb-2">📖 설정 가이드</h3>
        <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
          <li>Google Apps Script를 작성하고 배포합니다</li>
          <li>배포 후 받은 웹앱 URL을 복사하여 위에 입력합니다</li>
          <li>데이터를 저장할 Google Spreadsheet ID를 입력합니다</li>
          <li>"설정 저장" 버튼을 눌러 저장합니다</li>
          <li>"연결 테스트"로 정상 작동을 확인합니다</li>
        </ol>
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
  const [expandedId, setExpandedId] = useState(null);

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
    setExpandedId('new');
  };

  const handleEdit = (site) => {
    setEditingId(site._id);
    setEditData({ ...site });
  };

  const handleCancel = () => {
    if (editingId === 'new') {
      setSites(sites.filter(s => s._id !== 'new'));
      setExpandedId(null);
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
        setExpandedId(null);
      }
    } catch (error) {
      alert('삭제 실패');
    }
  };

  const handleCellChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  const toggleExpand = (siteId) => {
    if (expandedId === siteId) {
      setExpandedId(null);
    } else {
      setExpandedId(siteId);
    }
  };

  if (loading) return <div className="text-center py-10">로딩 중...</div>;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">현장 관리</h2>
        <button
          onClick={handleAddRow}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + 추가
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {sites.map((site, index) => (
          <div key={site._id} className="border-b last:border-b-0">
            <div
              onClick={() => editingId !== site._id && toggleExpand(site._id)}
              className={`px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${
                expandedId === site._id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-sm text-gray-500 w-8 flex-shrink-0">{index + 1}</span>
                <span className="text-sm font-medium truncate">{site.siteName}</span>
                <span className="text-sm text-gray-600 truncate">({site.projectName})</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`w-2 h-2 rounded-full ${
                  expandedId === site._id ? 'bg-blue-600' : 'bg-gray-400'
                }`}></span>
              </div>
            </div>

            {expandedId === site._id && (
              <div className="px-4 py-4 bg-gray-50 border-t">
                {editingId === site._id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">현장명</label>
                      <input
                        type="text"
                        value={editData.siteName || ''}
                        onChange={(e) => handleCellChange('siteName', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="현장명"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">프로젝트명</label>
                      <input
                        type="text"
                        value={editData.projectName || ''}
                        onChange={(e) => handleCellChange('projectName', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="프로젝트명"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">공종코드</label>
                        <input
                          type="text"
                          value={editData.workTypeCode || ''}
                          onChange={(e) => handleCellChange('workTypeCode', e.target.value)}
                          className="w-full px-3 py-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="코드"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">공종명</label>
                        <input
                          type="text"
                          value={editData.workTypeName || ''}
                          onChange={(e) => handleCellChange('workTypeName', e.target.value)}
                          className="w-full px-3 py-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="공종명"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">공사단계</label>
                      <select
                        value={editData.constructionStage || '시작전'}
                        onChange={(e) => handleCellChange('constructionStage', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="시작전">시작전</option>
                        <option value="진행중">진행중</option>
                        <option value="완료">완료</option>
                      </select>
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
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">현장명:</span>
                        <span className="ml-2 font-medium">{site.siteName}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">프로젝트명:</span>
                        <span className="ml-2">{site.projectName}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">공종:</span>
                        <span className="ml-2">{site.workTypeCode} - {site.workTypeName}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">공사단계:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          site.constructionStage === '완료' ? 'bg-green-100 text-green-800' :
                          site.constructionStage === '진행중' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {site.constructionStage}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <button
                        onClick={() => handleEdit(site)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        ✏️ 수정
                      </button>
                      <button
                        onClick={() => handleDelete(site._id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>💡 현장명을 클릭하면 상세정보가 펼쳐집니다.</p>
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
      role: 'employee'
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
      const url = isNew ? '/api/employees' : `/api/employees/${editingId}`;
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
        fetchEmployees();
        setExpandedId(null);
      }
    } catch (error) {
      alert('삭제 실패');
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
                        placeholder="이름"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">사용자명</label>
                      <input
                        type="text"
                        value={editData.username || ''}
                        onChange={(e) => handleCellChange('username', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="사용자명"
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
                        <span className="text-gray-600">이름:</span>
                        <span className="ml-2 font-medium">{emp.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">사용자명:</span>
                        <span className="ml-2">{emp.username}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">역할:</span>
                        <span className="ml-2">{emp.role === 'employee' ? '직원' : '관리자'}</span>
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
                        onClick={() => handleDelete(emp._id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
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
                                <div>
                                  <div className="font-medium">{upload.siteName} - {upload.formName}</div>
                                  <div className="text-gray-500 mt-1">
                                    {new Date(upload.createdAt).toLocaleString('ko-KR')}
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

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/forms', {
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
      fieldOptions: fieldOptions
    });
  };

  const handleCancel = () => {
    if (editingId === 'new') {
      setForms(forms.filter(f => f._id !== 'new'));
      setExpandedId(null);
    }
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const isNew = editingId === 'new';
      const url = isNew ? '/api/forms' : `/api/forms/${editingId}`;
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
        fetchForms();
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
      const response = await fetch(`/api/forms/${id}`, {
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

  const handleFieldsChange = (value) => {
    // 세미콜론으로 구분된 문자열을 배열로 변환
    const fieldsArray = value.split(';').map(f => f.trim()).filter(f => f);
    setEditData({ ...editData, fields: fieldsArray });
  };

  const handleFieldOptionChange = (fieldName, value) => {
    // 세미콜론으로 구분된 문자열을 배열로 변환
    const optionsArray = value.split(';').map(o => o.trim()).filter(o => o);
    setEditData({
      ...editData,
      fieldOptions: {
        ...editData.fieldOptions,
        [fieldName]: optionsArray
      }
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
                  [{Array.isArray(form.fields) ? form.fields.join('; ') : ''}]
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
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">양식명</label>
                      <input
                        type="text"
                        value={editData.formName || ''}
                        onChange={(e) => handleCellChange('formName', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="예: DL연간단가"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">항목명 (세미콜론으로 구분)</label>
                      <input
                        type="text"
                        value={Array.isArray(editData.fields) ? editData.fields.join('; ') : ''}
                        onChange={(e) => handleFieldsChange(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="예: 현장명; 일자; 공종코드; 물량; 공사단계"
                      />
                    </div>

                    {/* 각 항목별 옵션 리스트 입력 */}
                    {Array.isArray(editData.fields) && editData.fields.length > 0 && (
                      <div className="border-t pt-3 mt-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          항목별 선택 옵션 설정
                        </label>
                        <div className="space-y-2">
                          {editData.fields.map((field, idx) => (
                            <div key={idx}>
                              <label className="block text-xs text-gray-600 mb-1">
                                {field} (세미콜론으로 구분)
                              </label>
                              <input
                                type="text"
                                value={
                                  editData.fieldOptions && editData.fieldOptions[field]
                                    ? editData.fieldOptions[field].join('; ')
                                    : ''
                                }
                                onChange={(e) => handleFieldOptionChange(field, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={
                                  field === '현장명' ? '예: 양주신도시; 옥정더퍼스트; 옥정메트로포레' :
                                  field === '공종코드' ? '예: 1; 2; 3; 4; 5' :
                                  field === '공사단계' ? '예: 전; 중; 후' :
                                  '옵션을 입력하세요 (선택사항)'
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">상태</label>
                      <select
                        value={editData.isActive ? 'active' : 'inactive'}
                        onChange={(e) => handleCellChange('isActive', e.target.value === 'active')}
                        className="w-full px-3 py-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">활성</option>
                        <option value="inactive">비활성</option>
                      </select>
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
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600 font-semibold">양식명:</span>
                        <span className="ml-2 font-medium">{form.formName}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 font-semibold">항목명:</span>
                        <span className="ml-2 text-blue-600">
                          [{Array.isArray(form.fields) ? form.fields.join('; ') : ''}]
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
                        className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        ✏️ 수정
                      </button>
                      <button
                        onClick={() => handleDelete(form._id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        🗑️ 삭제
                      </button>
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

// 유사키 관리 컴포넌트
function KeyMappingManagement({ user }) {
  const [keyMappings, setKeyMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchKeyMappings();
  }, []);

  const fetchKeyMappings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/key-mappings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setKeyMappings(data.keyMappings);
      }
    } catch (error) {
      console.error('유사키 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    const newMapping = {
      _id: 'new',
      masterKey: '',
      originalKey: '',
      similarKeys: '',
      description: ''
    };
    setKeyMappings([newMapping, ...keyMappings]);
    setEditingId('new');
    setEditData(newMapping);
    setExpandedId('new');
  };

  const handleEdit = (mapping) => {
    setEditingId(mapping._id);
    setEditData({ 
      ...mapping,
      similarKeys: Array.isArray(mapping.similarKeys) ? mapping.similarKeys.join('; ') : mapping.similarKeys
    });
  };

  const handleCancel = () => {
    if (editingId === 'new') {
      setKeyMappings(keyMappings.filter(k => k._id !== 'new'));
      setExpandedId(null);
    }
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const isNew = editingId === 'new';
      const url = isNew ? '/api/key-mappings' : `/api/key-mappings/${editingId}`;
      const method = isNew ? 'POST' : 'PUT';

      const dataToSend = {
        ...editData,
        similarKeys: typeof editData.similarKeys === 'string' 
          ? editData.similarKeys.split(';').map(s => s.trim()).filter(s => s)
          : editData.similarKeys
      };

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
        fetchKeyMappings();
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
      const response = await fetch(`/api/key-mappings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchKeyMappings();
        setExpandedId(null);
      }
    } catch (error) {
      alert('삭제 실패');
    }
  };

  const handleCellChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  const toggleExpand = (mappingId) => {
    if (expandedId === mappingId) {
      setExpandedId(null);
    } else {
      setExpandedId(mappingId);
    }
  };

  if (loading) return <div className="text-center py-10">로딩 중...</div>;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">유사키 관리</h2>
        <button
          onClick={handleAddRow}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + 추가
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {keyMappings.map((mapping, index) => (
          <div key={mapping._id} className="border-b last:border-b-0">
            <div
              onClick={() => editingId !== mapping._id && toggleExpand(mapping._id)}
              className={`px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${
                expandedId === mapping._id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-sm text-gray-500 w-8 flex-shrink-0">{index + 1}</span>
                <span className="text-sm font-medium truncate">{mapping.masterKey}</span>
                <span className="text-sm text-gray-600 truncate">({mapping.originalKey || '기본키 없음'})</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`w-2 h-2 rounded-full ${
                  expandedId === mapping._id ? 'bg-blue-600' : 'bg-gray-400'
                }`}></span>
              </div>
            </div>

            {expandedId === mapping._id && (
              <div className="px-4 py-4 bg-gray-50 border-t">
                {editingId === mapping._id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">마스터키</label>
                      <input
                        type="text"
                        value={editData.masterKey || ''}
                        onChange={(e) => handleCellChange('masterKey', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="마스터키"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">기본키</label>
                      <input
                        type="text"
                        value={editData.originalKey || ''}
                        onChange={(e) => handleCellChange('originalKey', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="기본키"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">유사키 (세미콜론으로 구분)</label>
                      <input
                        type="text"
                        value={editData.similarKeys || ''}
                        onChange={(e) => handleCellChange('similarKeys', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="유사키1; 유사키2; 유사키3"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">설명</label>
                      <input
                        type="text"
                        value={editData.description || ''}
                        onChange={(e) => handleCellChange('description', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="설명"
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
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">마스터키:</span>
                        <span className="ml-2 font-medium">{mapping.masterKey}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">기본키:</span>
                        <span className="ml-2">{mapping.originalKey || '-'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">유사키:</span>
                        <span className="ml-2 text-blue-600">
                          {Array.isArray(mapping.similarKeys) ? mapping.similarKeys.join('; ') : mapping.similarKeys}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">설명:</span>
                        <span className="ml-2">{mapping.description}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <button
                        onClick={() => handleEdit(mapping)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        ✏️ 수정
                      </button>
                      <button
                        onClick={() => handleDelete(mapping._id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>💡 마스터키를 클릭하면 상세정보가 펼쳐집니다.</p>
      </div>
    </div>
  );
}