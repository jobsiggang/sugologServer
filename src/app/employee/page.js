'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployeeDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpload, setSelectedUpload] = useState(null);

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
    if (!userData || userData.role !== 'employee') {
      alert('직원만 접근 가능합니다.');
      router.push('/login');
      return;
    }

    setUser(userData);
    fetchUploads(userData.id);
  };

  const fetchUploads = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/uploads?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUploads(data.uploads);
      }
    } catch (error) {
      console.error('업로드 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const goToUpload = () => {
    router.push('/upload');
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
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-gray-800">{user.companyName}</h1>
            <p className="text-xs text-gray-500">{user.name} ({user.username})</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            로그아웃
          </button>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex border-t border-gray-200">
          <button
            onClick={goToUpload}
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 border-r border-gray-200"
          >
            📸 사진 업로드
          </button>
          <button
            className="flex-1 px-4 py-3 text-sm font-medium bg-blue-50 text-blue-700"
          >
            📋 업로드 내역
          </button>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="p-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">내 업로드 내역</h2>
          <p className="text-sm text-gray-600">총 {uploads.length}건</p>
        </div>

        {loading ? (
          <div className="text-center py-10">로딩 중...</div>
        ) : uploads.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">업로드한 내역이 없습니다.</p>
            <button
              onClick={goToUpload}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              사진 업로드하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {uploads.map((upload) => (
              <div
                key={upload._id}
                onClick={() => setSelectedUpload(upload)}
                className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{upload.formName || '양식명 없음'}</h3>
                    <p className="text-sm text-gray-600">{upload.siteName || upload.data?.현장명 || '현장명 없음'}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(upload.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                <div className="text-sm text-gray-700 space-y-1">
                  {upload.data && Object.entries(upload.data).map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="w-20 text-gray-500">{key}:</span>
                      <span className="flex-1">{value}</span>
                    </div>
                  ))}
                </div>

                {upload.imageUrls && upload.imageUrls.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {upload.imageUrls.slice(0, 3).map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`사진 ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded border"
                      />
                    ))}
                    {upload.imageUrls.length > 3 && (
                      <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded border text-sm text-gray-600">
                        +{upload.imageUrls.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 상세보기 모달 */}
      {selectedUpload && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedUpload(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
              <h3 className="text-lg font-bold">업로드 상세</h3>
              <button
                onClick={() => setSelectedUpload(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">{selectedUpload.formName || '양식명 없음'}</h4>
                <p className="text-sm text-gray-600">
                  업로드 일시: {new Date(selectedUpload.createdAt).toLocaleString('ko-KR')}
                </p>
              </div>

              <div className="mb-4 space-y-2">
                {selectedUpload.data && Object.entries(selectedUpload.data).map(([key, value]) => (
                  <div key={key} className="flex border-b pb-2">
                    <span className="w-24 font-medium text-gray-700">{key}</span>
                    <span className="flex-1 text-gray-800">{value}</span>
                  </div>
                ))}
              </div>

              {selectedUpload.imageUrls && selectedUpload.imageUrls.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">첨부 사진 ({selectedUpload.imageUrls.length}장)</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedUpload.imageUrls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`사진 ${idx + 1}`}
                        className="w-full h-40 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
