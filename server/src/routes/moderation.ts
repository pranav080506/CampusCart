import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

// GET /api/moderation/queue - Retrieves queues for all dashboard tabs
router.get('/queue', (_req: Request, res: Response) => {
  try {
    const queue = db.getModerationQueue();
    const categories = db.getCategories();
    const auditLogs = db.getAuditLogs();

    res.json({
      success: true,
      college: db.getActiveCollege().name,
      counts: {
        pendingApprovals: queue.pendingCollegeApprovals.length,
        aiFlagged: queue.aiFlagged.length,
        categoryMismatches: queue.categoryMismatches.length,
        lowQualityPhotos: queue.lowQualityPhotos.length,
        conditionDiscrepancies: queue.conditionDiscrepancies.length,
        recentlyApproved: queue.recentlyApproved.length,
        total: queue.allModerationItems.length
      },
      queue,
      categories,
      auditLogs
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/moderation/:productId/action - College administrator executes review decision
router.post('/:productId/action', (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { action, reason } = req.body;

    if (!['APPROVED', 'REJECTED', 'REQUESTED_INFO', 'SUSPENDED'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be APPROVED, REJECTED, REQUESTED_INFO, or SUSPENDED.'
      });
    }

    // Require reason for rejections, information requests, and suspensions (Requirement 6)
    if (action !== 'APPROVED' && (!reason || reason.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        error: `A detailed reason is mandatory when executing action '${action}'.`
      });
    }

    const currentUser = db.getCurrentUser();
    const adminName = currentUser ? currentUser.fullName : 'Authorized College Admin';
    const adminId = currentUser ? currentUser.id : 'usr-admin-system';

    const result = db.recordModerationAction({
      productId,
      adminId,
      adminName,
      action,
      reason: reason || 'Approved after college verification inspection.'
    });

    res.json({
      success: true,
      message: `Product successfully transitioned: ${action}`,
      product: result.product,
      auditLog: result.auditLog
    });
  } catch (error: any) {
    console.error('Error recording moderation action:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/moderation/audit-logs - View protected decision logs
router.get('/audit-logs', (req: Request, res: Response) => {
  try {
    const { productId } = req.query;
    const logs = db.getAuditLogs(productId as string);
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
