import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const SUPABASE_JWKS_URL = process.env.SUPABASE_JWKS_URL || '';

export const BUCKET_NAME = 'campus-cart-images';

/**
 * Privileged Admin Supabase Client (Service Role)
 * Used on the backend for administrative operations, data sync, and storage uploads.
 */
export const supabaseAdmin: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

/**
 * Public Supabase Client (Publishable Key)
 * Mirrors what client-side applications use.
 */
export const supabasePublic: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false
  }
});

export interface SupabaseHealthStatus {
  connected: boolean;
  url: string;
  jwksUrl: string;
  storageReady: boolean;
  bucketName: string;
  tablesDetected: string[];
  message: string;
  error?: string;
}

/**
 * Comprehensive health & connectivity check for Supabase
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthStatus> {
  const result: SupabaseHealthStatus = {
    connected: false,
    url: SUPABASE_URL,
    jwksUrl: SUPABASE_JWKS_URL,
    storageReady: false,
    bucketName: BUCKET_NAME,
    tablesDetected: [],
    message: ''
  };

  try {
    // 1. Test Storage Bucket
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
    if (!bucketError && buckets) {
      result.connected = true;
      const targetBucket = buckets.find(b => b.name === BUCKET_NAME);
      if (targetBucket) {
        result.storageReady = true;
      } else {
        // Automatically ensure bucket exists
        const { error: createErr } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: 10 * 1024 * 1024 // 10MB
        });
        result.storageReady = !createErr;
      }
    }

    // 2. Check for existence of core tables in database
    const coreTables = ['colleges', 'categories', 'products', 'users', 'campus_meetup_hubs', 'meetup_sessions'];
    for (const table of coreTables) {
      try {
        const { error } = await supabaseAdmin.from(table).select('id').limit(1);
        if (!error) {
          result.tablesDetected.push(table);
        }
      } catch {
        // Table not migrated yet
      }
    }

    if (result.connected) {
      result.message = result.tablesDetected.length > 0
        ? `Supabase connected successfully. Detected tables: ${result.tablesDetected.join(', ')}.`
        : `Supabase connected (Storage bucket active). Database tables awaiting initial SQL migration.`;
    } else {
      result.message = 'Unable to reach Supabase project.';
    }

    return result;
  } catch (err: any) {
    result.connected = false;
    result.error = err.message;
    result.message = `Supabase connection failed: ${err.message}`;
    return result;
  }
}

/**
 * Upload an image buffer or file path to Supabase Storage
 * Returns the direct public CDN URL
 */
export async function uploadImageToSupabase(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    const uniquePath = `products/${Date.now()}-${fileName}`;
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(uniquePath, fileBuffer, {
        contentType,
        upsert: true
      });

    if (error) {
      console.warn('[Supabase Storage] Upload error:', error.message);
      return { success: false, error: error.message };
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uniquePath);

    return {
      success: true,
      publicUrl: publicUrlData.publicUrl
    };
  } catch (err: any) {
    console.error('[Supabase Storage] Upload exception:', err);
    return { success: false, error: err.message };
  }
}

export default supabaseAdmin;
