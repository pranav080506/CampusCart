import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { ProductVerificationService } from '../services/verification/ProductVerificationService';
import { Product, ProductCondition, ProductStatus } from '../types';

const router = Router();
const verificationService = new ProductVerificationService();

// GET /api/products - Public approved marketplace catalog
router.get('/', (req: Request, res: Response) => {
  try {
    const {
      categorySlug,
      condition,
      minPrice,
      maxPrice,
      aiInspectedOnly,
      collegeApprovedOnly,
      search,
      sortBy
    } = req.query;

    const products = db.getPublicProducts({
      categorySlug: categorySlug as string,
      condition: condition as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      aiInspectedOnly: aiInspectedOnly === 'true',
      collegeApprovedOnly: collegeApprovedOnly === 'true',
      search: search as string,
      sortBy: sortBy as any
    });

    res.json({
      success: true,
      college: db.getActiveCollege().name,
      totalCount: products.length,
      products
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/products/:id - Single product with AI verification & audit details
router.get('/:id', (req: Request, res: Response) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    db.incrementProductViews(product.id);
    const auditLogs = db.getAuditLogs(product.id);

    res.json({
      success: true,
      product,
      auditLogs
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/products - Submit listing and run server-side AI verification pipeline
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      price,
      originalPrice,
      categoryId,
      sellerDeclaredCondition,
      images,
      preferredMeetupHubs,
      availableTimings
    } = req.body;

    if (!title || !description || !price || !categoryId || !sellerDeclaredCondition) {
      return res.status(400).json({
        success: false,
        error: 'Missing required listing fields: title, description, price, categoryId, sellerDeclaredCondition'
      });
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one photograph must be uploaded for verification.'
      });
    }

    const categories = db.getCategories();
    const category = categories.find(c => c.id === categoryId);
    const categoryName = category ? category.name : 'Other Approved Products';
    const currentUser = db.getCurrentUser();
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        error: 'Please sign in or register with your college email to list an item.'
      });
    }
    const activeCollege = db.getActiveCollege();

    const productId = `prod-${Date.now()}`;

    // Run AI Verification Pipeline (Steps 1-6)
    const verificationDecision = await verificationService.verifyListing({
      title,
      description,
      selectedCategoryName: categoryName,
      sellerDeclaredCondition: sellerDeclaredCondition as ProductCondition,
      imageUrls: images
    });

    // Save AI verification result table record (Requirement 7)
    const aiResult = db.saveVerificationResult({
      id: `vr-${Date.now()}`,
      productId,
      modelProvider: 'provider-independent-vision',
      modelVersion: 'gemini-2.0-flash',
      predictedCategory: verificationDecision.predictedCategory,
      categoryMatch: verificationDecision.categoryMatch,
      imageQuality: verificationDecision.imageQuality,
      descriptionConsistency: verificationDecision.descriptionConsistency,
      suggestedCondition: verificationDecision.conditionAssessment,
      visibleIssues: verificationDecision.visibleIssues,
      restrictedContentDetected: verificationDecision.restrictedContentDetected,
      confidence: verificationDecision.confidence,
      recommendedAction: verificationDecision.recommendedAction,
      limitations: verificationDecision.limitations,
      createdAt: new Date().toISOString()
    });

    // Determine initial lifecycle status according to College Publication Workflow (Requirement 5)
    let initialStatus: ProductStatus = 'PENDING_COLLEGE_REVIEW';

    if (verificationDecision.recommendedAction === 'reject' || verificationDecision.restrictedContentDetected) {
      initialStatus = 'AI_FLAGGED';
    } else if (verificationDecision.recommendedAction === 'needs_more_info' || !verificationDecision.categoryMatch) {
      initialStatus = verificationDecision.categoryMatch ? 'NEEDS_MORE_INFORMATION' : 'AI_FLAGGED';
    } else if (verificationDecision.recommendedAction === 'manual_review') {
      initialStatus = 'PENDING_COLLEGE_REVIEW';
    } else {
      // Clean AI assessment still requires mandatory college admin approval
      initialStatus = 'PENDING_COLLEGE_REVIEW';
    }

    const newProduct: Product = {
      id: productId,
      title,
      description,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      categoryId,
      collegeId: activeCollege.id,
      sellerId: currentUser.id,
      sellerName: `${currentUser.fullName} (${currentUser.studentId || 'Verified Student'})`,
      sellerDeclaredCondition: sellerDeclaredCondition as ProductCondition,
      aiSuggestedCondition: verificationDecision.conditionAssessment,
      status: initialStatus,
      images,
      isAiInspected: true,
      isCollegeApproved: false, // College approval remains strictly mandatory!
      viewsCount: 0,
      wishlistCount: 0,
      preferredMeetupHubs: preferredMeetupHubs || ['B.Tech Canteen', 'Stationery Shop'],
      availableTimings: availableTimings || 'Weekdays after 4:00 PM',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verificationResult: aiResult
    };

    db.createProduct(newProduct);

    res.status(201).json({
      success: true,
      message: 'Product listing submitted and AI verification completed.',
      product: newProduct,
      verification: verificationDecision
    });
  } catch (error: any) {
    console.error('Error submitting product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
