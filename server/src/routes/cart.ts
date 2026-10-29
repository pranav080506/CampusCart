import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

// Helper to calculate subtotal with agreed bargain prices respected
const computeSubtotal = (items: any[]) =>
  items.reduce((sum, item) => {
    const unitPrice = item.agreedPrice !== undefined ? item.agreedPrice : (item.product?.price || 0);
    return sum + (unitPrice * item.quantity);
  }, 0);

// GET /api/cart - User cart with product details
router.get('/', (_req: Request, res: Response) => {
  try {
    const user = db.getCurrentUser();
    if (!user) {
      return res.json({
        success: true,
        items: [],
        itemCount: 0,
        subtotal: 0
      });
    }
    const items = db.getCart(user.id);
    const subtotal = computeSubtotal(items);

    res.json({
      success: true,
      items,
      itemCount: items.reduce((cnt, item) => cnt + item.quantity, 0),
      subtotal
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cart/add - Add item to cart (with optional agreed bargain price)
router.post('/add', (req: Request, res: Response) => {
  try {
    const { productId, quantity, agreedPrice, bargainOfferId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required.' });
    }

    const user = db.getCurrentUser();
    if (!user) {
      return res.status(401).json({ success: false, error: 'Please log in to add items to your cart.' });
    }
    const items = db.addToCart(user.id, productId, quantity || 1, agreedPrice, bargainOfferId);
    const subtotal = computeSubtotal(items);

    res.json({
      success: true,
      message: agreedPrice ? `Item added with accepted bargain price of ₹${agreedPrice}` : 'Item added to cart',
      items,
      itemCount: items.reduce((cnt, item) => cnt + item.quantity, 0),
      subtotal
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/cart/update - Update item quantity
router.put('/update', (req: Request, res: Response) => {
  try {
    const { cartItemId, quantity } = req.body;
    const user = db.getCurrentUser();
    if (!user) {
      return res.status(401).json({ success: false, error: 'Please log in to manage your cart.' });
    }
    const items = db.updateCartItem(user.id, cartItemId, Number(quantity));
    const subtotal = computeSubtotal(items);

    res.json({
      success: true,
      items,
      itemCount: items.reduce((cnt, item) => cnt + item.quantity, 0),
      subtotal
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/cart/:cartItemId - Remove item from cart
router.delete('/:cartItemId', (req: Request, res: Response) => {
  try {
    const { cartItemId } = req.params;
    const user = db.getCurrentUser();
    if (!user) {
      return res.status(401).json({ success: false, error: 'Please log in to manage your cart.' });
    }
    const items = db.updateCartItem(user.id, cartItemId, 0);
    const subtotal = computeSubtotal(items);

    res.json({
      success: true,
      message: 'Item removed from cart',
      items,
      itemCount: items.reduce((cnt, item) => cnt + item.quantity, 0),
      subtotal
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cart/checkout - Manual campus handover checkout (hub & timing decided by both)
router.post('/checkout', (req: Request, res: Response) => {
  try {
    const user = db.getCurrentUser();
    if (!user) {
      return res.status(401).json({ success: false, error: 'Please log in to proceed to checkout.' });
    }
    const items = db.getCart(user.id);
    if (items.length === 0) {
      return res.status(400).json({ success: false, error: 'Your cart is empty.' });
    }

    const {
      meetupHub,
      hubLandmark,
      meetingDate,
      timeSlot,
      buyerNotes
    } = req.body;

    const orderId = `ORD-CAMPUS-${Date.now().toString().slice(-6)}`;
    const totalAmount = items.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);

    const firstProduct = items[0]?.product;
    let meetupSession = null;

    if (firstProduct) {
      meetupSession = db.createMeetupSession({
        orderId,
        productId: firstProduct.id,
        buyerId: user.id,
        hubLocation: meetupHub || 'B.Tech Canteen',
        hubLandmark: hubLandmark || '',
        meetingDate: meetingDate || 'Tomorrow (29 Oct)',
        timeSlot: timeSlot || '05:00 PM - 05:30 PM',
        buyerNotes: buyerNotes || 'Order placed. Awaiting seller confirmation for campus handover.'
      });
    }

    // Clear cart after checkout
    db.clearCart(user.id);

    res.json({
      success: true,
      orderId,
      totalAmount,
      meetupLocation: meetupSession ? meetupSession.hubLocation : (meetupHub || 'B.Tech Canteen'),
      meetingDate: meetupSession ? meetupSession.meetingDate : (meetingDate || 'Tomorrow'),
      timeSlot: meetupSession ? meetupSession.timeSlot : (timeSlot || '05:00 PM - 05:30 PM'),
      itemsCount: items.length,
      meetup: meetupSession,
      message: 'Meetup proposal created! Handover hub and timing require mutual confirmation from both buyer and seller.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
