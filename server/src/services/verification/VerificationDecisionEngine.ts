import { ProductCondition } from '../../types';
import { ImageQualityReport } from './ImageQualityAnalyzer';
import { CategoryClassificationResult } from './ProductCategoryClassifier';
import { ConsistencyReport } from './DescriptionImageConsistencyChecker';
import { RestrictedContentReport } from './RestrictedContentDetector';
import { ConditionAssessmentReport } from './ProductConditionAnalyzer';

export interface FinalVerificationDecision {
  imageQuality: 'acceptable' | 'high' | 'poor' | 'insufficient_lighting' | 'blurry';
  predictedCategory: string;
  categoryMatch: boolean;
  descriptionConsistency: 'likely_consistent' | 'inconsistent' | 'uncertain';
  conditionAssessment: ProductCondition;
  visibleIssues: string[];
  restrictedContentDetected: boolean;
  confidence: number;
  recommendedAction: 'approve' | 'manual_review' | 'reject' | 'needs_more_info';
  limitations: string[];
  calibrationBreakdown: {
    qualityWeight: number;
    categoryMatchWeight: number;
    consistencyWeight: number;
    conditionCertaintyWeight: number;
  };
}

export class VerificationDecisionEngine {
  /**
   * Evaluates all module outputs to synthesize a calibrated decision
   */
  public synthesize(
    quality: ImageQualityReport,
    category: CategoryClassificationResult,
    consistency: ConsistencyReport,
    restricted: RestrictedContentReport,
    condition: ConditionAssessmentReport,
    sellerDeclaredCondition?: ProductCondition
  ): FinalVerificationDecision {
    const visibleIssues: string[] = [];

    // Collate all visible issues
    if (quality.issues.length > 0) visibleIssues.push(...quality.issues);
    if (!category.categoryMatch && category.mismatchReason) visibleIssues.push(category.mismatchReason);
    if (consistency.discrepancies.length > 0) visibleIssues.push(...consistency.discrepancies);
    if (condition.visibleScratches.length > 0) visibleIssues.push(...condition.visibleScratches.map(s => `Scratch: ${s}`));
    if (condition.visibleCracksOrDamage.length > 0) visibleIssues.push(...condition.visibleCracksOrDamage.map(c => `Damage: ${c}`));
    if (restricted.concerns.length > 0) visibleIssues.push(...restricted.concerns);

    // Combine limitations
    const limitations = Array.from(new Set([
      ...consistency.limitations,
      ...condition.limitations,
      'AI verification provides assistive signals for administrative review and does not substitute authorized college moderation.'
    ]));

    // Calibrated Confidence Scoring Formula:
    // Quality (25%), Category Match (35%), Description Alignment (20%), Condition Visual Evidence (20%)
    const qScore = quality.score;
    const catScore = category.categoryMatch ? category.confidence : (1 - category.confidence);
    const consScore = consistency.score;
    const condScore = condition.confidence;

    const rawConfidence = (qScore * 0.25) + (catScore * 0.35) + (consScore * 0.20) + (condScore * 0.20);
    const calibratedConfidence = Number(Math.max(0.50, Math.min(0.98, rawConfidence)).toFixed(2));

    // Determine Recommended Action
    let recommendedAction: FinalVerificationDecision['recommendedAction'] = 'manual_review';

    if (restricted.restrictedContentDetected && restricted.severity === 'CRITICAL') {
      recommendedAction = 'reject';
    } else if (!quality.isAcceptable) {
      recommendedAction = 'needs_more_info';
    } else if (!category.categoryMatch) {
      // Category mismatch requires human administrator review
      recommendedAction = 'manual_review';
    } else if (sellerDeclaredCondition && this.hasSevereConditionDiscrepancy(sellerDeclaredCondition, condition.suggestedCondition)) {
      visibleIssues.push(`Condition discrepancy detected: Seller declared '${sellerDeclaredCondition}' but visual analysis suggests '${condition.suggestedCondition}'.`);
      recommendedAction = 'manual_review';
    } else if (category.categoryMatch && consistency.isConsistent && quality.isAcceptable && !restricted.restrictedContentDetected && calibratedConfidence >= 0.85) {
      recommendedAction = 'approve';
    } else {
      recommendedAction = 'manual_review';
    }

    return {
      imageQuality: quality.quality,
      predictedCategory: category.predictedCategory,
      categoryMatch: category.categoryMatch,
      descriptionConsistency: consistency.consistency,
      conditionAssessment: condition.suggestedCondition,
      visibleIssues: visibleIssues.length > 0 ? visibleIssues : ['No visible defects detected'],
      restrictedContentDetected: restricted.restrictedContentDetected,
      confidence: calibratedConfidence,
      recommendedAction,
      limitations,
      calibrationBreakdown: {
        qualityWeight: Number((qScore * 0.25).toFixed(3)),
        categoryMatchWeight: Number((catScore * 0.35).toFixed(3)),
        consistencyWeight: Number((consScore * 0.20).toFixed(3)),
        conditionCertaintyWeight: Number((condScore * 0.20).toFixed(3))
      }
    };
  }

  /**
   * Helper to flag major condition discrepancies (e.g. NEW vs FAIR)
   */
  private hasSevereConditionDiscrepancy(declared: ProductCondition, suggested: ProductCondition): boolean {
    const ranks: Record<ProductCondition, number> = {
      NEW: 4,
      LIKE_NEW: 3,
      GOOD: 2,
      FAIR: 1
    };
    const diff = Math.abs((ranks[declared] || 2) - (ranks[suggested] || 2));
    return diff >= 2; // e.g. NEW declared but FAIR suggested
  }
}
