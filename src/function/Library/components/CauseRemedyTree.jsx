import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  HelpCircle,
  Wrench,
  Check,
  Plus,
  Trash2,
  Edit3,
  X,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  RotateCw,
  Copy,
  CheckCheck,
  Sparkles,
  Loader2,
  FolderOpen,
  FolderClosed,
  AlertCircle
} from "lucide-react";

/**
 * Tách và phân tích dữ liệu nguyên nhân & hướng khắc phục thành cấu trúc cây phân cấp
 * Giữ nguyên số thứ tự (order/ID) của từng nguyên nhân và hướng khắc phục
 */
export const parseCausesAndRemedies = (
  rawNguyenNhan = "",
  rawHuongKhacPhuc = "",
  prevCauses = []
) => {
  const causes = [];

  // Tạo map lưu lại trạng thái và ID cũ nếu có
  const prevMap = new Map();
  if (Array.isArray(prevCauses)) {
    prevCauses.forEach((c, idx) => {
      prevMap.set(idx, c);
      if (c.id) prevMap.set(c.id, c);
      if (c.title) prevMap.set(c.title.trim().toLowerCase(), c);
    });
  }

  // Tách các dòng của nguyên nhân
  const rawCauseLines = (rawNguyenNhan || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Tách các dòng của hướng khắc phục
  const rawRemedyLines = (rawHuongKhacPhuc || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Kiểm tra xem rawHuongKhacPhuc có chia theo nhóm [Nguyên nhân X] hay không
  const hasSections = rawRemedyLines.some((l) => /^\[(nguyên nhân|nguyen nhan|cause)/i.test(l));

  if (hasSections) {
    let currentCause = null;

    rawRemedyLines.forEach((line) => {
      const sectionMatch = line.match(/^\[(?:nguyên nhân|nguyen nhan|cause)\s*(\d*)[:\-]?\s*(.*?)\]/i);
      if (sectionMatch) {
        const parsedOrder = sectionMatch[1] ? parseInt(sectionMatch[1], 10) : causes.length + 1;
        const causeTitle = sectionMatch[2]?.trim() || `Nguyên nhân ${parsedOrder}`;
        const prev = prevMap.get(causes.length) || prevMap.get(causeTitle.toLowerCase());

        currentCause = {
          id: prev?.id || `cause_${causes.length}_${Math.random().toString(36).substr(2, 6)}`,
          order: parsedOrder,
          title: causeTitle,
          remedies: [],
          isExpanded: prev ? prev.isExpanded : true,
        };
        causes.push(currentCause);
      } else if (line) {
        if (!currentCause) {
          const defaultTitle = rawCauseLines[0] || "Nguyên nhân chính";
          const prev = prevMap.get(0);
          currentCause = {
            id: prev?.id || `cause_0_${Math.random().toString(36).substr(2, 6)}`,
            order: 1,
            title: defaultTitle,
            remedies: [],
            isExpanded: prev ? prev.isExpanded : true,
          };
          causes.push(currentCause);
        }

        // Bóc tách số thứ tự của hướng nếu có trong chuỗi (VD: "3. Kiểm tra...", "Hướng 3: ...")
        const matchRemedyOrder = line.match(/^(?:(?:hướng|huong|bước|buoc|ý|y)\s*(\d+)|(\d+)[\.\)\/\-])/i);
        const parsedRemedyOrder = matchRemedyOrder
          ? parseInt(matchRemedyOrder[1] || matchRemedyOrder[2], 10)
          : currentCause.remedies.length + 1;

        const cleanRemedy = line
          .replace(/^(hướng|huong|bước|buoc|ý|y)\s*\d+[\s:.-]*/i, "")
          .replace(/^\d+[\.\)\/\-]\s*/, "")
          .replace(/^[\-\*\•\+]\s*/, "")
          .trim();

        if (cleanRemedy) {
          currentCause.remedies.push({
            id: `rem_${currentCause.id}_${parsedRemedyOrder}_${Math.random().toString(36).substr(2, 6)}`,
            order: parsedRemedyOrder,
            text: cleanRemedy,
          });
        }
      }
    });

    // Bổ sung các nguyên nhân trong rawNguyenNhan nếu chưa có trong causes
    if (rawCauseLines.length > causes.length) {
      rawCauseLines.slice(causes.length).forEach((line, idx) => {
        const matchCauseOrder = line.match(/^(?:(?:nguyên nhân|nguyen nhan|ý|y)\s*(\d+)|(\d+)[\.\)\/\-])/i);
        const parsedCauseOrder = matchCauseOrder
          ? parseInt(matchCauseOrder[1] || matchCauseOrder[2], 10)
          : causes.length + 1;

        const cleanCause = line
          .replace(/^(nguyên nhân|nguyen nhan|ý|y)\s*\d+[\s:.-]*/i, "")
          .replace(/^\d+[\.\)\/\-]\s*/, "")
          .replace(/^[\-\*\•\+]\s*/, "")
          .trim();

        const globalIdx = causes.length;
        const prev = prevMap.get(globalIdx);

        causes.push({
          id: prev?.id || `cause_extra_${globalIdx}_${Math.random().toString(36).substr(2, 6)}`,
          order: parsedCauseOrder,
          title: cleanCause || line,
          remedies: [],
          isExpanded: prev ? prev.isExpanded : true,
        });
      });
    }
  } else {
    // Dữ liệu phẳng thông thường
    const parsedCauses = rawCauseLines.map((line, idx) => {
      const matchCauseOrder = line.match(/^(?:(?:nguyên nhân|nguyen nhan|ý|y)\s*(\d+)|(\d+)[\.\)\/\-])/i);
      const parsedCauseOrder = matchCauseOrder
        ? parseInt(matchCauseOrder[1] || matchCauseOrder[2], 10)
        : idx + 1;

      const cleanCause = line
        .replace(/^(nguyên nhân|nguyen nhan|ý|y)\s*\d+[\s:.-]*/i, "")
        .replace(/^\d+[\.\)\/\-]\s*/, "")
        .replace(/^[\-\*\•\+]\s*/, "")
        .trim();

      const prev = prevMap.get(idx);

      return {
        id: prev?.id || `cause_${idx}_${Math.random().toString(36).substr(2, 6)}`,
        order: parsedCauseOrder,
        title: cleanCause || line,
        remedies: [],
        isExpanded: prev ? prev.isExpanded : true,
      };
    });

    // Nếu không có nguyên nhân nào được nhập
    if (parsedCauses.length === 0) {
      const prev = prevMap.get(0);
      parsedCauses.push({
        id: prev?.id || `cause_default_${Math.random().toString(36).substr(2, 6)}`,
        order: 1,
        title: "Nguyên nhân ghi nhận từ thiết bị",
        remedies: [],
        isExpanded: prev ? prev.isExpanded : true,
      });
    }

    const parsedRemedies = rawRemedyLines.map((line, idx) => {
      const matchRemedyOrder = line.match(/^(?:(?:hướng|huong|bước|buoc|ý|y)\s*(\d+)|(\d+)[\.\)\/\-])/i);
      const parsedRemedyOrder = matchRemedyOrder
        ? parseInt(matchRemedyOrder[1] || matchRemedyOrder[2], 10)
        : idx + 1;

      const cleanRemedy = line
        .replace(/^(hướng|huong|bước|buoc|ý|y)\s*\d+[\s:.-]*/i, "")
        .replace(/^\d+[\.\)\/\-]\s*/, "")
        .replace(/^[\-\*\•\+]\s*/, "")
        .trim();

      return {
        id: `rem_init_${parsedRemedyOrder}_${Math.random().toString(36).substr(2, 6)}`,
        order: parsedRemedyOrder,
        text: cleanRemedy || line,
      };
    });

    // Gán toàn bộ hướng khắc phục vào nguyên nhân đầu tiên
    parsedCauses[0].remedies = parsedRemedies;
    causes.push(...parsedCauses);
  }

  return causes;
};

