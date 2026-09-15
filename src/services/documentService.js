import { supabase } from "../lib/supabase";
import { uploadFileToDocSpace, PWC_PUBLIC_SHARE_URL } from "./docspaceService";

/**
 * Lấy thông tin tài khoản đang đăng nhập hiện tại
 */
export const getCurrentUser = () => {
  const saved = localStorage.getItem("pwc_saved_username");
  return saved ? saved.trim() : "admin";
};

/**
 * Xác định loại file chuẩn từ tên file
 */
export const getFileType = (fileName) => {
  const ext = fileName.split(".").pop().toLowerCase();
  if (["docx", "doc"].includes(ext)) return "docx";
  if (["pdf"].includes(ext)) return "pdf";
  if (["pptx", "ppt"].includes(ext)) return "pptx";
  if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) return "image";
  if (["mp4", "webm", "mov", "avi"].includes(ext)) return "video";
  return ext;
};

/**
 * Lấy danh sách tài liệu từ Supabase Database
 * Hỗ trợ lọc theo sự cố (su_co_id) nếu được truyền vào
 */
export const fetchDocuments = async (filterOptions = {}) => {
  let query = supabase
    .from("documents")
    .select("*, document_versions(id, version)")
    .order("created_at", { ascending: false });

  if (filterOptions.su_co_id) {
    query = query.eq("su_co_id", filterOptions.su_co_id);
  }

  const { data, error } = await query;

  if (error) {
    // Fallback nếu chưa tạo relationship document_versions
    let simpleQuery = supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (filterOptions.su_co_id) {
      simpleQuery = simpleQuery.eq("su_co_id", filterOptions.su_co_id);
    }

    const { data: simpleData, error: simpleError } = await simpleQuery;

    if (simpleError) {
      console.error("Lỗi lấy danh sách tài liệu:", simpleError);
      throw simpleError;
    }
    return simpleData || [];
  }
  return data || [];
};

/**
 * Upload file ban đầu (Phiên bản 1)
 * Nhận thêm extraMeta: { su_co_id, thiet_bi_name, id_pq }
 */
export const uploadDocument = async (
  file,
  changeSummary = "Khởi tạo tài liệu",
  extraMeta = {}
) => {
  const user = getCurrentUser();
  const fileType = getFileType(file.name);
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueStoragePath = `files/${Date.now()}_v1_${cleanFileName}`;

  // 1. Upload lên Supabase Storage bucket 'documents'
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(uniqueStoragePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("Lỗi upload file lên Storage:", uploadError);
    throw new Error(`Upload thất bại: ${uploadError.message}. Hãy chắc chắn bạn đã tạo Bucket 'documents' dạng Public.`);
  }

  // 2. Lấy Public URL của file
  const { data: urlData } = supabase.storage
    .from("documents")
    .getPublicUrl(uniqueStoragePath);

  const fileUrl = urlData?.publicUrl || "";

  // 3. Đồng bộ sang phòng PWC DocSpace nếu là file Word
  let docSpaceInfo = null;
  if (fileType === "docx" || fileType === "doc") {
    try {
      docSpaceInfo = await uploadFileToDocSpace(file);
    } catch (dsErr) {
      console.warn("Chưa đồng bộ sang DocSpace:", dsErr);
    }
  }

  // 4. Tạo record metadata trong bảng documents
  const insertPayload = {
    name: file.name,
    file_type: fileType,
    storage_path: uniqueStoragePath,
    file_url: fileUrl,
    size: file.size,
    current_version: 1,
    created_by: user,
    updated_by: user,
    default_permission: "view",
  };

  if (extraMeta.su_co_id) {
    insertPayload.su_co_id = Number(extraMeta.su_co_id);
  }
  if (extraMeta.thiet_bi_name) {
    insertPayload.thiet_bi_name = extraMeta.thiet_bi_name;
  }
  if (extraMeta.id_pq) {
    insertPayload.id_pq = Number(extraMeta.id_pq);
  }

  const { data: docData, error: dbError } = await supabase
    .from("documents")
    .insert([insertPayload])
    .select()
    .single();

  if (dbError) {
    console.error("Lỗi lưu metadata vào Database:", dbError);
    throw new Error(`Lưu thông tin thất bại: ${dbError.message}`);
  }

  if (docSpaceInfo) {
    docData.docspace_file_id = docSpaceInfo.id;
    docData.docspace_web_url = docSpaceInfo.webUrl;
  }

  // 4. Tự động ghi lại lịch sử Phiên bản 1 vào bảng document_versions
  try {
    await supabase.from("document_versions").insert([
      {
        document_id: docData.id,
        version: 1,
        storage_path: uniqueStoragePath,
        file_url: fileUrl,
        size: file.size,
        modified_by: user,
        change_summary: changeSummary,
      },
    ]);
  } catch (verErr) {
    console.warn("Chưa ghi nhận vào document_versions (có thể bảng chưa được tạo):", verErr);
  }

  return docData;
};

/**
 * Lưu phiên bản mới (Version History) khi chỉnh sửa DOCX hoặc thay thế file
 */
