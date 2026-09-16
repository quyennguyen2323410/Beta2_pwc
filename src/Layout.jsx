import React, { useState } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import PWAInstallPrompt from "./components/PWA/PWAInstallPrompt";

export default function Layout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("pwc_sidebar_collapsed") === "true";
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("pwc_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-100">
      <div className="flex min-h-screen">
        {/* Sidebar desktop (hỗ trợ đóng mở thu gọn mượt mà) */}
        <aside
          className={`hidden md:block flex-shrink-0 transition-all duration-300 ease-in-out bg-gradient-to-b from-[#238cc1] via-[#06384b] to-[#052c3f] text-white border-r border-white/10 shadow-xl ${
            collapsed ? "w-[76px]" : "w-[270px]"
          }`}
        >
          <div className={`h-full ${collapsed ? "p-2.5" : "p-5"}`}>
            <Sidebar
              collapsed={collapsed}
              onToggleCollapse={toggleCollapsed}
            />
          </div>
        </aside>

        {/* Sidebar mobile overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-[84%] max-w-[320px] bg-gradient-to-b from-[#062f43] via-[#06384b] to-[#052c3f] text-white shadow-2xl">
              <div className="h-full p-5">
                <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
              </div>
            </aside>
          </div>
        )}

        {/* Main Content Area */}
        <main className="relative flex-1 h-screen overflow-y-auto bg-slate-100">
          {/* Nút menu mobile: luôn nổi khi cuộn */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden fixed top-6 left-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/40 bg-white/70 text-[#295a91] shadow-lg backdrop-blur-xl transition hover:bg-white active:scale-95"
          >
            <Menu size={22} strokeWidth={2.2} />
          </button>

          {/* Nội dung chính các trang */}
          <div className="min-w-0">
            <Outlet />
          </div>

          {/* Banner cài đặt PWA (Tự động hiển thị khi hỗ trợ) */}
          <PWAInstallPrompt />
        </main>
      </div>
    </div>
  );
}
