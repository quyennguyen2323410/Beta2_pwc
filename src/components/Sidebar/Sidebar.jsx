import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { X, LogOut, ChevronDown, ChevronRight } from "lucide-react";

export default function Sidebar({ onCloseMobile }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [devices, setDevices] = useState([]);
  const [openLibraryMenu, setOpenLibraryMenu] = useState(
    location.pathname.startsWith("/Library"),
  );

  // đọc dữ liệu thiết bị từ localStorage
  const loadDevicesFromStorage = () => {
    const saved = localStorage.getItem("pwc_library_devices");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDevices(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error("Lỗi đọc dữ liệu thư viện:", error);
        setDevices([]);
      }
    } else {
      setDevices([]);
    }
  };

  useEffect(() => {
    loadDevicesFromStorage();

    // lắng nghe khi localStorage thay đổi từ tab khác
    const handleStorage = () => {
      loadDevicesFromStorage();
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // cập nhật mở submenu nếu đang ở Library
  useEffect(() => {
    if (location.pathname.startsWith("/Library")) {
      setOpenLibraryMenu(true);
    }
  }, [location.pathname]);

  // lấy danh sách nhóm thiết bị duy nhất
  const libraryGroups = useMemo(() => {
    const groups = devices.map((item) => item.group?.trim()).filter(Boolean);

    return [...new Set(groups)];
  }, [devices]);

  const handleLogout = () => {
    localStorage.removeItem("pwc_auth");
    sessionStorage.removeItem("pwc_auth");
    navigate("/Login", { replace: true });
  };

  const handleGoLibrary = () => {
    navigate("/Library");
    onCloseMobile?.();
  };

  const handleGoLibraryGroup = (groupName) => {
    navigate(`/Library?group=${encodeURIComponent(groupName)}`);
    onCloseMobile?.();
  };

  return (
    <div className="flex h-full flex-col text-white">
      {/* Mobile close button */}
      <div className="mb-4 flex justify-end md:hidden">
        <button
          type="button"
          onClick={onCloseMobile}
          className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-white/80 text-[#295a91] shadow-[0_8px_30px_rgba(15,23,42,0.18)] backdrop-blur-xl transition hover:bg-white"
        >
          <X size={24} strokeWidth={2.2} />
        </button>
      </div>

      {/* Brand */}

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 bg-cyan-400 text-lg font-bold text-[#214e95] text-2xl">
          PW
        </div>
        <div>
          <div className="text-2xl font-bold text-cyan-50/90">
            PWC Watercare
          </div>
        </div>
      </div>
      {/* Menu */}
      <div className="space-y-3">
        <NavLink
          to="/Overview"
          onClick={() => onCloseMobile?.()}
          className={({ isActive }) =>
            `block rounded-2xl px-4 py-4 text-lg transition-all duration-200 border ${
              isActive
                ? "bg-cyan-500/20 border-cyan-300/40 text-white shadow-md"
                : "bg-[#0b3b52]/80 border-white/5 text-white/95 hover:bg-[#104961]"
            }`
          }
        >
          Tổng quan
        </NavLink>

        {/* Thư viện kỹ thuật + submenu tự động */}
        <div
          className={`overflow-hidden rounded-2xl border transition ${
            openLibraryMenu
              ? "border-cyan-300/30 bg-[#0f4f68]"
              : "border-white/5 bg-[#0b3b52]/80"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-4">
            <button
              type="button"
              onClick={handleGoLibrary}
              className="text-left text-lg text-white"
            >
              Thư viện kỹ thuật
            </button>

            <button
              type="button"
              onClick={() => setOpenLibraryMenu((prev) => !prev)}
              className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/10"
            >
              {openLibraryMenu ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronRight size={18} />
              )}
            </button>
          </div>

          {openLibraryMenu && (
            <div className="border-t border-white/10 px-3 pb-3">
              <div className="mt-2 space-y-2">
                {libraryGroups.length > 0 ? (
                  libraryGroups.map((group) => (
                    <button
                      key={group}
                      type="button"
                      onClick={() => handleGoLibraryGroup(group)}
                      className="block w-full rounded-xl bg-white/5 px-3 py-3 text-left text-sm text-cyan-50 transition hover:bg-white/10"
                    >
                      {group}
                    </button>
                  ))
                ) : (
                  <div className="rounded-xl bg-white/5 px-3 py-3 text-sm text-white/60">
                    Chưa có nhóm thiết bị
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <NavLink
          to="/QA"
          onClick={() => onCloseMobile?.()}
          className={({ isActive }) =>
            `block rounded-2xl px-4 py-4 text-lg transition-all duration-200 border ${
              isActive
                ? "bg-cyan-500/20 border-cyan-300/40 text-white shadow-md"
                : "bg-[#0b3b52]/80 border-white/5 text-white/95 hover:bg-[#104961]"
            }`
          }
        >
          Thư viện kiến thức
        </NavLink>

        <NavLink
          to="/AI"
          onClick={() => onCloseMobile?.()}
          className={({ isActive }) =>
            `block rounded-2xl px-4 py-4 text-lg transition-all duration-200 border ${
              isActive
                ? "bg-cyan-500/20 border-cyan-300/40 text-white shadow-md"
                : "bg-[#0b3b52]/80 border-white/5 text-white/95 hover:bg-[#104961]"
            }`
          }
        >
          Trợ lý AI
        </NavLink>
      </div>

      {/* Logout */}
      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-lg font-semibold text-white shadow-md backdrop-blur-sm transition hover:bg-red-500/20 hover:border-red-300/30"
        >
          <LogOut size={20} />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
