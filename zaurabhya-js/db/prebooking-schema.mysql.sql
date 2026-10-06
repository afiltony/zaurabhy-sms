-- Product pre-booking schema (MySQL / MariaDB): Dosa Rice and Malabar Tamarind.
--
-- You do not need to run this by hand: the app creates these tables itself the
-- first time it connects (see ensureSchema in src/lib/prebooking/db.ts). It is
-- kept here as the reference schema and for manual setup through phpMyAdmin.
-- Amounts are in paise (1 rupee = 100). Timestamps are ISO-8601 UTC strings.

CREATE TABLE IF NOT EXISTS prebooking_settings (
  id INT NOT NULL PRIMARY KEY,           -- always 1
  config_json TEXT NOT NULL,             -- per-product price and MOQ, shipping, tax, UPI ID
  updated_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per product per day (e.g. ZR-DR-20261006); gives the collision-safe
-- sequence in ZR-DR-YYYYMMDD-XXXX and ZR-MT-YYYYMMDD-XXXX.
CREATE TABLE IF NOT EXISTS prebooking_counters (
  counter_key VARCHAR(24) NOT NULL PRIMARY KEY,
  last_seq INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS prebooking_orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(32) NOT NULL,
  client_token VARCHAR(64) NOT NULL,     -- ties the order to the browser that created it
  product_id VARCHAR(64) NOT NULL,
  product_name VARCHAR(120) NOT NULL,
  quantity_kg INT NOT NULL,
  price_per_kg_paise INT NOT NULL,
  product_amount_paise INT NOT NULL,
  shipping_amount_paise INT NOT NULL,
  tax_amount_paise INT NOT NULL,
  discount_amount_paise INT NOT NULL,
  grand_total_paise INT NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(254) NOT NULL,
  customer_phone VARCHAR(15) NOT NULL,
  address_line_1 VARCHAR(200) NOT NULL,
  address_line_2 VARCHAR(200) NULL,
  city VARCHAR(80) NOT NULL,
  district VARCHAR(80) NOT NULL,
  state VARCHAR(80) NOT NULL,
  pincode VARCHAR(6) NOT NULL,
  country VARCHAR(40) NOT NULL,
  gst_number VARCHAR(15) NULL,
  shipping_method VARCHAR(60) NOT NULL,
  payment_provider VARCHAR(20) NOT NULL, -- UPI_QR
  payment_status VARCHAR(20) NOT NULL,   -- PENDING, PAYMENT_INITIATED, PAID, FAILED, CANCELLED, EXPIRED, REFUND_PENDING, REFUNDED
  order_status VARCHAR(20) NOT NULL,     -- PENDING, CONFIRMED, PROCESSING, PACKED, SHIPPED, DELIVERED, CANCELLED, REFUNDED
  payment_reference VARCHAR(32) NULL,    -- UPI transaction reference (UTR)
  payment_note VARCHAR(500) NULL,        -- admin note written when verifying / rejecting
  payment_submitted_at VARCHAR(32) NULL,
  admin_email_sent_at VARCHAR(32) NULL,  -- set once; prevents duplicate confirmation emails
  customer_email_sent_at VARCHAR(32) NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  paid_at VARCHAR(32) NULL,
  CONSTRAINT uq_prebooking_order_number UNIQUE (order_number),
  CONSTRAINT uq_prebooking_client_token UNIQUE (client_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_prebooking_payment_status ON prebooking_orders (payment_status, created_at);
CREATE INDEX idx_prebooking_payment_reference ON prebooking_orders (payment_reference);
