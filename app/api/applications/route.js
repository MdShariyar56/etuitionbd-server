import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { ApiError, authorize, handler } from "@/lib/guard";

export const GET = handler(async (req) => {
  const user = await authorize(req, ["tutor", "student"]);
  const sp = new URL(req.url).searchParams;
  const filter = user.role === "tutor" ? { tutorId: String(user._id) } : { studentId: String(user._id) };
  if (sp.get("status")) filter.status = sp.get("status");
  if (sp.get("tuitionId")) filter.tuitionId = sp.get("tuitionId");
  const items = await (await getDb()).collection("applications").find(filter).sort({ createdAt: -1 }).toArray();
  return Response.json({ items });
});

export const POST = handler(async (req) => {
  const user = await authorize(req, ["tutor"]);
  const b = await req.json();
  if (!ObjectId.isValid(b.tuitionId)) throw new ApiError(400, "Invalid tuition");
  if (!String(b.qualifications || "").trim()) throw new ApiError(400, "Qualifications are required");
  if (!String(b.experience || "").trim()) throw new ApiError(400, "Experience is required");
  const salary = Number(b.expectedSalary);
  if (!(salary > 0)) throw new ApiError(400, "Expected salary must be greater than 0");

  const db = await getDb();
  const tuition = await db.collection("tuitions").findOne({ _id: new ObjectId(b.tuitionId) });
  if (!tuition || tuition.status !== "approved") throw new ApiError(404, "Tuition not available");
  if (tuition.hiredTutorId) throw new ApiError(400, "A tutor has already been hired for this tuition");

  const dup = await db
    .collection("applications")
    .findOne({ tuitionId: b.tuitionId, tutorId: String(user._id) });
  if (dup) throw new ApiError(409, "You have already applied to this tuition");

  const doc = {
    tuitionId: b.tuitionId,
    tuitionSubject: tuition.subject,
    tuitionClass: tuition.classLevel,
    tuitionLocation: tuition.location,
    studentId: tuition.studentId,
    tutorId: String(user._id),
    tutorName: user.name,
    tutorEmail: user.email,
    tutorPhoto: user.photoURL || "",
    qualifications: String(b.qualifications).trim(),
    experience: String(b.experience).trim(),
    expectedSalary: salary,
    status: "pending",
    createdAt: new Date(),
  };
  const res = await db.collection("applications").insertOne(doc);
  return Response.json({ application: { ...doc, _id: res.insertedId } }, { status: 201 });
});
