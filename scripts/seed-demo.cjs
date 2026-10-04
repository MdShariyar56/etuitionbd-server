const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const now = Date.now();
const daysAgo = (n) => new Date(now - n * 86400000);

const tutors = [
  ["Rahim Uddin", "Mathematics, Physics", "Dhaka", "BSc in Mathematics, University of Dhaka", "5 years", "Patient teacher focused on building strong fundamentals for SSC and HSC students.", 600, true],
  ["Nusrat Jahan", "English, Bangla", "Dhaka", "MA in English, Jahangirnagar University", "4 years", "Helps students improve grammar, writing and spoken English with practical exercises.", 500, true],
  ["Tanvir Hasan", "Physics, Chemistry", "Chattogram", "BSc in Engineering, CUET", "3 years", "Concept-first teaching with plenty of problem solving for admission test candidates.", 700, true],
  ["Sadia Islam", "Biology, Chemistry", "Sylhet", "MBBS student, Sylhet MAG Osmani Medical College", "2 years", "Medical admission and HSC biology specialist with easy memory techniques.", 650, false],
  ["Mahmudul Karim", "ICT, Mathematics", "Rajshahi", "BSc in CSE, RUET", "3 years", "Teaches ICT, programming basics and higher math with real examples.", 550, false],
  ["Farhana Akter", "Accounting, Finance", "Dhaka", "BBA in Accounting, University of Dhaka", "4 years", "Makes accounting simple for HSC business studies and BBA students.", 600, true],
  ["Imran Hossain", "Mathematics, General Science", "Khulna", "BSc in Mathematics, Khulna University", "6 years", "Experienced in JSC and SSC preparation with regular weekly tests.", 450, false],
  ["Sumaiya Rahman", "English, Social Science", "Barishal", "BA (Hons) in English, University of Barishal", "2 years", "Friendly tutor for primary and junior students, with a focus on reading skills.", 400, false],
  ["Arif Chowdhury", "Chemistry, Biology", "Chattogram", "MSc in Chemistry, University of Chittagong", "7 years", "Long experience with HSC and medical admission coaching.", 750, true],
  ["Mim Sultana", "Bangla, Islamic Studies", "Dhaka", "MA in Bangla, Dhaka College", "3 years", "Clear explanations and creative writing support for school students.", 450, false],
].map(([name, subjects, location, qualification, experience, bio, ratePerHour, verified], i) => ({
  name,
  email: `demo.tutor${i + 1}@etuitionbd.demo`,
  phone: `0171000${String(1000 + i)}`,
  photoURL: "",
  role: "tutor",
  status: "active",
  verified,
  subjects: subjects.split(",").map((s) => s.trim()),
  location,
  qualification,
  experience,
  bio,
  ratePerHour,
  isDemo: true,
  createdAt: daysAgo(30 - i),
}));

const students = ["Karim Ahmed", "Ayesha Siddika", "Rafiq Mia"].map((name, i) => ({
  name,
  email: `demo.student${i + 1}@etuitionbd.demo`,
  phone: `0181000${String(2000 + i)}`,
  photoURL: "",
  role: "student",
  status: "active",
  verified: false,
  isDemo: true,
  createdAt: daysAgo(40 - i),
}));

const tuitionSeeds = [
  ["Mathematics", "Class 10", "Dhaka", 5000, 3, 2, "Need help with algebra and geometry before SSC exam. Weekly model tests preferred.", ["Experienced tutor", "Own notes"]],
  ["Physics", "Class 12", "Dhaka", 6000, 4, 2, "HSC 2nd year physics, mainly mechanics and electricity.", ["Engineering background"]],
  ["English", "Class 8", "Chattogram", 3500, 3, 1, "Improve grammar and writing skills.", ["Patient with kids"]],
  ["Chemistry", "Class 11", "Sylhet", 4500, 3, 2, "Organic and physical chemistry for HSC 1st year.", []],
  ["Biology", "Admission", "Dhaka", 7000, 5, 2, "Medical admission preparation, daily practice and exam.", ["Medical student preferred"]],
  ["ICT", "Class 11", "Rajshahi", 3000, 2, 2, "HSC ICT, programming and database chapters.", ["CSE background"]],
  ["Mathematics", "Class 6", "Khulna", 3000, 3, 1, "Basic math strengthening for a class 6 student.", ["Female tutor preferred"]],
  ["Accounting", "Class 12", "Dhaka", 5500, 3, 2, "HSC business studies accounting, 2nd paper.", []],
  ["Bangla", "Class 9", "Barishal", 3200, 3, 1, "Bangla grammar and composition.", []],
  ["Chemistry", "Admission", "Chattogram", 6500, 4, 2, "University admission chemistry crash course.", ["Experienced tutor"]],
  ["English", "Class 10", "Dhaka", 4000, 3, 2, "SSC English first and second paper.", ["Spoken English practice"]],
  ["General Science", "Class 7", "Khulna", 3000, 3, 1, "Science basics with simple experiments.", []],
];

(async () => {
  const client = await new MongoClient(process.env.MONGODB_URI).connect();
  const db = client.db(process.env.MONGODB_DB || "etuitionbd");
  const users = db.collection("users");
  const tuitions = db.collection("tuitions");

  await users.deleteMany({ isDemo: true });
  await tuitions.deleteMany({ isDemo: true });
  if (process.argv.includes("--remove")) {
    console.log("Demo data removed.");
    return client.close();
  }

  await users.insertMany([...tutors, ...students]);
  const studentDocs = await users.find({ isDemo: true, role: "student" }).sort({ email: 1 }).toArray();

  const docs = tuitionSeeds.map(([subject, classLevel, location, budget, daysPerWeek, hoursPerDay, description, requirements], i) => {
    const s = studentDocs[i % studentDocs.length];
    return {
      subject, classLevel, location, budget, daysPerWeek, hoursPerDay, description, requirements,
      status: "approved",
      studentId: String(s._id),
      studentName: s.name,
      studentEmail: s.email,
      studentPhoto: "",
      studentSince: s.createdAt,
      isDemo: true,
      createdAt: daysAgo(i + 1),
    };
  });
  await tuitions.insertMany(docs);

  console.log(`Inserted ${tutors.length} tutors, ${students.length} students, ${docs.length} tuitions.`);
  await client.close();
})().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
