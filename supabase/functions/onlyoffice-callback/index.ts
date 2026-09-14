import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-docspace-signature-256, x-docspace-signature",
};

// Cấu hình URL, API Key và Secret Key xác thực Webhook
const DOCSPACE_URL =
  Deno.env.get("DOCSPACE_URL") ?? "https://docspace-hhni1b.onlyoffice.com";
const DOCSPACE_API_KEY =
  Deno.env.get("DOCSPACE_API_KEY") ??
  "sk-aa96429e175a7812c482edde24cfd5c5ce621071dfd10986e56dc289f549d038";
const DOCSPACE_WEBHOOK_SECRET =
  Deno.env.get("DOCSPACE_WEBHOOK_SECRET") ?? "pwc_docspace_secret_2026";

/**
 * Xác thực chữ ký HMAC-SHA256 gửi từ DocSpace Webhook
 */
async function verifySignature(
  secret: string,
  rawBody: string,
  signatureHeader: string | null
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;
  const signature = signatureHeader.replace(/^sha256=/i, "").trim().toLowerCase();

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const sigBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(rawBody)
    );
    const hex = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toLowerCase();

    return hex === signature;
  } catch (err) {
    console.error("Lỗi khi tính toán HMAC-SHA256:", err);
    return false;
  }
}

