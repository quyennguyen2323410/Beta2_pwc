import React, { useState } from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";

export default function Layout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-slate-100">
      <div className="flex min-h-screen">
        {/* Sidebar desktop */}
        <aside className="hidden md:block w-[340px] flex-shrink-0 bg-gradient-to-b from-[#062f43] via-[#06384b] to-[#052c3f] text-white border-r border-white/10 shadow-xl">
          <div className=" h-full p-5 md:p-7">
            <Sidebar />
          </div>
        </aside>

        {/* Sidebar mobile overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-[84%] max-w-[340px] bg-gradient-to-b from-[#062f43] via-[#06384b] to-[#052c3f] text-white shadow-2xl">
              <div className="h-full p-5">
                <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
              </div>
            </aside>
          </div>
        )}

        {/* Main */}
        <main className="relative flex-1 h-screen overflow-y-auto bg-slate-100">
          {/* Nút menu mobile: luôn nổi khi cuộn */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden fixed top-6 left-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/40 bg-white/55 text-[#295a91] shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl transition hover:bg-white/70 active:scale-95"
          >
            <Menu size={24} strokeWidth={2.2} />
          </button>

          <div className="p-4 pt-24 md:p-6 md:pt-6 lg:p-8">
            {/* Banner */}
            {/* <div className="mb-6 rounded-[28px] bg-white/70 border border-slate-200 shadow-sm backdrop-blur-sm">
              <div className="px-5 py-5 md:px-7 md:py-6">
                <p className="text-xs md:text-sm font-bold uppercase tracking-[0.22em] text-[#0b8ea0]">
                  CÔNG TY CỔ PHẦN CẤP NƯỚC PHÙ HÒA TÂN
                </p>
                <h1 className="mt-3 text-[28px] leading-tight font-bold text-slate-800 md:text-3xl">
                  Quản lý tri thức – Vận hành – AI
                </h1>
              </div>
            </div> */}

            {/* Content */}
            <div className="min-h-[calc(100vh-180px)] rounded-[28px] border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm md:p-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
