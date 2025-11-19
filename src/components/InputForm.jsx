"use client";
import React, { useMemo, useCallback, useRef, useImperativeHandle, forwardRef } from "react";

const baseInputStyle = {
  padding: "2px 4px",
  border: "none",
  borderBottom: "1px solid #ccc",
  fontSize: "13px",
  color: "#000",
  background: "transparent",
  fontWeight: "bold",
};

function EntryRow({ entry, options, onChangeDebounced, onBlur }) {
  const hasOptions = options && options.length > 0;
  
  // 디버깅 로그
  if (entry.field === "현장명" || entry.field === "위치" || entry.field === "공종") {
    console.log(`📝 ${entry.field} - hasOptions:`, hasOptions, 'options:', options);
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <input
        style={{
          ...baseInputStyle,
          width: "10ch",
          textAlign: "right",
          flexShrink: 0,
        }}
        value={entry.field}
        readOnly
      />

      {entry.field === "일자" ? (
        <input
          type="date"
          style={{
            ...baseInputStyle,
            width: "20ch",
            fontWeight: "normal",
          }}
          value={entry.value}
          onChange={(e) => onChangeDebounced(entry.key, e.target.value)}
          onBlur={() => onBlur(entry.key)}
        />
      ) : entry.field === "위치" ? (
        <input
          style={{
            ...baseInputStyle,
            width: "20ch",
            fontWeight: "normal",
          }}
          value={entry.value}
          placeholder="123-345"
          onChange={(e) => onChangeDebounced(entry.key, e.target.value)}
          onBlur={() => onBlur(entry.key)}
        />
      ) : hasOptions ? (
        <>
          <input
            list={`datalist-${entry.key}`}
            style={{
              ...baseInputStyle,
              width: "20ch",
              fontWeight: "normal",
            }}
            value={entry.value}
            onChange={(e) => onChangeDebounced(entry.key, e.target.value)}
            onBlur={() => onBlur(entry.key)}
          />
          <datalist id={`datalist-${entry.key}`}>
            {options.map((val) => (
              <option key={val} value={val} />
            ))}
          </datalist>
        </>
      ) : (
        <input
          style={{
            ...baseInputStyle,
            width: "20ch",
            fontWeight: "normal",
          }}
          value={entry.value}
          placeholder={entry.field}
          onChange={(e) => onChangeDebounced(entry.key, e.target.value)}
          onBlur={() => onBlur(entry.key)}
        />
      )}
    </div>
  );
}

const MemoEntryRow = React.memo(EntryRow);

const InputFormImpl = function InputForm({ entries, setEntries, fieldOptions = {} }, ref) {
  // field -> unique options map (캐시)
  // 우선순위: fieldOptions (양식에서 정의)
  const optionsMap = useMemo(() => {
    const map = {};

    // 1. 양식의 fieldOptions 사용
    Object.keys(fieldOptions).forEach((key) => {
      if (Array.isArray(fieldOptions[key]) && fieldOptions[key].length > 0) {
        map[key] = fieldOptions[key];
      }
    });

    console.log('📋 InputForm optionsMap:', map);
    return map;
  }, [fieldOptions]);

  // 키별 디바운스 타이머 및 최신 값 저장
  // timersRef.current[key] = { timer: TimeoutId, value: latestValue }
  const timersRef = useRef({});

  const onChangeDebounced = useCallback((key, newValue, delay = 300) => {
    // 즉시 UI 반영 (타이핑 지연 제거)
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, value: newValue } : e)));

    // 내부 타이머만 유지 (flushPending/handleBlur 호환성)
    if (timersRef.current[key]?.timer) clearTimeout(timersRef.current[key].timer);
    const timer = setTimeout(() => {
      // 타이머 만료시 pending 표시는 제거 (이미 값은 반영되어 있음)
      delete timersRef.current[key];
    }, delay);
    timersRef.current[key] = { timer, value: newValue };
  }, [setEntries]);

  const handleBlur = useCallback((key) => {
    if (timersRef.current[key]) {
      clearTimeout(timersRef.current[key].timer);
      const pendingValue = timersRef.current[key].value;
      delete timersRef.current[key];
      setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, value: pendingValue } : e)));
      return;
    }
    // 기존 동작 (예: 포맷 변경)
    setEntries((prev) =>
      prev.map((e) => {
        if (e.key === key && e.field === "위치") {
          return { ...e, value: (e.value || "").replace(/(\d+)-(\d+)/g, "$1동$2호") };
        }
        return e;
      })
    );
  }, [setEntries]);

  // 외부에서 pending 디바운스값을 즉시 적용하도록 노출
  useImperativeHandle(ref, () => ({
    flushPending: () => {
      const pending = { ...timersRef.current };
      Object.keys(pending).forEach((k) => {
        try {
          if (pending[k].timer) clearTimeout(pending[k].timer);
        } catch (e) {}
      });
      // 한번에 적용
      setEntries((prev) =>
        prev.map((e) => {
          if (pending[e.key]) return { ...e, value: pending[e.key].value };
          return e;
        })
      );
      timersRef.current = {};
    },
  }), []); // stable handle

  // 컴포넌트 렌더링은 동일
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        marginBottom: 6,
      }}
    >
      {entries.map((entry) => (
        <MemoEntryRow
          key={entry.key}
          entry={entry}
          options={optionsMap[entry.field] || []}
          onChangeDebounced={onChangeDebounced}
          onBlur={handleBlur}
        />
      ))}
    </div>
  );
};

export default React.memo(forwardRef(InputFormImpl));
