import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Upload from '@/models/Upload';
import { verifyToken } from '@/lib/auth';

// GET: 업로드 데이터 목록 조회 (회사별, 직원별)
export async function GET(req) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'company_admin' && decoded.role !== 'supervisor')) {
      return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 });
    }

    await connectDB();

    // URL 파라미터에서 userId 가져오기
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    let query = { companyId: decoded.companyId };
    
    // userId가 있으면 특정 직원의 업로드만 조회
    if (userId) {
      query.userId = userId;
    }

    const uploads = await Upload.find(query)
      .populate('userId', 'username name')
      .populate('siteId', 'siteName')
      .populate('formId', 'formName')
      .sort({ createdAt: -1 })
      .limit(1000);

    return NextResponse.json({
      success: true,
      uploads: uploads.map(u => ({
        _id: u._id,
        userName: u.userId?.name || '알 수 없음',
        username: u.userId?.username || '',
        siteName: u.siteName,
        formName: u.formName,
        data: Object.fromEntries(u.data || new Map()),
        photoUrl: u.photoUrl,
        status: u.status,
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
    console.error('업로드 목록 조회 실패:', error);
    return NextResponse.json({ 
      success: false, 
      error: '업로드 목록 조회 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
