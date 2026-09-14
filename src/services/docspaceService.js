/**
 * Dịch vụ giao tiếp với ONLYOFFICE DocSpace Cloud API
 * Phòng làm việc chung (Public Room) "PWC" - Không yêu cầu đăng nhập tài khoản
 */

const DOCSPACE_URL =
  import.meta.env.VITE_ONLYOFFICE_URL || "https://docspace-hhni1b.onlyoffice.com";
const DOCSPACE_API_KEY =
  import.meta.env.VITE_ONLYOFFICE_API_KEY ||
  "sk-aa96429e175a7812c482edde24cfd5c5ce621071dfd10986e56dc289f549d038";
export const PWC_ROOM_ID =
  import.meta.env.VITE_ONLYOFFICE_ROOM_ID || "4256715";

// Token và URL dự phòng cho phòng public PWC
const DEFAULT_PUBLIC_SHARE_URL =
  import.meta.env.VITE_ONLYOFFICE_PUBLIC_ROOM_URL ||
  "https://docspace-hhni1b.onlyoffice.com/s/mksmrDjHPsMn_RB";

const DEFAULT_PUBLIC_TOKEN =
  import.meta.env.VITE_ONLYOFFICE_PUBLIC_TOKEN ||
  "MEI0RmdTZkY1N3JrbTRlMFIxVTFLaEN4UG1nelk2MkhCdURHMkZRYjhRaz0_ImQyMGY5MzM1LTBmMTktNDY1MS05YzdkLWJmNTRmNjU4YTk3MSI";

export const PWC_PUBLIC_SHARE_URL = DEFAULT_PUBLIC_SHARE_URL;

// Cache thông tin share phòng PWC trong bộ nhớ
let cachedShareInfo = null;

const getCleanUrl = () =>
  DOCSPACE_URL.startsWith("http") ? DOCSPACE_URL : `https://${DOCSPACE_URL}`;

/**
 * Lấy thông tin chia sẻ công khai và mã Token ủy quyền (requestToken) của phòng PWC
 */
export const getPublicRoomShareInfo = async () => {
  if (cachedShareInfo) {
    return cachedShareInfo;
  }

  const cleanUrl = getCleanUrl();

  try {
    const res = await fetch(
      `${cleanUrl}/api/2.0/files/folder/${PWC_ROOM_ID}/link`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DOCSPACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shareType: 5 }), // 5: Edit / External share
      }
    );

    if (res.ok) {
      const data = await res.json();
      const linkInfo = data.response?.sharedLink || data.response?.sharedTo;
      if (linkInfo && linkInfo.requestToken) {
        const token = linkInfo.requestToken;
        const shareLink = linkInfo.shareLink || DEFAULT_PUBLIC_SHARE_URL;
        const embedUrl = `${cleanUrl}/sdk/public-room?folder=${PWC_ROOM_ID}&key=${encodeURIComponent(
          token
        )}`;

        cachedShareInfo = {
          shareLink,
          requestToken: token,
          embedUrl,
        };
        return cachedShareInfo;
      }
    }
  } catch (err) {
    console.warn("Không thể lấy token mới từ DocSpace API, dùng fallback:", err);
  }

  // Fallback nếu API có sự cố mạng
  const fallbackEmbedUrl = `${cleanUrl}/sdk/public-room?folder=${PWC_ROOM_ID}&key=${encodeURIComponent(
    DEFAULT_PUBLIC_TOKEN
  )}`;

  cachedShareInfo = {
    shareLink: DEFAULT_PUBLIC_SHARE_URL,
    requestToken: DEFAULT_PUBLIC_TOKEN,
    embedUrl: fallbackEmbedUrl,
  };
  return cachedShareInfo;
};

/**
 * Lấy danh sách file đang có trong phòng PWC
 */
