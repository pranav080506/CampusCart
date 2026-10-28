-- ==============================================================================
-- Migration: 003_bargain_offers_schema.sql
-- Description: Peer-to-Peer Bargaining & Counter-Offer Negotiation Table for CampusCart
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.bargain_offers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    product_title TEXT NOT NULL,
    product_image TEXT,
    original_listing_price NUMERIC(10, 2) NOT NULL,
    offered_price NUMERIC(10, 2) NOT NULL,
    buyer_id TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    seller_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'EXPIRED')),
    buyer_message TEXT,
    counter_price NUMERIC(10, 2),
    seller_message TEXT,
    ai_acceptance_probability INTEGER DEFAULT 75,
    ai_deal_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_bargain_offers_product ON public.bargain_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_bargain_offers_buyer ON public.bargain_offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_bargain_offers_seller ON public.bargain_offers(seller_id);
CREATE INDEX IF NOT EXISTS idx_bargain_offers_status ON public.bargain_offers(status);

-- Enable RLS
ALTER TABLE public.bargain_offers ENABLE ROW LEVEL SECURITY;

-- Service Role Full Access
DROP POLICY IF EXISTS "Service role full access bargain_offers" ON public.bargain_offers;
CREATE POLICY "Service role full access bargain_offers" ON public.bargain_offers FOR ALL USING (auth.role() = 'service_role');

-- Public / Authenticated read access for buyers and sellers
DROP POLICY IF EXISTS "Public read bargain_offers" ON public.bargain_offers;
CREATE POLICY "Public read bargain_offers" ON public.bargain_offers FOR SELECT USING (true);
