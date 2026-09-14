import React from "react";
import { X, Download, ExternalLink, FileText, AlertCircle } from "lucide-react";

export default function FilePreviewModal({ document, onClose }) {
  if (!document) return null;

  const renderContent = () => {
    switch (document.file_type) {
      case "image":
        return (
          <div className="flex h-full max-h-[80vh] items-center justify-center p-4">
            <img
              src={document.file_url}
              alt={document.name}
              className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        );

      case "video":
        return (
          <div className="flex h-full max-h-[80vh] items-center justify-center p-4">
            <video
              src={document.file_url}
              controls
              autoPlay
              className="max-h-full max-w-full rounded-xl shadow-2xl"
            >
              Trình duyệt của bạn không hỗ trợ thẻ video HTML5.
            </video>
          </div>
        );

      case "pdf":
        return (
          <div className="h-[80vh] w-full p-2">
            <iframe
              src={`${document.file_url}#toolbar=1`}
              title={document.name}
              className="h-full w-full rounded-xl border border-slate-700 bg-white"
            />
          </div>
        );

      case "pptx":
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
              <FileText size={40} />
            </div>
            <h3 className="mb-2 text-lg font-bold text-white">
              Tệp trình chiếu PowerPoint ({document.name})
            </h3>
            <p className="mb-6 max-w-md text-sm text-slate-400">
              Theo phạm vi POC, hệ thống chỉ hỗ trợ lưu trữ tệp PPTX trên Cloud. Vui lòng tải về máy để xem nội dung chi tiết.
            </p>
            <a
              href={document.file_url}
              download
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
            >
              <Download size={16} /> Tải tệp PPTX về máy
            </a>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="mb-3 text-slate-400" size={40} />
            <p className="text-sm text-slate-300">
              Định dạng tệp này không hỗ trợ xem trực tiếp trên trình duyệt.
            </p>
            <a
              href={document.file_url}
              download
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cyan-500"
            >
              <Download size={14} /> Tải tệp về máy
            </a>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="truncate text-sm font-semibold text-slate-200">
              {document.name}
            </span>
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-cyan-400">
              {document.file_type}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={document.file_url}
              download
              title="Tải về máy"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <Download size={16} />
            </a>
            <a
              href={document.file_url}
              target="_blank"
              rel="noopener noreferrer"
              title="Mở trong tab mới"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <ExternalLink size={16} />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 overflow-auto bg-slate-950/60">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
