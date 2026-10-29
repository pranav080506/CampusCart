import { College, Category, User, Product, ModerationAuditLog } from '../types';

export const seedColleges: College[] = [
  {
    id: 'col-glbajaj',
    name: 'G.L. Bajaj Institute of Technology and Management',
    shortCode: 'GL Bajaj',
    domain: 'glbitm.ac.in',
    state: 'Greater Noida, Uttar Pradesh',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'col-bits',
    name: 'Birla Institute of Technology and Science, Pilani',
    shortCode: 'BITS',
    domain: 'pilani.bits-pilani.ac.in',
    state: 'Rajasthan',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

export const seedCategories: Category[] = [
  {
    id: 'cat-eng-draw',
    collegeId: 'col-glbajaj',
    name: 'Engineering Drawing',
    slug: 'engineering-drawing',
    description: 'Mini drafters, T-squares, compass sets, drawing boards, and sheet containers',
    iconName: 'Compass',
    isApproved: true,
    displayOrder: 1
  },
  {
    id: 'cat-calc',
    collegeId: 'col-glbajaj',
    name: 'Calculators',
    slug: 'calculators',
    description: 'ClassWiz, scientific, non-programmable, and graphing calculators',
    iconName: 'Calculator',
    isApproved: true,
    displayOrder: 2
  },
  {
    id: 'cat-stationery',
    collegeId: 'col-glbajaj',
    name: 'Stationery',
    slug: 'stationery',
    description: 'Technical pens, Rotring isographs, binders, engineering notebooks, and scales',
    iconName: 'PenTool',
    isApproved: true,
    displayOrder: 3
  },
  {
    id: 'cat-books',
    collegeId: 'col-glbajaj',
    name: 'Academic Books',
    slug: 'academic-books',
    description: 'Standard curriculum textbooks, reference guides, GATE & semester prep',
    iconName: 'BookOpen',
    isApproved: true,
    displayOrder: 4
  },
  {
    id: 'cat-lab',
    collegeId: 'col-glbajaj',
    name: 'Lab Accessories',
    slug: 'lab-accessories',
    description: 'Cotton lab coats, vernier calipers, breadboards, multimeters, and safety goggles',
    iconName: 'FlaskConical',
    isApproved: true,
    displayOrder: 5
  },
  {
    id: 'cat-essentials',
    collegeId: 'col-glbajaj',
    name: 'College Essentials',
    slug: 'college-essentials',
    description: 'Study lamps, laptop risers, backpacks, dorm organizers, and calculators pouches',
    iconName: 'Backpack',
    isApproved: true,
    displayOrder: 6
  },
  {
    id: 'cat-other',
    collegeId: 'col-glbajaj',
    name: 'Other Approved Products',
    slug: 'other-approved-products',
    description: 'Campus bicycles, instrument cases, sports gear, and verified student accessories',
    iconName: 'ShoppingBag',
    isApproved: true,
    displayOrder: 7
  }
];

export const seedUsers: User[] = [];

export const seedProducts: Product[] = [];

export const seedAuditLogs: ModerationAuditLog[] = [];
