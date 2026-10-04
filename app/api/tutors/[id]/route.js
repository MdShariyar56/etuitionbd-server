import { getDb } from "@/lib/mongodb";
import { ApiError, handler, toObjectId } from "@/lib/guard";

export const GET = handler(async (req, { params }) => {
  const { id } = await params;
  const tutor = await (await getDb())
    .collection("users")
    .findOne({ _id: toObjectId(id), role: "tutor", status: "active" });
  if (!tutor) throw new ApiError(404, "Tutor not found");
  return Response.json({ tutor });
});
