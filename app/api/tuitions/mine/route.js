import { getDb } from "@/lib/mongodb";
import { authorize, handler } from "@/lib/guard";

export const GET = handler(async (req) => {
  const user = await authorize(req, ["student"]);
  const db = await getDb();
  const items = await db
    .collection("tuitions")
    .find({ studentId: String(user._id) })
    .sort({ createdAt: -1 })
    .toArray();
  const counts = await db
    .collection("applications")
    .aggregate([
      { $match: { studentId: String(user._id) } },
      { $group: { _id: "$tuitionId", count: { $sum: 1 } } },
    ])
    .toArray();
  const map = Object.fromEntries(counts.map((c) => [c._id, c.count]));
  return Response.json({ items: items.map((t) => ({ ...t, applicationCount: map[String(t._id)] || 0 })) });
});
