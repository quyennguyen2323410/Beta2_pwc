/**
 * Utility ánh xạ hình ảnh icon từ public/ cho từng danh mục phân quyền / loại thiết bị
 */
export const getCategoryIcon = (categoryName, idPq) => {
  const name = (categoryName || "").trim().toLowerCase();
  const pq = Number(idPq);

  // 1. DMA VÙNG I
  if (
    pq === 1 ||
    name.includes("vùng i") ||
    name.includes("vung i") ||
    name.includes("vùng 1") ||
    name.includes("vung 1")
  ) {
    return "/image copy 5.png";
  }

  // 2. DMA VÙNG II
  if (
    pq === 2 ||
    name.includes("vùng ii") ||
    name.includes("vung ii") ||
    name.includes("vùng 2") ||
    name.includes("vung 2")
  ) {
    return "/image copy 6.png";
  }

  // 3. Van điều tiết áp lực / Van giảm áp / PRV
  if (
    pq === 3 ||
    name.includes("van") ||
    name.includes("áp lực") ||
    name.includes("ap luc") ||
    name.includes("prv")
  ) {
    return "/image.png";
  }

  // 4. Data logger / Logger
  if (
    pq === 4 ||
    name.includes("logger") ||
    name.includes("datalogger") ||
    name.includes("data logger")
  ) {
    return "/image copy.png";
  }

  // 5. Đồng hồ điện từ / Flow meter
  if (
    pq === 5 ||
    name.includes("đồng hồ") ||
    name.includes("dong ho") ||
    name.includes("điện từ") ||
    name.includes("dien tu") ||
    name.includes("flow")
  ) {
    return "/image copy 2.png";
  }

  // 6. PWNOC
  if (
    pq === 6 ||
    name.includes("pwnoc") ||
    name.includes("noc") ||
    name.includes("scada")
  ) {
    return "/image copy 4.png";
  }

  // 7. Tủ chất lượng nước
  if (
    pq === 7 ||
    name.includes("chất lượng") ||
    name.includes("chat luong") ||
    name.includes("tủ chất lượng") ||
    name.includes("nước")
  ) {
    return "/image copy 3.png";
  }

  // Fallback icon mặc định
  return "/image copy 5.png";
};
