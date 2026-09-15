import { supabase } from "../lib/supabase";

const AUTH_KEY = "pwc_auth";
const USER_KEY = "pwc_user";
const USERNAME_KEY = "pwc_saved_username";

/**
 * Lấy thông tin người dùng đang đăng nhập trong phiên
 * Trả về: { id, username, role, can_edit_word, isAdmin }
 */
export const getAuthUser = () => {
  const isAuth =
    localStorage.getItem(AUTH_KEY) === "true" ||
    sessionStorage.getItem(AUTH_KEY) === "true";

  if (!isAuth) return null;

  const rawUser =
    localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);

  if (rawUser) {
    try {
      const user = JSON.parse(rawUser);
      return {
        ...user,
        isAdmin: user.role === "admin",
      };
    } catch (e) {
      console.warn("Lỗi parse user data:", e);
    }
  }

  // Fallback nếu lưu username dạng text cũ
  const savedUsername =
    localStorage.getItem(USERNAME_KEY) ||
    sessionStorage.getItem(USERNAME_KEY) ||
    "admin";

  const isAdmin = savedUsername.toLowerCase() === "admin";
  return {
    id: 1,
    username: savedUsername,
    role: isAdmin ? "admin" : "user",
    can_edit_word: isAdmin, // admin mặc định có quyền, user khác mặc định false
    isAdmin,
  };
};

/**
 * Đăng nhập người dùng qua bảng app_users
 */
export const loginUser = async (username, password, remember = true) => {
  const cleanUsername = username.trim();
  if (!cleanUsername || !password) {
    throw new Error("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
  }

  // 1. Kiểm tra trong bảng Supabase app_users
  const { data: user, error } = await supabase
    .from("app_users")
    .select("id, username, role, can_edit_word, created_at")
    .eq("username", cleanUsername)
    .eq("password", password)
    .maybeSingle();

  if (error) {
    console.error("Lỗi xác thực đăng nhập từ Supabase:", error);
    // Nếu bảng chưa được tạo và là tài khoản admin mặc định: hỗ trợ fallback
    if (cleanUsername === "admin" && password === "123456") {
      const fallbackAdmin = {
        id: 1,
        username: "admin",
        role: "admin",
        can_edit_word: true,
      };
      saveSession(fallbackAdmin, remember);
      return fallbackAdmin;
    }
    throw new Error("Lỗi kết nối CSDL hoặc bảng app_users chưa được tạo.");
  }

  if (!user) {
    // Nếu chưa tạo bảng hoặc sai thông tin
    if (cleanUsername === "admin" && password === "123456") {
      const fallbackAdmin = {
        id: 1,
        username: "admin",
        role: "admin",
        can_edit_word: true,
      };
      saveSession(fallbackAdmin, remember);
      return fallbackAdmin;
    }
    throw new Error("Sai tài khoản hoặc mật khẩu.");
  }

  saveSession(user, remember);
  return user;
};

/**
 * Lưu phiên làm việc vào localStorage / sessionStorage
 */
const saveSession = (user, remember) => {
  const storage = remember ? localStorage : sessionStorage;
  const otherStorage = remember ? sessionStorage : localStorage;

  otherStorage.removeItem(AUTH_KEY);
  otherStorage.removeItem(USER_KEY);
  otherStorage.removeItem(USERNAME_KEY);

  storage.setItem(AUTH_KEY, "true");
  storage.setItem(USER_KEY, JSON.stringify(user));
  storage.setItem(USERNAME_KEY, user.username);
};

/**
 * Đăng xuất tài khoản
 */
export const logoutUser = () => {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(USER_KEY);
};

/**
 * Lấy toàn bộ danh sách tài khoản (Chỉ admin dùng)
 */
export const fetchUsers = async () => {
  const { data, error } = await supabase
    .from("app_users")
    .select("id, username, role, can_edit_word, created_at")
    .order("id", { ascending: true });

  if (error) {
    console.error("Lỗi lấy danh sách app_users:", error);
    throw error;
  }
  return data || [];
};

/**
 * Tạo tài khoản mới (Chỉ admin dùng)
 * can_edit_word: true (Có quyền sửa Word) | false (Không có quyền sửa)
 */
export const createUser = async ({ username, password, can_edit_word = false }) => {
  const cleanUsername = username.trim();
  if (!cleanUsername || !password) {
    throw new Error("Vui lòng điền đủ tên đăng nhập và mật khẩu.");
  }

  const { data, error } = await supabase
    .from("app_users")
    .insert([
      {
        username: cleanUsername,
        password: password,
        role: "user",
        can_edit_word: Boolean(can_edit_word),
      },
    ])
    .select("id, username, role, can_edit_word, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(`Tài khoản "${cleanUsername}" đã tồn tại trên hệ thống.`);
    }
    throw new Error(error.message || "Tạo tài khoản thất bại.");
  }

  return data;
};

/**
 * Cấp hoặc thu hồi quyền sửa file Word (Chỉ admin dùng)
 */
export const toggleWordPermission = async (userId, currentCanEdit) => {
  const nextValue = !currentCanEdit;

  const { data, error } = await supabase
    .from("app_users")
    .update({ can_edit_word: nextValue })
    .eq("id", userId)
    .select("id, username, role, can_edit_word, created_at")
    .single();

  if (error) {
    console.error("Lỗi cập nhật quyền sửa Word:", error);
    throw new Error("Không thể cập nhật quyền: " + error.message);
  }

  // Nếu người đang sửa chính là tài khoản hiện tại, cập nhật lại storage
  const current = getAuthUser();
  if (current && current.id === userId) {
    current.can_edit_word = nextValue;
    if (localStorage.getItem(USER_KEY)) {
      localStorage.setItem(USER_KEY, JSON.stringify(current));
    } else if (sessionStorage.getItem(USER_KEY)) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(current));
    }
  }

  return data;
};

/**
 * Xóa người dùng (Không cho phép xóa admin)
 */
export const deleteUser = async (user) => {
  if (user.role === "admin" || user.username === "admin") {
    throw new Error("Không thể xóa tài khoản Quản trị viên (Admin).");
  }

  const { error } = await supabase
    .from("app_users")
    .delete()
    .eq("id", user.id);

  if (error) {
    console.error("Lỗi xóa người dùng:", error);
    throw new Error("Xóa tài khoản thất bại: " + error.message);
  }

  return true;
};
