import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';

/**
 * Structured output schema for Gemini Vision product analysis.
 * Every field maps to a downstream verification module input.
 */
export interface GeminiVisionOutput {
  // Core identification
  primaryObject: string;
  estimatedCategory: string;
  detectedLabels: string[];

  // Image quality signals
  clarity: 'sharp' | 'moderate' | 'blurry';
  lighting: 'good' | 'dim' | 'overexposed';
  framing: 'centered' | 'too_small' | 'cropped';
  imageResolutionAdequate: boolean;

  // Physical condition signals
  scratchesOrWear: string[];
  cracksOrDamage: string[];
  missingParts: string[];
  wearSeverity: 'none' | 'minimal' | 'moderate' | 'heavy';
  surfaceConditionNotes: string;

  // Brand and authenticity
  brandVisible: boolean;
  detectedBrandName: string;

  // College relevance
  isCollegeRelated: boolean;
  collegeRelevanceReason: string;

  // Restricted content
  containsRestrictedContent: boolean;
  restrictedContentDetails: string;

  // Confidence scores
  categoryConfidence: number;
  conditionConfidence: number;
  overallAnalysisConfidence: number;

  // Description cross-check
  descriptionMatchesImage: boolean;
  descriptionMismatchDetails: string;
}

/**
 * The JSON schema to enforce structured output from Gemini.
 */
const VISION_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    primaryObject: {
      type: Type.STRING,
      description: 'The primary object visible in the photograph (e.g., "Scientific Calculator", "Mini Drafter Set", "Engineering Textbook").'
    },
    estimatedCategory: {
      type: Type.STRING,
      description: 'The most appropriate product category from: Engineering Drawing, Calculators, Stationery, Academic Books, Lab Accessories, College Essentials, Other Approved Products, or Unapproved Category.'
    },
    detectedLabels: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'List of 5-10 descriptive visual labels detected in the image (e.g., "LCD display", "metal compass arm", "textbook spine").'
    },
    clarity: {
      type: Type.STRING,
      description: 'Image sharpness: "sharp" (crisp details), "moderate" (acceptable), or "blurry" (out of focus / motion blur).'
    },
    lighting: {
      type: Type.STRING,
      description: 'Lighting quality: "good" (even, natural), "dim" (underexposed), or "overexposed" (harsh glare/flash).'
    },
    framing: {
      type: Type.STRING,
      description: 'How the product is framed: "centered" (fills 60%+ of image), "too_small" (product is tiny in frame), or "cropped" (key parts cut off).'
    },
    imageResolutionAdequate: {
      type: Type.BOOLEAN,
      description: 'Whether the image resolution is sufficient to clearly identify the product and its condition.'
    },
    scratchesOrWear: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'List of visible scratches, scuffs, discoloration, or surface wear. Each entry should describe location and severity (e.g., "Light scratch on LCD bezel, 2cm long"). Empty array if none visible.'
    },
    cracksOrDamage: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'List of visible cracks, chips, dents, or structural damage. Each entry should describe location and severity. Empty array if none visible.'
    },
    missingParts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'List of parts that appear to be missing based on the product type (e.g., "Battery cover missing", "One compass leg absent"). Empty array if nothing appears missing.'
    },
    wearSeverity: {
      type: Type.STRING,
      description: 'Overall wear level: "none" (pristine/sealed), "minimal" (barely noticeable), "moderate" (clearly used but functional), or "heavy" (significant wear/damage).'
    },
    surfaceConditionNotes: {
      type: Type.STRING,
      description: 'Detailed prose description of the product surface condition, noting specific areas of concern or confirming good condition.'
    },
    brandVisible: {
      type: Type.BOOLEAN,
      description: 'Whether a brand logo, name, or manufacturer marking is visible in the image.'
    },
    detectedBrandName: {
      type: Type.STRING,
      description: 'The brand name if visible (e.g., "Casio", "Rotring", "Staedtler"), or "Unknown" if no brand is identifiable.'
    },
    isCollegeRelated: {
      type: Type.BOOLEAN,
      description: 'Whether the product is a legitimate college/academic/educational item suitable for a campus marketplace.'
    },
    collegeRelevanceReason: {
      type: Type.STRING,
      description: 'Brief explanation of why this is or is not college-related (e.g., "Engineering drawing instrument used in college courses" or "Household kitchen appliance not relevant to academics").'
    },
    containsRestrictedContent: {
      type: Type.BOOLEAN,
      description: 'Whether the image contains prohibited items: weapons, drugs, alcohol, tobacco, explicit content, counterfeit goods, or dangerous chemicals.'
    },
    restrictedContentDetails: {
      type: Type.STRING,
      description: 'Details of any restricted content detected, or "None" if clean.'
    },
    categoryConfidence: {
      type: Type.NUMBER,
      description: 'Confidence score (0.0 to 1.0) for the category classification.'
    },
    conditionConfidence: {
      type: Type.NUMBER,
      description: 'Confidence score (0.0 to 1.0) for the physical condition assessment.'
    },
    overallAnalysisConfidence: {
      type: Type.NUMBER,
      description: 'Overall confidence (0.0 to 1.0) in the entire analysis. Lower if image quality is poor or product is partially obscured.'
    },
    descriptionMatchesImage: {
      type: Type.BOOLEAN,
      description: 'Whether the seller title and description accurately match what is visible in the photograph.'
    },
    descriptionMismatchDetails: {
      type: Type.STRING,
      description: 'Specific details of any mismatch between the description and the image, or "None" if consistent.'
    }
  },
  propertyOrdering: [
    'primaryObject', 'estimatedCategory', 'detectedLabels',
    'clarity', 'lighting', 'framing', 'imageResolutionAdequate',
    'scratchesOrWear', 'cracksOrDamage', 'missingParts', 'wearSeverity', 'surfaceConditionNotes',
    'brandVisible', 'detectedBrandName',
    'isCollegeRelated', 'collegeRelevanceReason',
    'containsRestrictedContent', 'restrictedContentDetails',
    'categoryConfidence', 'conditionConfidence', 'overallAnalysisConfidence',
    'descriptionMatchesImage', 'descriptionMismatchDetails'
  ]
};

