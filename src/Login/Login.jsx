import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
    remember: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedUsername = localStorage.getItem("pwc_saved_username");
    if (savedUsername) {
      setForm((prev) => ({ ...prev, username: savedUsername }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    // Demo account
    const DEMO_USERNAME = "admin";
    const DEMO_PASSWORD = "123456";

    if (
      form.username.trim() === DEMO_USERNAME &&
      form.password === DEMO_PASSWORD
    ) {
      if (form.remember) {
        localStorage.setItem("pwc_auth", "true");
        localStorage.setItem("pwc_saved_username", form.username.trim());
        sessionStorage.removeItem("pwc_auth");
      } else {
        sessionStorage.setItem("pwc_auth", "true");
        localStorage.removeItem("pwc_auth");
      }

      navigate("/Overview", { replace: true });
      return;
    }

    setError("Sai tài khoản hoặc mật khẩu.");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left */}
        <div className="hidden lg:flex bg-gradient-to-br from-[#062f43] via-[#0b4560] to-[#2d5f99] text-white p-12">
          <div className="m-auto max-w-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400 text-[#06384b] text-2xl font-extrabold shadow-md">
                PW
              </div>
              <div>
                <h1 className="text-3xl font-bold">PWC WaterCare AI</h1>
                <p className="mt-2 text-white/85 text-lg">
                  Nền tảng vận hành kỹ thuật ngành nước
                </p>
              </div>
            </div>

            <p className="mt-10 text-sm font-bold uppercase tracking-[0.25em] text-[#ffe7a6]">
              Enterprise platform
            </p>

            <h2 className="mt-4 text-5xl font-bold leading-tight">
              Chuẩn hóa tri thức, tối ưu vận hành, hỗ trợ quyết định bằng AI
            </h2>

            <p className="mt-6 text-lg leading-8 text-white/90">
              Hệ thống giúp đội ngũ kỹ thuật tra cứu nhanh, lưu trữ tri thức,
              hỏi đáp nội bộ và kết nối dữ liệu vận hành trên một nền tảng duy
              nhất.
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0b8ea0]">
              Đăng nhập hệ thống
            </p>

            <h2 className="mt-3 text-3xl font-bold text-slate-800 md:text-4xl">
              Chào mừng quay lại
            </h2>

            <p className="mt-3 text-slate-600">
              Đăng nhập để truy cập nền tảng PWC WaterCare AI.
            </p>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Tài khoản
                </label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Nhập tài khoản"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-[#0b8ea0] focus:ring-2 focus:ring-[#0b8ea0]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Mật khẩu
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Nhập mật khẩu"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-14 text-slate-800 outline-none transition focus:border-[#0b8ea0] focus:ring-2 focus:ring-[#0b8ea0]/20"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={form.remember}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Ghi nhớ đăng nhập
                </label>

                {/* <span className="text-sm text-slate-400">
                  Demo: admin / 123456
                </span> */}
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0f8fad] px-5 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-[#0d7d97] active:scale-[0.99]"
              >
                <LogIn size={18} />
                Đăng nhập
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
