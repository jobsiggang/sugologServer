// src/app/api/companies/[companyId]/teams/route.js 

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Team from "@/models/Team";
import User from "@/models/User";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import mongoose from 'mongoose';

// 팀 목록 조회 (GET)
// 🚨 [수정] context 대신 { params }를 인수로 받습니다.
export async function GET(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    await connectDB();
    
    // 🟢 [수정] params에서 companyId 추출
    const companyId = params.companyId; 
 
    // 회사관리자/슈퍼바이저만 허용
    const user = await User.findById(decoded.userId);
    if (!user || (user.role !== 'company_admin' && user.role !== 'supervisor')) {
      return NextResponse.json({ error: '회사 관리자만 접근 가능합니다.' }, { status: 403 });
    }
    const teams = await Team.find({ companyId }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, teams });
  } catch (error) {
    console.error('팀 목록 조회 오류:', error);
    return NextResponse.json({ error: '팀 목록 조회 실패' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------

// 팀 생성 (POST) - 팀 책임자(관리자) 계정도 함께 생성
export async function POST(request, { params }) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'company_admin') {
      return NextResponse.json({ error: '회사 관리자만 팀을 생성할 수 있습니다.' }, { status: 403 });
    }
    const { name, description, adminUsername, adminName, adminPassword } = await request.json();
    if (!name || !adminUsername || !adminName || !adminPassword) {
      return NextResponse.json({ error: '팀명과 팀 책임자 정보를 모두 입력하세요.' }, { status: 400 });
    }
    if (adminPassword.length < 6) {
      return NextResponse.json({ error: '비밀번호는 최소 6자 이상이어야 합니다.' }, { status: 400 });
    }
    await connectDB();
    const companyId = params.companyId;
 console.log('Company ID:', companyId);  
    // 1. 중복 체크
    const exists = await Team.findOne({ companyId, name });
    if (exists) {
      return NextResponse.json({ error: '이미 존재하는 팀명입니다.' }, { status: 400 });
    }
    const userExists = await User.findOne({ companyId, username: adminUsername });
    if (userExists) {
      return NextResponse.json({ error: '이미 존재하는 관리자 아이디입니다.' }, { status: 400 });
    }

    // 2. 팀 생성
    // 💡 companyId를 명시적으로 ObjectId로 변환하여 안정성을 높입니다.
    const newTeam = new Team({
      name ,
      description: description || '',
      companyId: new mongoose.Types.ObjectId(companyId)
    });
    await newTeam.save({ session });

    // 3. 팀 관리자(책임자) 계정 생성
    const newAdmin = new User({
      username: adminUsername,
      password: adminPassword,
      name: adminName,
      role: 'team_admin',
      companyId: new mongoose.Types.ObjectId(companyId), 
      teamId: newTeam._id, // 🟢 [수정] teamId를 반드시 연결
      isActive: true
    });
    await newAdmin.save({ session });

    await session.commitTransaction();
    session.endSession();
    return NextResponse.json({
      success: true,
      message: '팀과 팀 책임자가 성공적으로 생성되었습니다.',
      team: newTeam,
      admin: { username: newAdmin.username, name: newAdmin.name, _id: newAdmin._id }
    }, { status: 201 });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('팀 생성 오류:', error);
    return NextResponse.json({ error: '팀 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------

// 팀 정보 수정 (PUT)
export async function PUT(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'company_admin' && decoded.role !== 'supervisor')) {
      return NextResponse.json({ error: '회사 관리자만 수정할 수 있습니다.' }, { status: 403 });
    }
    const { teamId, name, description, isActive } = await request.json();
    await connectDB();
    const companyId = params.companyId; 
    const team = await Team.findOne({ _id: teamId, companyId });
    if (!team) {
      return NextResponse.json({ error: '팀을 찾을 수 없습니다.' }, { status: 404 });
    }
    if (name && name !== team.name) {
      const exists = await Team.findOne({ companyId, name, _id: { $ne: teamId } });
      if (exists) {
        return NextResponse.json({ error: '이미 존재하는 팀명입니다.' }, { status: 400 });
      }
      team.name = name;
    }
    if (description !== undefined) team.description = description;
    if (isActive !== undefined) team.isActive = isActive;
    await team.save();
    return NextResponse.json({ success: true, team });
  } catch (error) {
    console.error('팀 수정 오류:', error);
    return NextResponse.json({ error: '팀 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------

// 팀 삭제 (DELETE)
export async function DELETE(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'company_admin' && decoded.role !== 'supervisor')) {
      return NextResponse.json({ error: '회사 관리자만 삭제할 수 있습니다.' }, { status: 403 });
    }
    const { teamId } = await request.json();
    await connectDB();
    const companyId = params.companyId; 
    const team = await Team.findOne({ _id: teamId, companyId });
    if (!team) {
      return NextResponse.json({ error: '팀을 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // 1. 팀에 속한 일반 사용자 수 확인
    const userCount = await User.countDocuments({ teamId, role: { $ne: 'team_admin' } });
    if (userCount > 0) {
      return NextResponse.json({ error: `팀에 ${userCount}명의 일반 사용자가 등록되어 있습니다. 먼저 모든 사용자를 삭제해주세요.`, userCount }, { status: 400 });
    }
    
    // 2. 🟢 [수정] 팀 관리자 계정 삭제
    await User.deleteMany({ teamId, role: 'team_admin' });
    
    // 3. 팀 삭제
    await Team.findByIdAndDelete(teamId);
    return NextResponse.json({ success: true, message: '팀이 삭제되었습니다.' });
  } catch (error) {
    console.error('팀 삭제 오류:', error);
    return NextResponse.json({ error: '팀 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}