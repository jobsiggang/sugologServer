import { canvasConfig } from "./compositeConfig";

// 캐시 맵 추가 (상단에)
const overlayCache = new Map();

function makeOverlayCanvas(entries) {
  const key = JSON.stringify(entries.map(e => ({ field: e.field, value: e.value })));
  if (overlayCache.has(key)) return overlayCache.get(key);

  const width = canvasConfig.width;
  const height = canvasConfig.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const minTableWidthRatio = canvasConfig.table.widthRatio; // 최소 0.23
  const tableHeightRatio = canvasConfig.table.heightRatio;
  const col1Ratio = canvasConfig.table.col1Ratio; // 0.36 고정 (첫 번째 열)
  const cellPaddingX = canvasConfig.table.cellPaddingX || 4;

  // 테이블 높이는 고정
  let tableHeight = height * tableHeightRatio;
  const tableX = 0;
  const tableY = height - tableHeight;

  // 글자 길이에 따라 테이블 너비 동적 계산 (두 번째 열만)
  ctx.font = canvasConfig.table.font;
  let maxCol2Width = 0;

  for (const entry of entries) {
    const value = entry.value || "";
    
    // 값의 길이 측정
    const valueMetrics = ctx.measureText(value);
    
    // 여유분(패딩) 추가: 좌우 각 cellPaddingX
    const valueWidth = valueMetrics.width + cellPaddingX * 2;
    maxCol2Width = Math.max(maxCol2Width, valueWidth);
  }

  // 첫 번째 열: 고정 비율 (36%)
  // 두 번째 열: 동적 (maxCol2Width에 맞춰)
  const col1Width = width * col1Ratio;
  const col2Width = maxCol2Width;
  const tableWidth = col1Width + col2Width;
  
  // 최대값 제한 (캔버스 너비를 넘지 않도록, 여유분 약간 추가)
  const finalTableWidth = Math.min(tableWidth, width * 0.95);

  // 테이블 배경 및 테두리 그리기
  ctx.fillStyle = canvasConfig.table.backgroundColor;
  ctx.fillRect(tableX, tableY, finalTableWidth, tableHeight);
  ctx.strokeStyle = canvasConfig.table.borderColor;
  ctx.lineWidth = canvasConfig.table.borderWidth;
  ctx.strokeRect(tableX, tableY, finalTableWidth, tableHeight);

  // 각 행(entry) 그리기
  const rowHeight = tableHeight / entries.length;
  ctx.font = canvasConfig.table.font;
  ctx.fillStyle = canvasConfig.table.textColor;
  ctx.textBaseline = "middle";

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const rowY = tableY + i * rowHeight;
    const finalCol1Width = finalTableWidth * (col1Width / tableWidth); // 비율 유지
    const finalCol2Width = finalTableWidth * (col2Width / tableWidth); // 비율 유지

    // 컬럼 1: 필드명 (왼쪽 정렬, 고정)
    ctx.textAlign = "left";
    ctx.fillText(entry.field || "", tableX + cellPaddingX, rowY + rowHeight / 2);

    // 컬럼 경계선
    ctx.strokeStyle = canvasConfig.table.borderColor;
    ctx.beginPath();
    ctx.moveTo(tableX + finalCol1Width, rowY);
    ctx.lineTo(tableX + finalCol1Width, rowY + rowHeight);
    ctx.stroke();

    // 컬럼 2: 값 (왼쪽 정렬, 동적)
    ctx.textAlign = "left";
    ctx.fillText(entry.value || "", tableX + finalCol1Width + cellPaddingX, rowY + rowHeight / 2);

    // 행 경계선
    if (i < entries.length - 1) {
      ctx.beginPath();
      ctx.moveTo(tableX, rowY + rowHeight);
      ctx.lineTo(tableX + finalTableWidth, rowY + rowHeight);
      ctx.stroke();
    }
  }

  overlayCache.set(key, canvas);
  return canvas;
}

/**
 * 유지할 조건:
 * - 이미지 비율 유지하지 않음 (stretch)
 * - 캔버스 크기에 꽉 채움 (회전 시 가로/세로 교환 처리)
 */
export const createCompositeImage = async (file, entries, rotation = 0) => {
  // 이미지 디코딩 (빠른 브라우저 API 우선)
  let imgBitmap = null;
  let objectUrl = null;
  try {
    if (typeof createImageBitmap === "function") {
      imgBitmap = await createImageBitmap(file);
    } else {
      // 폴백: HTMLImageElement 사용
      await new Promise((resolve, reject) => {
        const img = new Image();
        objectUrl = URL.createObjectURL(file);
        img.onload = () => {
          try {
            // draw to temp canvas and convert to ImageBitmap if available
            const tmp = document.createElement("canvas");
            tmp.width = img.naturalWidth;
            tmp.height = img.naturalHeight;
            tmp.getContext("2d").drawImage(img, 0, 0);
            if (typeof createImageBitmap === "function") {
              createImageBitmap(tmp)
                .then((bmp) => {
                  imgBitmap = bmp;
                  resolve();
                })
                .catch(() => {
                  imgBitmap = img;
                  resolve();
                });
            } else {
              imgBitmap = img;
              resolve();
            }
          } catch (err) {
            reject(err);
          } finally {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
          }
        };
        img.onerror = (e) => {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
          reject(e);
        };
        img.src = objectUrl;
      });
    }
  } catch (err) {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
    throw err;
  }

  // 결과 캔버스
  const width = canvasConfig.width;
  const height = canvasConfig.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // 성능 우선 옵션 (필요 시 조정)
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "low";

  // 회전에 따른 대상 그리기 크기 결정 (비율 유지하지 않음 -> 단순 치환)
  let drawW = width;
  let drawH = height;
  if (rotation % 180 !== 0) {
    // 90 or 270: 가로/세로 교체
    drawW = height;
    drawH = width;
  }

  // 중앙 회전 후 스트레치로 캔버스에 꽉 채우기 (비율 유지 X)
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((rotation * Math.PI) / 180);

  // imgBitmap may be ImageBitmap or Image; draw stretched to drawW x drawH centered
  ctx.drawImage(imgBitmap, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  // 테이블(오버레이) 합성 (캐시된 오버레이 사용)
  const overlay = makeOverlayCanvas(entries);
  ctx.drawImage(overlay, 0, 0, width, height);

  // ImageBitmap 메모리 정리 가능하면 수행
  if (imgBitmap && typeof imgBitmap.close === "function") {
    try {
      imgBitmap.close();
    } catch (e) {
      /* ignore */
    }
  }

  return canvas;
};
