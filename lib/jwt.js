import { SignJWT, jwtVerify } from "jose";

const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set in .env.local");
  return new TextEncoder().encode(process.env.JWT_SECRET);
};

export function signToken(user) {
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user._id))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, secret());
  return payload;
}
