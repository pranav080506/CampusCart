import { ProductCondition } from '../../types';

export interface ConditionAssessmentReport {
  suggestedCondition: ProductCondition;
  visibleScratches: string[];
  visibleCracksOrDamage: string[];
  missingComponents: string[];
  imageClarityRating: 'sharp' | 'acceptable' | 'suboptimal';
  additionalPhotoRequests: string[];
  observations: string[];
  limitations: string[];
  confidence: number;
}

export class ProductConditionAnalyzer {
  /**
   * Assesses visible signs of wear and surface condition from photographs and vision detections
   */
  public assess(
    categoryName: string,
    visualDetails: {
      rawObservations?: string[];
      detectedScratches?: string[];
      detectedCracks?: string[];
      missingComponents?: string[];
      wearSeverity?: 'none' | 'minimal' | 'moderate' | 'heavy';
      clarity?: 'sharp' | 'acceptable' | 'suboptimal';
      confidence?: number;
    }
  ): ConditionAssessmentReport {
    const scratches = visualDetails.detectedScratches || [];
    const cracks = visualDetails.detectedCracks || [];
    const missing = visualDetails.missingComponents || [];
    const wear = visualDetails.wearSeverity || (scratches.length > 2 || cracks.length > 0 ? 'moderate' : scratches.length > 0 ? 'minimal' : 'none');
    const clarity = visualDetails.clarity || 'acceptable';

    let suggestedCondition: ProductCondition = 'GOOD';
    const observations: string[] = [];
    const additionalPhotoRequests: string[] = [];

    // Map wear to condition tiers
    if (wear === 'none' && scratches.length === 0 && cracks.length === 0 && missing.length === 0) {
      suggestedCondition = 'NEW';
      observations.push('Item surfaces appear pristine with no obvious visible wear or blemishes.');
    } else if (wear === 'minimal' || (scratches.length <= 1 && cracks.length === 0)) {
      suggestedCondition = 'LIKE_NEW';
      observations.push('Minimal superficial signs of prior handling.');
    } else if (wear === 'moderate' || (scratches.length > 1 && cracks.length === 0)) {
      suggestedCondition = 'GOOD';
      observations.push('Normal signs of collegiate use with superficial surface wear.');
    } else {
      suggestedCondition = 'FAIR';
      observations.push('Noticeable surface scratches, discoloration, or visible signs of extensive use.');
    }

    if (scratches.length > 0) {
      observations.push(`Visible scratch marks: ${scratches.join(', ')}`);
    }
    if (cracks.length > 0) {
      observations.push(`Visible crack or structural damage: ${cracks.join(', ')}`);
    }
    if (missing.length > 0) {
      observations.push(`Potentially missing items: ${missing.join(', ')}`);
    }

    // Category-specific close-up photo requests
    const lowerCat = categoryName.toLowerCase();
    if (lowerCat.includes('drawing') || lowerCat.includes('drafter')) {
      additionalPhotoRequests.push('Please upload a close-up photograph of the compass tips, adjustment hinges, and clamping knob.');
    } else if (lowerCat.includes('calculator')) {
      additionalPhotoRequests.push('Please upload a photograph of the LCD screen powered ON to verify segment display, and the battery compartment.');
    } else if (lowerCat.includes('book')) {
      additionalPhotoRequests.push('Please upload a photograph of the book spine, edition page, and sample internal page highlighting.');
    } else if (lowerCat.includes('lab')) {
      additionalPhotoRequests.push('Please upload a close-up photograph of seams, fabric cleanliness, or instrument calibration dials.');
    } else {
      additionalPhotoRequests.push('Please upload a close-up photograph showing corners and interface ports.');
    }

    const limitations: string[] = [
      'Visual appraisal cannot confirm internal electrical reliability or microchip function.',
      'Surface condition does not guarantee absence of hidden internal mechanical fatigue.',
      'Authenticity of brand seals cannot be verified conclusively without physical audit.'
    ];

    let confidence = visualDetails.confidence || 0.89;
    if (clarity === 'sharp') confidence = Math.min(0.95, confidence + 0.04);
    if (clarity === 'suboptimal') confidence = Math.max(0.65, confidence - 0.15);

    return {
      suggestedCondition,
      visibleScratches: scratches,
      visibleCracksOrDamage: cracks,
      missingComponents: missing,
      imageClarityRating: clarity,
      additionalPhotoRequests,
      observations,
      limitations,
      confidence: Number(confidence.toFixed(2))
    };
  }
}
