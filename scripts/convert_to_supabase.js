import fs from "fs";

const mysqlSql = fs.readFileSync("implements/sql.txt", "utf-8");

// Convert MySQL syntax to PostgreSQL
let pgSql = mysqlSql
  .replace(/SET NAMES utf8mb4;/g, "")
  .replace(/SET FOREIGN_KEY_CHECKS\s*=\s*[01];/g, "")
  // Drop table
  .replace(
    /DROP TABLE IF EXISTS `([^`]+)`;/g,
    'DROP TABLE IF EXISTS public."$1" CASCADE;'
  )
  // Create table
  .replace(
    /CREATE TABLE `([^`]+)` \(/g,
    'CREATE TABLE IF NOT EXISTS public."$1" (\n  id BIGSERIAL PRIMARY KEY,'
  )
  // Clean column types
  .replace(/`([^`]+)` INT NULL/g, '"$1" INT')
  .replace(/`([^`]+)` VARCHAR\(255\) NULL/g, '"$1" TEXT')
  .replace(/`([^`]+)` VARCHAR\(50\) NULL/g, '"$1" TEXT')
  .replace(/`([^`]+)` TEXT NULL/g, '"$1" TEXT')
  .replace(/`([^`]+)` DECIMAL\(15,9\) NULL/g, '"$1" NUMERIC(15,9)')
  // Remove MySQL Engine & Charset
  .replace(
    /\) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;/g,
    ");"
  )
  // Fix column names in INSERT INTO
  .replace(
    /INSERT INTO `([^`]+)` \(([^)]+)\) VALUES/g,
    (match, table, cols) => {
      const cleanCols = cols
        .split(",")
        .map((c) => '"' + c.trim().replace(/`/g, "") + '"')
        .join(", ");
      return 'INSERT INTO public."' + table + '" (' + cleanCols + ") VALUES";
    }
  );

// Fix unquoted dma_code in pwc_dma_devices: (1, 1001, 'GL... -> (1, '1001', 'GL...
pgSql = pgSql.replace(/\((\d+),\s*(\d+),\s*'/g, "($1, '$2', '");

// Fix row 23 in pwc_dma_devices where kinh_do was 106672058 instead of 106.672058
pgSql = pgSql.replace("106672058, 10.764262", "106.672058, 10.764262");

const fullScript = `-- ========================================================
-- SUPABASE MIGRATION SCRIPT CHO PWC WATERCARE
-- Chạy toàn bộ script này trong Supabase: SQL Editor -> New query -> Run
-- ========================================================

-- 1. BẢNG QUẢN LÝ TÀI LIỆU (POC ONLYOFFICE + STORAGE)
CREATE TABLE IF NOT EXISTS public.documents (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  size BIGINT DEFAULT 0,
  current_version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CÁC BẢNG DỮ LIỆU TỪ MYSQL (pwc_device_types, pwc_dma_devices, pwc_errors)
${pgSql}

-- ========================================================
-- 3. TẠO VIEW v_dma_locations ĐỒNG BỘ DỮ LIỆU DMA
-- Tự động kết hợp bảng pwc_dma_devices và pwc_device_types
-- ========================================================
CREATE OR REPLACE VIEW public.v_dma_locations AS
SELECT 
  d.id AS stt,
  d."id_pq",
  d."dma_code" AS ten_dma,
  d."vi_tri" AS vi_tri_dma,
  d."thiet_bi",
  d."kinh_do",
  d."vi_do",
  COALESCE(t."loai_thiet_bi", 'DMA') AS loai_thiet_bi
FROM public.pwc_dma_devices d
LEFT JOIN public.pwc_device_types t ON d."id_pq" = t."id_pq";

-- ========================================================
-- 4. PHÂN QUYỀN TRUY CẬP (ROW LEVEL SECURITY - RLS)
-- Cho phép ứng dụng Frontend (anon public key) đọc và ghi dữ liệu
-- ========================================================

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all documents" ON public.documents;
CREATE POLICY "Allow public all documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.pwc_device_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all pwc_device_types" ON public.pwc_device_types;
CREATE POLICY "Allow public all pwc_device_types" ON public.pwc_device_types FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.pwc_dma_devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all pwc_dma_devices" ON public.pwc_dma_devices;
CREATE POLICY "Allow public all pwc_dma_devices" ON public.pwc_dma_devices FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.pwc_errors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all pwc_errors" ON public.pwc_errors;
CREATE POLICY "Allow public all pwc_errors" ON public.pwc_errors FOR ALL USING (true) WITH CHECK (true);
`;

fs.writeFileSync("implements/supabase_migration.sql", fullScript, "utf-8");
console.log(
  "Successfully generated implements/supabase_migration.sql (" +
    fullScript.length +
    " bytes)"
);
