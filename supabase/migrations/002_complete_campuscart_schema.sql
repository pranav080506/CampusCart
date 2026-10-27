-- ==============================================================================
-- CampusCart GLBITM - Comprehensive Supabase PostgreSQL Schema & Seed Migration
-- Project URL: https://wnftvqqtjjzgpuventan.supabase.co
-- College: G.L. Bajaj Institute of Technology and Management (GLBITM)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Colleges Table
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_code VARCHAR(50) NOT NULL UNIQUE,
    domain VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    is_approved BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(college_id, slug)
);

-- 3. Users Table (College Students & Admins)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    student_id VARCHAR(100),
    role VARCHAR(50) DEFAULT 'STUDENT' CHECK (role IN ('STUDENT', 'COLLEGE_ADMIN', 'SUPER_ADMIN')),
    is_id_verified BOOLEAN DEFAULT FALSE,
    department VARCHAR(100),
    hostel VARCHAR(100),
    phone VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Products Table (Verified Marketplace Listings)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    original_price DECIMAL(10, 2) CHECK (original_price IS NULL OR original_price >= price),
    category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
    college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    seller_name VARCHAR(255),
    seller_declared_condition VARCHAR(20) NOT NULL CHECK (seller_declared_condition IN ('NEW', 'LIKE_NEW', 'GOOD', 'FAIR')),
    ai_suggested_condition VARCHAR(20) CHECK (ai_suggested_condition IN ('NEW', 'LIKE_NEW', 'GOOD', 'FAIR')),
    status VARCHAR(50) DEFAULT 'PENDING_COLLEGE_REVIEW' CHECK (
        status IN (
            'DRAFT',
            'PENDING_AI_CHECK',
            'AI_FLAGGED',
            'PENDING_COLLEGE_REVIEW',
            'APPROVED',
            'REJECTED',
            'NEEDS_MORE_INFORMATION',
            'SUSPENDED',
            'SOLD'
        )
    ),
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_ai_inspected BOOLEAN DEFAULT FALSE,
    is_college_approved BOOLEAN DEFAULT FALSE,
    college_approved_at TIMESTAMP WITH TIME ZONE,
    college_approved_by UUID REFERENCES public.users(id),
    rejection_reason TEXT,
    admin_notes TEXT,
    views_count INT DEFAULT 0,
    wishlist_count INT DEFAULT 0,
    preferred_meetup_hubs JSONB DEFAULT '[]'::jsonb,
    available_timings VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. AI Verification Results Table (Gemini Vision AI Pipeline Logs)
CREATE TABLE IF NOT EXISTS public.ai_verification_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    model_provider VARCHAR(100) NOT NULL DEFAULT 'google-gemini',
    model_version VARCHAR(50) NOT NULL DEFAULT 'gemini-2.5-flash',
    predicted_category VARCHAR(100) NOT NULL,
    category_match BOOLEAN NOT NULL DEFAULT FALSE,
    image_quality VARCHAR(50) NOT NULL,
    description_consistency VARCHAR(50) NOT NULL,
    suggested_condition VARCHAR(20) NOT NULL,
    visible_issues JSONB DEFAULT '[]'::jsonb,
    restricted_content_detected BOOLEAN NOT NULL DEFAULT FALSE,
    confidence DECIMAL(4, 3) NOT NULL,
    recommended_action VARCHAR(50) NOT NULL CHECK (recommended_action IN ('approve', 'manual_review', 'reject', 'needs_more_info')),
    limitations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Moderation Audit Log (Protected College Admin History)
