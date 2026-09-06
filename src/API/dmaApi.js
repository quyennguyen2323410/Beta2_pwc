const BASE_URL = "http://fdtech.coder96.com:7843/api";

/**
 * LUỒNG 1: Lấy danh sách DMA (Vị trí, Tọa độ GPS - Dùng cho id_pq 1 & 2)
 */
export const fetchDmaLocations = async () => {
  try {
    const response = await fetch(`${BASE_URL}/dma`);

    if (!response.ok) {
      throw new Error(`Lỗi kết nối API DMA: ${response.status}`);
    }

    const result = await response.json();
    return Array.isArray(result) ? result : result.data || [];
  } catch (error) {
    console.error("API Error [fetchDmaLocations]:", error);
    throw error;
  }
};

/**
 * LUỒNG 2: Lấy danh sách Loại thiết bị & Sự cố (Dùng cho id_pq >= 3)
 */
export const fetchSuCoThietBiList = async () => {
  try {
    const response = await fetch(`${BASE_URL}/su-co-thiet-bi`);

    if (!response.ok) {
      throw new Error(`Lỗi kết nối API Sự cố thiết bị: ${response.status}`);
    }

    const result = await response.json();
    return Array.isArray(result) ? result : result.data || [];
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
 * Thêm lỗi / sự cố mới
 */
export const createDmaError = async (errorData) => {
  try {
    const response = await fetch(`${BASE_URL}/dma/errors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(errorData),
    });

    if (!response.ok) {
      throw new Error(`Không thể thêm lỗi mới: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Error [createDmaError]:", error);
    throw error;
  }
};
