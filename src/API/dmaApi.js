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
