export interface ImageQualityReport {
  quality: 'acceptable' | 'high' | 'poor' | 'insufficient_lighting' | 'blurry';
  isAcceptable: boolean;
  score: number; // 0.0 - 1.0 calibrated score
  lighting: 'good' | 'dim' | 'overexposed';
  clarity: 'sharp' | 'moderate' | 'blurry';
  framing: 'centered' | 'too_small' | 'cropped';
  issues: string[];
  recommendations: string[];
}

export class ImageQualityAnalyzer {
  /**
   * Analyzes an image metadata, buffer, and AI vision response flags
   */
  public analyze(imageData: {
    mimeType?: string;
    sizeBytes?: number;
    filename?: string;
    visionClarityFlag?: string;
    visionLightingFlag?: string;
    visionFramingFlag?: string;
  }): ImageQualityReport {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 0.92;

    // Check file size minimum (e.g. suspiciously tiny files < 15KB lack detail)
    if (imageData.sizeBytes && imageData.sizeBytes < 15000) {
      issues.push('Image resolution is very low (file size under 15KB)');
      recommendations.push('Upload a higher resolution photograph');
      score -= 0.35;
    }

    const clarity = (imageData.visionClarityFlag as any) || 'sharp';
    const lighting = (imageData.visionLightingFlag as any) || 'good';
    const framing = (imageData.visionFramingFlag as any) || 'centered';

    if (clarity === 'blurry') {
      issues.push('Camera motion blur or out of focus');
      recommendations.push('Hold the camera steady and tap to focus on the item');
      score -= 0.3;
    }

    if (lighting === 'dim') {
      issues.push('Insufficient ambient lighting');
      recommendations.push('Photograph the item in a well-lit room or near natural light');
      score -= 0.2;
    } else if (lighting === 'overexposed') {
      issues.push('Harsh flash or heavy glare obscuring surface details');
      recommendations.push('Avoid direct camera flash reflection on glossy surfaces');
      score -= 0.15;
    }

    if (framing === 'too_small') {
      issues.push('Product occupies too small a fraction of the frame');
      recommendations.push('Move closer to the product so it fills at least 70% of the image');
      score -= 0.2;
    }

    score = Math.max(0.1, Math.min(1.0, score));

    let quality: ImageQualityReport['quality'] = 'acceptable';
    if (score >= 0.85) quality = 'high';
    else if (clarity === 'blurry') quality = 'blurry';
    else if (lighting === 'dim') quality = 'insufficient_lighting';
    else if (score < 0.6) quality = 'poor';

    return {
      quality,
      isAcceptable: score >= 0.6,
      score: Number(score.toFixed(2)),
      lighting,
      clarity,
      framing,
      issues,
      recommendations
    };
  }
}
