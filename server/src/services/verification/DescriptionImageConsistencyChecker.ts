export interface ConsistencyReport {
  consistency: 'likely_consistent' | 'inconsistent' | 'uncertain';
  isConsistent: boolean;
  score: number;
  matchedAttributes: string[];
  discrepancies: string[];
  limitations: string[];
}

export class DescriptionImageConsistencyChecker {
  /**
   * Evaluates text claims against visible photograph observations
   */
  public evaluate(
    title: string,
    description: string,
    visualObservations: {
      predictedItemType: string;
      detectedIssues: string[];
      visibleBrandLogoFound?: boolean;
      visualWear?: string;
    }
  ): ConsistencyReport {
    const textBlob = `${title} ${description}`.toLowerCase();
    const matchedAttributes: string[] = [];
    const discrepancies: string[] = [];
    const limitations: string[] = [
      'Visual inspection cannot verify internal electronic circuits, battery health, or functional operation.',
      'Brand authenticity and OEM certification cannot be conclusively established from surface photographs alone.'
    ];

    let score = 0.90;

    // Check if item type mentioned in title roughly aligns with detected item
    const itemType = visualObservations.predictedItemType.toLowerCase();
    const titleLower = title.toLowerCase();

    const titleMentionsItem = textBlob.includes(itemType) ||
      (itemType.includes('calculator') && textBlob.includes('calculator')) ||
      (itemType.includes('drafter') && textBlob.includes('drafter')) ||
      (itemType.includes('book') && (textBlob.includes('book') || textBlob.includes('edition'))) ||
      (itemType.includes('stationery') && (textBlob.includes('pen') || textBlob.includes('pencil') || textBlob.includes('kit'))) ||
      (itemType.includes('lab') && (textBlob.includes('coat') || textBlob.includes('lab') || textBlob.includes('goggle') || textBlob.includes('caliper')));

    if (titleMentionsItem) {
      matchedAttributes.push(`Title explicitly describes product type '${visualObservations.predictedItemType}'`);
    } else {
      discrepancies.push(`Title claims '${title}' which differs from visually detected object '${visualObservations.predictedItemType}'`);
      score -= 0.35;
    }

    // Check declared defects vs visible defects
    const claimsPristine = textBlob.includes('scratchless') || textBlob.includes('brand new') || textBlob.includes('unopened') || textBlob.includes('no flaws');
    const hasVisibleScratches = visualObservations.detectedIssues.some(i => i.toLowerCase().includes('scratch') || i.toLowerCase().includes('crack') || i.toLowerCase().includes('wear'));

    if (claimsPristine && hasVisibleScratches) {
      discrepancies.push('Seller claims flawless or scratchless condition, but visible wear or scratches are evident in photographs.');
      score -= 0.30;
    } else if (hasVisibleScratches && (textBlob.includes('scratch') || textBlob.includes('used') || textBlob.includes('wear'))) {
      matchedAttributes.push('Visible surface wear accurately disclosed in seller description.');
    }

    score = Math.max(0.1, Math.min(1.0, score));

    let consistency: ConsistencyReport['consistency'] = 'likely_consistent';
    if (score < 0.5) consistency = 'inconsistent';
    else if (score < 0.75) consistency = 'uncertain';

    return {
      consistency,
      isConsistent: consistency === 'likely_consistent',
      score: Number(score.toFixed(2)),
      matchedAttributes,
      discrepancies,
      limitations
    };
  }
}
