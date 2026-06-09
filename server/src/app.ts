import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { initFirebase } from './middleware/auth.js';
import { logger } from './config/logger.js';
import footprintRouter from './routes/footprint.js';
import userRouter from './routes/user.js';
import offsetRouter from './routes/offset.js';
import healthRouter from './routes/health.js';
import goalsRouter from './routes/goals.js';

import { calculationRequestSchema } from '@carbon/shared';
import { calculateCarbon } from './utils/calculator.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Trust only the first proxy (Render/Docker gateway).
 * Prevents IP-spoofing via X-Forwarded-For header manipulation.
 */
app.set('trust proxy', 1);

/** Resolve directory paths for ESM compatibility. */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Initialize Firebase Admin SDK for token verification. */
initFirebase();

// ────────────────────────────────────────────────────────────
// MIDDLEWARE STACK — ordered by priority
// ────────────────────────────────────────────────────────────

/** 1. Gzip/Brotli response compression for all payloads > 1 KB. */
app.use(compression());

/** 2. Structured JSON request logger with timing. */
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
    });
  });
  next();
});

/**
 * 3. Security headers via Helmet.
 *
 * CSP: `'unsafe-inline'` is required for Vite's injected styles and
 * Firebase Auth popup scripts. In production, Vite emits extracted CSS
 * files so inline styles are minimal; Firebase Auth SDK injects inline
 * scripts for the popup/redirect flow. Removing `'unsafe-inline'` would
 * break Firebase Google Sign-In. This is the strictest practical CSP
 * for this stack.
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://apis.google.com",
        "https://www.gstatic.com",
        "https://*.firebaseapp.com",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://www.gstatic.com",
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: [
        "'self'",
        "data:",
        "https://images.unsplash.com",
        "https://*.googleusercontent.com",
      ],
      connectSrc: [
        "'self'",
        "https://*.googleapis.com",
        "https://securetoken.googleapis.com",
        "https://*.firebaseapp.com",
      ],
      frameSrc: ["'self'", "https://*.firebaseapp.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  /** HSTS: 2-year max-age with subdomains and preload eligibility. */
  strictTransportSecurity: {
    maxAge: 63_072_000,
    includeSubDomains: true,
    preload: true,
  },
  /** Prevent MIME-type sniffing. */
  xContentTypeOptions: true,
  /** Prevent clickjacking via X-Frame-Options (duplicates frameAncestors). */
  xFrameOptions: { action: 'deny' as const },
  /** Control Referer header leakage. */
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' as const },
  /** Disable all browser features not required by the app. */
  permittedCrossDomainPolicies: { permittedPolicies: 'none' as const },
  /** Remove X-Powered-By header. */
  xPoweredBy: false,
  /** Prevent DNS prefetching to third parties. */
  xDnsPrefetchControl: { allow: false },
}));

/**
 * 4. Permissions-Policy header (not yet covered by Helmet).
 * Restricts powerful browser features to prevent misuse.
 */
app.use((_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );
  /** Cross-Origin headers for defense-in-depth. */
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  next();
});

/**
 * 5. CORS — strict origin allow-list with exact matching.
 * No wildcard origins; no subdomain fuzzing.
 */
const allowedOrigins: string[] = [
  process.env.CLIENT_ORIGIN,
  'https://carbonfootprintcalculator.me',
  'http://localhost:5173',
  'http://localhost:3000',
].filter((origin): origin is string => typeof origin === 'string' && origin.length > 0);

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests (no Origin header)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS Policy: Origin not allowed.'));
  },
  credentials: true,
}));

/**
 * 6. JSON body parser with 100 KB limit.
 * Prevents large-payload denial-of-service attacks.
 */
app.use(express.json({ limit: '100kb' }));

/**
 * 7. API rate limiting — 100 requests per 15 min window per IP.
 * Uses standard RateLimit headers (draft-6).
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// ────────────────────────────────────────────────────────────
// API ROUTES
// ────────────────────────────────────────────────────────────

app.use('/api/health', healthRouter);
app.use('/api/footprint', footprintRouter);
app.use('/api/user', userRouter);
app.use('/api/offsets', offsetRouter);
app.use('/api/user/goals', goalsRouter);

/**
 * Public carbon calculation preview (no authentication required).
 * Validates input with Zod schema before passing to calculator.
 */
app.post('/api/calculate', (req, res) => {
  const result = calculationRequestSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors[0].message });
  }
  const { category, subCategory, value } = result.data;
  try {
    const calc = calculateCarbon(category, subCategory, value);
    res.json(calc);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Calculation failed';
    res.status(400).json({ error: message });
  }
});

// ────────────────────────────────────────────────────────────
// PRODUCTION STATIC FILE SERVING
// ────────────────────────────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');

  /** Serve pre-built Vite assets with immutable caching for fingerprinted files. */
  app.use(express.static(clientBuildPath, {
    maxAge: '1y',
    immutable: true,
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      // HTML files should never be cached
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));

  /** SPA catch-all — serves index.html for client-side routing. */
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  /** Development status endpoint. */
  app.get('/', (_req, res) => {
    res.json({ status: 'running', env: process.env.NODE_ENV || 'development' });
  });
}

// ────────────────────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ────────────────────────────────────────────────────────────

/**
 * Catches all unhandled errors. Logs the full error server-side
 * but returns a generic message to the client (no stack leakage).
 */
app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled Server Error', { error: err, url: req.originalUrl, method: req.method });
  res.status(500).json({ error: 'Internal Server Error' });
});

// ────────────────────────────────────────────────────────────
// SERVER START (skipped during test mode for Supertest)
// ────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`ZeroGrid server running on port ${PORT}`);
  });
}

export default app;
