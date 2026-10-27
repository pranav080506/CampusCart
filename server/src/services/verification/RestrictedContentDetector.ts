import { RestrictedPolicy } from '../../types';

export interface RestrictedContentReport {
  restrictedContentDetected: boolean;
  flaggedRules: string[];
  concerns: string[];
  severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedAdminAction?: string;
}

export class RestrictedContentDetector {
  private defaultPolicies: RestrictedPolicy[] = [
    {
      id: 'pol-1',
      collegeId: 'default',
      ruleName: 'Prohibited Substances & Paraphernalia',
      description: 'Alcohol, tobacco, e-cigarettes, vapes, illegal narcotics, prescription medications',
      keywords: ['alcohol', 'liquor', 'beer', 'vodka', 'vape', 'tobacco', 'cigarette', 'drug', 'weed', 'cannabis', 'pill', 'prescription'],
      severity: 'CRITICAL',
      isActive: true
    },
    {
      id: 'pol-2',
      collegeId: 'default',
      ruleName: 'Weapons & Hazardous Campus Gear',
      description: 'Knives, blades, firearms, replica weapons, firecrackers, hazardous lab chemicals',
      keywords: ['gun', 'knife', 'dagger', 'sword', 'weapon', 'firearm', 'ammo', 'firecracker', 'hazardous chemical', 'acid', 'poison'],
      severity: 'CRITICAL',
      isActive: true
    },
    {
      id: 'pol-3',
      collegeId: 'default',
      ruleName: 'Academic Integrity & Exam Circumvention',
      description: 'Leaked question papers, proxy services, solved answer sheets, unauthorized test keys',
      keywords: ['leaked paper', 'exam leak', 'proxy attendance', 'solved key', 'cheat sheet', 'bypass proctor', 'assignment solution paid'],
      severity: 'HIGH',
      isActive: true
    },
    {
      id: 'pol-4',
      collegeId: 'default',
      ruleName: 'Unapproved Non-College Electronics & Counterfeits',
      description: 'Stolen goods, high-voltage unauthorized appliances, luxury replica watches/shoes',
      keywords: ['stolen', 'replica 1st copy', 'fake rolex', 'heater coil unauthorized', 'counterfeit'],
      severity: 'MEDIUM',
      isActive: true
    }
  ];

  /**
   * Scans text content, detected object labels, and college policy list
   */
  public scan(
    content: {
      title: string;
      description: string;
      labels: string[];
      categoryName: string;
    },
    customPolicies: RestrictedPolicy[] = []
  ): RestrictedContentReport {
    const policies = customPolicies.length > 0 ? customPolicies : this.defaultPolicies;
    const textCorpus = `${content.title} ${content.description} ${content.labels.join(' ')}`.toLowerCase();

    const flaggedRules: string[] = [];
    const concerns: string[] = [];
    let highestSeverity: RestrictedContentReport['severity'] = 'NONE';

    for (const pol of policies) {
      if (!pol.isActive) continue;

      const triggeredKeywords: string[] = [];
      for (const kw of pol.keywords) {
        if (textCorpus.includes(kw.toLowerCase())) {
          triggeredKeywords.push(kw);
        }
      }

      if (triggeredKeywords.length > 0) {
        flaggedRules.push(pol.ruleName);
        concerns.push(`Matched policy rule "${pol.ruleName}": keyword '${triggeredKeywords.join(', ')}' detected in listing.`);

        if (pol.severity === 'CRITICAL') highestSeverity = 'CRITICAL';
        else if (pol.severity === 'HIGH' && highestSeverity !== 'CRITICAL') highestSeverity = 'HIGH';
        else if (pol.severity === 'MEDIUM' && highestSeverity === 'NONE') highestSeverity = 'MEDIUM';
      }
    }

    const restrictedContentDetected = flaggedRules.length > 0;

    return {
      restrictedContentDetected,
      flaggedRules,
      concerns,
      severity: highestSeverity,
      recommendedAdminAction: restrictedContentDetected
        ? 'Flag listing for administrative review before publication; verify seller identity and intent.'
        : undefined
    };
  }
}