export const fetchDocSpaceFiles = async () => {
  try {
    const cleanUrl = getCleanUrl();
    const response = await fetch(`${cleanUrl}/api/2.0/files/${PWC_ROOM_ID}`, {
      headers: {
        Authorization: `Bearer ${DOCSPACE_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`DocSpace API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response?.files || [];
  } catch (error) {
    console.error("Lỗi lấy danh sách file phòng PWC:", error);
    return [];
  }
};

/**
 * Upload một file trực tiếp từ trình duyệt lên phòng PWC trong DocSpace
 */
export const uploadFileToDocSpace = async (file) => {
  try {
    const cleanUrl = getCleanUrl();
    const shareInfo = await getPublicRoomShareInfo();

    const formData = new FormData();
    formData.append("file", file, file.name);

    const response = await fetch(
      `${cleanUrl}/api/2.0/files/${PWC_ROOM_ID}/upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DOCSPACE_API_KEY}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`DocSpace upload error: ${response.status}`);
    }

    const data = await response.json();
    const uploadedFile = data.response?.[0];

    if (!uploadedFile) {
      throw new Error("Không nhận được thông tin file từ DocSpace");
    }

    const directEditorUrl = `${cleanUrl}/doceditor?fileid=${uploadedFile.id}&version=1&share=${encodeURIComponent(
      shareInfo.requestToken
    )}`;

    return {
      id: uploadedFile.id,
      title: uploadedFile.title,
      version: uploadedFile.version,
      viewUrl: uploadedFile.viewUrl,
      webUrl: directEditorUrl,
      publicUrl: shareInfo.shareLink,
      embedUrl: shareInfo.embedUrl,
    };
  } catch (error) {
    console.error("Lỗi upload lên DocSpace:", error);
    throw error;
  }
};

/**
 * Tìm hoặc tự động đồng bộ tệp từ Supabase Storage sang phòng PWC
 */
export const findOrCreateDocSpaceFile = async (docItem) => {
  try {
    const cleanUrl = getCleanUrl();
    const shareInfo = await getPublicRoomShareInfo();

    // 1. Kiểm tra xem file đã có trong phòng PWC chưa
    const files = await fetchDocSpaceFiles();
    const existing = files.find(
      (f) => f.title.toLowerCase() === docItem.name.toLowerCase()
    );

    if (existing) {
      const sdkEditorUrl = `${cleanUrl}/sdk/editor?fileId=${existing.id}&key=${encodeURIComponent(
        shareInfo.requestToken
      )}`;
      const directEditorUrl = `${cleanUrl}/doceditor?fileid=${existing.id}&version=1&share=${encodeURIComponent(
        shareInfo.requestToken
      )}`;
      return {
        fileId: existing.id,
        editorUrl: directEditorUrl,
        sdkEditorUrl: sdkEditorUrl,
        shareInfo,
      };
    }

    // 2. Nếu chưa có, fetch file từ file_url của Supabase và upload sang phòng PWC
    if (docItem.file_url) {
      const fileRes = await fetch(docItem.file_url);
      const blob = await fileRes.blob();
      const file = new File([blob], docItem.name, {
        type:
          blob.type ||
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const uploaded = await uploadFileToDocSpace(file);
      const sdkEditorUrl = `${cleanUrl}/sdk/editor?fileId=${uploaded.id}&key=${encodeURIComponent(
        shareInfo.requestToken
      )}`;

      return {
        fileId: uploaded.id,
        editorUrl: uploaded.webUrl,
        sdkEditorUrl: sdkEditorUrl,
        shareInfo,
      };
    }

    return {
      fileId: null,
      editorUrl: null,
      sdkEditorUrl: null,
      shareInfo,
    };
  } catch (err) {
    console.warn("Lỗi tìm hoặc đồng bộ tệp DocSpace:", err);
    const shareInfo = await getPublicRoomShareInfo();
    return {
      fileId: null,
      editorUrl: null,
      sdkEditorUrl: null,
      shareInfo,
    };
  }
};

/**
 * Lấy URL trỏ thẳng vào trình soạn thảo Word của tài liệu này (mở trên tab mới)
 * Định dạng: /doceditor?version=1&share=...&fileId=...
 */
export const getDirectDocEditorUrl = async (docItem) => {
  const cleanUrl = getCleanUrl();
  const shareInfo = await getPublicRoomShareInfo();

  const fileResult = await findOrCreateDocSpaceFile(docItem);
  const fileId = fileResult.fileId;
  const token = shareInfo.requestToken;

  if (fileId) {
    return `${cleanUrl}/doceditor?version=${docItem.current_version || 1}&share=${encodeURIComponent(
      token
    )}&fileId=${fileId}`;
  }

  return shareInfo.shareLink;
};

/**
 * Tải file DOCX mới nhất từ ONLYOFFICE DocSpace
 */
export const fetchLatestDocSpaceBlob = async (docItem) => {
  if (!docItem) throw new Error("Thiếu thông tin tài liệu");

  const files = await fetchDocSpaceFiles();
  const dsFile = files.find(
    (f) => f.title.toLowerCase() === docItem.name.toLowerCase()
  );

  if (!dsFile || !dsFile.viewUrl) {
    throw new Error(`Không tìm thấy file "${docItem.name}" trên phòng PWC DocSpace`);
  }

  const res = await fetch(dsFile.viewUrl, {
    headers: {
      Authorization: `Bearer ${DOCSPACE_API_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Lỗi tải file từ DocSpace: HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const file = new File([blob], docItem.name, {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  return { blob, file, dsFile };
};

/**
 * Tự động ghi đè nội dung file hiện tại mà không tạo phiên bản mới
 */
export const overwriteCurrentDocSpaceFile = async (docItem) => {
  try {
    const { file, blob } = await fetchLatestDocSpaceBlob(docItem);
    const { supabase } = await import("../lib/supabase");
    const { getCurrentUser } = await import("./documentService");

    const storagePath = docItem.storage_path;
    if (!storagePath) {
      throw new Error("Tài liệu không có storage_path hợp lệ");
    }

    // 1. Upload ghi đè Storage
    const { error: uploadErr } = await supabase.storage
      .from("documents")
      .upload(storagePath, file, {
        cacheControl: "0",
        upsert: true,
      });

    if (uploadErr) throw uploadErr;

    // 2. Cập nhật size và updated_at trong documents (giữ nguyên version)
    const { data: updatedDoc, error: updateErr } = await supabase
      .from("documents")
      .update({
        size: blob.size,
        updated_by: getCurrentUser(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", docItem.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return { success: true, doc: updatedDoc };
  } catch (err) {
    console.error("Lỗi ghi đè file hiện tại từ DocSpace:", err);
    return { success: false, error: err.message, doc: docItem };
  }
};

/**
 * Tạo phiên bản mới chính thức (Commit version - kiểu Git)
 * Tải file mới nhất từ DocSpace và snapshot vào document_versions
 */
export const commitDocSpaceVersion = async (
  docItem,
  { targetVersion, commitMessage }
) => {
  try {
    let fileToCommit;

    // 1. Thử lấy file mới nhất từ DocSpace
    try {
      const { file } = await fetchLatestDocSpaceBlob(docItem);
      fileToCommit = file;
    } catch (dsErr) {
      console.warn("Không lấy được từ DocSpace, dùng file hiện tại của Supabase:", dsErr);
      if (docItem.file_url) {
        const fileRes = await fetch(docItem.file_url);
        const blob = await fileRes.blob();
        fileToCommit = new File([blob], docItem.name, {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
      } else {
        throw new Error("Không thể lấy dữ liệu file để commit phiên bản mới");
      }
    }

    // 2. Gọi createNewVersion với targetVersion và commitMessage
    const { createNewVersion } = await import("./documentService");
    const updatedDoc = await createNewVersion(
      docItem.id,
      docItem,
      fileToCommit,
      commitMessage || `Commit phiên bản v${targetVersion}`,
      targetVersion
    );

    return {
      success: true,
      doc: updatedDoc,
      newVersion: updatedDoc.current_version,
    };
  } catch (err) {
    console.error("Lỗi commit phiên bản mới:", err);
    throw err;
  }
};

/**
 * Hàm tương thích cũ (nếu có nơi nào gọi syncDocSpaceFileToSupabase)
 */
export const syncDocSpaceFileToSupabase = overwriteCurrentDocSpaceFile;

/**
 * Xóa file vĩnh viễn khỏi phòng làm việc chung trên ONLYOFFICE DocSpace
 */
export const deleteFileFromDocSpace = async (fileName, fileId = null) => {
  try {
    const cleanUrl = getCleanUrl();
    let targetId = fileId;

    if (!targetId) {
      const files = await fetchDocSpaceFiles();
      const target = files.find(
        (f) => f.title.toLowerCase() === fileName.toLowerCase()
      );
      if (target) {
        targetId = target.id;
      }
    }

    if (!targetId) {
      console.warn(`Không tìm thấy file "${fileName}" trên DocSpace để xóa.`);
      return false;
    }

    const res = await fetch(`${cleanUrl}/api/2.0/files/fileops/delete`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${DOCSPACE_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        fileIds: [String(targetId)],
        immediately: true,
      }),
    });

    if (!res.ok) {
      console.warn(`DocSpace delete HTTP ${res.status}`);
      return false;
    }

    console.log(`Đã xóa thành công file ID ${targetId} (${fileName}) trên DocSpace`);
    return true;
  } catch (err) {
    console.error("Lỗi khi xóa file trên DocSpace:", err);
    return false;
  }
};


