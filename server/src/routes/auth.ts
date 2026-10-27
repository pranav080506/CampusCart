import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

// Allowed institution domains strictly enforced for GL Bajaj (supports admission_number@glbitm.ac.in and @gibitm.ac.in)
const ALLOWED_COLLEGE_DOMAINS = ['glbitm.ac.in', 'gibitm.ac.in'];

const isCollegeEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  return ALLOWED_COLLEGE_DOMAINS.some(domain => clean.endsWith(`@${domain}`));
};

// GET /api/auth/me - Current active user context
router.get('/me', (_req: Request, res: Response) => {
  try {
    const user = db.getCurrentUser();
    const college = db.getActiveCollege();
    res.json({
      success: true,
      user,
      college
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/auth/users - List available demo personas
router.get('/users', (_req: Request, res: Response) => {
  try {
    const users = db.getUsers();
    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/signup - Student registration with mandatory college email ID
router.post('/signup', (req: Request, res: Response) => {
  try {
    const { fullName, email, password, studentId, department, hostel, phone } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide full name, college email, and password.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!isCollegeEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: `Only official college email IDs (admission_number@glbitm.ac.in or @gibitm.ac.in) are allowed for registration.`
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.'
      });
    }

    const existingUser = db.findUserByEmail(cleanEmail);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this college email already exists. Please log in instead.'
      });
    }

    const newUser = db.createUser({
      fullName: fullName.trim(),
      email: cleanEmail,
      studentId: studentId?.trim() || `GLB-${Date.now().toString().slice(-6)}`,
      department: department?.trim() || 'AI, AIML & DS',
      hostel: hostel?.trim() || 'Day Scholar',
      phone: phone?.trim() || '',
      role: 'STUDENT',
      isIdVerified: true
    });

    res.status(201).json({
      success: true,
      message: `Account created successfully! Welcome to GL Bajaj campus network, ${newUser.fullName}.`,
      user: newUser,
      college: db.getActiveCollege()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/login - Student login strictly verifying college email ID
router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please enter both your college email and password.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!isCollegeEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: `Only official college email IDs (admission_number@glbitm.ac.in or @gibitm.ac.in) are allowed to log in.`
      });
    }

    const user = db.findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: `No registered account found with ${cleanEmail}. Please sign up first using the Create Account tab.`
      });
    }

    db.setCurrentUser(user.id);
    const college = db.getActiveCollege();

    res.json({
      success: true,
      message: `Welcome back, ${user.fullName}!`,
      user,
      college
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/google - Continue with Google Workspace account
router.post('/google', (req: Request, res: Response) => {
  try {
    const { email, fullName, studentId, department } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Google email is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!isCollegeEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: `Google Account Rejected: Only official GL Bajaj Google Workspace accounts (admission_number@glbitm.ac.in or @gibitm.ac.in) are permitted.`
      });
    }

    let user = db.findUserByEmail(cleanEmail);
    if (!user) {
      // Auto-register verified Google user
      user = db.createUser({
        fullName: fullName || cleanEmail.split('@')[0],
        email: cleanEmail,
        studentId: studentId || `GLB-${Date.now().toString().slice(-6)}`,
        department: department || 'AI, AIML & DS',
        hostel: 'Day Scholar',
        role: 'STUDENT',
        isIdVerified: true
      });
    }

    db.setCurrentUser(user.id);
    const college = db.getActiveCollege();

    res.json({
      success: true,
      message: `Signed in successfully via Google as ${user.fullName}!`,
      user,
      college
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/switch-user - Switch active persona (Student vs Admin)
router.post('/switch-user', (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const user = db.setCurrentUser(userId);
    const college = db.getActiveCollege();
    res.json({
      success: true,
      message: `Switched context to ${user.fullName} (${user.role})`,
      user,
      college
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