/**
 * System prompt for highly accurate product photo verification.
 * Designed to extract maximum detail from seller-uploaded product photographs.
 */
const VISION_SYSTEM_INSTRUCTION = `You are an expert product verification AI for CampusCart, a college campus marketplace.
Your role is to perform rigorous, accurate visual analysis of product photographs uploaded by student sellers.

## Your Core Responsibilities:
1. **ACCURATELY identify** the product in the photograph. Do NOT guess — describe exactly what you see.
2. **PRECISELY assess** image quality (sharpness, lighting, framing).
3. **CAREFULLY inspect** for physical defects: scratches, cracks, chips, dents, discoloration, missing parts, stains, yellowing.
4. **DETERMINE** whether the product is legitimately college/academic-related.
5. **DETECT** any restricted or prohibited content in the image.
6. **CROSS-CHECK** the seller's title and description against what is actually visible.

## Analysis Standards:
- Be STRICT and THOROUGH. A seller claiming "Brand New" but the photo shows scratches must be flagged.
- Do NOT assume what you cannot see. If the image is blurry, say so and reduce confidence.
- For condition assessment, examine EVERY visible surface: corners, edges, screens, buttons, hinges, pages, spines.
- Wear marks smaller than 1mm should still be reported if visible.
- If the product is NOT college-related (e.g., kitchen appliances, fashion accessories, furniture), flag it clearly.
- If the image shows a completely different product than described, flag as a critical mismatch.

## College-Approved Categories:
- Engineering Drawing (drafters, compasses, T-squares, drawing boards)
- Calculators (scientific, graphing)
- Stationery (pens, pencils, notebooks, geometry sets)
- Academic Books (textbooks, reference materials)
- Lab Accessories (lab coats, safety goggles, calipers, breadboards)
- College Essentials (desk lamps, backpacks, laptop stands, organizers)
- Other Approved Products (bicycle, sports equipment for college teams)

## NOT College-Related (Flag These):
- Kitchen appliances, home furnishings, cosmetics, fashion clothing, luxury items
- Consumer electronics not used for studies (gaming consoles, TVs)
- Food items, perishables`;

