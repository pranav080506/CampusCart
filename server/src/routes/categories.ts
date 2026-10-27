import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

// GET /api/categories - College administrator controlled categories
router.get('/', (_req: Request, res: Response) => {
  try {
    const categories = db.getCategories();
    res.json({ success: true, categories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/categories - Administrator adds new category
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, slug, description, iconName } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ success: false, error: 'Name and slug are required.' });
    }

    const college = db.getActiveCollege();
    const newCategory = db.createCategory({
      id: `cat-${Date.now()}`,
      collegeId: college.id,
      name,
      slug,
      description: description || '',
      iconName: iconName || 'ShoppingBag',
      isApproved: true,
      displayOrder: db.getCategories().length + 1
    });

    res.status(201).json({ success: true, category: newCategory });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
