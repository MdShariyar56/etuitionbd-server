import { getDb } from "@/lib/mongodb";
import { verifyFirebaseToken } from "@/lib/firebaseAuth";
import { signToken } from "@/lib/jwt";
import { ApiError, handler } from "@/lib/guard";

export const POST = handler(async (req) => {
  const { idToken, profile = {} } = await req.json();
  if (!idToken) throw new ApiError(400, "idToken is required");

  let decoded;
  try {
    decoded = await verifyFirebaseToken(idToken);
  } catch {
    throw new ApiError(401, "Invalid Firebase token");
  }

  const email = decoded.email?.toLowerCase();
  if (!email) throw new ApiError(400, "Account has no email");

  const users = (await getDb()).collection("users");
  const isAdminEmail = email === process.env.ADMIN_EMAIL?.toLowerCase();
  let user = await users.findOne({ email });

  if (!user) {
    const role = isAdminEmail ? "admin" : ["student", "tutor"].includes(profile.role) ? profile.role : "student";
    const doc = {
      name: profile.name || decoded.name || email.split("@")[0],
      email,
      phone: profile.phone || "",
      photoURL: profile.photoURL || decoded.picture || "",
      role,
      status: "active",
      verified: false,
      createdAt: new Date(),
    };
    const res = await users.insertOne(doc);
    user = { ...doc, _id: res.insertedId };
  } else if (isAdminEmail && user.role !== "admin") {
    await users.updateOne({ _id: user._id }, { $set: { role: "admin" } });
    user.role = "admin";
  }

  if (user.status === "blocked") throw new ApiError(403, "Account is blocked");
  return Response.json({ token: await signToken(user), user });
});