export class GeminiVisionAnalyzer {
  private client: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Analyzes a product photo using Gemini 3.8 Flash multimodal capabilities.
   * Reads the actual image file, sends it to the API, and returns structured analysis.
   */
  public async analyzeProductPhoto(
    imagePath: string,
    sellerTitle: string,
    sellerDescription: string,
    selectedCategory: string
  ): Promise<GeminiVisionOutput> {
    if (!this.client) {
      console.warn('[GeminiVision] No API key configured. Falling back to heuristic analysis.');
      return this.heuristicFallback(sellerTitle, sellerDescription, selectedCategory);
    }

    try {
      // Resolve the absolute path to the uploaded image
      const absolutePath = path.isAbsolute(imagePath)
        ? imagePath
        : path.join(__dirname, '../../../../public', imagePath);

      if (!fs.existsSync(absolutePath)) {
        console.warn(`[GeminiVision] Image file not found at ${absolutePath}. Using heuristic fallback.`);
        return this.heuristicFallback(sellerTitle, sellerDescription, selectedCategory);
      }

      // Read the actual image file as base64
      const imageBuffer = fs.readFileSync(absolutePath);
      const base64Image = imageBuffer.toString('base64');

      // Determine MIME type from file extension
      const ext = path.extname(absolutePath).toLowerCase();
      const mimeTypeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp'
      };
      const mimeType = mimeTypeMap[ext] || 'image/jpeg';

      // Build the multimodal prompt
      const userPrompt = `Analyze this product photograph for the CampusCart marketplace.

SELLER'S LISTING DETAILS:
- Title: "${sellerTitle}"
- Description: "${sellerDescription}"
- Selected Category: "${selectedCategory}"

Perform a comprehensive visual inspection. Compare what you SEE in the photograph against what the seller CLAIMS in their title and description.
Be extremely thorough about detecting any physical defects, wear, or damage. Report every visible scratch, scuff, dent, crack, stain, or sign of use.
Determine if this product is genuinely college/academic-related and fits the selected category.`;

      // Call Gemini 3.8 Flash with the actual image and structured output schema
      const response = await this.client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              mimeType,
              data: base64Image
            }
          },
          { text: userPrompt }
        ],
        config: {
          systemInstruction: VISION_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseJsonSchema: VISION_RESPONSE_SCHEMA,
          temperature: 0.1 // Low temperature for precise, consistent analysis
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response from Gemini Vision API');
      }

      const parsed = JSON.parse(responseText) as GeminiVisionOutput;

      // Validate and clamp confidence scores
      parsed.categoryConfidence = Math.max(0, Math.min(1, parsed.categoryConfidence || 0.5));
      parsed.conditionConfidence = Math.max(0, Math.min(1, parsed.conditionConfidence || 0.5));
      parsed.overallAnalysisConfidence = Math.max(0, Math.min(1, parsed.overallAnalysisConfidence || 0.5));

      // Normalize enum values
      parsed.clarity = (['sharp', 'moderate', 'blurry'].includes(parsed.clarity) ? parsed.clarity : 'moderate') as any;
      parsed.lighting = (['good', 'dim', 'overexposed'].includes(parsed.lighting) ? parsed.lighting : 'good') as any;
      parsed.framing = (['centered', 'too_small', 'cropped'].includes(parsed.framing) ? parsed.framing : 'centered') as any;
      parsed.wearSeverity = (['none', 'minimal', 'moderate', 'heavy'].includes(parsed.wearSeverity) ? parsed.wearSeverity : 'minimal') as any;

      console.log(`[GeminiVision] ✓ Analyzed photo: "${parsed.primaryObject}" | Category: "${parsed.estimatedCategory}" | Confidence: ${(parsed.overallAnalysisConfidence * 100).toFixed(0)}%`);

      return parsed;
    } catch (error: any) {
      console.error('[GeminiVision] API call failed:', error.message);
      // Fall back to heuristic analysis if the API call fails
      return this.heuristicFallback(sellerTitle, sellerDescription, selectedCategory);
    }
  }

  /**
   * Analyzes multiple product photos and aggregates results.
   * Takes the worst-case for defects and best-case for identification.
   */
  public async analyzeMultiplePhotos(
    imagePaths: string[],
    sellerTitle: string,
    sellerDescription: string,
    selectedCategory: string
  ): Promise<GeminiVisionOutput> {
    if (imagePaths.length === 0) {
      return this.heuristicFallback(sellerTitle, sellerDescription, selectedCategory);
    }

    // Analyze the first (primary) photo in detail
    const primaryResult = await this.analyzeProductPhoto(
      imagePaths[0], sellerTitle, sellerDescription, selectedCategory
    );

    // If there are additional photos, analyze them for supplementary defect detection
    if (imagePaths.length > 1 && this.client) {
      for (let i = 1; i < Math.min(imagePaths.length, 4); i++) {
        try {
          const supplementary = await this.analyzeProductPhoto(
            imagePaths[i], sellerTitle, sellerDescription, selectedCategory
          );

          // Merge additional defects found in other photos
          for (const scratch of supplementary.scratchesOrWear) {
            if (!primaryResult.scratchesOrWear.includes(scratch)) {
              primaryResult.scratchesOrWear.push(scratch);
            }
          }
          for (const crack of supplementary.cracksOrDamage) {
            if (!primaryResult.cracksOrDamage.includes(crack)) {
              primaryResult.cracksOrDamage.push(crack);
            }
          }
          for (const missing of supplementary.missingParts) {
            if (!primaryResult.missingParts.includes(missing)) {
              primaryResult.missingParts.push(missing);
            }
          }

          // Take the worst-case wear severity
          const severityRank = { none: 0, minimal: 1, moderate: 2, heavy: 3 };
          if (severityRank[supplementary.wearSeverity] > severityRank[primaryResult.wearSeverity]) {
            primaryResult.wearSeverity = supplementary.wearSeverity;
          }

          // If any photo detects restricted content, flag it
          if (supplementary.containsRestrictedContent) {
            primaryResult.containsRestrictedContent = true;
            primaryResult.restrictedContentDetails = supplementary.restrictedContentDetails;
          }
        } catch (err) {
          console.warn(`[GeminiVision] Supplementary photo ${i + 1} analysis failed, skipping.`);
        }
      }
    }

    return primaryResult;
  }

  /**
   * Text-based heuristic fallback when Gemini API is unavailable.
   * Uses keyword matching on title/description as a basic substitute.
   */
  private heuristicFallback(
    title: string,
    description: string,
    selectedCategory: string
  ): GeminiVisionOutput {
    const textCorpus = `${title} ${description}`.toLowerCase();

    let primaryObject = 'College Educational Equipment';
    let estimatedCategory = selectedCategory;
    const detectedLabels: string[] = [];
    const scratchesOrWear: string[] = [];
    const cracksOrDamage: string[] = [];
    const missingParts: string[] = [];
    let wearSeverity: GeminiVisionOutput['wearSeverity'] = 'minimal';
    let isCollegeRelated = true;
    let collegeRelevanceReason = 'Product appears to be college-related based on listing description.';

    // Category detection via keyword matching
    if (textCorpus.includes('drafter') || textCorpus.includes('compass') || selectedCategory.includes('Drawing')) {
      primaryObject = 'Mini Drafter & Engineering Scale Set';
      estimatedCategory = 'Engineering Drawing';
      detectedLabels.push('mini drafter', 'protractor head', 'steel rod arms', 'drawing board clamp', 'acrylic scales');
    } else if (textCorpus.includes('calculator') || selectedCategory.includes('Calculator')) {
      primaryObject = 'Scientific Calculator with Dual Power';
      estimatedCategory = 'Calculators';
      detectedLabels.push('scientific calculator', 'matrix display', 'natural textbook display', 'solar strip', 'protective hard case');
    } else if (textCorpus.includes('book') || selectedCategory.includes('Book')) {
      primaryObject = 'Academic Textbook';
      estimatedCategory = 'Academic Books';
      detectedLabels.push('textbook', 'bound spine', 'printed pages', 'syllabus textbook');
    } else if (textCorpus.includes('coat') || textCorpus.includes('lab') || selectedCategory.includes('Lab')) {
      primaryObject = 'Lab Coat & Safety Equipment';
      estimatedCategory = 'Lab Accessories';
      detectedLabels.push('cotton lab coat', 'protective apparel', 'reinforced collar', 'chest pocket');
    } else if (textCorpus.includes('pen') || textCorpus.includes('rotring') || selectedCategory.includes('Stationery')) {
      primaryObject = 'Technical Drawing Pen Set';
      estimatedCategory = 'Stationery';
      detectedLabels.push('technical pens', 'ink cartridges', 'fine-liner nibs', 'storage case');
    } else if (textCorpus.includes('lamp') || textCorpus.includes('backpack') || selectedCategory.includes('Essential')) {
      primaryObject = 'Student Study Essential';
      estimatedCategory = 'College Essentials';
      detectedLabels.push('desk organizer', 'lighting accessory', 'durable fabric');
    }

    // Detect non-college items
    const nonCollegeKeywords = ['toaster', 'refrigerator', 'microwave', 'washing machine', 'blender', 'iron', 'hair dryer', 'gaming console', 'playstation', 'xbox', 'television'];
    for (const kw of nonCollegeKeywords) {
      if (textCorpus.includes(kw)) {
        primaryObject = 'Non-College Item';
        estimatedCategory = 'Unapproved Category';
        isCollegeRelated = false;
        collegeRelevanceReason = `Item "${kw}" is a household/consumer product, not college-related academic equipment.`;
        detectedLabels.length = 0;
        detectedLabels.push(kw, 'consumer electronics', 'household appliance');
        break;
      }
    }

    // Check for wear keywords
    if (textCorpus.includes('scratch') || textCorpus.includes('used') || textCorpus.includes('mark')) {
      scratchesOrWear.push('Surface wear mentioned in listing description (visual confirmation not available without API)');
      wearSeverity = 'moderate';
    }

    const brandVisible = textCorpus.includes('casio') || textCorpus.includes('rotring') || textCorpus.includes('staedtler');

    return {
      primaryObject,
      estimatedCategory,
      detectedLabels,
      clarity: 'moderate',
      lighting: 'good',
      framing: 'centered',
      imageResolutionAdequate: true,
      scratchesOrWear,
      cracksOrDamage,
      missingParts,
      wearSeverity,
      surfaceConditionNotes: 'Heuristic fallback analysis — actual photo inspection requires GEMINI_API_KEY.',
      brandVisible,
      detectedBrandName: brandVisible ? (textCorpus.includes('casio') ? 'Casio' : textCorpus.includes('rotring') ? 'Rotring' : 'Staedtler') : 'Unknown',
      isCollegeRelated,
      collegeRelevanceReason,
      containsRestrictedContent: false,
      restrictedContentDetails: 'None',
      categoryConfidence: 0.75,
      conditionConfidence: 0.65,
      overallAnalysisConfidence: 0.60,
      descriptionMatchesImage: true,
      descriptionMismatchDetails: 'Heuristic analysis cannot verify image-description consistency without actual photo analysis.'
    };
  }
}
