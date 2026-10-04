import { getDb } from "@/lib/mongodb";
import { authorize, handler } from "@/lib/guard";
import { escapeRegex } from "@/lib/utils";

export const GET = handler(async (req) => {
  await authorize(req, ["admin"]);
  const sp = new URL(req.url).searchParams;
  const filter = {};
  const q = sp.get("q");
  const role = sp.get("role");
  if (role) filter.role = role;
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const users = await (await getDb()).collection("users").find(filter).sort({ createdAt: -1 }).toArray();
  return Response.json({ items: users });
});
