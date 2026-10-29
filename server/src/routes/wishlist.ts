import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

// GET /api/wishlist - Get active user's wishlisted items
router.get('/', (_req: Request, res: Response) => {
  try {
    const user = db.getCurrentUser();
    if (!user) {
      return res.json({
        success: true,
        items: [],
        count: 0
      });
    }
    const items = db.getWishlist(user.id);
    res.json({
      success: true,
      items,
      count: items.length
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/wishlist/toggle - Toggle wishlist state for product
router.post('/toggle', (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required.' });
    }

    const user = db.getCurrentUser();
    if (!user) {
      return res.status(401).json({ success: false, error: 'Please sign in to save items to your wishlist.' });
    }
    const result = db.toggleWishlist(user.id, productId);

    res.json({
      success: true,
      inWishlist: result.inWishlist,
      wishlistCount: result.count
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
