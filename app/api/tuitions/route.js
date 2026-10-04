import { getDb } from "@/lib/mongodb";
import { ApiError, authorize, handler } from "@/lib/guard";
import { escapeRegex } from "@/lib/utils";

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  budget_asc: { budget: 1, createdAt: -1 },
  budget_desc: { budget: -1, createdAt: -1 },
};

export const GET = handler(async (req) => {
  const sp = new URL(req.url).searchParams;
  const and = [{ status: "approved" }, { hiredTutorId: { $exists: false } }];

  const q = sp.get("q");
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    and.push({ $or: [{ subject: rx }, { location: rx }] });
  }
  for (const key of ["subject", "classLevel", "location"]) {
    const v = sp.get(key);
    if (v) and.push({ [key]: new RegExp(`^${escapeRegex(v)}$`, "i") });
  }
  const min = Number(sp.get("minBudget"));
  const max = Number(sp.get("maxBudget"));
  if (min) and.push({ budget: { $gte: min } });
  if (max) and.push({ budget: { $lte: max } });

  const limit = Math.min(Number(sp.get("limit")) || 6, 50);
  const page = Math.max(Number(sp.get("page")) || 1, 1);
  const sort = SORTS[sp.get("sort")] || SORTS.newest;

  const col = (await getDb()).collection("tuitions");
  const filter = { $and: and };
  const [items, total] = await Promise.all([
    col.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).toArray(),
    col.countDocuments(filter),
  ]);
  return Response.json({ items, total, page, pages: Math.ceil(total / limit) });
});

export const POST = handler(async (req) => {
  const user = await authorize(req, ["student"]);
  const b = await req.json();
  const required = ["subject", "classLevel", "location", "budget"];
  for (const f of required) {
    if (!String(b[f] ?? "").trim()) throw new ApiError(400, `${f} is required`);
  }
  const doc = {
    subject: String(b.subject).trim(),
    classLevel: String(b.classLevel).trim(),
    location: String(b.location).trim(),
    budget: Number(b.budget),
    daysPerWeek: Number(b.daysPerWeek) || 3,
    hoursPerDay: Number(b.hoursPerDay) || 2,
    description: String(b.description || "").trim(),
    requirements: Array.isArray(b.requirements) ? b.requirements.filter(Boolean) : [],
    status: "pending",
    studentId: String(user._id),
    studentName: user.name,
    studentEmail: user.email,
    studentPhoto: user.photoURL || "",
    studentSince: user.createdAt,
    createdAt: new Date(),
  };
  if (!(doc.budget > 0)) throw new ApiError(400, "Budget must be greater than 0");
  const res = await (await getDb()).collection("tuitions").insertOne(doc);
  return Response.json({ tuition: { ...doc, _id: res.insertedId } }, { status: 201 });
});
