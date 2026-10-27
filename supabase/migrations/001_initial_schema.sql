-- Supabase PostgreSQL Schema for CampusCart

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Colleges Table (Admin Configured)
CREATE TABLE IF NOT EXISTS colleges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_code VARCHAR(50) NOT NULL UNIQUE,
    domain VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories Table (Controlled by Administrator)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    is_approved BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(college_id, slug)
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    student_id VARCHAR(100),
    role VARCHAR(50) DEFAULT 'STUDENT' CHECK (role IN ('STUDENT', 'COLLEGE_ADMIN', 'SUPER_ADMIN')),
    is_id_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    original_price DECIMAL(10, 2) CHECK (original_price IS NULL OR original_price >= price),
    category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
    college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    seller_declared_condition VARCHAR(20) NOT NULL CHECK (seller_declared_condition IN ('NEW', 'LIKE_NEW', 'GOOD', 'FAIR')),
    ai_suggested_condition VARCHAR(20) CHECK (ai_suggested_condition IN ('NEW', 'LIKE_NEW', 'GOOD', 'FAIR')),
    status VARCHAR(50) DEFAULT 'PENDING_AI_CHECK' CHECK (
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
    college_approved_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    admin_notes TEXT,
    views_count INT DEFAULT 0,
    wishlist_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Verification Results Table (as explicitly requested)
CREATE TABLE IF NOT EXISTS ai_verification_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    model_provider VARCHAR(100) NOT NULL DEFAULT 'gemini-vision-pro',
    model_version VARCHAR(50) NOT NULL DEFAULT '2.0-flash',
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

-- Moderation Audit Log (Protected history of admin decisions)
CREATE TABLE IF NOT EXISTS moderation_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_name VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    previous_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Restricted Content Policies
CREATE TABLE IF NOT EXISTS restricted_content_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    description TEXT,
    keywords JSONB DEFAULT '[]'::jsonb,
    severity VARCHAR(20) DEFAULT 'HIGH',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wishlist Table
CREATE TABLE IF NOT EXISTS wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Cart Table
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_college ON products(college_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_ai_results_product ON ai_verification_results(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_product ON moderation_audit_logs(product_id);
