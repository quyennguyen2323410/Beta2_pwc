import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  X,
  LogOut,
  ChevronDown,
  ChevronRight,
  Users,
  Shield,
  Database,
  LayoutDashboard,
  BookOpen,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { getAuthUser, logoutUser } from "../../services/authService";

export default function Sidebar({
  onCloseMobile,
  collapsed = false,
  onToggleCollapse,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [devices, setDevices] = useState([]);
  const [authUser, setAuthUser] = useState(() => getAuthUser());
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
    setAuthUser(getAuthUser());

    // lắng nghe khi localStorage thay đổi từ tab khác
    const handleStorage = () => {
      loadDevicesFromStorage();
      setAuthUser(getAuthUser());
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

  const handleLogout = () => {
    logoutUser();
    navigate("/Login", { replace: true });
  };

  const handleGoLibrary = () => {
    navigate("/Library");
    onCloseMobile?.();
  };

  return (
    <div className="flex h-full flex-col text-white select-none">
      {/* Mobile close button */}
      <div className="mb-4 flex justify-end md:hidden">
        <button
          type="button"
          onClick={onCloseMobile}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white/80 text-[#295a91] shadow-lg backdrop-blur-xl transition hover:bg-white"
        >
          <X size={22} strokeWidth={2.2} />
        </button>
      </div>

      {/* Brand Header */}
      <div
        className={`mb-5 flex items-center ${
          collapsed ? "justify-center flex-col gap-2" : "justify-between"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/pht logo.jpg"
            alt="Logo"
            className="h-10 w-10 shrink-0 rounded-full object-cover bg-white p-0.5 shadow-md border border-white/30"
          />
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-lg font-black tracking-tight text-cyan-50/95 truncate">
                Sổ tay vận hành
              </div>
            </div>
          )}
        </div>

        {/* Nút đóng/mở sidebar trên Desktop */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
            className="hidden md:inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-cyan-100 hover:bg-white/20 hover:text-white transition"
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
      </div>

      {/* Menu List */}
      <div className="space-y-2">
        {/* 1. Tổng quan */}
        <NavLink
          to="/Overview"
          onClick={() => onCloseMobile?.()}
          title="Tổng quan hệ thống"
          className={({ isActive }) =>
            `flex items-center rounded-2xl transition-all duration-200 border ${
              collapsed
                ? "justify-center p-3"
                : "gap-3 px-3.5 py-3 text-sm font-semibold"
            } ${
              isActive
                ? "bg-cyan-500/25 border-cyan-300/40 text-white shadow-md"
                : "bg-[#0b3b52]/80 border-white/5 text-white/90 hover:bg-[#104961]"
            }`
          }
        >
          <LayoutDashboard size={20} className="shrink-0" />
          {!collapsed && <span>Tổng quan</span>}
        </NavLink>

        {/* 2. Thư viện kỹ thuật */}
        <div
          className={`overflow-hidden rounded-2xl border transition ${
            openLibraryMenu
              ? "border-cyan-300/30 bg-[#0f4f68]"
              : "border-white/5 bg-[#0b3b52]/80"
          }`}
        >
          <div
            className={`flex items-center ${
              collapsed ? "justify-center p-3" : "justify-between px-3.5 py-3"
            }`}
          >
            <button
              type="button"
              onClick={handleGoLibrary}
              title="Thư viện kỹ thuật"
              className={`flex items-center text-white ${
                collapsed
                  ? "justify-center"
                  : "gap-3 text-left text-sm font-semibold"
              }`}
            >
              <BookOpen size={20} className="shrink-0 text-cyan-200" />
              {!collapsed && <span>Thư viện kỹ thuật</span>}
            </button>

            {!collapsed && (
              <button
                type="button"
                onClick={() => setOpenLibraryMenu((prev) => !prev)}
                className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10"
              >
                {openLibraryMenu ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* 3. Trợ lý AI */}
        <NavLink
          to="/AI"
          onClick={() => onCloseMobile?.()}
          title="Trợ lý AI hỗ trợ kỹ thuật"
          className={({ isActive }) =>
            `flex items-center rounded-2xl transition-all duration-200 border ${
              collapsed
                ? "justify-center p-3"
                : "gap-3 px-3.5 py-3 text-sm font-semibold"
            } ${
              isActive
                ? "bg-cyan-500/25 border-cyan-300/40 text-white shadow-md"
                : "bg-[#0b3b52]/80 border-white/5 text-white/90 hover:bg-[#104961]"
            }`
          }
        >
          <Bot size={20} className="shrink-0 text-cyan-300" />
          {!collapsed && <span>Trợ lý AI</span>}
        </NavLink>

        {/* 4. Quản trị dữ liệu */}
        <NavLink
          to="/Admin"
          onClick={() => onCloseMobile?.()}
          title="Quản trị dữ liệu (Danh mục, DMA, Sự cố)"
          className={({ isActive }) =>
            `flex items-center rounded-2xl transition-all duration-200 border ${
              collapsed
                ? "justify-center p-3"
                : "gap-3 px-3.5 py-3 text-sm font-semibold"
            } ${
              isActive
                ? "bg-cyan-500/25 border-cyan-300/40 text-white shadow-md"
                : "bg-[#0b3b52]/80 border-white/5 text-white/90 hover:bg-[#104961]"
            }`
          }
        >
          <Database size={20} className="shrink-0 text-amber-300" />
          {!collapsed && <span>Quản trị dữ liệu</span>}
        </NavLink>

        {/* 5. Quản lý người dùng (Admin) */}
        {authUser?.isAdmin && (
          <NavLink
            to="/Users"
            onClick={() => onCloseMobile?.()}
            title="Quản lý người dùng hệ thống"
            className={({ isActive }) =>
              `flex items-center rounded-2xl transition-all duration-200 border ${
                collapsed
                  ? "justify-center p-3"
                  : "gap-3 px-3.5 py-3 text-sm font-semibold"
              } ${
                isActive
                  ? "bg-cyan-500/25 border-cyan-300/40 text-white shadow-md"
                  : "bg-[#0b3b52]/80 border-white/5 text-white/90 hover:bg-[#104961]"
              }`
            }
          >
            <Users size={20} className="shrink-0 text-emerald-300" />
            {!collapsed && <span>Quản lý người dùng</span>}
          </NavLink>
        )}
      </div>

      {/* Footer / User & Logout */}
      <div className="mt-auto pt-4 space-y-2.5">
        {authUser && (
          <div
            className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xs flex items-center ${
              collapsed
                ? "justify-center p-2.5"
                : "justify-between p-3 gap-2.5"
            }`}
            title={`${authUser.username} (${authUser.isAdmin ? "Quản trị viên" : "Người dùng"})`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-400 font-bold text-[#06384b] text-xs shadow-sm">
                {(authUser.username || "U").substring(0, 2).toUpperCase()}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {authUser.username}
                  </div>
                  <div className="text-[10px] text-cyan-200/80 truncate">
                    {authUser.isAdmin ? (
                      <span className="text-amber-300 font-semibold">Quản trị viên</span>
                    ) : authUser.can_edit_word ? (
                      <span className="text-emerald-300 font-medium">Sửa Word</span>
                    ) : (
                      <span className="text-slate-300">Chỉ xem</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {!collapsed && authUser.isAdmin && (
              <span className="shrink-0 rounded-lg bg-amber-400/20 border border-amber-300/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                ADMIN
              </span>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          title="Đăng xuất khỏi hệ thống"
          className={`flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-sm backdrop-blur-sm transition hover:bg-rose-500/20 hover:border-rose-300/30 ${
            collapsed ? "p-2.5" : "gap-2.5 px-3.5 py-2.5 text-xs font-semibold"
          }`}
        >
          <LogOut size={16} />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </div>
  );
}
