import { getDb } from "@/lib/mongodb";
import { ApiError, authorize, handler, toObjectId } from "@/lib/guard";
import { pick } from "@/lib/utils";

async function load(id) {
  const tuition = await (await getDb()).collection("tuitions").findOne({ _id: toObjectId(id) });
  if (!tuition) throw new ApiError(404, "Tuition not found");
  return tuition;
}

export const GET = handler(async (req, { params }) => {
  const { id } = await params;
  const tuition = await load(id);
  if (tuition.status !== "approved") {
    const user = await authorize(req);
    if (user.role !== "admin" && tuition.studentId !== String(user._id)) {
      throw new ApiError(404, "Tuition not found");
    }
  }
  return Response.json({ tuition });
});

export const PATCH = handler(async (req, { params }) => {
  const user = await authorize(req, ["student"]);
  const { id } = await params;
  const tuition = await load(id);
  if (tuition.studentId !== String(user._id)) throw new ApiError(403, "Not your tuition post");
  if (tuition.hiredTutorId) throw new ApiError(400, "A tutor is already hired for this tuition");

  const update = pick(await req.json(), [
    "subject", "classLevel", "location", "budget", "daysPerWeek", "hoursPerDay", "description", "requirements",
  ]);
  for (const k of ["budget", "daysPerWeek", "hoursPerDay"]) if (update[k] !== undefined) update[k] = Number(update[k]);
  if (update.budget !== undefined && !(update.budget > 0)) throw new ApiError(400, "Budget must be greater than 0");
  if (tuition.status === "rejected") update.status = "pending";
  update.updatedAt = new Date();

  const col = (await getDb()).collection("tuitions");
  await col.updateOne({ _id: tuition._id }, { $set: update });
  return Response.json({ tuition: await col.findOne({ _id: tuition._id }) });
});

export const DELETE = handler(async (req, { params }) => {
  const user = await authorize(req, ["student", "admin"]);
  const { id } = await params;
  const tuition = await load(id);
  if (user.role !== "admin" && tuition.studentId !== String(user._id)) throw new ApiError(403, "Not your tuition post");

  const db = await getDb();
  await db.collection("tuitions").deleteOne({ _id: tuition._id });
  await db.collection("applications").deleteMany({ tuitionId: String(tuition._id), status: { $ne: "approved" } });
  return Response.json({ success: true });
});
