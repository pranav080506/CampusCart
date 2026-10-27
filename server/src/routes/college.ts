import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

// GET /api/college/current - Active verified college info
router.get('/current', (_req: Request, res: Response) => {
  try {
    const college = db.getActiveCollege();
    res.json({ success: true, college });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/college/all - List available verified colleges
router.get('/all', (_req: Request, res: Response) => {
  try {
    const colleges = db.getColleges();
    res.json({ success: true, colleges });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/college/switch - Switch current college context
router.post('/switch', (req: Request, res: Response) => {
  try {
    const { collegeId } = req.body;
    const college = db.setActiveCollege(collegeId);
    res.json({ success: true, college });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/college/config - Administrator updates college details
router.put('/config', (req: Request, res: Response) => {
  try {
    const { name, domain, shortCode, state } = req.body;
    const current = db.getActiveCollege();
    const updated = db.updateCollegeConfig(current.id, {
      name: name || current.name,
      domain: domain || current.domain,
      shortCode: shortCode || current.shortCode,
      state: state || current.state
    });
    res.json({ success: true, college: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
