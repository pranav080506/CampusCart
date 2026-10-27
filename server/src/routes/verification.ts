import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ProductVerificationService } from '../services/verification/ProductVerificationService';
import { db } from '../db/database';
import { ProductCondition } from '../types';
import { uploadImageToSupabase } from '../services/supabase';

const router = Router();
const verificationService = new ProductVerificationService();

// Ensure upload directory exists
const uploadDir = process.env.VERCEL 
  ? path.join('/tmp', 'uploads') 
  : path.join(__dirname, '../../../public/uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config with file type security enforcement (Step 1)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `prod-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const dangerousExtensions = ['.exe', '.sh', '.bat', '.cmd', '.js', '.vbs', '.scr'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (dangerousExtensions.includes(ext)) {
      return cb(new Error('Executable or script files are strictly prohibited.'));
    }

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image format. Only JPEG, PNG, and WebP are supported.'));
    }
  }
});

// POST /api/verification/upload-image - Upload photograph with format & size validation + Supabase Cloud Storage
router.post('/upload-image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded.' });
    }

    let publicUrl = `/uploads/${req.file.filename}`;
    let isCloudStored = false;

    // Stream to Supabase Storage if configured
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      const supabaseUpload = await uploadImageToSupabase(fileBuffer, req.file.filename, req.file.mimetype);
      if (supabaseUpload.success && supabaseUpload.publicUrl) {
        publicUrl = supabaseUpload.publicUrl;
        isCloudStored = true;
      }
    } catch (e: any) {
      console.warn('[Storage] Supabase upload fallback to local storage:', e.message);
    }

    res.json({
      success: true,
      imageUrl: publicUrl,
      isCloudStored,
      fileInfo: {
        filename: req.file.filename,
        sizeBytes: req.file.size,
        mimeType: req.file.mimetype
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/verification/upload-multiple - Upload multiple photos at once + Supabase Cloud Storage
router.post('/upload-multiple', upload.array('images', 5), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No image files uploaded.' });
    }

    const uploadedFiles = await Promise.all(files.map(async file => {
      let publicUrl = `/uploads/${file.filename}`;
      let isCloudStored = false;

      try {
        const fileBuffer = fs.readFileSync(file.path);
        const supabaseUpload = await uploadImageToSupabase(fileBuffer, file.filename, file.mimetype);
        if (supabaseUpload.success && supabaseUpload.publicUrl) {
          publicUrl = supabaseUpload.publicUrl;
          isCloudStored = true;
        }
      } catch (e) {
        // Fallback to local
      }

      return {
        imageUrl: publicUrl,
        filename: file.filename,
        sizeBytes: file.size,
        mimeType: file.mimetype,
        isCloudStored
      };
    }));

    res.json({
      success: true,
      images: uploadedFiles,
      count: uploadedFiles.length
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/verification/inspect-draft - Interactive AI Condition & Listing Assessment
// This is the core endpoint that now sends REAL photos to Gemini Vision AI
router.post('/inspect-draft', async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      categoryId,
      sellerDeclaredCondition,
      images,
      fileMetadata
    } = req.body;

    const categories = db.getCategories();
    const category = categories.find(c => c.id === categoryId);
    const categoryName = category ? category.name : 'Engineering Drawing';

    // Convert public image URLs to filesystem paths for Gemini Vision to read
    const imageFilePaths = (images || []).map((imgUrl: string) => {
      // The imgUrl is like "/uploads/prod-1234.jpg"
      // We need to resolve it to the absolute path on disk
      if (imgUrl.startsWith('/uploads/')) {
        return path.join(uploadDir, imgUrl.replace('/uploads/', ''));
      }
      // If it's already a full path, use it directly
      return imgUrl;
    });

    console.log(`[API] inspect-draft called for "${title}" with ${imageFilePaths.length} photos`);

    const decision = await verificationService.verifyListing({
      title: title || 'Draft Product',
      description: description || 'Visual verification draft inspection',
      selectedCategoryName: categoryName,
      sellerDeclaredCondition: (sellerDeclaredCondition as ProductCondition) || 'GOOD',
      imageUrls: imageFilePaths, // Now passing actual file paths, not just URL strings
      fileMetadata
    });

    res.json({
      success: true,
      assessment: {
        suggestedCondition: decision.conditionAssessment,
        categoryMatch: decision.categoryMatch,
        predictedCategory: decision.predictedCategory,
        imageQuality: decision.imageQuality,
        descriptionConsistency: decision.descriptionConsistency,
        visibleIssues: decision.visibleIssues,
        restrictedContentDetected: decision.restrictedContentDetected,
        confidence: decision.confidence,
        recommendedAction: decision.recommendedAction,
        limitations: decision.limitations,
        calibrationBreakdown: decision.calibrationBreakdown
      }
    });
  } catch (error: any) {
    console.error('Error in inspect-draft:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
