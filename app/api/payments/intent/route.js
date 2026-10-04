import { getDb } from "@/lib/mongodb";
import { ApiError, authorize, handler, toObjectId } from "@/lib/guard";
import { getStripe } from "@/lib/stripe";

const currency = () => (process.env.STRIPE_CURRENCY || "bdt").toLowerCase();

export const POST = handler(async (req) => {
  const user = await authorize(req, ["student"]);
  const { applicationId } = await req.json();
  const db = await getDb();
  const app = await db.collection("applications").findOne({ _id: toObjectId(applicationId) });
  if (!app || app.studentId !== String(user._id)) throw new ApiError(404, "Application not found");
  if (app.status !== "pending") throw new ApiError(400, "This application is no longer pending");

  const tuition = await db.collection("tuitions").findOne({ _id: toObjectId(app.tuitionId) });
  if (!tuition || tuition.hiredTutorId) throw new ApiError(400, "A tutor is already hired for this tuition");

  const intent = await getStripe().paymentIntents.create({
    amount: Math.round(app.expectedSalary * 100),
    currency: currency(),
    automatic_payment_methods: { enabled: true },
    metadata: { applicationId: String(app._id), studentId: String(user._id) },
  });
  return Response.json({ clientSecret: intent.client_secret, amount: app.expectedSalary, application: app });
});
