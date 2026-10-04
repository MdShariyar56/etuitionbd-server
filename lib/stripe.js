import Stripe from "stripe";

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set in .env.local");
  if (!global._stripe) global._stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return global._stripe;
}
