import { supabase } from "../lib/supabase";

/**
 * LUỒNG 1: Lấy danh sách DMA (Vị trí, Tọa độ GPS - Dùng cho id_pq 1 & 2)
 * Lấy trực tiếp từ Supabase qua view v_dma_locations hoặc bảng pwc_dma_devices
 */
export const fetchDmaLocations = async () => {
  try {
    const { data, error } = await supabase
      .from("v_dma_locations")
      .select("*")
      .order("stt", { ascending: true });

    if (error) {
      console.warn("Lỗi đọc view v_dma_locations, fallback sang pwc_dma_devices:", error.message);
      // Fallback nếu người dùng chưa tạo view
      const { data: fallbackData, error: fbError } = await supabase
        .from("pwc_dma_devices")
        .select("*")
        .order("id", { ascending: true });

      if (fbError) throw fbError;

      return (fallbackData || []).map((item) => ({
        stt: item.id,
        id_pq: item.id_pq,
        ten_dma: item.dma_code,
        vi_tri_dma: item.vi_tri,
        thiet_bi: item.thiet_bi,
        kinh_do: Number(item.kinh_do),
        vi_do: Number(item.vi_do),
        loai_thiet_bi: item.id_pq === 1 ? "DMA VÙNG I" : "DMA VÙNG II",
      }));
    }

    return data || [];
  } catch (error) {
    console.error("API Error [fetchDmaLocations]:", error);
    throw error;
  }
};

/**
 * LUỒNG 2: Lấy danh sách Loại thiết bị & Sự cố (Dùng cho id_pq >= 3)
 * Lấy từ Supabase (pwc_device_types và pwc_errors) và nhóm dữ liệu chuẩn
 */
export const fetchSuCoThietBiList = async () => {
  try {
    const [typesRes, errorsRes] = await Promise.all([
      supabase.from("pwc_device_types").select("*").order("id_pq", { ascending: true }),
      supabase.from("pwc_errors").select("*").order("id", { ascending: true }),
    ]);

    if (typesRes.error) throw typesRes.error;
    if (errorsRes.error) throw errorsRes.error;

    const types = typesRes.data || [];
    const allErrors = errorsRes.data || [];

    // Chỉ lấy các danh mục sự cố thiết bị (id_pq >= 3)
    const suCoTypes = types.filter((t) => Number(t.id_pq) >= 3);

    const result = suCoTypes.map((t) => {
      const idPq = Number(t.id_pq);
      const typeErrors = allErrors.filter((e) => Number(e.id_pq) === idPq);

      // Nhóm theo tên thiết bị (name)
      const deviceMap = new Map();
      typeErrors.forEach((e) => {
        const devName = (e.name || "Chung").trim();
        if (!deviceMap.has(devName)) {
          deviceMap.set(devName, []);
        }
        deviceMap.get(devName).push({
          id: e.id,
          loi_so: e.loi || 1,
          tinh_trang: e.tinh_trang || "",
          nguyen_nhan: e.nguyen_nhan || "",
          huong_khac_phuc: e.huong_khac_phuc || "",
        });
      });

      const devices = Array.from(deviceMap.entries()).map(
        ([ten_thiet_bi, errors]) => ({
          ten_thiet_bi,
          errors,
        })
      );

      return {
        id_pq: idPq,
        loai_thiet_bi: t.loai_thiet_bi?.trim() || "",
        devices,
      };
    });

    return result;
  } catch (error) {
    console.error("API Error [fetchSuCoThietBiList]:", error);
    throw error;
  }
};

/**
 * Hàm hỗ trợ lấy đồng thời cả 2 luồng dữ liệu cùng lúc
 */
export const fetchAllDmaData = async () => {
  try {
    const [locations, troubleList] = await Promise.all([
      fetchDmaLocations().catch(() => []),
      fetchSuCoThietBiList().catch(() => []),
    ]);

    return {
      locations,
      troubleList,
    };
  } catch (error) {
    console.error("API Error [fetchAllDmaData]:", error);
    throw error;
  }
};

/**
 * Thêm lỗi / sự cố mới cho thiết bị vào bảng pwc_errors trên Supabase
 */
