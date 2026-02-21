import type { KVNamespace, D1Database, R2Bucket } from '@cloudflare/workers-types';

export interface Env {
    // KV Namespaces
    CACHE_KV: KVNamespace;

    // D1 Databases
    anime_db: D1Database;

    // AI & Analytics
    AI: any; // Cloudflare AI binding type
    ANALYTICS?: any; // AnalyticsEngineDataset

    // R2 Buckets
    IMAGES_BUCKET: R2Bucket;

    // Environment Variables (Vars)
    VALUE_FROM_CLOUDFLARE: string;
    PAYMENT_SECRET: string;
    CSRF_SECRET: string;
    SESSION_SECRET: string;
    ENVIRONMENT: 'development' | 'production';
    PAYMENT_CALLBACK_IPS: string;
}
