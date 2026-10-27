import { z } from 'zod';
import { ProductCondition, RestrictedPolicy } from '../../types';
import { GeminiVisionAnalyzer, GeminiVisionOutput } from './GeminiVisionAnalyzer';
import { ImageQualityAnalyzer } from './ImageQualityAnalyzer';
import { ProductCategoryClassifier } from './ProductCategoryClassifier';
import { DescriptionImageConsistencyChecker } from './DescriptionImageConsistencyChecker';
import { RestrictedContentDetector } from './RestrictedContentDetector';
import { ProductConditionAnalyzer } from './ProductConditionAnalyzer';
import { VerificationDecisionEngine, FinalVerificationDecision } from './VerificationDecisionEngine';

// Strict Zod schema for Step 6 verification payload validation
export const VerificationResultSchema = z.object({
  imageQuality: z.enum(['acceptable', 'high', 'poor', 'insufficient_lighting', 'blurry']),
  predictedCategory: z.string(),
  categoryMatch: z.boolean(),
  descriptionConsistency: z.enum(['likely_consistent', 'inconsistent', 'uncertain']),
  conditionAssessment: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']),
  visibleIssues: z.array(z.string()),
  restrictedContentDetected: z.boolean(),
  confidence: z.number().min(0).max(1),
  recommendedAction: z.enum(['approve', 'manual_review', 'reject', 'needs_more_info']),
  limitations: z.array(z.string())
});

export interface VerificationRequestParams {
  title: string;
  description: string;
  selectedCategoryName: string;
  sellerDeclaredCondition: ProductCondition;
  imageUrls: string[];
  fileMetadata?: {
    sizeBytes?: number;
    mimeType?: string;
    filename?: string;
  };
  policies?: RestrictedPolicy[];
}

export class ProductVerificationService {
  private visionAnalyzer: GeminiVisionAnalyzer;
  private qualityAnalyzer: ImageQualityAnalyzer;
  private categoryClassifier: ProductCategoryClassifier;
  private consistencyChecker: DescriptionImageConsistencyChecker;
  private restrictedDetector: RestrictedContentDetector;
  private conditionAnalyzer: ProductConditionAnalyzer;
  private decisionEngine: VerificationDecisionEngine;

  constructor() {
    this.visionAnalyzer = new GeminiVisionAnalyzer();
    this.qualityAnalyzer = new ImageQualityAnalyzer();
    this.categoryClassifier = new ProductCategoryClassifier();
    this.consistencyChecker = new DescriptionImageConsistencyChecker();
    this.restrictedDetector = new RestrictedContentDetector();
    this.conditionAnalyzer = new ProductConditionAnalyzer();
    this.decisionEngine = new VerificationDecisionEngine();
  }

  /**
   * Main verification pipeline orchestrating Steps 1-6
   * Now powered by real Gemini Vision API photo analysis.
   */
  public async verifyListing(params: VerificationRequestParams): Promise<FinalVerificationDecision> {
    const {
      title,
      description,
      selectedCategoryName,
      sellerDeclaredCondition,
      imageUrls,
      fileMetadata,
      policies
    } = params;

    // Step 1: REAL AI Vision Analysis — sends actual photos to Gemini 3.8 Flash
    console.log(`[Verification] Starting AI photo analysis for "${title}"...`);
    const visionOutput = await this.visionAnalyzer.analyzeMultiplePhotos(
      imageUrls,
      title,
      description,
      selectedCategoryName
    );
    console.log(`[Verification] AI analysis complete. Detected: "${visionOutput.primaryObject}" (${(visionOutput.overallAnalysisConfidence * 100).toFixed(0)}% confidence)`);

    // Step 2: Image Quality Analysis — enhanced with real vision signals
    const qualityReport = this.qualityAnalyzer.analyze({
      mimeType: fileMetadata?.mimeType,
      sizeBytes: fileMetadata?.sizeBytes,
      filename: fileMetadata?.filename,
      visionClarityFlag: visionOutput.clarity,
      visionLightingFlag: visionOutput.lighting,
      visionFramingFlag: visionOutput.framing
    });

    // Step 3: Product Category Classification — powered by real object detection
    const categoryResult = this.categoryClassifier.classify(selectedCategoryName, {
      labels: visionOutput.detectedLabels,
      detectedItem: visionOutput.primaryObject,
      aiEstimatedCategory: visionOutput.estimatedCategory,
      confidence: visionOutput.categoryConfidence
    });

    // Step 4: Description-Image Consistency Check — real cross-verification
    const consistencyReport = this.consistencyChecker.evaluate(title, description, {
      predictedItemType: visionOutput.primaryObject || categoryResult.predictedCategory,
      detectedIssues: visionOutput.scratchesOrWear,
      visibleBrandLogoFound: visionOutput.brandVisible
    });

    // Step 5: Restricted Content Detection — enhanced with vision-detected labels
    const restrictedReport = this.restrictedDetector.scan({
      title,
      description,
      labels: visionOutput.detectedLabels,
      categoryName: selectedCategoryName
    }, policies);

    // Override restricted content if Gemini Vision detected it directly in the photo
    if (visionOutput.containsRestrictedContent && !restrictedReport.restrictedContentDetected) {
      restrictedReport.restrictedContentDetected = true;
      restrictedReport.flaggedRules.push('AI Vision: Restricted content detected in photograph');
      restrictedReport.concerns.push(`Gemini Vision flagged: ${visionOutput.restrictedContentDetails}`);
      restrictedReport.severity = 'HIGH';
    }

    // AI Condition Assessment — now based on real visual defect detection
    const conditionReport = this.conditionAnalyzer.assess(selectedCategoryName, {
      detectedScratches: visionOutput.scratchesOrWear,
      detectedCracks: visionOutput.cracksOrDamage,
      missingComponents: visionOutput.missingParts,
      wearSeverity: visionOutput.wearSeverity,
      clarity: qualityReport.clarity === 'sharp' ? 'sharp' : qualityReport.clarity === 'blurry' ? 'suboptimal' : 'acceptable',
      confidence: visionOutput.conditionConfidence
    });

    // Step 6: Synthesis and Calibrated Decision
    const decision = this.decisionEngine.synthesize(
      qualityReport,
      categoryResult,
      consistencyReport,
      restrictedReport,
      conditionReport,
      sellerDeclaredCondition
    );

    // Add non-college item flag from vision analysis
    if (!visionOutput.isCollegeRelated) {
      decision.visibleIssues.push(`Product is NOT college-related: ${visionOutput.collegeRelevanceReason}`);
      if (decision.recommendedAction === 'approve') {
        decision.recommendedAction = 'manual_review';
      }
    }

    // Add description mismatch from vision analysis
    if (!visionOutput.descriptionMatchesImage && visionOutput.descriptionMismatchDetails !== 'None') {
      decision.visibleIssues.push(`Photo-description mismatch: ${visionOutput.descriptionMismatchDetails}`);
    }

    // Validate payload against schema to guarantee integrity
    VerificationResultSchema.parse({
      imageQuality: decision.imageQuality,
      predictedCategory: decision.predictedCategory,
      categoryMatch: decision.categoryMatch,
      descriptionConsistency: decision.descriptionConsistency,
      conditionAssessment: decision.conditionAssessment,
      visibleIssues: decision.visibleIssues,
      restrictedContentDetected: decision.restrictedContentDetected,
      confidence: decision.confidence,
      recommendedAction: decision.recommendedAction,
      limitations: decision.limitations
    });

    return decision;
  }
}
