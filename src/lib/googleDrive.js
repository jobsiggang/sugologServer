// ...existing code...
export async function uploadPhotosBatch(uploadList) {
  try {
    const res = await fetch("/api/uploadPhoto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uploadList),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}
// ...existing code...
export async function uploadPhoto(base64, filename, entryData) {
  try {
    // 현재 선택된 양식 ID 가져오기
    const selectedFormId = localStorage.getItem('selectedFormId');
    if (!selectedFormId) {
      return { success: false, error: "양식을 먼저 선택해주세요." };
    }

    // API 형식에 맞게 데이터 변환
    const uploadData = {
      base64Image: `data:image/jpeg;base64,${base64}`,
      filename: filename,
      formId: selectedFormId,
      fieldData: entryData
    };

    console.log('📤 업로드 데이터:', {
      filename: uploadData.filename,
      formId: uploadData.formId,
      fieldDataKeys: Object.keys(uploadData.fieldData),
      base64Length: uploadData.base64Image.length
    });

    const res = await fetch("/api/uploadPhoto", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(uploadData),
    });

    const data = await res.json();
    console.log('업로드 응답:', data);

    if (!data.success) {
      return { success: false, error: data.error || "업로드 실패" };
    }

    // ✅ Base64 데이터가 있다면 바로 다운로드 (확인창 없이)
    if (data.base64) {
      const link = document.createElement("a");
      link.href = `data:image/png;base64,${data.base64}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    return data; // { success: true, base64: '...' }
  } catch (err) {
    console.error('❌ 업로드 실패:', err);
    return { success: false, error: err.message };
  }
}
