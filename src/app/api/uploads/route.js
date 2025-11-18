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
    if (!decoded) {
      return NextResponse.json({ success: false, error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    await connectDB();

    // URL 파라미터에서 userId 가져오기
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    let query = { companyId: decoded.companyId };
    
    // userId가 있으면 특정 직원의 업로드만 조회
    // 직원 본인이거나 관리자만 조회 가능
    if (userId) {
      if (decoded.role === 'employee' && decoded.userId !== userId) {
        return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 });
      }
      query.userId = userId;
    } else if (decoded.role === 'employee') {
      // 직원이 userId 없이 조회하면 본인 것만
      query.userId = decoded.userId;
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
        imageUrls: u.imageUrls || [],
        imageCount: u.imageCount || 0,
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

// POST: 업로드 정보 저장
export async function POST(req) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    const body = await req.json();
    const { formName, siteName, data, imageUrls, imageCount } = body;

    await connectDB();

    const upload = await Upload.create({
      userId: decoded.userId,
      companyId: decoded.companyId,
      formName,
      siteName,
      data: new Map(Object.entries(data || {})),
      imageUrls: imageUrls || [],
      imageCount: imageCount || (imageUrls ? imageUrls.length : 0),
      status: 'uploaded'
    });

    return NextResponse.json({
      success: true,
      upload
    });
  } catch (error) {
    console.error('업로드 정보 저장 실패:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
