import { getDb } from "@/lib/mongodb";
import { authorize, handler } from "@/lib/guard";

export const GET = handler(async (req) => {
  await authorize(req, ["admin"]);
  const status = new URL(req.url).searchParams.get("status");
  const items = await (await getDb())
    .collection("tuitions")
    .find(status ? { status } : {})
    .sort({ createdAt: -1 })
    .toArray();
  return Response.json({ items });
});
