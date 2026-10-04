import { getDb } from "@/lib/mongodb";
import { ApiError, authorize, handler, toObjectId } from "@/lib/guard";

export const PATCH = handler(async (req, { params }) => {
  const user = await authorize(req, ["student"]);
  const { id } = await params;
  const col = (await getDb()).collection("applications");
  const app = await col.findOne({ _id: toObjectId(id) });
  if (!app) throw new ApiError(404, "Application not found");
  if (app.studentId !== String(user._id)) throw new ApiError(403, "Forbidden");
  if (app.status !== "pending") throw new ApiError(400, "Only pending applications can be rejected");
  await col.updateOne({ _id: app._id }, { $set: { status: "rejected", reviewedAt: new Date() } });
  return Response.json({ success: true });
});
