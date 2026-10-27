import { Router, Request, Response } from 'express';
import { checkSupabaseHealth, supabaseAdmin, supabasePublic, BUCKET_NAME } from '../services/supabase';

const router = Router();

// GET /api/supabase/status - Live health & config status
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const health = await checkSupabaseHealth();
    res.json({
      success: true,
      data: health
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/supabase/schema - Read SQL schema for initial migration
router.get('/schema-sql', async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      instructions: 'Run this SQL in your Supabase SQL Editor (Dashboard -> SQL Editor -> New query) to set up all tables and seed data for CampusCart GLBITM.',
      migrationFile: 'supabase/migrations/002_complete_campuscart_schema.sql'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
