import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import { verifyToken } from "./jwt";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function toObjectId(id) {
  if (!ObjectId.isValid(id)) throw new ApiError(400, "Invalid id");
  return new ObjectId(id);
}

export async function authorize(req, roles) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new ApiError(401, "Missing access token");

  let payload;
  try {
    payload = await verifyToken(token);
  } catch (err) {
    throw new ApiError(401, err.code === "ERR_JWT_EXPIRED" ? "Token expired" : "Invalid token");
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: toObjectId(payload.sub) });
  if (!user) throw new ApiError(401, "User not found");
  if (user.status === "blocked") throw new ApiError(403, "Account is blocked");
  if (roles && !roles.includes(user.role)) throw new ApiError(403, "Forbidden: insufficient role");
  return user;
}

export function handler(fn) {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return Response.json({ message: err.message }, { status: err.status });
      }
      console.error(err);
      return Response.json({ message: err.message || "Server error" }, { status: 500 });
    }
  };
}
