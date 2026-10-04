import { getDb } from "@/lib/mongodb";
import { ApiError, authorize, handler, toObjectId } from "@/lib/guard";

export const PATCH = handler(async (req, { params }) => {
  await authorize(req, ["admin"]);
  const { id } = await params;
  const { status } = await req.json();
  if (!["approved", "rejected"].includes(status)) throw new ApiError(400, "Status must be approved or rejected");
  const col = (await getDb()).collection("tuitions");
  const res = await col.findOneAndUpdate(
    { _id: toObjectId(id) },
    { $set: { status, reviewedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!res) throw new ApiError(404, "Tuition not found");
  return Response.json({ tuition: res });
});
