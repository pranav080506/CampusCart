import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

// GET /api/meetups/hubs - List verified campus hubs
router.get('/hubs', (_req: Request, res: Response) => {
  try {
    const hubs = db.getCampusHubs();
    res.json({ success: true, hubs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/meetups - List all meetups for user (buyer or seller)
router.get('/', (req: Request, res: Response) => {
  try {
    const user = db.getCurrentUser();
    if (!user) {
      return res.json({ success: true, meetups: [] });
    }
    const meetups = db.getMeetups(user.id);
    res.json({ success: true, meetups });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/meetups/:id - Get single meetup session
router.get('/:id', (req: Request, res: Response) => {
  try {
    const meetup = db.getMeetupById(req.params.id);
    if (!meetup) {
      return res.status(404).json({ success: false, error: 'Meetup session not found.' });
    }
    res.json({ success: true, meetup });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/meetups/propose - Propose a new meetup (by buyer or direct)
router.post('/propose', (req: Request, res: Response) => {
  try {
    const { productId, hubLocation, hubLandmark, meetingDate, timeSlot, buyerNotes } = req.body;

    if (!productId || !hubLocation || !meetingDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        error: 'Missing required meetup proposal fields (productId, hubLocation, meetingDate, timeSlot).'
      });
    }

    const currentUser = db.getCurrentUser();
    if (!currentUser) {
      return res.status(401).json({ success: false, error: 'Please sign in to coordinate campus meetups.' });
    }

    const session = db.createMeetupSession({
      productId,
      buyerId: currentUser.id,
      hubLocation,
      hubLandmark,
      meetingDate,
      timeSlot,
      buyerNotes
    });

    res.status(201).json({
      success: true,
      message: 'Meetup proposal initiated. Waiting for seller confirmation.',
      meetup: session
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/meetups/account/summary - Get private summary for current user
router.get('/account/summary', (req: Request, res: Response) => {
  try {
    const user = db.getCurrentUser();
    if (!user) {
      return res.json({
        success: true,
        user: null,
        buyerMeetups: [],
        sellerMeetups: [],
        totalBuyerOrders: 0,
        totalSellerSales: 0
      });
    }
    const allMeetups = db.getMeetups(user.id);
    const buyerMeetups = allMeetups.filter(m => m.buyerId === user.id);
    const sellerMeetups = allMeetups.filter(m => m.sellerId === user.id);

    res.json({
      success: true,
      user,
      buyerMeetups,
      sellerMeetups,
      totalBuyerOrders: buyerMeetups.length,
      totalSellerSales: sellerMeetups.length
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/meetups/:id/respond - Buyer or seller confirms or suggests counter-proposal
router.post('/:id/respond', (req: Request, res: Response) => {
  try {
    const { action, hubLocation, hubLandmark, meetingDate, timeSlot, note } = req.body;

    if (!action || !['CONFIRM', 'COUNTER', 'COMPLETE'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid response action. Requires action (CONFIRM, COUNTER, COMPLETE).'
      });
    }

    const session = db.getMeetupById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Meetup session not found.' });
    }

    const currentUser = db.getCurrentUser();
    if (!currentUser) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    // Authenticate actor strictly from session identity
    let verifiedActor: 'BUYER' | 'SELLER';
    if (currentUser.id === session.buyerId) {
      verifiedActor = 'BUYER';
    } else if (currentUser.id === session.sellerId) {
      verifiedActor = 'SELLER';
    } else if (currentUser.role === 'COLLEGE_ADMIN') {
      verifiedActor = (req.body.actor as 'BUYER' | 'SELLER') || 'SELLER';
    } else {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You are neither the buyer nor seller for this private meetup.'
      });
    }

    const updatedSession = db.respondToMeetupSession({
      meetupId: req.params.id,
      actor: verifiedActor,
      action,
      hubLocation,
      hubLandmark,
      meetingDate,
      timeSlot,
      note
    });

    res.json({
      success: true,
      message: action === 'CONFIRM'
        ? `Meetup confirmed by ${verifiedActor === 'BUYER' ? 'Buyer' : 'Seller'}!`
        : action === 'COUNTER'
        ? `Alternative hub or timing proposed by ${verifiedActor === 'BUYER' ? 'Buyer' : 'Seller'}.`
        : 'Meetup marked completed.',
      meetup: updatedSession
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/meetups/:id/verify-code - Seller verifies buyer's secret handover pass
router.post('/:id/verify-code', (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const currentUser = db.getCurrentUser();
    if (!currentUser) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }
    const session = db.getMeetupById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Meetup session not found.' });
    }

    // Only seller or admin can verify the code
    if (currentUser.id !== session.sellerId && currentUser.role !== 'COLLEGE_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Only the verified seller can verify the buyer handover code.'
      });
    }

    if (!code || code.trim().toUpperCase() !== session.handoverCode.toUpperCase()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Handover Code. Please ask the buyer to provide the 6-character code from their Buyer Pass.'
      });
    }

    const updatedSession = db.respondToMeetupSession({
      meetupId: req.params.id,
      actor: 'SELLER',
      action: 'COMPLETE',
      note: `Verified buyer handover pass (${session.handoverCode}). Item inspected and handed over successfully!`
    });

    res.json({
      success: true,
      message: 'Handover Code verified! Transaction completed and funds unlocked.',
      meetup: updatedSession
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/meetups/:id/messages - Get chat messages for meetup
router.get('/:id/messages', (req: Request, res: Response) => {
  try {
    const messages = db.getMeetupMessages(req.params.id);
    res.json({ success: true, messages });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/meetups/:id/messages - Send a direct chat message between buyer and seller
router.post('/:id/messages', (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message text cannot be empty.'
      });
    }

    const session = db.getMeetupById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Meetup session not found.' });
    }

    const currentUser = db.getCurrentUser();
    if (!currentUser) {
      return res.status(401).json({ success: false, error: 'Authentication required to send messages.' });
    }

    // Authenticate sender role strictly from logged-in user
    let verifiedSenderRole: 'BUYER' | 'SELLER';
    if (currentUser.id === session.buyerId) {
      verifiedSenderRole = 'BUYER';
    } else if (currentUser.id === session.sellerId) {
      verifiedSenderRole = 'SELLER';
    } else if (currentUser.role === 'COLLEGE_ADMIN') {
      verifiedSenderRole = (req.body.senderRole as 'BUYER' | 'SELLER') || 'SELLER';
    } else {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Private chat is restricted to the buyer and seller of this item.'
      });
    }

    const newMsg = db.addMeetupMessage({
      meetupId: req.params.id,
      senderRole: verifiedSenderRole,
      text: text.trim()
    });

    const updatedSession = db.getMeetupById(req.params.id);

    res.status(201).json({
      success: true,
      message: newMsg,
      allMessages: updatedSession?.messages || []
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
