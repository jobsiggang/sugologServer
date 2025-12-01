'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CompanyDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('employees');
  
  // 💡 [추가] 로딩 상태 추가 (User data가 없으면 로딩 표시)
  const [loadingUser, setLoadingUser] = useState(true);


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
      router.push('/company_team/login');
      return;
    }

    setUser(userData);
    setLoadingUser(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/company_team/login');
  };

  if (!user || loadingUser) {
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
        // 🟢 [수정] API 경로 사용
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
        // 🟢 [수정] API 경로 사용
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
        // 🟢 [수정] API 경로 사용
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
  
  return (
    <div className="w-full">
      {/* ... GoogleSettings JSX 유지 ... */}
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
        // 🟢 [수정] 직원 목록 GET API 경로
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
        // 🚨 API 경로 수정: /api/uploads?userId=... 대신 팀 관리자 권한을 활용한 조회 경로 가정
      const response = await fetch(`/api/companies/${user.companyId}/teams/${user.teamId}/employees/${employeeId}/uploads`, {
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

  const handleAddRow = () => { /* ... */ };
  const handleEdit = (emp) => { /* ... */ };
  const handleCancel = () => { /* ... */ };

  // 🟢 [수정] 직원 저장
  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const isNew = editingId === 'new';
      // 🚨 API 경로: POST는 collection에, PUT은 resource에
      const url = isNew 
          ? `/api/companies/${user.companyId}/teams/${user.teamId}/employees` 
          : `/api/companies/${user.companyId}/teams/${user.teamId}/employees/${editingId}`;
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

  // 🟢 [수정] 직원 삭제
  const handleDelete = async (id, employee) => {
    if (employee.isActive) {
      alert('활성화된 직원은 삭제할 수 없습니다. 먼저 비활성화해주세요.');
      return;
    }

    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      const token = localStorage.getItem('token');
      // 🚨 API 경로: DELETE는 resource에
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

  // 🟢 [수정] 직원 활성/비활성 토글
  const handleToggleActive = async (id, currentStatus) => {
    const action = currentStatus ? '비활성화' : '활성화';
    if (!confirm(`정말 ${action}하시겠습니까?`)) return;

    try {
      const token = localStorage.getItem('token');
      // 🚨 API 경로: PUT은 resource에
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

  const handleCellChange = (field, value) => { /* ... */ };
  const toggleExpand = (empId) => { /* ... */ };

  return (
    <div className="w-full">
      {/* ... JSX 및 FormManagement, GoogleSettings 컴포넌트 생략 ... */}
    </div>
  );
}

// ----------------------------------------------------------------------
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
        // 🟢 [수정] API 경로: 팀장 권한에 맞게 companyId와 teamId 포함
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

  // 🟢 [수정] 양식 저장 (POST/PUT)
  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const isNew = editingId === 'new';
      // 🚨 API 경로: POST는 collection에, PUT은 resource에
      const url = isNew 
          ? `/api/companies/${user.companyId}/teams/${user.teamId}/forms` 
          : `/api/companies/${user.companyId}/teams/${user.teamId}/forms/${editingId}`;
      const method = isNew ? 'POST' : 'PUT';

      // fieldOptions를 명시적으로 복사
      const payload = {
        ...editData,
        fieldOptions: editData.fieldOptions ? {...editData.fieldOptions} : {}
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.success) {
        setEditingId(null);
        setEditData({});
        fetchForms();
      } else {
        alert(data.error || data.details || '저장 실패');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('오류가 발생했습니다: ' + error.message);
    }
  };

  // 🟢 [수정] 양식 삭제
  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      // 🚨 API 경로: DELETE는 resource에
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
    // ... (나머지 FormManagement 로직 유지)
    
    return (
        // ... (FormManagement JSX 유지)
        <div className="w-full">{/* ... */}</div>
    );
}

// ----------------------------------------------------------------------
// Google 설정 컴포넌트
function GoogleSettings({ user }) {
    // ... (상태 및 훅 유지)
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState(false);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({ webAppUrl: '' });

    // 🟢 [수정] API 경로 통일
    const API_PATH = `/api/companies/${user.companyId}/teams/${user.teamId}/googlesettings`;

    // 🟢 [수정] 설정 조회
    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_PATH, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // ... (나머지 로직 유지)
        } catch (error) { /* ... */ } finally { setLoading(false); }
    };

    // 🟢 [수정] 설정 업데이트
    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_PATH, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            // ... (나머지 로직 유지)
        } catch (error) { /* ... */ }
    };

    // 🟢 [수정] 연결 테스트
    const handleTest = async () => {
        setTesting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_PATH, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // ... (나머지 로직 유지)
        } catch (error) { /* ... */ } finally { setTesting(false); }
    };
    
    // ... (handleCancel 및 JSX 렌더링 유지)
    return (
        <div className="w-full">
            {/* ... GoogleSettings JSX 유지 ... */}
        </div>
    );
}