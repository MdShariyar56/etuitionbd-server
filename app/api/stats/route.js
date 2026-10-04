import { getDb } from "@/lib/mongodb";
import { authorize, handler } from "@/lib/guard";

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const GET = handler(async (req) => {
  await authorize(req, ["admin"]);
  const db = await getDb();
  const [users, tuitions, payments] = await Promise.all([
    db.collection("users").find({}, { projection: { role: 1, createdAt: 1 } }).toArray(),
    db.collection("tuitions").find({}, { projection: { status: 1 } }).toArray(),
    db.collection("payments").find({}).toArray(),
  ]);

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: monthKey(d),
      month: d.toLocaleString("en-US", { month: "short" }),
      earnings: 0,
      students: 0,
      tutors: 0,
    });
  }
  const byKey = Object.fromEntries(months.map((m) => [m.key, m]));
  for (const p of payments) {
    const m = byKey[monthKey(new Date(p.createdAt))];
    if (m) m.earnings += p.amount;
  }
  for (const u of users) {
    const m = byKey[monthKey(new Date(u.createdAt))];
    if (m && (u.role === "student" || u.role === "tutor")) m[`${u.role}s`] += 1;
  }

  return Response.json({
    totalUsers: users.length,
    students: users.filter((u) => u.role === "student").length,
    tutors: users.filter((u) => u.role === "tutor").length,
    totalTuitions: tuitions.length,
    pendingTuitions: tuitions.filter((t) => t.status === "pending").length,
    approvedTuitions: tuitions.filter((t) => t.status === "approved").length,
    transactions: payments.length,
    totalEarnings: payments.reduce((s, p) => s + p.amount, 0),
    monthly: months,
  });
});
