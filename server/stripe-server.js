import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Stripe
let stripe = null;
let supabase = null;

// Initialize Supabase
const initializeSupabase = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://despodpgvkszyexvcbft.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseKey) {
    console.error('❌ Supabase key not found in environment variables');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

// Initialize Stripe from database settings
const initializeStripe = async () => {
  try {
    if (!supabase) {
      supabase = initializeSupabase();
      if (!supabase) return false;
    }

    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'stripeConfig')
      .single();

    if (error || !data?.value) {
      console.error('❌ Stripe configuration not found in database');
      return false;
    }

    const config = data.value;
    if (!config.secretKey) {
      console.error('❌ Stripe secret key not found in configuration');
      return false;
    }

    stripe = new Stripe(config.secretKey);
    console.log('✅ Stripe initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing Stripe:', error.message);
    return false;
  }
};

// Middleware
app.use(cors({
  origin: ['http://localhost:8484', 'http://localhost:8485', 'https://francesco-fiori-piante.netlify.app', 'https://francesco-fiori-piante.onrender.com'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'application/json', limit: '10mb' }));

// Serve static files from dist directory (for Render deployment)
const distPath = path.join(__dirname, '../');
app.use(express.static(distPath));

// Serve React app for all non-API routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/') ||
      req.path.startsWith('/health') ||
      req.path.startsWith('/create-') ||
      req.path.startsWith('/verify-') ||
      req.path.startsWith('/webhook') ||
      req.path.startsWith('/initialize-')) {
    return next();
  }

  // Serve React app
  res.sendFile(path.join(distPath, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    stripe: stripe ? 'initialized' : 'not initialized',
    supabase: supabase ? 'initialized' : 'not initialized'
  });
});

// Initialize Stripe endpoint
app.post('/initialize-stripe', async (req, res) => {
  try {
    const success = await initializeStripe();
    if (success) {
      res.json({ success: true, message: 'Stripe initialized successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to initialize Stripe' });
    }
  } catch (error) {
    console.error('Error in /initialize-stripe:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create checkout session
app.post('/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      const initialized = await initializeStripe();
      if (!initialized) {
        return res.status(500).json({ error: 'Stripe not configured' });
      }
    }

    const {
      line_items,
      mode = 'payment',
      customer_email,
      billing_address_collection = 'required',
      shipping_address_collection,
      success_url,
      cancel_url,
      metadata = {},
      payment_intent_data = {}
    } = req.body;

    if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
      return res.status(400).json({ error: 'Invalid line items' });
    }

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode,
      customer_email,
      billing_address_collection,
      shipping_address_collection: shipping_address_collection || {
        allowed_countries: ['IT', 'FR', 'DE', 'ES', 'AT', 'CH']
      },
      success_url,
      cancel_url,
      metadata: {
        ...metadata,
        source: 'francesco-fiori-server',
        timestamp: new Date().toISOString()
      },
      payment_intent_data: {
        ...payment_intent_data,
        metadata: {
          ...payment_intent_data.metadata,
          source: 'francesco-fiori-server'
        }
      }
    });

    console.log('✅ Checkout session created:', session.id);
    res.json({
      id: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify payment
app.get('/verify-payment', async (req, res) => {
  try {
    if (!stripe) {
      const initialized = await initializeStripe();
      if (!initialized) {
        return res.status(500).json({ error: 'Stripe not configured' });
      }
    }

    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: 'Missing session_id parameter' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent']
    });

    const paymentIntent = session.payment_intent;

    res.json({
      status: session.payment_status,
      paymentIntentId: paymentIntent?.id,
      customerEmail: session.customer_email || session.customer_details?.email,
      amountTotal: session.amount_total,
      currency: session.currency,
      metadata: session.metadata
    });

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!stripe) {
      const initialized = await initializeStripe();
      if (!initialized) {
        return res.status(500).json({ error: 'Stripe not configured' });
      }
    }

    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.error('❌ Webhook secret not configured');
      return res.status(400).json({ error: 'Webhook secret not configured' });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle successful payment
const handlePaymentSuccess = async (paymentIntent) => {
  try {
    if (!supabase) {
      supabase = initializeSupabase();
      if (!supabase) return;
    }

    console.log('✅ Payment succeeded:', paymentIntent.id);

    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_intent_id: paymentIntent.id,
        paid_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .select();

    if (error) {
      console.error('❌ Failed to update order status:', error);
      return;
    }

    console.log('✅ Order status updated to paid:', data);
  } catch (error) {
    console.error('❌ Error handling payment success:', error);
  }
};

// Handle failed payment
const handlePaymentFailure = async (paymentIntent) => {
  try {
    if (!supabase) {
      supabase = initializeSupabase();
      if (!supabase) return;
    }

    console.log('❌ Payment failed:', paymentIntent.id);

    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'payment_failed',
        payment_intent_id: paymentIntent.id,
        failed_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .select();

    if (error) {
      console.error('❌ Failed to update order status:', error);
      return;
    }

    console.log('✅ Order status updated to payment_failed:', data);
  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
  }
};

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Francesco Fiori Stripe Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  
  // Try to initialize Stripe on startup
  await initializeStripe();
});
