import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

import productsRouter from './routes/products';
import verificationRouter from './routes/verification';
import moderationRouter from './routes/moderation';
import categoriesRouter from './routes/categories';
import collegeRouter from './routes/college';
import cartRouter from './routes/cart';
import wishlistRouter from './routes/wishlist';
import authRouter from './routes/auth';
import meetupsRouter from './routes/meetups';
import supabaseRouter from './routes/supabase';
import { checkSupabaseHealth } from './services/supabase';

import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded product photos statically
const uploadsPath = process.env.VERCEL 
  ? path.join('/tmp', 'uploads') 
  : path.join(__dirname, '../../public/uploads');

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/moderation', moderationRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/college', collegeRouter);
app.use('/api/cart', cartRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/auth', authRouter);
app.use('/api/meetups', meetupsRouter);
app.use('/api/supabase', supabaseRouter);

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  const supabaseHealth = await checkSupabaseHealth();
  res.json({
    status: 'ok',
    service: 'CampusCart AI Marketplace API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    supabase: supabaseHealth
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[CampusCart Server] Running on http://localhost:${PORT}`);
  });
}

export default app;
