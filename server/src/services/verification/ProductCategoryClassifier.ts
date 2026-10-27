export interface CategoryClassificationResult {
  predictedCategory: string;
  categoryMatch: boolean;
  confidence: number;
  detectedObjects: string[];
  mismatchReason?: string;
}

export class ProductCategoryClassifier {
  private categoryKeywords: Record<string, string[]> = {
    'Engineering Drawing': ['drafter', 'mini drafter', 't-square', 'compass', 'divider', 'drawing board', 'sheet container', 'engineering graphics', 'french curve', 'protractor', 'scale ruler'],
    'Calculators': ['calculator', 'scientific calculator', 'casio', 'fx-991', 'fx-82', 'graphing calculator', 'fx-991es', 'fx-991ex', 'fx-991cw', 'texas instruments'],
    'Stationery': ['pen', 'rotring', 'isograph', 'pencil', 'notebook', 'binder', 'stapler', 'highlighter', 'marker', 'geometry box', 'files', 'registers'],
    'Academic Books': ['book', 'textbook', 'handbook', 'author', 'edition', 'paperback', 'hardcover', 'engineering mathematics', 'physics', 'circuits', 'data structures', 'algorithms'],
    'Lab Accessories': ['lab coat', 'apron', 'safety goggles', 'glasses', 'dissection kit', 'forceps', 'vernier caliper', 'screw gauge', 'stethoscope', 'breadboard', 'multimeter'],
    'College Essentials': ['study lamp', 'desk organizer', 'backpack', 'laptop stand', 'umbrella', 'water bottle', 'extension cord', 'dorm essentials'],
    'Other Approved Products': ['bicycle', 'calculator pouch', 'sports equipment', 'instrument box']
  };

  /**
   * Classifies the visual signals against the seller's selected category
   */
  public classify(
    selectedCategoryName: string,
    visualSignals: {
      labels?: string[];
      detectedItem?: string;
      aiEstimatedCategory?: string;
      confidence?: number;
    }
  ): CategoryClassificationResult {
    const rawDetected = (visualSignals.detectedItem || visualSignals.aiEstimatedCategory || '').toLowerCase();
    const detectedLabels = (visualSignals.labels || []).map(l => l.toLowerCase());
    const allVisualTerms = [rawDetected, ...detectedLabels].join(' ');

    let predictedCategory = visualSignals.aiEstimatedCategory || 'Other Approved Products';
    let maxMatchCount = 0;

    // Scan our knowledge taxonomy
    for (const [catName, keywords] of Object.entries(this.categoryKeywords)) {
      let count = 0;
      for (const kw of keywords) {
        if (allVisualTerms.includes(kw)) {
          count += 2;
        }
      }
      if (count > maxMatchCount) {
        maxMatchCount = count;
        predictedCategory = catName;
      }
    }

    // Determine category match
    const normSelected = selectedCategoryName.trim().toLowerCase();
    const normPredicted = predictedCategory.trim().toLowerCase();

    const isDirectMatch = normSelected === normPredicted ||
      normSelected.includes(normPredicted) ||
      normPredicted.includes(normSelected);

    // Confidence calibration
    let confidence = visualSignals.confidence || 0.88;
    if (isDirectMatch) {
      confidence = Math.min(0.97, Math.max(0.75, confidence + 0.05));
    } else {
      confidence = Math.min(0.95, Math.max(0.65, confidence));
    }

    return {
      predictedCategory,
      categoryMatch: isDirectMatch,
      confidence: Number(confidence.toFixed(2)),
      detectedObjects: visualSignals.labels || [predictedCategory],
      mismatchReason: isDirectMatch
        ? undefined
        : `Uploaded photograph exhibits characteristics of '${predictedCategory}' rather than selected category '${selectedCategoryName}'.`
    };
  }
}
