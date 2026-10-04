import { getDb } from "@/lib/mongodb";
import { handler } from "@/lib/guard";
import { escapeRegex } from "@/lib/utils";

export const GET = handler(async (req) => {
  const sp = new URL(req.url).searchParams;
  const filter = { role: "tutor", status: "active" };
  const and = [];
  const q = sp.get("q");
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    and.push({ $or: [{ name: rx }, { subjects: rx }, { location: rx }] });
  }
  if (sp.get("subject")) and.push({ subjects: new RegExp(escapeRegex(sp.get("subject")), "i") });
  if (sp.get("location")) and.push({ location: new RegExp(escapeRegex(sp.get("location")), "i") });
  if (and.length) filter.$and = and;

  const limit = Math.min(Number(sp.get("limit")) || 12, 50);
  const page = Math.max(Number(sp.get("page")) || 1, 1);
  const col = (await getDb()).collection("users");
  const [items, total] = await Promise.all([
    col
      .find(filter, { projection: { status: 0 } })
      .sort({ verified: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    col.countDocuments(filter),
  ]);
  return Response.json({ items, total, page, pages: Math.ceil(total / limit) });
});
