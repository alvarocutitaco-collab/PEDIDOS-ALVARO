-- Esquema propuesto para el módulo de faltantes y pedidos por proveedor.
-- Ajustar tipos e índices al motor real cuando se integre con backend.

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  official_name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  internal_code TEXT,
  barcode TEXT,
  unit TEXT DEFAULT 'unidad',
  active BOOLEAN DEFAULT TRUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE product_aliases (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  alias TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  created_by TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE product_suppliers (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  supplier_product_code TEXT,
  supplier_product_name TEXT,
  last_price NUMERIC,
  last_purchase_date TEXT,
  preferred BOOLEAN DEFAULT FALSE,
  lead_time_days INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE shortage_requests (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id),
  unclassified_text TEXT,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pendiente',
  notes TEXT,
  location TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  reviewed_by TEXT,
  reviewed_at TEXT,
  CHECK (product_id IS NOT NULL OR unclassified_text IS NOT NULL)
);

CREATE TABLE purchase_orders (
  id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  status TEXT NOT NULL DEFAULT 'borrador',
  created_by TEXT NOT NULL,
  confirmed_by TEXT,
  confirmed_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE purchase_order_items (
  id TEXT PRIMARY KEY,
  purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id),
  shortage_request_id TEXT REFERENCES shortage_requests(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente',
  created_at TEXT NOT NULL
);

CREATE TABLE invoice_imports (
  id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  invoice_number TEXT,
  invoice_date TEXT,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'cargado',
  imported_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE invoice_import_rows (
  id TEXT PRIMARY KEY,
  invoice_import_id TEXT NOT NULL REFERENCES invoice_imports(id),
  row_number INTEGER NOT NULL,
  raw_product_code TEXT,
  raw_product_name TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT,
  unit_price NUMERIC,
  line_total NUMERIC,
  matched_product_id TEXT REFERENCES products(id),
  match_status TEXT NOT NULL DEFAULT 'pendiente',
  created_at TEXT NOT NULL
);

CREATE TABLE product_match_suggestions (
  id TEXT PRIMARY KEY,
  invoice_import_row_id TEXT REFERENCES invoice_import_rows(id),
  shortage_request_id TEXT REFERENCES shortage_requests(id),
  candidate_product_id TEXT NOT NULL REFERENCES products(id),
  score NUMERIC NOT NULL,
  reason TEXT,
  accepted_by TEXT,
  accepted_at TEXT,
  created_at TEXT NOT NULL
);
