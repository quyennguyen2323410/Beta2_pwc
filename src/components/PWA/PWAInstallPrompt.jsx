import React, { useEffect, useState } from "react";
import { Download, X, Smartphone, Share, PlusSquare, MoreVertical, ShieldAlert } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSecure, setIsSecure] = useState(true);

  useEffect(() => {
    // 1. Kiểm tra xem app đã ở chế độ standalone (đã cài đặt) chưa
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    setIsStandalone(isRunningStandalone);
    if (isRunningStandalone) return;

    // 2. Kiểm tra giao thức HTTPS / Secure context
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const isHttps = window.location.protocol === "https:";
    setIsSecure(isHttps || isLocalhost);

    // 3. Nhận diện thiết bị iOS (Safari)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Kiểm tra xem người dùng đã đóng banner chưa
    const isDismissed = sessionStorage.getItem("pwc_pwa_dismissed") === "true";

    // 5. Lắng nghe sự kiện trước khi cài đặt của Chromium (Android/Chrome/Edge)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isDismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Với mobile hoặc iOS, hiển thị banner sau 1.5 giây nếu chưa cài đặt và chưa bị ẩn
    const timer = setTimeout(() => {
      if (!isDismissed && !isRunningStandalone) {
        setShowBanner(true);
      }
    }, 1500);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
        setDeferredPrompt(null);
      }
    } else {
      // Nếu trình duyệt chưa sẵn sàng sự kiện tự động (như iOS hoặc HTTP nội bộ), mở modal hướng dẫn
      setShowGuideModal(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem("pwc_pwa_dismissed", "true");
  };

  if (isStandalone || !showBanner) return null;

  return (
    <>
      {/* BANNER NHẮC CÀI ĐẶT */}
      <div className="fixed bottom-4 left-3 right-3 z-50 mx-auto max-w-lg animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-blue-300/80 bg-gradient-to-r from-[#0f3b7c] via-[#1454a7] to-[#0b3b52] p-3 text-white shadow-[0_16px_40px_rgba(15,59,124,0.45)] backdrop-blur-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/pht logo.jpg"
              alt="Logo"
              className="h-10 w-10 shrink-0 rounded-xl object-cover bg-white p-0.5 shadow-md"
            />
            <div className="min-w-0">
              <h4 className="text-sm font-black truncate">Cài đặt Sổ tay PWC</h4>
              <p className="text-xs text-cyan-200/90 truncate">
                Mở app toàn màn hình & chạy offline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-3 py-1.5 text-xs font-black text-[#062f43] shadow-md transition hover:brightness-110 active:scale-95"
            >
              <Download size={14} strokeWidth={2.5} />
              Cài đặt
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition"
              title="Đóng"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL HƯỚNG DẪN CÀI ĐẶT THỦ CÔNG (DÀNH CHO IOS SAFARI / HTTP NỘI BỘ) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-blue-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="text-blue-600" size={20} />
                <h3 className="text-base font-bold text-[#183f82]">
                  Hướng dẫn cài đặt ứng dụng
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-700 leading-5">
              {!isSecure && (
                <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 border border-amber-200 text-amber-900">
                  <ShieldAlert size={18} className="shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <b>Lưu ý kết nối:</b> Bạn đang truy cập qua địa chỉ IP nội bộ HTTP. Trình duyệt di động chỉ tự động bật popup cài đặt khi chạy trên <b>HTTPS</b> hoặc tên miền an toàn. Bạn có thể thêm thủ công như hướng dẫn bên dưới:
                  </div>
                </div>
              )}

              {isIOS ? (
                /* Hướng dẫn trên iPhone / iPad (Safari) */
                <div className="space-y-3">
                  <p className="font-semibold text-slate-800">
                    Thao tác trên Safari (iPhone / iPad):
                  </p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>
                      Nhấn vào biểu tượng <b>Chia sẻ</b> (
                      <Share size={13} className="inline text-blue-600 mx-0.5" />
                      ) ở thanh công cụ dưới đáy trình duyệt.
                    </li>
                    <li>
                      Cuộn xuống và chọn mục <b>"Thêm vào Màn hình chính"</b> (
                      <PlusSquare size={13} className="inline text-slate-700 mx-0.5" />
                      <i>Add to Home Screen</i>).
                    </li>
                    <li>
                      Nhấn <b>"Thêm" (Add)</b> ở góc trên bên phải màn hình để hoàn tất.
                    </li>
                  </ol>
                </div>
              ) : (
                /* Hướng dẫn trên Android (Chrome / Cốc Cốc / Edge / Samsung Internet) */
                <div className="space-y-3">
                  <p className="font-semibold text-slate-800">
                    Thao tác trên Android (Chrome / Edge / Cốc Cốc):
                  </p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>
                      Nhấn vào biểu tượng <b>Menu 3 chấm</b> (
                      <MoreVertical size={13} className="inline text-slate-700 mx-0.5" />
                      ) ở góc trên bên phải trình duyệt.
                    </li>
                    <li>
                      Chọn mục <b>"Cài đặt ứng dụng"</b> (<i>Install app</i>) hoặc <b>"Thêm vào Màn hình chính"</b> (<i>Add to Home screen</i>).
                    </li>
                    <li>
                      Nhấn <b>"Cài đặt" / "Thêm"</b> để biểu tượng app xuất hiện trên màn hình điện thoại.
                    </li>
                  </ol>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="rounded-xl bg-[#163f7e] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