/**
 * Chuyển đổi dữ liệu cây phân cấp thành chuỗi để lưu vào Supabase
 * Giữ nguyên số thứ tự (order) của từng nguyên nhân và từng hướng
 */
export const serializeCausesAndRemedies = (causes = []) => {
  // 1. Chuỗi nguyen_nhan
  const nguyen_nhan = causes
    .map((c, i) => {
      const order = c.order ?? (i + 1);
      const title = c.title.trim();
      return title ? `${order}. ${title}` : "";
    })
    .filter(Boolean)
    .join("\n");

  // 2. Chuỗi huong_khac_phuc
  let huong_khac_phuc = "";
  if (causes.length <= 1) {
    // Chỉ có 1 nguyên nhân -> lưu dạng danh sách số đơn giản
    const firstRemedies = causes[0]?.remedies || [];
    huong_khac_phuc = firstRemedies
      .map((r, i) => {
        const order = r.order ?? (i + 1);
        const txt = r.text.trim();
        return txt ? `${order}. ${txt}` : "";
      })
      .filter(Boolean)
      .join("\n");
  } else {
    // Có nhiều nguyên nhân -> lưu kèm nhóm [Nguyên nhân X: ...]
    huong_khac_phuc = causes
      .map((c, i) => {
        const cOrder = c.order ?? (i + 1);
        const cTitle = c.title.trim() || `Nguyên nhân ${cOrder}`;
        const remediesText = c.remedies
          .map((r, ri) => {
            const rOrder = r.order ?? (ri + 1);
            const txt = r.text.trim();
            return txt ? `${rOrder}. ${txt}` : "";
          })
          .filter(Boolean)
          .join("\n");

        if (!remediesText) {
          return `[Nguyên nhân ${cOrder}: ${cTitle}]`;
        }
        return `[Nguyên nhân ${cOrder}: ${cTitle}]\n${remediesText}`;
      })
      .filter(Boolean)
      .join("\n\n");
  }

  return { nguyen_nhan, huong_khac_phuc };
};

