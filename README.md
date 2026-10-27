# CampusCart — Premium AI-Enabled College Marketplace

**CampusCart** is a modern student-to-student e-commerce platform inspired by AJIO's shopping experience, built specifically for college campuses. It features an automated AI verification pipeline, an explainable verification breakdown, multi-tiered condition appraisal, and a publication workflow governed by authorized college administrators.

---

## Key Highlights & Features

### 1. Premium E-Commerce UI/UX (AJIO-Inspired)
- **Visual Design**: Clean white background (`#FFFFFF`), crisp black typography (`#171717`), forest-green trust accents (`#176B4D`, `#E8F5EE`), subtle neutral borders (`#EAEAEA`), and modern typography (Google Fonts *Inter* & *Outfit*).
- **Header**:
  - Displays verified institution name (e.g., **G.L. Bajaj Institute of Technology and Management**).
  - Search bar with live search filtering.
  - Category navigation bar.
  - "Sell an Item" action button.
  - Real-time Wishlist and Cart count badges.
  - Dark mode toggle (`#121212`).
  - Role Persona switcher (**Student: Rohan Sharma** vs **College Admin: Prof. K. S. Verma**).
- **Homepage Sections**:
  - **Promotional Hero Banner**: *"Your Campus. Your Marketplace."* Subtitle: *"Buy smarter. Sell what you no longer need."*
  - **Shop by Category**: Visual category cards with illustrations for Engineering Drawing, Calculators, Stationery, Academic Books, Lab Accessories, and College Essentials.
  - **Verified Campus Picks**: Approved listings with dual verification indicators.
  - **Budget-Friendly Finds**: Student equipment sorted by price.
  - **Trending on Campus**: Popular listings ranked by actual student view counts and wishlist totals.
  - **How CampusCart Works**: 4-step workflow: *Upload → Verify → Approve → Buy*.

### 2. Provider-Independent AI Verification Pipeline
Implements a server-side `ProductVerificationService` with 6 dedicated modules:
1. **`ImageQualityAnalyzer`**: Detects camera motion blur, low light/glare, obstructed framing, and resolution limits.
2. **`ProductCategoryClassifier`**: Classifies visual evidence against campus categories and flags mismatches (e.g., household kitchen appliances in Engineering Drawing).
3. **`DescriptionImageConsistencyChecker`**: Cross-references seller text claims with visible evidence; disclaims internal electronics or OEM authenticity.
4. **`RestrictedContentDetector`**: Screens against an administrator-managed policy list for prohibited substances, weapons, exam leak materials, and unapproved electronics.
5. **`ProductConditionAnalyzer`**: Analyzes visible wear into `NEW`, `LIKE_NEW`, `GOOD`, or `FAIR`, cataloging scratches, cracks, and requesting category-specific close-up photos.
6. **`VerificationDecisionEngine`**: Synthesizes reports, calculates mathematically calibrated confidence scores, and recommends actions (`approve`, `manual_review`, `reject`, `needs_more_info`).

### 3. AI Product Condition Assessment & Seller Interaction
- Analyzes uploaded photos to generate:
  - Suggested condition: `NEW`, `LIKE_NEW`, `GOOD`, `FAIR`.
  - Visible scratches and damage observations.
  - Category-specific close-up photo prompts (e.g., compass tips, LCD active screen).
- **Seller Interaction Flow**:
  - Displays *"AI-Suggested Condition: GOOD"*
  - Buttons: **Accept Suggestion**, **Select Another Condition**, and **Upload More Photos**.
  - Stores both `sellerDeclaredCondition` and `aiSuggestedCondition`.

### 4. Explainable Verification Panel
Displayed on product detail pages and quick views:
- **Category Match**: *Looks Consistent* / *Potential Mismatch*
- **Image Quality**: *Good* / *More Evidence Needed*
- **Description Match**: *Likely Consistent* / *Potential Discrepancy*
- **Visible Condition**: Evaluated condition grade
- **Restricted Content**: *No Issue Detected* / *Policy Concern Flagged*
- **College Approval**: *Approved by College Administration* / *Pending Review*
- **Authenticity Notice**: Explains that AI inspection assists with physical surface inspection and does not substitute authorized moderation.
- **Separate Badges**: `AI Inspected`, `College Approved`, `Seller Identity Verified`.

### 5. College Approval Workflow & Statuses
Listings progress through strict publication stages:
`DRAFT` → `PENDING_AI_CHECK` → `AI_FLAGGED` → `PENDING_COLLEGE_REVIEW` → `APPROVED` / `REJECTED` / `NEEDS_MORE_INFORMATION` / `SUSPENDED` / `SOLD`.
- Only `APPROVED` products appear in the public marketplace.
- AI cannot approve its own flagged listing.

### 6. AI Moderation Dashboard (For College Admins)
- **Queued Tabs**:
  - *Pending College Review*
  - *AI-Flagged Listings*
  - *Category Mismatches*
  - *Low-Quality Photographs*
  - *Condition Discrepancies*
  - *Recently Approved Products*
  - *Decision Audit Logs*
- **Moderator Actions**: **Approve**, **Reject** (mandatory reason required), **Request More Info** (mandatory reason required), and **Suspend Listing**.
- Automatically logs administrator name, timestamp, decision, and rationale to the protected audit trail.

---

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express.js, TypeScript, Multer, Zod
- **Database & Storage**: Supabase PostgreSQL schema (`supabase/migrations/001_initial_schema.sql`), with unified in-memory persistence layer

---

## Quickstart & Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Both Server and Client Concurrently**:
   ```bash
   npm run dev
   ```
   - Frontend runs at: `http://localhost:5173`
   - Express API runs at: `http://localhost:5001`

3. **Production Build**:
   ```bash
   npm run build
   ```
