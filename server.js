// import express from 'express';
// import Stripe from 'stripe';
// import dotenv from 'dotenv';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import cors from 'cors';

// dotenv.config();

// const app = express();
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// // Define __filename and __dirname
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Enable CORS
// app.use(cors());

// // Parse JSON bodies
// app.use(express.json());

// // Serve the .well-known directory for Apple Pay domain verification
// app.use('/.well-known', express.static(path.join(__dirname, '.well-known')));

// // Serve the config endpoint
// app.get('/config', (req, res) => {
//   res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
// });

// // Create a payment intent
// app.post('/create-payment-intent', async (req, res) => {
//   const { paymentMethodType, currency } = req.body;

//   try {
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: 1999,
//       currency,
//       payment_method_types: [paymentMethodType],
//     });

//     res.json({ clientSecret: paymentIntent.client_secret });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));



//PAYPAL****************************************************************************


import express from 'express';
import fetch from 'node-fetch';
import 'dotenv/config';
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;
const environment = process.env.ENVIRONMENT || 'sandbox';
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const endpoint_url = environment === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

app.post('/create_order', async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    const orderData = {
      intent: req.body.intent.toUpperCase(),
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: '100.00'
        }
      }]
    };
    const response = await fetch(`${endpoint_url}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(orderData)
    });
    const order = await response.json();
    res.send(order);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.post('/complete_order', async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    const response = await fetch(`${endpoint_url}/v2/checkout/orders/${req.body.order_id}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const order = await response.json();
    res.send(order);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

async function getAccessToken() {
  const auth = `${client_id}:${client_secret}`;
  const response = await fetch(`${endpoint_url}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(auth).toString('base64')}`
    },
    body: 'grant_type=client_credentials'
  });
  const data = await response.json();
  return data.access_token;
}

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
