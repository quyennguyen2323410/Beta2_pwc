import React, { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  RotateCw,
  Copy,
  CheckCheck,
  ListTodo,
  Sparkles,
  Info,
  Loader2,
} from "lucide-react";

/**
 * Phân tích chuỗi text nhiều dòng thành mảng các mục Todo
 */
export const parseTextToTodoList = (rawText = "") => {
  if (!rawText || !rawText.trim()) return [];

  // Tách theo dòng
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  return lines.map((line, index) => {
    let text = line;
    let initialCompleted = false;

    // Kiểm tra tiền tố markdown checklist
    if (/^-\s*\[x\]\s*/i.test(text)) {
      initialCompleted = true;
      text = text.replace(/^-\s*\[x\]\s*/i, "");
    } else if (/^-\s*\[\s*\]\s*/i.test(text)) {
      initialCompleted = false;
      text = text.replace(/^-\s*\[\s*\]\s*/i, "");
    } else {
      // Loại bỏ các tiền tố đánh số thông thường: "1.", "1/", "Bước 1:", "Ý 1:", "- ", "• ", "* "
      text = text
        .replace(/^(bước|buoc|ý|y|mục|muc)\s*\d+[\s:.-]*/i, "")
        .replace(/^\d+[\.\)\/\-]\s*/, "")
        .replace(/^[\-\*\•\+]\s*/, "")
        .trim();
    }

    return {
      id: `item_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      text: text || line,
      defaultCompleted: initialCompleted,
    };
  });
};

/**
 * Chuyển đổi danh sách Todo thành chuỗi lưu vào CSDL
 */
export const serializeTodoListToText = (items = [], prefix = "number") => {
  if (!items || items.length === 0) return "";
  return items
    .map((item, index) => {
      const cleanText = item.text.trim();
      if (!cleanText) return "";
      if (prefix === "number") {
        return `${index + 1}. ${cleanText}`;
      }
      return `- ${cleanText}`;
    })
    .filter(Boolean)
    .join("\n");
};

export default function IncidentTodoList({
  title,
  icon,
  badgePrefix = "Bước",
  rawText = "",
  onSave,
  onReload,
  isReloading = false,
  storageKey,
  placeholder = "Nhập nội dung tiếp theo...",
  emptyMessage = "Chưa có nội dung danh sách. Hãy thêm mục mới bên dưới!",
  itemColor = "blue", // "blue" | "indigo" | "amber"
}) {
  const [items, setItems] = useState([]);
  const [checkedMap, setCheckedMap] = useState({});
  const [newItemText, setNewItemText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Nạp danh sách items khi rawText thay đổi
  useEffect(() => {
    const parsed = parseTextToTodoList(rawText);
    setItems(parsed);
  }, [rawText]);

  // Nạp trạng thái tick từ localStorage nếu có storageKey
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(`pwc_ticks_${storageKey}`);
      if (saved) {
        setCheckedMap(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Lỗi đọc localStorage ticks:", e);
    }
  }, [storageKey]);

  // Lưu trạng thái tick vào localStorage khi thay đổi
  const saveTicksToStorage = (newCheckedMap) => {
    setCheckedMap(newCheckedMap);
    if (storageKey) {
      try {
        localStorage.setItem(`pwc_ticks_${storageKey}`, JSON.stringify(newCheckedMap));
      } catch (e) {
        console.error("Lỗi lưu localStorage ticks:", e);
      }
    }
  };

  // Toggle tick một mục
  const handleToggleCheck = (index) => {
    const newCheckedMap = {
      ...checkedMap,
      [index]: !checkedMap[index],
    };
    saveTicksToStorage(newCheckedMap);
  };

  // Tick tất cả
  const handleCheckAll = () => {
    const newMap = {};
    items.forEach((_, idx) => {
      newMap[idx] = true;
    });
    saveTicksToStorage(newMap);
  };

  // Bỏ tick tất cả (Reset)
  const handleUncheckAll = () => {
    saveTicksToStorage({});
  };

  // Lưu danh sách vào Database
  const commitChanges = async (newItems) => {
    setItems(newItems);
    const newText = serializeTodoListToText(newItems, "number");
    if (onSave) {
      try {
        setIsSaving(true);
        await onSave(newText);
      } catch (err) {
        console.error("Lỗi khi lưu Todo list:", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Thêm mục mới
  const handleAddItem = async (e) => {
    e?.preventDefault();
    const trimmed = newItemText.trim();
    if (!trimmed) return;

    const newItem = {
      id: `item_${items.length}_${Date.now()}`,
      text: trimmed,
      defaultCompleted: false,
    };

    const newItems = [...items, newItem];
    setNewItemText("");
    await commitChanges(newItems);
  };

  // Bắt đầu sửa một mục
  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  // Lưu chỉnh sửa một mục
  const handleSaveEdit = async (itemId) => {
    const trimmed = editText.trim();
    if (!trimmed) {
      // Nếu để trống thì xóa mục này
      handleDeleteItem(itemId);
      return;
    }

    const newItems = items.map((it) => (it.id === itemId ? { ...it, text: trimmed } : it));
    setEditingId(null);
    setEditText("");
    await commitChanges(newItems);
  };

  // Hủy sửa
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  // Xóa một mục
  const handleDeleteItem = async (itemId) => {
    const itemIndex = items.findIndex((it) => it.id === itemId);
    const newItems = items.filter((it) => it.id !== itemId);
    
    // Điều chỉnh lại checkedMap theo index mới
    const newCheckedMap = {};
    let newIdx = 0;
    items.forEach((it, oldIdx) => {
      if (it.id !== itemId) {
        if (checkedMap[oldIdx]) {
          newCheckedMap[newIdx] = true;
        }
        newIdx++;
      }
    });
    saveTicksToStorage(newCheckedMap);
    await commitChanges(newItems);
  };

  // Di chuyển lên
  const handleMoveUp = async (index) => {
    if (index <= 0) return;
    const newItems = [...items];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;

    // Hoán đổi trạng thái checked
    const newCheckedMap = { ...checkedMap };
    const curChecked = !!newCheckedMap[index];
    const prevChecked = !!newCheckedMap[index - 1];
    newCheckedMap[index - 1] = curChecked;
    newCheckedMap[index] = prevChecked;
    saveTicksToStorage(newCheckedMap);

    await commitChanges(newItems);
  };

  // Di chuyển xuống
  const handleMoveDown = async (index) => {
    if (index >= items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;

    // Hoán đổi trạng thái checked
    const newCheckedMap = { ...checkedMap };
    const curChecked = !!newCheckedMap[index];
    const nextChecked = !!newCheckedMap[index + 1];
    newCheckedMap[index + 1] = curChecked;
    newCheckedMap[index] = nextChecked;
    saveTicksToStorage(newCheckedMap);

    await commitChanges(newItems);
  };

  // Sao chép toàn bộ danh sách
  const handleCopyList = () => {
    if (items.length === 0) return;
    const formatted = items
      .map((item, idx) => {
        const isDone = !!checkedMap[idx];
        return `${isDone ? "[x]" : "[ ]"} ${badgePrefix} ${idx + 1}: ${item.text}`;
      })
      .join("\n");

    navigator.clipboard.writeText(formatted);
    setCopied(true);
    showToast("Đã sao chép danh sách vào bộ nhớ tạm");
    setTimeout(() => setCopied(false), 2000);
  };

  // Tính toán tiến độ
  const totalCount = items.length;
  const completedCount = useMemo(() => {
    return items.reduce((acc, _, idx) => (checkedMap[idx] ? acc + 1 : acc), 0);
  }, [items, checkedMap]);

  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* HEADER: Tiêu đề + Tiến độ + Nút thao tác nhanh */}
      <div className="flex flex-col gap-3.5 rounded-2xl border border-blue-200/90 bg-gradient-to-r from-blue-50/90 via-sky-50/60 to-indigo-50/80 p-4 md:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ring-4 ${
                badgePrefix === "Nguyên nhân"
                  ? "bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 shadow-amber-500/30 ring-amber-100"
                  : "bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 shadow-blue-500/30 ring-blue-100"
              }`}
            >
              {icon || <ListTodo size={22} strokeWidth={2.5} />}
            </div>
            <div>
              <h3 className="text-base md:text-lg font-extrabold text-[#183f82] flex items-center gap-2">
                {title}
                {isSaving && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 animate-pulse">
                    <Loader2 size={13} className="animate-spin text-blue-600" /> Đang lưu...
                  </span>
                )}
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Đánh dấu các mục đã kiểm tra/thực hiện để phục vụ phân tích nội suy sự cố
              </p>
            </div>
          </div>

          {/* Cụm nút thao tác nhanh với Icon nổi bật */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            {onReload && (
              <button
                type="button"
                onClick={onReload}
                disabled={isReloading}
                title="Tải lại dữ liệu mới nhất từ CSDL"
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-blue-700 shadow-sm transition-all hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95 disabled:opacity-50"
              >
                <RotateCw
                  size={15}
                  strokeWidth={2.5}
                  className={isReloading ? "animate-spin text-blue-600" : ""}
                />
                <span>{isReloading ? "Đang tải..." : "Làm mới"}</span>
              </button>
            )}

            {totalCount > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleCheckAll}
                  title="Đánh dấu hoàn tất tất cả"
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
                  onClick={handleCopyList}
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

        {/* THANH TIẾN ĐỘ THỰC HIỆN / NỘI SUY */}
        {totalCount > 0 && (
          <div className="mt-1 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#1d478d] flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                Tiến độ thực hiện:{" "}
                <span className="font-extrabold text-blue-700">
                  {completedCount}/{totalCount} {badgePrefix.toLowerCase()}
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
                    : "bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 shadow-sm shadow-blue-400/50"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* DANH SÁCH CÁC MỤC TODO */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-slate-50/70 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-inner">
              <ListTodo size={28} strokeWidth={2.2} />
            </div>
            <p className="mt-3 text-sm font-bold text-slate-700">{emptyMessage}</p>
            <p className="mt-1 text-xs text-slate-400">
              Nhập nội dung vào ô bên dưới để thêm các bước xử lý từng bước.
            </p>
          </div>
        ) : (
          items.map((item, index) => {
            const isCompleted = !!checkedMap[index];
            const isEditing = editingId === item.id;
            const padNum = String(index + 1).padStart(2, "0");

            return (
              <div
                key={item.id}
                className={`group relative flex flex-col sm:flex-row sm:items-start justify-between gap-3.5 rounded-2xl border-2 p-3.5 md:p-4 transition-all duration-200 shadow-sm ${
                  isCompleted
                    ? "border-emerald-300 bg-gradient-to-r from-emerald-50/70 to-teal-50/40 hover:border-emerald-400 hover:shadow-md"
                    : "border-slate-200/90 bg-white hover:border-blue-400 hover:shadow-md hover:bg-blue-50/20"
                }`}
              >
                {/* Nội dung bên trái: Checkbox + Số thứ tự + Text */}
                <div className="flex flex-1 items-start gap-3">
                  {/* Nút Checkbox Nổi Bật */}
                  <button
                    type="button"
                    onClick={() => handleToggleCheck(index)}
                    aria-label={`Đánh dấu hoàn thành bước ${index + 1}`}
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border-2 transition-all active:scale-90 ${
                      isCompleted
                        ? "border-emerald-500 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30 scale-105"
                        : "border-slate-300 bg-white text-transparent hover:border-blue-500 hover:bg-blue-50 hover:scale-105 shadow-xs"
                    }`}
                  >
                    <Check
                      size={18}
                      strokeWidth={3.5}
                      className={isCompleted ? "opacity-100" : "opacity-0"}
                    />
                  </button>

                  {/* Badge số thứ tự Nổi Bật */}
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-black tracking-wide uppercase border shadow-xs ${
                      isCompleted
                        ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                        : badgePrefix === "Nguyên nhân"
                        ? "border-amber-200 bg-amber-100 text-amber-900"
                        : "border-blue-200 bg-blue-100 text-blue-900"
                    }`}
                  >
                    {badgePrefix} {padNum}
                  </span>

                  {/* Phần hiển thị Text hoặc Form Sửa */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    {isEditing ? (
                      <div className="space-y-2.5">
                        <textarea
                          rows={2}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveEdit(item.id);
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                          autoFocus
                          className="w-full rounded-xl border-2 border-blue-500 bg-white p-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-inner"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(item.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95"
                          >
                            <Check size={14} strokeWidth={2.5} /> Lưu
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                          >
                            <X size={14} strokeWidth={2.5} /> Hủy
                          </button>
                          <span className="text-[11px] text-slate-400">
                            (Enter để lưu, Esc để hủy)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleToggleCheck(index)}
                        className="cursor-pointer select-text"
                      >
                        <p
                          className={`text-sm md:text-[15px] font-semibold leading-relaxed transition-all ${
                            isCompleted
                              ? "text-emerald-950 line-through decoration-emerald-600/70 decoration-2 opacity-80"
                              : "text-slate-800"
                          }`}
                        >
                          {item.text}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cụm nút thao tác bên phải với Icon màu sắc nổi bật */}
                {!isEditing && (
                  <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center transition-opacity">
                    {/* Di chuyển lên */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                      title="Di chuyển lên trên"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 shadow-xs transition hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 active:scale-90 disabled:opacity-20 disabled:pointer-events-none"
                    >
                      <ArrowUp size={16} strokeWidth={2.5} />
                    </button>

                    {/* Di chuyển xuống */}
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={() => handleMoveDown(index)}
                      title="Di chuyển xuống dưới"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 shadow-xs transition hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 active:scale-90 disabled:opacity-20 disabled:pointer-events-none"
                    >
                      <ArrowDown size={16} strokeWidth={2.5} />
                    </button>

                    {/* Nút sửa Nổi Bật */}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      title="Chỉnh sửa nội dung này"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 shadow-xs transition hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-90"
                    >
                      <Edit3 size={15} strokeWidth={2.5} />
                    </button>

                    {/* Nút xóa Nổi Bật */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Bạn có chắc muốn xóa ${badgePrefix} ${index + 1}?`)) {
                          handleDeleteItem(item.id);
                        }
                      }}
                      title="Xóa mục này"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 shadow-xs transition hover:bg-rose-600 hover:text-white hover:border-rose-600 active:scale-90"
                    >
                      <Trash2 size={15} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* FORM THÊM MỤC MỚI */}
      <form
        onSubmit={handleAddItem}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 rounded-2xl border-2 border-blue-200 bg-white p-3 shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 transition-all"
      >
        <div className="flex flex-1 items-center gap-2.5 px-2">
          <span
            className={`shrink-0 rounded-xl px-2.5 py-1 text-xs font-black uppercase tracking-wide border ${
              badgePrefix === "Nguyên nhân"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            {badgePrefix} {String(items.length + 1).padStart(2, "0")}
          </span>
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={!newItemText.trim() || isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
        >
          <Plus size={18} strokeWidth={3} />
          <span>Thêm {badgePrefix.toLowerCase()}</span>
        </button>
      </form>
    </div>
  );
}
