import { authorize, handler } from "@/lib/guard";

export const GET = handler(async (req) => {
  const user = await authorize(req);
  return Response.json({ user });
});
