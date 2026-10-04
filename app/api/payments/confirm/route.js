import { getDb } from "@/lib/mongodb";
import { ApiError, authorize, handler, toObjectId } from "@/lib/guard";
import { getStripe } from "@/lib/stripe";

export const POST = handler(async (req) => {
  const user = await authorize(req, ["student"]);
  const { paymentIntentId } = await req.json();
  if (!paymentIntentId) throw new ApiError(400, "paymentIntentId is required");

  const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);
  if (intent.status !== "succeeded") throw new ApiError(402, "Payment has not succeeded");
  if (intent.metadata.studentId !== String(user._id)) throw new ApiError(403, "Forbidden");

  const db = await getDb();
  const payments = db.collection("payments");
  const existing = await payments.findOne({ paymentIntentId });
  if (existing) return Response.json({ payment: existing });

  const app = await db.collection("applications").findOne({ _id: toObjectId(intent.metadata.applicationId) });
  if (!app) throw new ApiError(404, "Application not found");
  const tuition = await db.collection("tuitions").findOne({ _id: toObjectId(app.tuitionId) });

  const payment = {
    paymentIntentId,
    amount: intent.amount / 100,
    currency: intent.currency,
    status: "succeeded",
    applicationId: String(app._id),
    tuitionId: app.tuitionId,
    tuitionSubject: app.tuitionSubject,
    studentId: String(user._id),
    studentName: user.name,
    tutorId: app.tutorId,
    tutorName: app.tutorName,
    createdAt: new Date(),
  };
  const res = await payments.insertOne(payment);

  await db.collection("applications").updateOne(
    { _id: app._id },
    { $set: { status: "approved", paidAt: new Date() } }
  );
  await db.collection("applications").updateMany(
    { tuitionId: app.tuitionId, status: "pending", _id: { $ne: app._id } },
    { $set: { status: "rejected", reviewedAt: new Date() } }
  );
  if (tuition) {
    await db.collection("tuitions").updateOne(
      { _id: tuition._id },
      { $set: { hiredTutorId: app.tutorId, hiredTutorName: app.tutorName, hiredApplicationId: String(app._id) } }
    );
  }
  return Response.json({ payment: { ...payment, _id: res.insertedId } });
});
