import { getDb } from "@/lib/mongodb";
import { ApiError, authorize, handler, toObjectId } from "@/lib/guard";
import { pick } from "@/lib/utils";

async function load(id) {
  const app = await (await getDb()).collection("applications").findOne({ _id: toObjectId(id) });
  if (!app) throw new ApiError(404, "Application not found");
  return app;
}

export const GET = handler(async (req, { params }) => {
  const user = await authorize(req, ["tutor", "student"]);
  const { id } = await params;
  const app = await load(id);
  const owner = user.role === "tutor" ? app.tutorId : app.studentId;
  if (owner !== String(user._id)) throw new ApiError(403, "Forbidden");
  return Response.json({ application: app });
});

export const PATCH = handler(async (req, { params }) => {
  const user = await authorize(req, ["tutor"]);
  const { id } = await params;
  const app = await load(id);
  if (app.tutorId !== String(user._id)) throw new ApiError(403, "Forbidden");
  if (app.status !== "pending") throw new ApiError(400, "Only pending applications can be edited");

  const update = pick(await req.json(), ["qualifications", "experience", "expectedSalary"]);
  if (update.expectedSalary !== undefined) {
    update.expectedSalary = Number(update.expectedSalary);
    if (!(update.expectedSalary > 0)) throw new ApiError(400, "Expected salary must be greater than 0");
  }
  const col = (await getDb()).collection("applications");
  await col.updateOne({ _id: app._id }, { $set: { ...update, updatedAt: new Date() } });
  return Response.json({ application: await col.findOne({ _id: app._id }) });
});

export const DELETE = handler(async (req, { params }) => {
  const user = await authorize(req, ["tutor"]);
  const { id } = await params;
  const app = await load(id);
  if (app.tutorId !== String(user._id)) throw new ApiError(403, "Forbidden");
  if (app.status === "approved") throw new ApiError(400, "Approved applications cannot be deleted");
  await (await getDb()).collection("applications").deleteOne({ _id: app._id });
  return Response.json({ success: true });
});