CREATE TABLE IF NOT EXISTS public.moderation_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    admin_name VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    previous_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Campus Meetup Hubs Table (Official GLBITM Handover Zones)
CREATE TABLE IF NOT EXISTS public.campus_meetup_hubs (
    id VARCHAR(50) PRIMARY KEY,
    college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    landmark VARCHAR(255) NOT NULL,
    security_cctv BOOLEAN DEFAULT TRUE,
    open_hours VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Meetup Sessions Table (Buyer-Seller Direct Handover Coordination)
CREATE TABLE IF NOT EXISTS public.meetup_sessions (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    product_title VARCHAR(255) NOT NULL,
    product_image TEXT,
    product_price DECIMAL(10, 2) NOT NULL,
    buyer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    buyer_name VARCHAR(255) NOT NULL,
    buyer_contact JSONB DEFAULT '{}'::jsonb,
    seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    seller_name VARCHAR(255) NOT NULL,
    seller_contact JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'PROPOSED_BY_BUYER',
    hub_location VARCHAR(255) NOT NULL,
    hub_landmark VARCHAR(255),
    meeting_date VARCHAR(50) NOT NULL,
    time_slot VARCHAR(100) NOT NULL,
    proposed_by VARCHAR(20) NOT NULL CHECK (proposed_by IN ('BUYER', 'SELLER')),
    buyer_agreed BOOLEAN DEFAULT FALSE,
    seller_agreed BOOLEAN DEFAULT FALSE,
    buyer_notes TEXT,
    seller_notes TEXT,
    messages JSONB DEFAULT '[]'::jsonb,
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Wishlist & Cart Tables
CREATE TABLE IF NOT EXISTS public.wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_college ON public.products(college_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_ai_results_product ON public.ai_verification_results(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_product ON public.moderation_audit_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_meetup_buyer ON public.meetup_sessions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_meetup_seller ON public.meetup_sessions(seller_id);

-- ==============================================================================
-- Row Level Security (RLS) Configuration
-- ==============================================================================
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_meetup_hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetup_sessions ENABLE ROW LEVEL SECURITY;

-- Public read access for colleges, categories, approved products, and meetup hubs
DROP POLICY IF EXISTS "Public read colleges" ON public.colleges;
CREATE POLICY "Public read colleges" ON public.colleges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read approved products" ON public.products;
CREATE POLICY "Public read approved products" ON public.products FOR SELECT USING (is_college_approved = true OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Public read meetup hubs" ON public.campus_meetup_hubs;
CREATE POLICY "Public read meetup hubs" ON public.campus_meetup_hubs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role full access products" ON public.products;
CREATE POLICY "Service role full access products" ON public.products FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access meetup_sessions" ON public.meetup_sessions;
CREATE POLICY "Service role full access meetup_sessions" ON public.meetup_sessions FOR ALL USING (auth.role() = 'service_role');

-- ==============================================================================
-- Initial Seed Data for GLBITM CampusCart
-- ==============================================================================

-- 1. Insert College
INSERT INTO public.colleges (id, name, short_code, domain, state, is_active)
VALUES (
    'c011e6e0-0000-0000-0000-000000000001',
    'G.L. Bajaj Institute of Technology and Management',
    'GLBITM',
    'glbitm.ac.in',
    'Uttar Pradesh',
    true
) ON CONFLICT (short_code) DO NOTHING;

-- 2. Insert Categories
INSERT INTO public.categories (id, college_id, name, slug, description, icon_name, is_approved, display_order)
VALUES
    ('c0000001-0000-0000-0000-000000000001', 'c011e6e0-0000-0000-0000-000000000001', 'Engineering Drawing & Drafting', 'engineering-drawing-drafting', 'Mini drafters, engineering sheets, compass boxes, and T-squares.', 'Compass', true, 1),
    ('c0000002-0000-0000-0000-000000000002', 'c011e6e0-0000-0000-0000-000000000001', 'Scientific Calculators', 'scientific-calculators', 'Casio FX-991EX, fx-82MS, and syllabus-approved programmable calculators.', 'Calculator', true, 2),
    ('c0000003-0000-0000-0000-000000000003', 'c011e6e0-0000-0000-0000-000000000001', 'Textbooks & Reference Notes', 'textbooks-reference-notes', 'Prescribed semester textbooks, handwritten notes, and solved question banks.', 'BookOpen', true, 3),
    ('c0000004-0000-0000-0000-000000000004', 'c011e6e0-0000-0000-0000-000000000001', 'Lab Coats & Workshop Aprons', 'lab-coats-workshop-aprons', 'White cotton laboratory aprons, safety goggles, and workshop boiler suits.', 'Shirt', true, 4),
    ('c0000005-0000-0000-0000-000000000005', 'c011e6e0-0000-0000-0000-000000000001', 'Electronics & Breadboards', 'electronics-breadboards', 'Arduino kits, ESP32 boards, jumper wires, sensors, and multimeters.', 'Cpu', true, 5),
    ('c0000006-0000-0000-0000-000000000006', 'c011e6e0-0000-0000-0000-000000000001', 'Hostel Essentials & Lamps', 'hostel-essentials-lamps', 'Desk study lamps, extension cords, laundry baskets, and kettle heaters.', 'Lamp', true, 6)
ON CONFLICT (college_id, slug) DO NOTHING;

-- 3. Insert GLBITM Handover Hubs
INSERT INTO public.campus_meetup_hubs (id, college_id, name, landmark, security_cctv, open_hours, description)
VALUES
    ('hub-btech-canteen', 'c011e6e0-0000-0000-0000-000000000001', 'B.Tech Canteen', 'B.Tech Food Court & Indoor Cafeteria Hall', true, '08:30 AM - 09:30 PM', 'Central student indoor cafeteria with dining counters, bright lighting, and high footfall.'),
    ('hub-stationery-shop', 'c011e6e0-0000-0000-0000-000000000001', 'Stationery Shop', 'Campus Stationery & Photocopy Center', true, '08:30 AM - 08:00 PM', 'Convenient academic spot right next to the campus book and stationery store.'),
    ('hub-gate-1', 'c011e6e0-0000-0000-0000-000000000001', 'Near Gate No. 1', 'Main Security Gate No. 1 & Entrance Plaza', true, '07:00 AM - 10:30 PM', 'Prominent, secure gate area with active 24/7 security guard post and CCTV.'),
    ('hub-ctm-block', 'c011e6e0-0000-0000-0000-000000000001', 'CTM Block', 'CTM Block (AI, AIML & DS Branches) Ground Floor Foyer', true, '08:00 AM - 07:30 PM', 'Academic block for AI, AIML & Data Science branches; convenient ground floor atrium between lecture breaks.'),
    ('hub-mba-canteen', 'c011e6e0-0000-0000-0000-000000000001', 'MBA Canteen', 'MBA Block Lawn & Shaded Canteen Tables', true, '09:00 AM - 08:30 PM', 'Quiet outdoor and indoor seating area next to management block.')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Default Users (with valid 36-char hexadecimal UUIDs)
INSERT INTO public.users (id, college_id, email, full_name, student_id, role, is_id_verified, department, hostel, phone)
VALUES
    ('a0000001-0000-0000-0000-000000000001', 'c011e6e0-0000-0000-0000-000000000001', 'rohan.sharma@glbitm.ac.in', 'Rohan Sharma', 'GLB-2023-CS-084', 'STUDENT', true, 'Computer Science', 'Boys Hostel Block B (Room 214)', '+91 98765 12045'),
    ('a0000002-0000-0000-0000-000000000002', 'c011e6e0-0000-0000-0000-000000000001', 'ananya.iyer@glbitm.ac.in', 'Ananya Iyer', 'GLB-2022-EC-041', 'STUDENT', true, 'Electronics & Comm.', 'Girls Hostel Block A (Room 108)', '+91 98111 88421'),
    ('a0000003-0000-0000-0000-000000000003', 'c011e6e0-0000-0000-0000-000000000001', 'admin.marketplace@glbitm.ac.in', 'Prof. Alok Verma', 'FACULTY-CS-01', 'COLLEGE_ADMIN', true, 'Student Welfare & Tech Admin', 'Campus Staff Quarters', '+91 98100 23456')
ON CONFLICT (email) DO NOTHING;
