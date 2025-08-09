import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// ensure secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY in environment');
}

// initialize Stripe with proper version
const stripe = new Stripe(stripeSecretKey);

const app = express();
app.use(cors());
app.use(express.json());

// define shape of incoming request body
interface CreatePaymentIntentRequest {
    amount?: number;
    currency?: string;
}

app.post(
    '/create-payment-intent',
    async (
        req: Request<{}, {}, CreatePaymentIntentRequest>,
        res: Response
    ) => {
        try {
            const { amount = 1000, currency = 'usd' } = req.body;
            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency
            });
            res.json({ clientSecret: paymentIntent.client_secret });
        } catch (err: any) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});