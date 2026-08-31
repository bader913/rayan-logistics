-- 001_enable_extensions.sql
-- Enable pgcrypto for gen_random_uuid() and hashing functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
