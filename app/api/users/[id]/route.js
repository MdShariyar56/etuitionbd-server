import { getDb } from "@/lib/mongodb";
import { ApiError, authorize, handler, toObjectId } from "@/lib/guard";
import { pick } from "@/lib/utils";

export const PATCH = handler(async (req, { params }) => {
  const admin = await authorize(req, ["admin"]);
  const { id } = await params;
  const _id = toObjectId(id);
  const body = await req.json();
  const update = pick(body, ["name", "phone", "photoURL", "role", "status", "verified"]);

  if (update.role && !["student", "tutor", "admin"].includes(update.role)) throw new ApiError(400, "Invalid role");
  if (update.status && !["active", "blocked"].includes(update.status)) throw new ApiError(400, "Invalid status");
  if (String(admin._id) === id && (update.role || update.status === "blocked")) {
    throw new ApiError(400, "You cannot change your own role or block yourself");
  }

  const users = (await getDb()).collection("users");
  const res = await users.updateOne({ _id }, { $set: update });
  if (!res.matchedCount) throw new ApiError(404, "User not found");
  return Response.json({ user: await users.findOne({ _id }) });
});

export const DELETE = handler(async (req, { params }) => {
  const admin = await authorize(req, ["admin"]);
  const { id } = await params;
  if (String(admin._id) === id) throw new ApiError(400, "You cannot delete your own account");
  const res = await (await getDb()).collection("users").deleteOne({ _id: toObjectId(id) });
  if (!res.deletedCount) throw new ApiError(404, "User not found");
  return Response.json({ success: true });
});
