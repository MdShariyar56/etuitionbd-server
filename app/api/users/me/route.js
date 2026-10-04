import { getDb } from "@/lib/mongodb";
import { authorize, handler } from "@/lib/guard";
import { pick } from "@/lib/utils";

const COMMON = ["name", "photoURL", "phone"];
const TUTOR = ["subjects", "location", "qualification", "experience", "bio", "ratePerHour"];

export const PATCH = handler(async (req) => {
  const user = await authorize(req);
  const body = await req.json();
  const update = pick(body, user.role === "tutor" ? [...COMMON, ...TUTOR] : COMMON);
  if (update.name !== undefined && !String(update.name).trim()) {
    return Response.json({ message: "Name is required" }, { status: 400 });
  }
  if (update.ratePerHour !== undefined) update.ratePerHour = Number(update.ratePerHour) || 0;
  const users = (await getDb()).collection("users");
  await users.updateOne({ _id: user._id }, { $set: update });
  return Response.json({ user: await users.findOne({ _id: user._id }) });
});
