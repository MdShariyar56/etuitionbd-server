import { getDb } from "@/lib/mongodb";
import { authorize, handler } from "@/lib/guard";

export const GET = handler(async (req) => {
  const user = await authorize(req);
  const filter =
    user.role === "admin" ? {} : user.role === "tutor" ? { tutorId: String(user._id) } : { studentId: String(user._id) };
  const items = await (await getDb()).collection("payments").find(filter).sort({ createdAt: -1 }).toArray();
  const total = items.reduce((sum, p) => sum + p.amount, 0);
  return Response.json({ items, total });
});
