import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

// GET /api/bargain/offers - List incoming and outgoing offers for the active student
router.get('/offers', (_req: Request, res: Response) => {
  try {
    const user = db.getCurrentUser();
    const { incoming, outgoing } = db.getBargainOffers(user.id);

    res.json({
      success: true,
      incoming,
      outgoing,
      totalActiveOffers: incoming.length + outgoing.length
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/bargain/product/:productId - Check if active user already has an active offer on this product
router.get('/product/:productId', (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const user = db.getCurrentUser();
    const offer = db.getBargainOfferByProductAndBuyer(productId, user.id);

    res.json({
      success: true,
      hasActiveOffer: Boolean(offer),
      offer: offer || null
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/bargain/make-offer - Student submits a bargain offer for a listed product
router.post('/make-offer', (req: Request, res: Response) => {
  try {
    const { productId, offeredPrice, message, allowAutoCounter } = req.body;
    if (!productId || offeredPrice === undefined) {
      return res.status(400).json({ success: false, error: 'Product ID and offered price are required.' });
    }

    const priceNum = Number(offeredPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ success: false, error: 'Please enter a valid numeric offer price.' });
    }

    const user = db.getCurrentUser();
    const offer = db.createBargainOffer({
      productId,
      buyerId: user.id,
      offeredPrice: priceNum,
      buyerMessage: message,
      allowAutoCounter: allowAutoCounter !== false
    });

    res.json({
      success: true,
      message: `Bargain offer of ₹${offer.offeredPrice.toLocaleString('en-IN')} sent to seller! Waiting for seller to review and respond.`,
      offer
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/bargain/raise-offer - Buyer raises / re-negotiates their bargain offer
router.post('/raise-offer', (req: Request, res: Response) => {
  try {
    const { offerId, raisedPrice, message } = req.body;
    if (!offerId || raisedPrice === undefined) {
      return res.status(400).json({ success: false, error: 'Offer ID and raised price are required.' });
    }

    const priceNum = Number(raisedPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ success: false, error: 'Please enter a valid numeric raised price.' });
    }

    const user = db.getCurrentUser();
    const offer = db.raiseBargainOffer({
      offerId,
      buyerId: user.id,
      raisedPrice: priceNum,
      message
    });

    res.json({
      success: true,
      message: `Offer raised to ₹${offer.offeredPrice.toLocaleString('en-IN')}! Waiting for seller to check and respond.`,
      offer
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/bargain/respond - Seller responds (ACCEPT, REJECT, or COUNTER)
router.post('/respond', (req: Request, res: Response) => {
  try {
    const { offerId, action, counterPrice, sellerMessage } = req.body;
    if (!offerId || !action) {
      return res.status(400).json({ success: false, error: 'Offer ID and action (ACCEPT, REJECT, COUNTER) are required.' });
    }

    const user = db.getCurrentUser();
    const offer = db.respondToBargainOffer({
      offerId,
      responderId: user.id,
      action,
      counterPrice: counterPrice ? Number(counterPrice) : undefined,
      sellerMessage
    });

    let msg = 'Offer updated successfully.';
    if (action === 'ACCEPT') msg = `Offer of ₹${offer.offeredPrice} accepted!`;
    if (action === 'REJECT') msg = 'Offer declined.';
    if (action === 'COUNTER') msg = `Counter-offer of ₹${offer.counterPrice} proposed to buyer.`;

    res.json({
      success: true,
      message: msg,
      offer
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/bargain/accept-counter - Buyer accepts seller's counter-offer
router.post('/accept-counter', (req: Request, res: Response) => {
  try {
    const { offerId } = req.body;
    if (!offerId) {
      return res.status(400).json({ success: false, error: 'Offer ID is required.' });
    }

    const user = db.getCurrentUser();
    const offer = db.acceptCounterOffer(offerId, user.id);

    res.json({
      success: true,
      message: `Counter-offer accepted! Bargain finalized at ₹${offer.offeredPrice}.`,
      offer
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/bargain/buy-accepted - Add accepted bargain deal straight to cart with negotiated price
router.post('/buy-accepted', (req: Request, res: Response) => {
  try {
    const { offerId } = req.body;
    if (!offerId) {
      return res.status(400).json({ success: false, error: 'Offer ID is required.' });
    }

    const offer = db.getBargainOfferById(offerId);
    if (!offer) {
      return res.status(404).json({ success: false, error: 'Bargain offer not found.' });
    }

    if (offer.status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        error: `Cannot checkout offer with status "${offer.status}". Only ACCEPTED offers can be added at bargain price.`
      });
    }

    const user = db.getCurrentUser();
    const items = db.addToCart(user.id, offer.productId, 1, offer.offeredPrice, offer.id);
    const subtotal = items.reduce((sum, item) => {
      const unit = item.agreedPrice !== undefined ? item.agreedPrice : (item.product?.price || 0);
      return sum + (unit * item.quantity);
    }, 0);

    res.json({
      success: true,
      message: `Bargain deal applied! Added "${offer.productTitle}" to cart at negotiated price of ₹${offer.offeredPrice.toLocaleString('en-IN')}.`,
      cart: {
        items,
        itemCount: items.reduce((cnt, item) => cnt + item.quantity, 0),
        subtotal
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