export const createNewVersion = async (
  documentId,
  currentDoc,
  file,
  changeSummary = "Cập nhật nội dung",
  customVersion = null
) => {
  const user = getCurrentUser();
  const nextVersion = customVersion ? Number(customVersion) || customVersion : (currentDoc.current_version || 1) + 1;
  const cleanFileName = (file.name || currentDoc.name).replace(/[^a-zA-Z0-9._-]/g, "_");
  const newStoragePath = `files/${Date.now()}_v${nextVersion}_${cleanFileName}`;

  // 1. Tải bản mới lên Storage
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(newStoragePath, file, {
      cacheControl: "0",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Lỗi tải phiên bản mới lên Storage: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from("documents")
    .getPublicUrl(newStoragePath);

  const newFileUrl = urlData?.publicUrl || "";

  // 2. Cập nhật bản chính trong bảng documents
  const { data: updatedDoc, error: updateError } = await supabase
    .from("documents")
    .update({
      storage_path: newStoragePath,
      file_url: newFileUrl,
      size: file.size || currentDoc.size,
      current_version: nextVersion,
      updated_by: user,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Lỗi cập nhật bảng documents: ${updateError.message}`);
  }

  // 3. Thêm bản ghi mới vào document_versions
  await supabase.from("document_versions").insert([
    {
      document_id: documentId,
      version: nextVersion,
      storage_path: newStoragePath,
      file_url: newFileUrl,
      size: file.size || currentDoc.size,
      modified_by: user,
      change_summary: changeSummary || `Cập nhật phiên bản v${nextVersion}`,
    },
  ]);

  return updatedDoc;
};

/**
 * Lấy toàn bộ danh sách lịch sử phiên bản của một tài liệu
 */
export const fetchDocumentVersions = async (documentId) => {
  const { data, error } = await supabase
    .from("document_versions")
    .select("*")
    .eq("document_id", documentId)
    .order("version", { ascending: false });

  if (error) {
    console.error("Lỗi lấy lịch sử phiên bản:", error);
    return [];
  }
  return data || [];
};

/**
 * Lấy danh sách phân quyền của tài liệu
 */
export const fetchDocumentPermissions = async (documentId) => {
  const { data, error } = await supabase
    .from("document_permissions")
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Lỗi lấy danh sách phân quyền:", error);
    return [];
  }
  return data || [];
};

/**
 * Cấp hoặc cập nhật quyền cho người dùng
 */
export const grantDocumentPermission = async (documentId, userEmail, permission) => {
  const currentAdmin = getCurrentUser();

  const { data, error } = await supabase
    .from("document_permissions")
    .upsert(
      [
        {
          document_id: documentId,
          user_email: userEmail.trim(),
          permission: permission, // 'edit' hoặc 'view'
          granted_by: currentAdmin,
        },
      ],
      { onConflict: "document_id,user_email" }
    )
    .select()
    .single();

  if (error) {
    console.error("Lỗi cấp quyền:", error);
    throw error;
  }
  return data;
};

/**
 * Thu hồi quyền của một người dùng
 */
export const removeDocumentPermission = async (permissionId) => {
  const { error } = await supabase
    .from("document_permissions")
    .delete()
    .eq("id", permissionId);

  if (error) {
    console.error("Lỗi thu hồi quyền:", error);
    throw error;
  }
  return true;
};

/**
 * Kiểm tra quyền của tài khoản hiện tại đối với tài liệu
 * Trả về: 'edit' (được chỉnh sửa) hoặc 'view' (chỉ được xem)
 */
export const checkUserPermission = async (document, currentUser) => {
  const user = (currentUser || getCurrentUser()).trim().toLowerCase();

  // 1. Admin hoặc người tạo file luôn có quyền Edit
  if (user === "admin" || (document.created_by && document.created_by.toLowerCase() === user)) {
    return "edit";
  }

  // 2. Tra cứu trong bảng document_permissions
  try {
    const { data } = await supabase
      .from("document_permissions")
      .select("permission")
      .eq("document_id", document.id)
      .eq("user_email", user)
      .maybeSingle();

    if (data && data.permission) {
      return data.permission;
    }
  } catch (e) {
    console.warn("Lỗi kiểm tra quyền từ bảng document_permissions:", e);
  }

  // 3. Quyền mặc định của tài liệu
  return document.default_permission || "view";
};

/**
 * Xóa tài liệu khỏi ONLYOFFICE DocSpace, Supabase Storage (mọi phiên bản) và Database
 */
export const deleteDocument = async (id, storagePath, fileName = null) => {
  // 1. Xóa file trên ONLYOFFICE DocSpace
  if (fileName) {
    try {
      const { deleteFileFromDocSpace } = await import("./docspaceService");
      await deleteFileFromDocSpace(fileName);
    } catch (dsErr) {
      console.warn("Lỗi khi xóa trên DocSpace:", dsErr);
    }
  }

  // 2. Thu thập toàn bộ file của các phiên bản trong Storage để xóa sạch
  try {
    const { data: versions } = await supabase
      .from("document_versions")
      .select("storage_path")
      .eq("document_id", id);

    const pathsToDelete = new Set();
    if (storagePath) pathsToDelete.add(storagePath);
    if (versions && versions.length > 0) {
      versions.forEach((v) => {
        if (v.storage_path) pathsToDelete.add(v.storage_path);
      });
    }

    if (pathsToDelete.size > 0) {
      await supabase.storage.from("documents").remove(Array.from(pathsToDelete));
    }
  } catch (stErr) {
    console.warn("Lỗi dọn dẹp Supabase Storage:", stErr);
  }

  // 3. Xóa bản ghi trong database (bảng documents và cascade sang document_versions)
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) {
    console.error("Lỗi xóa document trong DB:", error);
    throw error;
  }
  return true;
};

