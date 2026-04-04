import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Configure environment
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Supabase Client (Service Role for backend logic)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.VITE_SUPABASE_ANON_KEY || 
                    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE_URL or SUPABASE_KEY is missing from environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Auth Middleware (Stub for integrating with Supabase Auth)
const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Auth header missing' });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return res.status(403).json({ error: 'Invalid or expired token' });

  (req as any).user = user;
  next();
};

// --- RESTful API Routes ---

/**
 * @route   GET /api/incidents
 * @desc    Fetch recent community safety incidents
 */
app.get('/api/incidents', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/incidents
 * @desc    Submit a new safety incident (Auth Required)
 */
const IncidentSchema = z.object({
  category: z.string(),
  severity: z.string(),
  title: z.string(),
  description: z.string().optional(),
  location_name: z.string(),
  location_lat: z.number(),
  location_lng: z.number(),
  anonymous: z.boolean().default(false),
});

app.post('/api/incidents', authenticateUser, async (req: Request, res: Response) => {
  try {
    const validatedData = IncidentSchema.parse(req.body);
    const userId = (req as any).user.id;

    const { data, error } = await supabase.from('incidents').insert({
      ...validatedData,
      reporter_id: validatedData.anonymous ? null : userId,
    }).select().single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   POST /api/realtime/tracking
 * @desc    Update user location broadcast (RESTful bridge)
 */
app.post('/api/realtime/tracking', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;
    const userId = (req as any).user.id;

    // In a real-world scenario, this might push to a Redis stream or Kafka
    // For now, we update the location_shares table or broadcast via Supabase Realtime
    const { error } = await supabase.from('location_shares').update({
      last_lat: lat,
      last_lng: lng,
      last_updated_at: new Date().toISOString()
    }).match({ user_id: userId });

    if (error) throw error;
    res.json({ status: 'Tracking updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => res.json({ status: 'Safe-Her Backend is Running 🛡️' }));

// Start Server
app.listen(PORT, () => {
  console.log(`🛡️  Safe-Her Backend listening on http://localhost:${PORT}`);
});