export const createDmaError = async (errorData) => {
  try {
    const { data, error } = await supabase
      .from("pwc_errors")
      .insert([
        {
          id_pq: Number(errorData.id_pq),
          name: errorData.ten_thiet_bi,
          loi: parseInt(errorData.loi_so) || 1,
          tinh_trang: errorData.tinh_trang,
          nguyen_nhan: errorData.nguyen_nhan,
          huong_khac_phuc: errorData.huong_khac_phuc,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("API Error [createDmaError]:", error);
    throw error;
  }
};

/**
 * Lấy chi tiết 1 sự cố theo ID từ bảng pwc_errors kèm theo thông tin loại thiết bị
 */
export const fetchDmaErrorById = async (id) => {
  try {
    const { data: errorData, error: err } = await supabase
      .from("pwc_errors")
      .select("*")
      .eq("id", id)
      .single();

    if (err) throw err;
    if (!errorData) return null;

    // Lấy thông tin loại thiết bị từ pwc_device_types nếu có id_pq
    let loai_thiet_bi = "";
    if (errorData.id_pq) {
      const { data: typeData } = await supabase
        .from("pwc_device_types")
        .select("loai_thiet_bi")
        .eq("id_pq", errorData.id_pq)
        .single();
      loai_thiet_bi = typeData?.loai_thiet_bi || "";
    }

    return {
      id: errorData.id,
      id_pq: errorData.id_pq,
      ten_thiet_bi: errorData.name || "",
      loi_so: errorData.loi || 1,
      tinh_trang: errorData.tinh_trang || "",
      nguyen_nhan: errorData.nguyen_nhan || "",
      huong_khac_phuc: errorData.huong_khac_phuc || "",
      loai_thiet_bi: loai_thiet_bi,
    };
  } catch (error) {
    console.error("API Error [fetchDmaErrorById]:", error);
    throw error;
  }
};

/**
 * Cập nhật thông tin sự cố vào bảng pwc_errors
 */
export const updateDmaError = async (id, updateData) => {
  try {
    const payload = {};
    if (updateData.huong_khac_phuc !== undefined) payload.huong_khac_phuc = updateData.huong_khac_phuc;
    if (updateData.nguyen_nhan !== undefined) payload.nguyen_nhan = updateData.nguyen_nhan;
    if (updateData.tinh_trang !== undefined) payload.tinh_trang = updateData.tinh_trang;
    if (updateData.loi !== undefined) payload.loi = parseInt(updateData.loi);
    if (updateData.name !== undefined) payload.name = updateData.name;

    const { data, error } = await supabase
      .from("pwc_errors")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("API Error [updateDmaError]:", error);
    throw error;
  }
};

/**
 * Xóa sự cố từ bảng pwc_errors
 */
export const deleteDmaError = async (id) => {
  try {
    const { data, error } = await supabase
      .from("pwc_errors")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("API Error [deleteDmaError]:", error);
    throw error;
  }
};

/**
 * THAO TÁC CRUD TRỰC TIẾP TRÊN OPTION (TÊN THIẾT BỊ / MỤC CON) CỦA CATEGORY
 */

// 1. Thêm một Option / Thiết bị mới vào Category
export const createDeviceOption = async (idPq, optionName) => {
  try {
    const cleanName = (optionName || "").trim();
    if (!cleanName) throw new Error("Tên Option / Thiết bị không được để trống.");

    const { data, error } = await supabase
      .from("pwc_errors")
      .insert([
        {
          id_pq: Number(idPq),
          name: cleanName,
          loi: 1,
          tinh_trang: "Chưa ghi nhận sự cố",
          nguyen_nhan: "—",
          huong_khac_phuc: "—",
        },
      ])
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error("API Error [createDeviceOption]:", error);
    throw error;
  }
};

// 2. Đổi tên một Option / Thiết bị (Cập nhật toàn bộ các sự cố thuộc Option đó)
export const renameDeviceOption = async (idPq, oldName, newName) => {
  try {
    const cleanNew = (newName || "").trim();
    if (!cleanNew) throw new Error("Tên mới không được để trống.");

    const cleanOld = (oldName || "").trim();

    // Lấy tất cả bản ghi pwc_errors thuộc danh mục idPq
    let query = supabase.from("pwc_errors").select("id, name, id_pq");
    if (idPq !== null && idPq !== undefined) {
      query = query.eq("id_pq", Number(idPq));
    }
    const { data: catErrors, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    // Tìm các ID trùng khớp với oldName (xử lý case-insensitive, trim, và trường hợp "Chung")
    const matchingIds = (catErrors || [])
      .filter((e) => {
        const eName = (e.name || "").trim();
        if (cleanOld.toLowerCase() === "chung" || cleanOld === "") {
          return !eName || eName.toLowerCase() === "chung";
        }
        return (
          eName === cleanOld ||
          eName.toLowerCase() === cleanOld.toLowerCase()
        );
      })
      .map((e) => e.id);

    if (matchingIds.length > 0) {
      const { data, error } = await supabase
        .from("pwc_errors")
        .update({ name: cleanNew })
        .in("id", matchingIds)
        .select();

      if (error) throw error;
      return data;
    } else {
      // Fallback: update theo id_pq và tên ilike nếu có
      let updateQuery = supabase.from("pwc_errors").update({ name: cleanNew });
      if (idPq !== null && idPq !== undefined) {
        updateQuery = updateQuery.eq("id_pq", Number(idPq));
      }
      const { data, error } = await updateQuery
        .ilike("name", cleanOld)
        .select();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error("API Error [renameDeviceOption]:", error);
    throw error;
  }
};

// 3. Xóa một Option / Thiết bị (Xóa toàn bộ các sự cố thuộc Option đó)
export const deleteDeviceOption = async (idPq, optionName) => {
  try {
    const cleanName = (optionName || "").trim();

    let query = supabase.from("pwc_errors").select("id, name, id_pq");
    if (idPq !== null && idPq !== undefined) {
      query = query.eq("id_pq", Number(idPq));
    }
    const { data: catErrors, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    const matchingIds = (catErrors || [])
      .filter((e) => {
        const eName = (e.name || "").trim();
        if (cleanName.toLowerCase() === "chung" || cleanName === "") {
          return !eName || eName.toLowerCase() === "chung";
        }
        return (
          eName === cleanName ||
          eName.toLowerCase() === cleanName.toLowerCase()
        );
      })
      .map((e) => e.id);

    if (matchingIds.length > 0) {
      const { data, error } = await supabase
        .from("pwc_errors")
        .delete()
        .in("id", matchingIds)
        .select();

      if (error) throw error;
      return data;
    } else {
      let delQuery = supabase.from("pwc_errors").delete();
      if (idPq !== null && idPq !== undefined) {
        delQuery = delQuery.eq("id_pq", Number(idPq));
      }
      const { data, error } = await delQuery.ilike("name", cleanName).select();
      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error("API Error [deleteDeviceOption]:", error);
    throw error;
  }
};

/* =========================================================
 * BỔ SUNG: TOÀN BỘ CÁC HÀM CRUD QUẢN TRỊ NỘI DUNG (ADMIN)
 * ========================================================= */

/**
 * 1. QUẢN LÝ LOẠI THIẾT BỊ / DANH MỤC (pwc_device_types)
 */

export const fetchDeviceTypesAdmin = async () => {
  try {
    const { data, error } = await supabase
      .from("pwc_device_types")
      .select("*")
      .order("id_pq", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("API Error [fetchDeviceTypesAdmin]:", error);
    throw error;
  }
};

export const createDeviceType = async ({ id_pq, loai_thiet_bi }) => {
  try {
    let nextPq = Number(id_pq);
    if (!nextPq || isNaN(nextPq)) {
      // Tự động tìm id_pq lớn nhất + 1
      const { data: existing } = await supabase
        .from("pwc_device_types")
        .select("id_pq")
        .order("id_pq", { ascending: false })
        .limit(1);

      const maxPq = existing?.[0]?.id_pq ? Number(existing[0].id_pq) : 13;
      nextPq = Math.max(maxPq + 1, 3);
    }

    const { data, error } = await supabase
      .from("pwc_device_types")
      .insert([
        {
          id_pq: nextPq,
          loai_thiet_bi: (loai_thiet_bi || "").trim(),
        },
      ])
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error("API Error [createDeviceType]:", error);
    throw error;
  }
};

export const updateDeviceType = async (oldIdPq, { id_pq, loai_thiet_bi }) => {
  try {
    const payload = {
      loai_thiet_bi: (loai_thiet_bi || "").trim(),
    };
    if (id_pq !== undefined && !isNaN(Number(id_pq))) {
      payload.id_pq = Number(id_pq);
    }

    const { data, error } = await supabase
      .from("pwc_device_types")
      .update(payload)
      .eq("id_pq", oldIdPq)
      .select();

    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error("API Error [updateDeviceType]:", error);
    throw error;
  }
};

export const deleteDeviceType = async (idPq) => {
  try {
    const numPq = Number(idPq);
    const { data, error } = await supabase
      .from("pwc_device_types")
      .delete()
      .eq("id_pq", numPq)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("API Error [deleteDeviceType]:", error);
    throw error;
  }
};

/**
 * 2. QUẢN LÝ ĐIỂM ĐO DMA & TỌA ĐỘ GPS (pwc_dma_devices)
 */

export const fetchDmaDevicesAdmin = async () => {
  try {
    const { data, error } = await supabase
      .from("pwc_dma_devices")
      .select("*")
      .order("id_pq", { ascending: true })
      .order("id", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("API Error [fetchDmaDevicesAdmin]:", error);
    throw error;
  }
};

export const createDmaDevice = async ({ id_pq, dma_code, vi_tri, thiet_bi, kinh_do, vi_do }) => {
  try {
    const payload = {
      id_pq: Number(id_pq) || 1,
      dma_code: (dma_code || "").toString().trim(),
      vi_tri: (vi_tri || "").trim(),
      thiet_bi: (thiet_bi || "").trim(),
      kinh_do: kinh_do !== "" && kinh_do !== null && !isNaN(Number(kinh_do)) ? Number(kinh_do) : null,
      vi_do: vi_do !== "" && vi_do !== null && !isNaN(Number(vi_do)) ? Number(vi_do) : null,
    };

    const { data, error } = await supabase
      .from("pwc_dma_devices")
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("API Error [createDmaDevice]:", error);
    throw error;
  }
};

export const updateDmaDevice = async (id, updateData) => {
  try {
    const payload = {};
    if (updateData.id_pq !== undefined) payload.id_pq = Number(updateData.id_pq);
    if (updateData.dma_code !== undefined) payload.dma_code = (updateData.dma_code || "").toString().trim();
    if (updateData.vi_tri !== undefined) payload.vi_tri = (updateData.vi_tri || "").trim();
    if (updateData.thiet_bi !== undefined) payload.thiet_bi = (updateData.thiet_bi || "").trim();
    if (updateData.kinh_do !== undefined) {
      payload.kinh_do = updateData.kinh_do !== "" && updateData.kinh_do !== null && !isNaN(Number(updateData.kinh_do))
        ? Number(updateData.kinh_do)
        : null;
    }
    if (updateData.vi_do !== undefined) {
      payload.vi_do = updateData.vi_do !== "" && updateData.vi_do !== null && !isNaN(Number(updateData.vi_do))
        ? Number(updateData.vi_do)
        : null;
    }

    const { data, error } = await supabase
      .from("pwc_dma_devices")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("API Error [updateDmaDevice]:", error);
    throw error;
  }
};

export const deleteDmaDevice = async (id) => {
  try {
    const { data, error } = await supabase
      .from("pwc_dma_devices")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("API Error [deleteDmaDevice]:", error);
    throw error;
  }
};

/**
 * 3. QUẢN LÝ SỰ CỐ & HƯỚNG DẪN XỬ LÝ (pwc_errors)
 */

export const fetchErrorsAdmin = async (idPqFilter = null) => {
  try {
    let query = supabase.from("pwc_errors").select("*");
    if (idPqFilter !== null && idPqFilter !== undefined && idPqFilter !== "all") {
      query = query.eq("id_pq", Number(idPqFilter));
    }
    const { data, error } = await query
      .order("id_pq", { ascending: true })
      .order("id", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("API Error [fetchErrorsAdmin]:", error);
    throw error;
  }
};

