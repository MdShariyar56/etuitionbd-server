import { getDb } from "@/lib/mongodb";
import { handler } from "@/lib/guard";

export const GET = handler(async () => {
  const col = (await getDb()).collection("tuitions");
  const base = { status: "approved" };
  const [subjects, classLevels, locations] = await Promise.all([
    col.distinct("subject", base),
    col.distinct("classLevel", base),
    col.distinct("location", base),
  ]);
  const sort = (a) => a.filter(Boolean).sort((x, y) => x.localeCompare(y, undefined, { numeric: true }));
  return Response.json({ subjects: sort(subjects), classLevels: sort(classLevels), locations: sort(locations) });
});
