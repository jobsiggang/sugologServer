import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Upload from '@/models/Upload';
import Company from "@/models/Company";
import User from "@/models/User";
import Form from "@/models/Form";
import Team from "@/models/Team";
import Upload from "@/models/Upload"
import { verifyToken } from '@/lib/auth';

// Enhanced logging and error handling for debugging
export async function GET(req) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      console.error('Authorization token missing');
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.error('Invalid token');
      return NextResponse.json({ success: false, error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    console.log('Decoded token:', decoded);

    await connectDB();
    console.log('Database connection established');

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    let query = { companyId: decoded.companyId };

    if (userId) {
      if (decoded.role === 'employee' && decoded.userId !== userId) {
        console.error('Access denied: Employee trying to access another user\'s data');
        return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 });
      }
      query.userId = userId;
    } else if (decoded.role === 'employee') {
      query.userId = decoded.userId;
    }

    console.log('Executing query with:', query);

    const uploads = await Upload.find(query)
      .populate('userId', 'username name')
      .populate('formId', 'formName')
      .sort({ createdAt: -1 })
      .limit(1000);

    console.log('Query result count:', uploads.length);

    return NextResponse.json({
      success: true,
      uploads: uploads.map(u => ({
        _id: u._id,
       name: u.userId?.name || '알 수 없음',
        username: u.userId?.username || '',
        formName: u.formName,
        data: Object.fromEntries(u.data || new Map()),
        imageUrls: u.imageUrls || [],
        imageCount: u.imageCount || 0,
        thumbnails: u.thumbnails || [],
        photoUrl: u.photoUrl,
        status: u.status,
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
    console.error('업로드 목록 조회 실패:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json({
        success: false,
        error: 'Validation error occurred while processing the request.'
      }, { status: 400 });
    }

    if (error.name === 'MongoError') {
      return NextResponse.json({
        success: false,
        error: 'Database error occurred while processing the request.'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: false, 
      error: `업로드 목록 조회 중 오류가 발생했습니다: ${error.message}` 
    }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      console.error('Authorization token missing');
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.error('Invalid token');
      return NextResponse.json({ success: false, error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    const body = await req.json();
    const { formName, data, imageUrls, imageCount, thumbnails } = body;

    if (!formName || !data) {
      console.error('Missing required fields: formName or data');
      return NextResponse.json({ success: false, error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    await connectDB();

    const upload = await Upload.create({
      userId: decoded.userId,
      companyId: decoded.companyId,
      teamId: decoded.teamId,
      formName,
      data: new Map(Object.entries(data || {})),
      imageUrls: imageUrls || [],
      imageCount: imageCount || (imageUrls ? imageUrls.length : 0),
      thumbnails: thumbnails || [],
      status: 'uploaded'
    });

    console.log('Upload created successfully:', upload);

    return NextResponse.json({ success: true, upload });
  } catch (error) {
    console.error('업로드 정보 저장 실패:', error);
    return NextResponse.json({
      success: false,
      error: `업로드 정보 저장 중 오류가 발생했습니다: ${error.message}`
    }, { status: 500 });
  }
}
