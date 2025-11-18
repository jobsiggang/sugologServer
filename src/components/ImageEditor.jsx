"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import InputForm from "./InputForm";
import ImageCanvas from "./ImageCanvas";
import { uploadPhoto, uploadPhotosBatch } from "@/lib/googleDrive";
import toast from "react-hot-toast";
import { createCompositeImage } from "@/lib/createComposite";
import { canvasConfig } from "@/lib/compositeConfig";

export default function ImageEditor({ author }) {
  const router = useRouter();
  const canvasWidth = canvasConfig.width;
  const canvasHeight = canvasConfig.height;

  const [siteData, setSiteData] = useState([]);
  const [entries, setEntries] = useState([]);
  const [formList, setFormList] = useState([]);
  const [selectedForm, setSelectedForm] = useState("");
  const [fieldOptions, setFieldOptions] = useState({}); // 양식의 fieldOptions 저장
  const [images, setImages] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  // 분리된 진행률: 합성(처리) / 업로드
  const [processingProgress, setProcessingProgress] = useState(0); // 합성(이미지 처리) 진행률 0-100
  const [uploadingProgress, setUploadingProgress] = useState(0); // 업로드 진행률 0-100
  const kstTimeoutRef = useRef(null);
  const kstIntervalRef = useRef(null);

  // 🎨 공통 버튼 스타일
  const buttonStyle = {
    color: "#000",
    height: 30,
    padding: "4px 8px",
    cursor: "pointer",
    borderRadius: 6,
    fontWeight: "bold",
    background: "#ffcc00",
    transition: "0.2s",
    flex: "1 1 auto",
    fontSize: 14,
    margin: 2,
  };

  const saveButtonStyle = {
    ...buttonStyle,
    background: "#00cc88",
    color: "#fff",
  };

  // 📋 MongoDB에서 현장과 입력양식 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // 현장 목록 가져오기
        const sitesResponse = await fetch('/api/sites', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const sitesData = await sitesResponse.json();
        if (sitesData.success) {
          setSiteData(sitesData.sites.map(s => ({
            현장명: s.siteName,
            프로젝트명: s.projectName,
            공종코드: s.workTypeCode,
            공종명: s.workTypeName
          })));
        }

        // 입력양식 목록 가져오기
        const formsResponse = await fetch('/api/forms', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const formsData = await formsResponse.json();
        if (formsData.success) {
          setFormList(formsData.forms.filter(f => f.isActive).map(f => f.formName));
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        toast.error('데이터를 불러오는데 실패했습니다.');
      }
    };
    fetchData();
  }, []);

  // 📅 작성자 로컬스토리지 일주일 삭제
  useEffect(() => {
    const lastClear = localStorage.getItem("lastAuthorClear");
    const now = Date.now();
    if (!lastClear || now - Number(lastClear) > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem("authorName");
      localStorage.setItem("lastAuthorClear", now.toString());
    }
  }, []);

  // 한국시간(KST) 자정 자동 로그아웃
  useEffect(() => {
    const doLogout = () => {
      try {
        localStorage.removeItem("authorName");
      } catch (e) {}
      toast.success("자동 로그아웃: 한국시간 자정이 되어 로그아웃됩니다.");
      router.push("/");
    };

    const now = new Date();
    const nowUtcMs = now.getTime();
    const nextKstMidUtc = new Date();
    nextKstMidUtc.setUTCHours(15, 0, 0, 0);
    if (nextKstMidUtc.getTime() <= nowUtcMs) {
      nextKstMidUtc.setUTCDate(nextKstMidUtc.getUTCDate() + 1);
    }
    const delay = nextKstMidUtc.getTime() - nowUtcMs;

    kstTimeoutRef.current = setTimeout(() => {
      doLogout();
      // 이후 매일 실행
      kstIntervalRef.current = setInterval(doLogout, 24 * 60 * 60 * 1000);
    }, delay);

    return () => {
      if (kstTimeoutRef.current) clearTimeout(kstTimeoutRef.current);
      if (kstIntervalRef.current) clearInterval(kstIntervalRef.current);
    };
  }, []);

  const handleLoadForm = async () => {
    if (!selectedForm) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/forms', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        const form = data.forms.find((f) => f.formName === selectedForm);
        if (!form) return;
        
        // ✅ 양식 ID를 localStorage에 저장 (업로드 시 사용)
        localStorage.setItem('selectedFormId', form._id);
        console.log('✅ 양식 선택:', form.formName, 'ID:', form._id);
        console.log('📋 원본 fieldOptions:', form.fieldOptions);
        console.log('📋 fieldOptions 타입:', typeof form.fieldOptions);
        
        // ✅ fieldOptions 저장 (이미 toJSON에서 변환됨)
        const options = form.fieldOptions || {};
        setFieldOptions(options);
        console.log('✅ 최종 fieldOptions 설정:', options);
        
        // fields 배열이 있으면 사용, 없으면 기본값
        const fields = form.fields || [];

        const now = new Date();
        const kstOffset = 9 * 60;
        const localOffset = now.getTimezoneOffset();
        const kstTime = new Date(now.getTime() + (kstOffset + localOffset) * 60000);
        const yyyy = kstTime.getFullYear();
        const mm = String(kstTime.getMonth() + 1).padStart(2, "0");
        const dd = String(kstTime.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;

        const newEntries = fields.map((f) => ({
          key: Date.now() + Math.random(),
          field: f,
          value: f === "일자" ? todayStr : "",
        }));

        setEntries(newEntries);
        toast.success(`✅ "${selectedForm}" 양식을 불러왔습니다.`);
      }
    } catch (error) {
      console.error('양식 로드 실패:', error);
      toast.error('양식을 불러오는데 실패했습니다.');
    }
  };

  // 📸 이미지 선택/촬영
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (images.length + files.length > 10) {
      toast.error(`한 번에 최대 10장까지 선택 가능합니다. 현재 ${images.length}장 선택됨`);
      return;
    }

    const newImages = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      rotation: 0,
    }));

    // set preview index based on previous length to avoid stale state
    setImages((prev) => {
      const startIndex = prev.length;
      setPreviewIndex(startIndex);
      return [...prev, ...newImages];
    });
  };

  const allRequiredFilled = () => {
    if (!entries || entries.length === 0) {
      toast.error("❌ 항목이 없습니다. 양식을 불러오거나 항목을 추가하세요.");
      return false;
    }

    for (const e of entries) {
      const v = e.value;
      if (v === undefined || v === null || String(v).trim() === "") {
        toast.error("❌ 모든 항목을 입력해주세요.");
        return false;
      }
    }

    return true;
  };

  // 이미지 삭제
  const handleDelete = (index) => {
    const imgToDelete = images[index];
    URL.revokeObjectURL(imgToDelete.url);
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (previewIndex >= index) setPreviewIndex(Math.max(previewIndex - 1, 0));
  };

  // 이미지 회전
  const handleRotate = (index) => {
    setImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, rotation: (img.rotation + 90) % 360 } : img
      )
    );
  };

  // 🚀 업로드 — 합성(처리)과 업로드를 분리하여 각각 진행률을 업데이트
  const handleUpload = async () => {
    console.log('🚀 handleUpload 시작');
    console.log('entries:', entries);
    console.log('images:', images);
    
    if (!allRequiredFilled()) {
      console.log('❌ 필수 항목 누락');
      return;
    }
    if (!images.length) {
      console.log('❌ 이미지 없음');
      return toast.error("❌ 이미지를 선택하세요.");
    }

    console.log('✅ 업로드 시작 - 초기화');
    // 초기화
    setUploading(true);
    setProcessingProgress(0);
    setUploadingProgress(0);

    const entryData = {};
    entries.forEach((e) => (entryData[e.field] = e.value));
    entryData["작성자"] = author;

    const processImage = async (file, rotation) => {
      const canvas = await createCompositeImage(file, entries, rotation);

      // 다운스케일(선택): 최대 길이 제한 (예: 1600px)
      const MAX_DIM = 1600;
      let outCanvas = canvas;
      if (canvas.width > MAX_DIM || canvas.height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / canvas.width, MAX_DIM / canvas.height);
        const tmp = document.createElement("canvas");
        tmp.width = Math.round(canvas.width * ratio);
        tmp.height = Math.round(canvas.height * ratio);
        tmp.getContext("2d").drawImage(canvas, 0, 0, tmp.width, tmp.height);
        outCanvas = tmp;
      }

      const base64 = outCanvas.toDataURL("image/jpeg", 0.75).split(",")[1];
      const filename = Object.values(entryData).filter(Boolean).join("_") + "_" + file.name;
      return { base64, filename, entryData };
    };

    try {
      console.log('📦 합성 단계 시작');
      // 1) 합성(처리) 단계 — 순차 처리하여 명확한 진행률 제공
      const processed = [];
      for (let i = 0; i < images.length; i++) {
        console.log(`합성 중 ${i+1}/${images.length}`);
        const { file, rotation } = images[i];
        processed[i] = await processImage(file, rotation);
        setProcessingProgress(Math.round(((i + 1) / images.length) * 100));
      }

      console.log('✅ 합성 완료, 업로드 시작');
      console.log('uploadPhoto 함수 존재:', typeof uploadPhoto);
      console.log('uploadPhotosBatch 함수 존재:', typeof uploadPhotosBatch);
      
      // 2) 업로드 단계 — 각 파일 업로드 완료 시점에 진행률 갱신
      const uploadedUrls = [];
      
      if (typeof uploadPhoto === "function") {
        console.log('개별 업로드 방식 사용');
        for (let i = 0; i < processed.length; i++) {
          console.log(`업로드 중 ${i+1}/${processed.length}`);
          const item = processed[i];
          const res = await uploadPhoto(item.base64, item.filename, item.entryData);
          console.log('업로드 응답:', res);
          if (!res || !res.success) throw new Error(res?.error || "업로드 실패");
          if (res.url) uploadedUrls.push(res.url);
          setUploadingProgress(Math.round(((i + 1) / processed.length) * 100));
        }
      } else if (typeof uploadPhotosBatch === "function") {
        console.log('배치 업로드 방식 사용');
        // 배치 업로드만 지원하는 경우: 호출 전 업로드Progress 0, 호출 후 100
        const res = await uploadPhotosBatch(processed);
        console.log('배치 업로드 응답:', res);
        if (!res || !res.success) throw new Error(res?.error || "배치 업로드 실패");
        if (res.urls) uploadedUrls.push(...res.urls);
        setUploadingProgress(100);
      } else {
        throw new Error("업로드 함수(uploadPhoto 또는 uploadPhotosBatch)가 없습니다.");
      }

      // 3) MongoDB에 업로드 정보 저장
      try {
        console.log('💾 DB 저장 시작');
        const token = localStorage.getItem('token');
        const uploadRecord = {
          formName: selectedForm,
          siteName: entryData['현장명'] || '',
          data: entryData,
          imageUrls: uploadedUrls
        };

        console.log('저장할 데이터:', uploadRecord);

        const saveResponse = await fetch('/api/uploads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(uploadRecord)
        });

        const saveData = await saveResponse.json();
        console.log('DB 저장 응답:', saveData);
        if (!saveData.success) {
          console.error('DB 저장 실패:', saveData.error);
        } else {
          console.log('✅ DB 저장 완료');
        }
      } catch (dbErr) {
        console.error('DB 저장 중 오류:', dbErr);
        // DB 저장 실패해도 업로드는 완료된 것으로 처리
      }

      // 완료 처리
      console.log('✅ 모든 작업 완료');
      setProcessingProgress(100);
      setUploadingProgress(100);
      await new Promise((r) => setTimeout(r, 300));
      setUploading(false);

      const saveConfirm = confirm("✅ 업로드 완료!\n보드 사진을 휴대폰에 저장하시겠습니까?");
      if (saveConfirm) handleSaveComposite();
      setImages([]);
      toast.success("✅ 모든 이미지 업로드 완료!");
    } catch (err) {
      console.error('❌ 업로드 실패:', err);
      toast.error(`❌ 업로드 실패: ${err?.message || err}`);
      setUploading(false);
      setProcessingProgress(0);
      setUploadingProgress(0);
    }
  };

  // 💾 휴대폰 저장 (회전값 적용)
  const handleSaveComposite = async () => {
    if (!allRequiredFilled()) return;
    if (!images.length) return toast.error("❌ 이미지를 선택하세요.");

    setSaving(true);
    try {
      for (let i = 0; i < images.length; i++) {
        const { file, rotation } = images[i];
        const canvas = await createCompositeImage(file, entries, rotation);
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/jpeg");
        link.download = `합성_${Date.now()}_${i + 1}.jpg`;
        link.click();
        await new Promise((r) => setTimeout(r, 200));
      }
      toast.success("✅ 합성 이미지가 저장되었습니다!");
    } catch (err) {
      console.error(err);
      toast.error("❌ 저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 16, backgroundColor: "#f0f0f0", minHeight: "100vh", fontFamily: "돋움", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "90%", maxWidth: 900 }}>    
        {/* 양식 선택 + 가져오기 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <select
            value={selectedForm}
            onChange={(e) => setSelectedForm(e.target.value)}
            style={{
              color: "#000",
              flex: "1 1 200px",
              height: 32,
              borderRadius: 8,
              background: "#ffcc00",
              fontWeight: "bold",
              fontSize: 13, // 글자 크기 조정
            }}
          >
            <option value="">--입력 양식 선택--</option>
            {formList.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <button onClick={handleLoadForm} style={buttonStyle}>
            가져오기
          </button>
        </div>

        {/* 입력 폼 */}
        <InputForm 
          entries={entries} 
          setEntries={setEntries} 
          siteData={siteData} 
          fieldOptions={fieldOptions}
        />

        {/* 진행률 바 */}
        {uploading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
            <div>
              <div style={{ fontSize: 12, marginBottom: 4, color: "#333" }}>합성 중: {processingProgress}%</div>
              <div style={{ width: "100%", background: "#eee", height: 12, borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: `${processingProgress}%`, height: "100%", background: "#007bff", transition: "width 0.25s" }} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, marginBottom: 4, color: "#333" }}>업로드 중: {uploadingProgress}%</div>
              <div style={{ width: "100%", background: "#eee", height: 12, borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: `${uploadingProgress}%`, height: "100%", background: "#00aa66", transition: "width 0.25s" }} />
              </div>
            </div>
          </div>
        )}

        {/* 📸 사진 버튼 */}
        <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input id="cameraInput" type="file" accept="image/*" capture="environment" multiple onChange={handleFileSelect} style={{ display: "none" }} />
          <button disabled={uploading || saving} onClick={() => document.getElementById("cameraInput").click()} style={buttonStyle}>📸 사진 찍기</button>

          <input id="galleryInput" type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: "none" }} />
          <button disabled={uploading || saving} onClick={() => document.getElementById("galleryInput").click()} style={buttonStyle}>🖼️ 사진 선택</button>

          <button disabled={uploading || saving} onClick={handleUpload} style={buttonStyle}>{uploading ? "전송 중..." : "🚀 사진 전송"}</button>
        </div>

        {/* 썸네일 + 미리보기 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {images.map((img, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img
                src={img.url}
                alt={`thumb-${i}`}
                onClick={() => setPreviewIndex(i)}
                style={{
                  width: 80,
                  height: 80,
                  objectFit: "cover",
                  border: previewIndex === i ? "3px solid #007bff" : "2px solid #222",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              />
              <button
                onClick={() => handleDelete(i)}
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  background: "#ff4d4f",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: 20,
                  height: 20,
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* 미리보기 + 회전 버튼 */}
        {images[previewIndex] && (
          <div style={{ position: "relative", marginTop: 10 }}>
            <ImageCanvas
              image={images[previewIndex].file}
              rotation={images[previewIndex].rotation}
              entries={entries}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
            />
            <button
              onClick={() => handleRotate(previewIndex)}
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                width: 36,
                height: 36,
                borderRadius: 4,
                fontWeight: "bold",
                cursor: "pointer",
                background: "#007bff",
                color: "#fff",
                border: "none",
              }}
            >↻</button>
          </div>
        )}
      </div>
    </div>
  );
}