export default function CauseRemedyTree({
  rawNguyenNhan = "",
  rawHuongKhacPhuc = "",
  onSave,
  onReload,
  isReloading = false,
  storageKey = "",
}) {
  const [causes, setCauses] = useState([]);
  const [checkedMap, setCheckedMap] = useState({});
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Ref lưu giá trị serialization gần nhất để tránh re-parse khi prop thay đổi do chính component lưu
  const lastSerializedRef = useRef({
    nguyen_nhan: null,
    huong_khac_phuc: null,
  });

  // States thêm / sửa nguyên nhân
  const [newCauseTitle, setNewCauseTitle] = useState("");
  const [editingCauseId, setEditingCauseId] = useState(null);
  const [editCauseTitle, setEditCauseTitle] = useState("");
  const [editCauseOrder, setEditCauseOrder] = useState(1);

  // States thêm / sửa hướng khắc phục
  const [newRemedyInputs, setNewRemedyInputs] = useState({}); // { [causeId]: string }
  const [editingRemedyId, setEditingRemedyId] = useState(null);
  const [editRemedyText, setEditRemedyText] = useState("");
  const [editRemedyOrder, setEditRemedyOrder] = useState(1);

  // Nạp dữ liệu khi prop raw thay đổi từ bên ngoài
  useEffect(() => {
    if (
      lastSerializedRef.current.nguyen_nhan === rawNguyenNhan &&
      lastSerializedRef.current.huong_khac_phuc === rawHuongKhacPhuc
    ) {
      return;
    }

    lastSerializedRef.current = {
      nguyen_nhan: rawNguyenNhan,
      huong_khac_phuc: rawHuongKhacPhuc,
    };

    setCauses((prev) => parseCausesAndRemedies(rawNguyenNhan, rawHuongKhacPhuc, prev));
  }, [rawNguyenNhan, rawHuongKhacPhuc]);

  // Nạp trạng thái tick từ localStorage
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(`pwc_remedy_ticks_${storageKey}`);
      if (saved) {
        setCheckedMap(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Lỗi đọc localStorage ticks:", e);
    }
  }, [storageKey]);

  // Lưu trạng thái tick vào localStorage
  const saveTicksToStorage = (newMap) => {
    setCheckedMap(newMap);
    if (storageKey) {
      try {
        localStorage.setItem(`pwc_remedy_ticks_${storageKey}`, JSON.stringify(newMap));
      } catch (e) {
        console.error("Lỗi lưu localStorage ticks:", e);
      }
    }
  };

  // Lưu thay đổi lên CSDL
  const commitChanges = async (newCauses) => {
    setCauses(newCauses);
    const { nguyen_nhan, huong_khac_phuc } = serializeCausesAndRemedies(newCauses);
    lastSerializedRef.current = { nguyen_nhan, huong_khac_phuc };

    if (onSave) {
      try {
        setIsSaving(true);
        await onSave({ nguyen_nhan, huong_khac_phuc });
      } catch (err) {
        console.error("Lỗi khi lưu CSDL:", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // -------------------------------------------------------------
  // THAO TÁC NGUYÊN NHÂN
  // -------------------------------------------------------------
  const handleToggleExpandCause = (causeId) => {
    setCauses((prev) =>
      prev.map((c) => (c.id === causeId ? { ...c, isExpanded: !c.isExpanded } : c))
    );
  };

  const handleExpandAll = () => {
    setCauses((prev) => prev.map((c) => ({ ...c, isExpanded: true })));
  };

  const handleCollapseAll = () => {
    setCauses((prev) => prev.map((c) => ({ ...c, isExpanded: false })));
  };

  const handleAddCause = async (e) => {
    e?.preventDefault();
    const title = newCauseTitle.trim();
    if (!title) return;

    const maxOrder = causes.length > 0 ? Math.max(...causes.map((c) => c.order || 0)) : 0;
    const nextOrder = maxOrder + 1;

    const newCause = {
      id: `cause_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      order: nextOrder,
      title,
      remedies: [],
      isExpanded: true,
    };

    const newCauses = [...causes, newCause];
    setNewCauseTitle("");
    await commitChanges(newCauses);
  };

  const handleStartEditCause = (cause) => {
    setEditingCauseId(cause.id);
    setEditCauseTitle(cause.title);
    setEditCauseOrder(cause.order || 1);
  };

  const handleSaveEditCause = async (causeId) => {
    const title = editCauseTitle.trim();
    if (!title) {
      handleDeleteCause(causeId);
      return;
    }
    const newCauses = causes.map((c) =>
      c.id === causeId
        ? { ...c, title, order: parseInt(editCauseOrder, 10) || c.order || 1 }
        : c
    );
    setEditingCauseId(null);
    setEditCauseTitle("");
    await commitChanges(newCauses);
  };

  const handleDeleteCause = async (causeId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nguyên nhân này cùng các hướng khắc phục bên trong?")) {
      return;
    }
    // Xóa nguyên nhân nhưng giữ nguyên số thứ tự (order) của các nguyên nhân còn lại
    const newCauses = causes.filter((c) => c.id !== causeId);
    await commitChanges(newCauses);
  };

  const handleMoveCauseUp = async (index) => {
    if (index <= 0) return;
    const newCauses = [...causes];
    const temp = newCauses[index - 1];
    newCauses[index - 1] = newCauses[index];
    newCauses[index] = temp;
    await commitChanges(newCauses);
  };

  const handleMoveCauseDown = async (index) => {
    if (index >= causes.length - 1) return;
    const newCauses = [...causes];
    const temp = newCauses[index + 1];
    newCauses[index + 1] = newCauses[index];
    newCauses[index] = temp;
    await commitChanges(newCauses);
  };

  // -------------------------------------------------------------
  // THAO TÁC HƯỚNG KHẮC PHỤC (REMEDY)
  // -------------------------------------------------------------
  const handleToggleCheckRemedy = (remedyKey) => {
    const newMap = {
      ...checkedMap,
      [remedyKey]: !checkedMap[remedyKey],
    };
    saveTicksToStorage(newMap);
  };

  const handleCheckAll = () => {
    const newMap = {};
    causes.forEach((c) => {
      c.remedies.forEach((r) => {
        newMap[r.id] = true;
      });
    });
    saveTicksToStorage(newMap);
  };

  const handleUncheckAll = () => {
    saveTicksToStorage({});
  };

  const handleAddRemedy = async (causeId) => {
    const text = (newRemedyInputs[causeId] || "").trim();
    if (!text) return;

    const targetCause = causes.find((c) => c.id === causeId);
    const maxOrder =
      targetCause && targetCause.remedies.length > 0
        ? Math.max(...targetCause.remedies.map((r) => r.order || 0))
        : 0;
    const nextOrder = maxOrder + 1;

    const newRemedy = {
      id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      order: nextOrder,
      text,
    };

    const newCauses = causes.map((c) => {
      if (c.id === causeId) {
        return {
          ...c,
          isExpanded: true,
          remedies: [...c.remedies, newRemedy],
        };
      }
      return c;
    });

    setNewRemedyInputs((prev) => ({ ...prev, [causeId]: "" }));
    await commitChanges(newCauses);
  };

  const handleStartEditRemedy = (remedy) => {
    setEditingRemedyId(remedy.id);
    setEditRemedyText(remedy.text);
    setEditRemedyOrder(remedy.order || 1);
  };

  const handleSaveEditRemedy = async (causeId, remedyId) => {
    const text = editRemedyText.trim();
    if (!text) {
      handleDeleteRemedy(causeId, remedyId);
      return;
    }

    const newCauses = causes.map((c) => {
      if (c.id === causeId) {
        return {
          ...c,
          remedies: c.remedies.map((r) =>
            r.id === remedyId
              ? { ...r, text, order: parseInt(editRemedyOrder, 10) || r.order || 1 }
              : r
          ),
        };
      }
      return c;
    });

    setEditingRemedyId(null);
    setEditRemedyText("");
    await commitChanges(newCauses);
  };

  const handleDeleteRemedy = async (causeId, remedyId) => {
    // Khi xóa 1 hướng, giữ nguyên số thứ tự (order) của các hướng còn lại, KHÔNG tự động tuột số thứ tự
    const newCauses = causes.map((c) => {
      if (c.id === causeId) {
        return {
          ...c,
          remedies: c.remedies.filter((r) => r.id !== remedyId),
        };
      }
      return c;
    });

    // Xóa tick state
    const newCheckedMap = { ...checkedMap };
    delete newCheckedMap[remedyId];
    saveTicksToStorage(newCheckedMap);

    await commitChanges(newCauses);
  };

  const handleMoveRemedyUp = async (causeId, remedyIndex) => {
    if (remedyIndex <= 0) return;
    const newCauses = causes.map((c) => {
      if (c.id === causeId) {
        const newRemedies = [...c.remedies];
        const temp = newRemedies[remedyIndex - 1];
        newRemedies[remedyIndex - 1] = newRemedies[remedyIndex];
        newRemedies[remedyIndex] = temp;
        return { ...c, remedies: newRemedies };
      }
      return c;
    });
    await commitChanges(newCauses);
  };

  const handleMoveRemedyDown = async (causeId, remedyIndex) => {
    const targetCause = causes.find((c) => c.id === causeId);
    if (!targetCause || remedyIndex >= targetCause.remedies.length - 1) return;

    const newCauses = causes.map((c) => {
      if (c.id === causeId) {
        const newRemedies = [...c.remedies];
        const temp = newRemedies[remedyIndex + 1];
        newRemedies[remedyIndex + 1] = newRemedies[remedyIndex];
        newRemedies[remedyIndex] = temp;
        return { ...c, remedies: newRemedies };
      }
      return c;
    });
    await commitChanges(newCauses);
  };

  // Sao chép toàn bộ cây nội dung
  const handleCopyAll = () => {
    if (causes.length === 0) return;
    let result = "";
    causes.forEach((c, ci) => {
      const cOrder = c.order ?? (ci + 1);
      result += `\n📌 NGUYÊN NHÂN ${cOrder}: ${c.title}\n`;
      if (c.remedies.length === 0) {
        result += `   (Chưa có hướng khắc phục)\n`;
      } else {
        c.remedies.forEach((r, ri) => {
          const rOrder = r.order ?? (ri + 1);
          const isDone = !!checkedMap[r.id];
          result += `   ${isDone ? "[x]" : "[ ]"} Hướng ${rOrder}: ${r.text}\n`;
        });
      }
    });

    navigator.clipboard.writeText(result.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Tính tổng số lượng hướng khắc phục và tiến độ
  const totalRemedies = useMemo(() => {
    return causes.reduce((acc, c) => acc + c.remedies.length, 0);
  }, [causes]);

  const completedRemedies = useMemo(() => {
    let count = 0;
    causes.forEach((c) => {
      c.remedies.forEach((r) => {
        if (checkedMap[r.id]) count++;
      });
    });
    return count;
  }, [causes, checkedMap]);

  const progressPercent =
    totalRemedies > 0 ? Math.round((completedRemedies / totalRemedies) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* HEADER: Tiêu đề + Tiến độ + Nút thao tác nhanh */}
      <div className="flex flex-col gap-4 rounded-3xl border border-amber-200/90 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-blue-50/80 p-4 md:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-lg shadow-amber-500/25 ring-4 ring-amber-100">
              <HelpCircle size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black text-[#183f82] flex items-center gap-2">
                Phân tích Nguyên nhân & Hướng khắc phục
                {isSaving && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 animate-pulse">
                    <Loader2 size={13} className="animate-spin text-blue-600" /> Đang lưu...
                  </span>
                )}
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Mỗi nguyên nhân đi kèm danh sách các hướng xử lý cụ thể. Số thứ tự được cố định riêng biệt cho từng mục.
              </p>
            </div>
          </div>

          {/* Cụm nút thao tác nhanh */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            {onReload && (
              <button
                type="button"
                onClick={onReload}
                disabled={isReloading}
                title="Tải lại dữ liệu mới nhất từ CSDL"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-slate-700 shadow-sm transition-all hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 active:scale-95 disabled:opacity-50"
              >
                <RotateCw
                  size={15}
                  strokeWidth={2.5}
                  className={isReloading ? "animate-spin text-blue-600" : ""}
                />
                <span>{isReloading ? "Đang tải..." : "Làm mới"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExpandAll}
              title="Mở rộng tất cả nguyên nhân"
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-amber-800 shadow-sm transition-all hover:bg-amber-50 hover:border-amber-400 active:scale-95"
            >
              <FolderOpen size={15} />
              <span>Mở rộng</span>
            </button>

            <button
              type="button"
              onClick={handleCollapseAll}
              title="Thu gọn tất cả nguyên nhân"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-slate-700 shadow-sm transition-all hover:bg-slate-100 active:scale-95"
            >
              <FolderClosed size={15} />
              <span>Thu gọn</span>
            </button>

            {totalRemedies > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleCheckAll}
                  title="Đánh dấu hoàn tất tất cả hướng xử lý"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-emerald-700 shadow-sm transition-all hover:bg-emerald-600 hover:text-white hover:border-emerald-600 active:scale-95"
                >
                  <CheckCheck size={16} strokeWidth={2.5} />
                  <span>Chọn hết</span>
                </button>

                <button
                  type="button"
                  onClick={handleUncheckAll}
                  title="Đặt lại trạng thái kiểm tra"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-rose-700 shadow-sm transition-all hover:bg-rose-600 hover:text-white hover:border-rose-600 active:scale-95"
                >
                  <RotateCcw size={15} strokeWidth={2.5} />
                  <span>Bỏ chọn</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyAll}
                  title="Sao chép toàn bộ danh sách"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-blue-700 shadow-sm transition-all hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95"
                >
                  <Copy size={15} strokeWidth={2.5} />
                  <span>{copied ? "Đã sao chép!" : "Sao chép"}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* THANH TIẾN ĐỘ THỰC HIỆN TOÀN CỤC */}
        {totalRemedies > 0 && (
          <div className="mt-1 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#1d478d] flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                Tiến độ thực hiện hướng khắc phục:{" "}
                <span className="font-extrabold text-blue-700">
                  {completedRemedies}/{totalRemedies} hướng
                </span>
                <span className="text-slate-400 font-normal">
                  ({causes.length} nguyên nhân)
                </span>
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold shadow-sm ${
                  progressPercent === 100
                    ? "bg-emerald-500 text-white shadow-emerald-500/20"
                    : progressPercent > 0
                    ? "bg-blue-600 text-white shadow-blue-500/20"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {progressPercent}% Hoàn tất
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200/90 p-0.5 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progressPercent === 100
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-400/50"
                    : "bg-gradient-to-r from-amber-500 via-sky-500 to-blue-600 shadow-sm shadow-blue-400/50"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* DANH SÁCH CÁC NGUYÊN NHÂN & HƯỚNG KHẮC PHỤC XỔ RA */}
      <div className="space-y-4">
        {causes.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-amber-200 bg-amber-50/40 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-inner">
              <HelpCircle size={28} strokeWidth={2.2} />
            </div>
            <p className="mt-3 text-sm font-bold text-slate-700">
              Chưa có phân tích nguyên nhân cho sự cố này.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Nhập nguyên nhân vào ô bên dưới để bắt đầu thiết lập các hướng khắc phục tương ứng.
            </p>
          </div>
        ) : (
          causes.map((cause, cIndex) => {
            const causeDisplayNum = String(cause.order ?? (cIndex + 1)).padStart(2, "0");
            const isEditingCause = editingCauseId === cause.id;
            const causeCompletedCount = cause.remedies.filter((r) => checkedMap[r.id]).length;
            const isCauseAllDone =
              cause.remedies.length > 0 && causeCompletedCount === cause.remedies.length;

            return (
              <div
                key={cause.id}
                className={`rounded-3xl border-2 transition-all duration-200 shadow-sm overflow-hidden ${
                  isCauseAllDone
                    ? "border-emerald-300 bg-emerald-50/30"
                    : cause.isExpanded
                    ? "border-amber-300/80 bg-white shadow-md"
                    : "border-slate-200 bg-white hover:border-amber-300"
                }`}
              >
                {/* HEADER NGUYÊN NHÂN */}
                <div
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 md:p-5 border-b transition-colors ${
                    cause.isExpanded
                      ? "bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-white border-amber-200/80"
                      : "bg-slate-50/60 border-transparent hover:bg-amber-50/40 cursor-pointer"
                  }`}
                >
                  <div
                    className="flex flex-1 items-start sm:items-center gap-3 min-w-0 cursor-pointer"
                    onClick={() => handleToggleExpandCause(cause.id)}
                  >
                    {/* Nút Toggle Chevron */}
                    <button
                      type="button"
                      className="mt-0.5 sm:mt-0 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100/90 text-amber-800 transition hover:bg-amber-200"
                    >
                      {cause.isExpanded ? (
                        <ChevronUp size={18} strokeWidth={2.5} />
                      ) : (
                        <ChevronDown size={18} strokeWidth={2.5} />
                      )}
                    </button>

                    {/* Badge Nguyên Nhân với số thứ tự riêng biệt */}
                    <span className="shrink-0 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 text-xs font-black tracking-wider uppercase shadow-xs">
                      NGUYÊN NHÂN {causeDisplayNum}
                    </span>

                    {/* Tiêu đề Nguyên Nhân hoặc Input Sửa */}
                    <div className="flex-1 min-w-0" onClick={(e) => isEditingCause && e.stopPropagation()}>
                      {isEditingCause ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-500">Số:</span>
                            <input
                              type="number"
                              value={editCauseOrder}
                              onChange={(e) => setEditCauseOrder(e.target.value)}
                              className="w-14 rounded-lg border border-slate-300 px-2 py-1 text-xs font-bold text-center"
                              title="Số thứ tự nguyên nhân"
                            />
                          </div>
                          <input
                            type="text"
                            value={editCauseTitle}
                            onChange={(e) => setEditCauseTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEditCause(cause.id);
                              if (e.key === "Escape") setEditingCauseId(null);
                            }}
                            autoFocus
                            className="flex-1 min-w-[200px] rounded-xl border-2 border-amber-500 bg-white px-3 py-1 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-500/20 shadow-inner"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditCause(cause.id)}
                            className="rounded-xl bg-amber-600 px-3 py-1 text-xs font-bold text-white shadow hover:bg-amber-700"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCauseId(null)}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm md:text-base font-extrabold text-slate-900 leading-snug">
                            {cause.title}
                          </h4>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                            {cause.remedies.length} hướng khắc phục
                          </span>
                          {cause.remedies.length > 0 && (
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                                isCauseAllDone
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {causeCompletedCount}/{cause.remedies.length} đã thực hiện
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Nút Thao Tác Nguyên Nhân */}
                  {!isEditingCause && (
                    <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
                      <button
                        type="button"
                        disabled={cIndex === 0}
                        onClick={() => handleMoveCauseUp(cIndex)}
                        title="Di chuyển nguyên nhân lên"
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 active:scale-90 disabled:opacity-20 disabled:pointer-events-none"
                      >
                        <ArrowUp size={15} strokeWidth={2.5} />
                      </button>

                      <button
                        type="button"
                        disabled={cIndex === causes.length - 1}
                        onClick={() => handleMoveCauseDown(cIndex)}
                        title="Di chuyển nguyên nhân xuống"
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 active:scale-90 disabled:opacity-20 disabled:pointer-events-none"
                      >
                        <ArrowDown size={15} strokeWidth={2.5} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartEditCause(cause)}
                        title="Sửa tên nguyên nhân"
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700 shadow-xs transition hover:bg-amber-600 hover:text-white active:scale-90"
                      >
                        <Edit3 size={14} strokeWidth={2.5} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCause(cause.id)}
                        title="Xóa nguyên nhân này"
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 shadow-xs transition hover:bg-rose-600 hover:text-white active:scale-90"
                      >
                        <Trash2 size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                </div>

                {/* NỘI DUNG XỔ RA: DANH SÁCH CÁC HƯỚNG KHẮC PHỤC (REMEDIES) */}
                {cause.isExpanded && (
                  <div className="p-4 md:p-6 bg-slate-50/50 space-y-3.5 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider pb-1">
                      <span className="flex items-center gap-1.5 text-blue-700">
                        <Wrench size={14} /> Danh sách hướng khắc phục cho Nguyên nhân {causeDisplayNum}:
                      </span>
                      <span>{cause.remedies.length} hướng</span>
                    </div>

                    {cause.remedies.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center text-xs text-slate-400">
                        Chưa có hướng khắc phục nào cho nguyên nhân này. Hãy thêm ở ô bên dưới!
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {cause.remedies.map((remedy, rIndex) => {
                          const isCompleted = !!checkedMap[remedy.id];
                          const isEditingRemedy = editingRemedyId === remedy.id;
                          const remedyDisplayNum = String(remedy.order ?? (rIndex + 1)).padStart(2, "0");

                          return (
                            <div
                              key={remedy.id}
                              className={`group flex flex-col sm:flex-row sm:items-start justify-between gap-3 rounded-2xl border-2 p-3.5 transition-all duration-200 shadow-xs ${
                                isCompleted
                                  ? "border-emerald-300 bg-emerald-50/80 hover:border-emerald-400"
                                  : "border-blue-100 bg-white hover:border-blue-300 hover:shadow-sm"
                              }`}
                            >
                              {/* Left: Checkbox + HƯỚNG badge + Text */}
                              <div className="flex flex-1 items-start gap-3">
                                {/* Checkbox */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleCheckRemedy(remedy.id)}
                                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border-2 transition-all active:scale-90 ${
                                    isCompleted
                                      ? "border-emerald-500 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30 scale-105"
                                      : "border-slate-300 bg-white text-transparent hover:border-blue-500 hover:bg-blue-50"
                                  }`}
                                >
                                  <Check
                                    size={18}
                                    strokeWidth={3.5}
                                    className={isCompleted ? "opacity-100" : "opacity-0"}
                                  />
                                </button>

                                {/* Badge: HƯỚNG XX (Cố định theo số thứ tự riêng) */}
                                <span
                                  className={`shrink-0 inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-black tracking-wide uppercase border shadow-xs ${
                                    isCompleted
                                      ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                                      : "border-blue-200 bg-blue-100 text-blue-900"
                                  }`}
                                >
                                  HƯỚNG {remedyDisplayNum}
                                </span>

                                {/* Text hoặc Edit Box */}
                                <div className="flex-1 min-w-0 pt-0.5">
                                  {isEditingRemedy ? (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-500">Số hướng:</span>
                                        <input
                                          type="number"
                                          value={editRemedyOrder}
                                          onChange={(e) => setEditRemedyOrder(e.target.value)}
                                          className="w-14 rounded-lg border border-slate-300 px-2 py-1 text-xs font-bold text-center"
                                          title="Số thứ tự hướng"
                                        />
                                      </div>
                                      <textarea
                                        rows={2}
                                        value={editRemedyText}
                                        onChange={(e) => setEditRemedyText(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSaveEditRemedy(cause.id, remedy.id);
                                          } else if (e.key === "Escape") {
                                            setEditingRemedyId(null);
                                          }
                                        }}
                                        autoFocus
                                        className="w-full rounded-xl border-2 border-blue-500 bg-white p-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-inner"
                                      />
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleSaveEditRemedy(cause.id, remedy.id)}
                                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-blue-700"
                                        >
                                          <Check size={14} /> Lưu
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingRemedyId(null)}
                                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                        >
                                          <X size={14} /> Hủy
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p
                                      onClick={() => handleToggleCheckRemedy(remedy.id)}
                                      className={`text-sm font-semibold leading-relaxed cursor-pointer select-text ${
                                        isCompleted
                                          ? "text-emerald-950 line-through decoration-emerald-600/70 decoration-2 opacity-80"
                                          : "text-slate-800"
                                      }`}
                                    >
                                      {remedy.text}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Right: Remedy action buttons */}
                              {!isEditingRemedy && (
                                <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
                                  <button
                                    type="button"
                                    disabled={rIndex === 0}
                                    onClick={() => handleMoveRemedyUp(cause.id, rIndex)}
                                    title="Di chuyển hướng lên"
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-20 disabled:pointer-events-none"
                                  >
                                    <ArrowUp size={14} strokeWidth={2.5} />
                                  </button>

                                  <button
                                    type="button"
                                    disabled={rIndex === cause.remedies.length - 1}
                                    onClick={() => handleMoveRemedyDown(cause.id, rIndex)}
                                    title="Di chuyển hướng xuống"
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-20 disabled:pointer-events-none"
                                  >
                                    <ArrowDown size={14} strokeWidth={2.5} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleStartEditRemedy(remedy)}
                                    title="Sửa hướng khắc phục"
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white"
                                  >
                                    <Edit3 size={13} strokeWidth={2.5} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Xóa Hướng ${remedy.order || rIndex + 1}?`)) {
                                        handleDeleteRemedy(cause.id, remedy.id);
                                      }
                                    }}
                                    title="Xóa hướng này"
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-600 hover:text-white"
                                  >
                                    <Trash2 size={13} strokeWidth={2.5} />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* FORM THÊM HƯỚNG KHẮC PHỤC CHO NGUYÊN NHÂN NÀY */}
                    <div className="pt-2">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAddRemedy(cause.id);
                        }}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl border-2 border-blue-200/80 bg-white p-2.5 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 transition-all shadow-xs"
                      >
                        <div className="flex flex-1 items-center gap-2 px-2">
                          <span className="shrink-0 rounded-lg bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-bold text-blue-800 uppercase">
                            HƯỚNG {String(
                              (cause.remedies.length > 0
                                ? Math.max(...cause.remedies.map((r) => r.order || 0))
                                : 0) + 1
                            ).padStart(2, "0")}
                          </span>
                          <input
                            type="text"
                            value={newRemedyInputs[cause.id] || ""}
                            onChange={(e) =>
                              setNewRemedyInputs({ ...newRemedyInputs, [cause.id]: e.target.value })
                            }
                            placeholder="Nhập hướng xử lý tiếp theo... (VD: Kiểm tra lại van kim, thay thế gioăng...)"
                            className="flex-1 bg-transparent text-xs md:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={!newRemedyInputs[cause.id]?.trim() || isSaving}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                        >
                          <Plus size={16} strokeWidth={3} />
                          <span>Thêm hướng khắc phục</span>
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* FORM THÊM NGUYÊN NHÂN MỚI (DƯỚI CÙNG) */}
      <div className="pt-2">
        <form
          onSubmit={handleAddCause}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-3xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-4 focus-within:border-amber-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-amber-500/15 transition-all"
        >
          <div className="flex flex-1 items-center gap-2.5 px-2">
            <span className="shrink-0 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 text-xs font-black uppercase shadow-xs">
              + NGUYÊN NHÂN {String(
                (causes.length > 0 ? Math.max(...causes.map((c) => c.order || 0)) : 0) + 1
              ).padStart(2, "0")}
            </span>
            <input
              type="text"
              value={newCauseTitle}
              onChange={(e) => setNewCauseTitle(e.target.value)}
              placeholder="Nhập tên nguyên nhân kỹ thuật mới... (VD: Áp lực nguồn nước đầu vào không ổn định)"
              className="flex-1 bg-transparent text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!newCauseTitle.trim() || isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-amber-500/25 transition-all hover:from-amber-600 hover:to-orange-600 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Plus size={18} strokeWidth={3} />
            <span>Thêm nguyên nhân mới</span>
          </button>
        </form>
      </div>
    </div>
  );
}