serve(async (req) => {
  // Xử lý CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const rawBody = await req.text();
    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({ error: 1, message: "Invalid JSON body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // =========================================================================
    // 1. XÁC THỰC SECRET KEY (CHỮ KÝ BẢO MẬT HMAC-SHA256)
    // =========================================================================
    const signatureHeader =
      req.headers.get("x-docspace-signature-256") ||
      req.headers.get("x-docspace-signature");

    if (body.event || signatureHeader) {
      console.log(`DocSpace Webhook nhận sự kiện: [${body.event}]`);
      const isValid = await verifySignature(
        DOCSPACE_WEBHOOK_SECRET,
        rawBody,
        signatureHeader
      );

      if (!isValid) {
        console.warn("Từ chối Webhook: Chữ ký HMAC-SHA256 không hợp lệ!");
        return new Response(
          JSON.stringify({
            error: 1,
            message: "Unauthorized: Invalid webhook signature",
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      console.log("Xác thực Secret Key của DocSpace Webhook thành công!");
    }

    // Khởi tạo Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // =========================================================================
    // 2. NHÁNH XỬ LÝ DOCSPACE WEBHOOK (file.updated, file.uploaded)
    // =========================================================================
    // Lưu ý: MẶC ĐỊNH CHỈ GHI ĐÈ VÀO FILE HIỆN TẠI (KHÔNG TĂNG SỐ PHIÊN BẢN)
    // Chỉ khi bấm "Đồng bộ / Commit" trên giao diện mới tạo bản ghi phiên bản mới.
    if (
      body.event === "file.updated" ||
      (body.data && body.data.fileId && !body.status)
    ) {
      const fileData = body.data || {};
      const fileId = fileData.fileId;
      const fileName = fileData.title;
      const user = fileData.updatedBy?.name || "ONLYOFFICE DocSpace";

      console.log(`Bắt đầu đồng bộ tự động tệp DocSpace: ${fileName} (ID: ${fileId})`);

      if (fileId && fileName) {
        const cleanDocSpaceUrl = DOCSPACE_URL.startsWith("http")
          ? DOCSPACE_URL
          : `https://${DOCSPACE_URL}`;

        // Lấy thông tin viewUrl từ DocSpace API
        const fileInfoRes = await fetch(
          `${cleanDocSpaceUrl}/api/2.0/files/file/${fileId}`,
          {
            headers: {
              Authorization: `Bearer ${DOCSPACE_API_KEY}`,
            },
          }
        );

        if (!fileInfoRes.ok) {
          console.error("Lỗi lấy thông tin file từ DocSpace:", fileInfoRes.status);
          return new Response(JSON.stringify({ error: 0 }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const fileInfoData = await fileInfoRes.json();
        const downloadUrl = fileInfoData.response?.viewUrl;

        if (!downloadUrl) {
          console.error("Không tìm thấy link download viewUrl của file:", fileId);
          return new Response(JSON.stringify({ error: 0 }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Tải nội dung file đã sửa từ DocSpace Cloud
        const fileRes = await fetch(downloadUrl, {
          headers: {
            Authorization: `Bearer ${DOCSPACE_API_KEY}`,
          },
        });
        const fileBlob = await fileRes.blob();

        // Tìm kiếm tài liệu tương ứng trong bảng documents Supabase
        const { data: docs, error: docError } = await supabase
          .from("documents")
          .select("*")
          .ilike("name", fileName);

        if (docError || !docs || docs.length === 0) {
          console.warn(`Không tìm thấy tài liệu "${fileName}" trong DB Supabase.`);
          return new Response(JSON.stringify({ error: 0 }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const currentDoc = docs[0];
        const cleanFileName = currentDoc.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const currentStoragePath =
          currentDoc.storage_path || `files/doc_${currentDoc.id}_${cleanFileName}`;

        // Upload ghi đè phiên bản hiện tại vào Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(currentStoragePath, fileBlob, {
            contentType:
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            upsert: true,
          });

        if (uploadError) {
          console.error("Lỗi upload file lên Storage:", uploadError);
          return new Response(JSON.stringify({ error: 0 }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: urlData } = supabase.storage
          .from("documents")
          .getPublicUrl(currentStoragePath);
        const newFileUrl = urlData.publicUrl;

        // Cập nhật bảng documents: CHỈ cập nhật dung lượng và thời gian, GIỮ NGUYÊN current_version
        await supabase
          .from("documents")
          .update({
            storage_path: currentStoragePath,
            file_url: newFileUrl,
            size: fileBlob.size,
            updated_by: user,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentDoc.id);

        console.log(
          `Đã ghi đè thành công file hiện tại (v${currentDoc.current_version}) cho tài liệu: ${fileName}`
        );
      }

      return new Response(JSON.stringify({ error: 0, status: "success" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =========================================================================
    // 3. NHÁNH XỬ LÝ ONLYOFFICE DOCUMENT SERVER (status: 2 hoặc 6)
    // =========================================================================
    const docId = url.searchParams.get("docId");
    const user = url.searchParams.get("user") || "Admin";

    if (body.status === 2 || body.status === 6) {
      const downloadUrl = body.url;
      if (downloadUrl && docId) {
        const fileRes = await fetch(downloadUrl);
        const fileBlob = await fileRes.blob();

        const { data: currentDoc } = await supabase
          .from("documents")
          .select("*")
          .eq("id", docId)
          .single();

        if (currentDoc) {
          const cleanFileName = currentDoc.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const currentStoragePath =
            currentDoc.storage_path || `files/doc_${currentDoc.id}_${cleanFileName}`;

          await supabase.storage
            .from("documents")
            .upload(currentStoragePath, fileBlob, {
              contentType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              upsert: true,
            });

          const { data: urlData } = supabase.storage
            .from("documents")
            .getPublicUrl(currentStoragePath);

          await supabase
            .from("documents")
            .update({
              storage_path: currentStoragePath,
              file_url: urlData.publicUrl,
              size: fileBlob.size,
              updated_by: user,
              updated_at: new Date().toISOString(),
            })
            .eq("id", docId);

          console.log(
            `Đã ghi đè file hiện tại (v${currentDoc.current_version}) cho document ID ${docId}`
          );
        }
      }
    }

    // BẮT BUỘC: Trả về { "error": 0 }
    return new Response(JSON.stringify({ error: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Lỗi xử lý callback:", err);
    return new Response(JSON.stringify({ error: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
