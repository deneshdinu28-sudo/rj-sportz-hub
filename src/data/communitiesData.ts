export interface Student {
  id: string;
  name: string;
  age: number;
  parentName: string;
  phone: string;
  whatsapp: string;
  feeStatus: "paid" | "pending" | "overdue";
  fee: number;
  joiningDate: string;
  validTill: string;
  nextDueDate: string;
  paymentPlan: "monthly" | "two_months" | "three_months" | "six_months";
}

export interface Batch {
  id: string;
  startTime: string;
  endTime: string;
  days: string[];
  ageGroup: "kids" | "adults";
  batchType: "standard" | "premium";
  maxStudents?: number;
  students: Student[];
}

export interface Sport {
  id: string;
  name: string;
  icon: string;
  coach: string;
  coachPhone: string;
  coachId: string;
  standardFee: number;
  premiumFee: number;
  batches: Batch[];
}

export interface Community {
  id: string;
  name: string;
  location: string;
  contactPerson: string;
  contactPhone: string;
  status: "active" | "inactive";
  sports: Sport[];
}

const firstNames = ["Rahul","Priya","Amit","Sneha","Arjun","Kavya","Rohan","Ananya","Vivek","Meera","Karan","Divya","Aarav","Siddharth","Diya","Aryan","Nisha","Om","Tara","Ishaan","Riya","Harsh","Sakshi","Dev","Tanvi","Nikhil","Aditi","Yash","Lavanya","Manav","Saanvi","Reyansh","Anika","Gaurav","Prerna","Kunal","Neha","Pooja","Sanjay","Vinay","Sunita","Ashok","Geeta","Rajiv","Deepa","Manoj","Lakshmi","Tanya","Ravi","Arun"];
const lastNames = ["Sharma","Gupta","Patel","Reddy","Singh","Nair","Das","Iyer","Joshi","Kapoor","Mehta","Rao","Jain","Bansal","Choudhary","Malik","Goyal","Shukla","Sethi","Shetty","Chopra","Deshpande","Bajaj","Dubey","Kohli","Mishra","Bose","Sinha","Rawat","Thakur","Kulkarni","Pandey","Bhatt","Pillai","Bhat","Roy","Menon","Desai","Shah","Verma","Tiwari","Agarwal","Saxena","Malhotra","Chauhan"];
const parentFirstNames = ["Suresh","Ramesh","Neha","Vikram","Harpreet","Deepak","Sumit","Mohan","Anil","Ravi","Sunil","Prasad","Pankaj","Rajesh","Naveen","Sudhir","Arun","Dinesh","Raman","Karthik","Ashish","Piyush","Tarun","Debashis","Ajay","Pradeep","Nitin","Rakesh","Vijay","Mohit"];

let studentCounter = 0;
let batchCounter = 0;
let sportCounter = 0;

function randomPhone(): string {
  return `${Math.floor(6000000000 + Math.random() * 3999999999)}`;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeStudent(fee: number, ageGroup: "kids" | "adults"): Student {
  studentCounter++;
  const firstName = randomFrom(firstNames);
  const lastName = randomFrom(lastNames);
  const statuses: Student["feeStatus"][] = ["paid","paid","paid","paid","paid","paid","paid","pending","pending","overdue"];
  const status = randomFrom(statuses);
  const phone = randomPhone();
  const age = ageGroup === "kids" ? Math.floor(Math.random() * 10) + 5 : Math.floor(Math.random() * 25) + 20;
  const plans: Student["paymentPlan"][] = ["monthly","monthly","monthly","two_months","three_months","six_months"];
  const plan = randomFrom(plans);
  const parentName = ageGroup === "adults" ? "Self" : `${randomFrom(parentFirstNames)} ${lastName}`;

  return {
    id: `st-${studentCounter}`,
    name: `${firstName} ${lastName}`,
    age,
    parentName,
    phone,
    whatsapp: phone,
    feeStatus: status,
    fee,
    joiningDate: "2026-01-15",
    validTill: "2026-02-14",
    nextDueDate: "2026-02-15",
    paymentPlan: plan,
  };
}

function makeBatch(startTime: string, endTime: string, ageGroup: "kids" | "adults", batchType: "standard" | "premium", fee: number, studentCount: number, maxStudents?: number): Batch {
  batchCounter++;
  const days = batchType === "premium" ? ["Mon","Wed","Fri","Sat"] : ["Mon","Wed","Fri"];
  const students: Student[] = [];
  for (let i = 0; i < studentCount; i++) {
    students.push(makeStudent(fee, ageGroup));
  }
  return {
    id: `bt-${batchCounter}`,
    startTime, endTime, days, ageGroup, batchType,
    maxStudents: maxStudents || (studentCount + Math.floor(Math.random() * 10) + 5),
    students,
  };
}

const sportTemplates: { name: string; icon: string; stdFee: number; premFee: number }[] = [
  { name: "Badminton", icon: "🏸", stdFee: 1500, premFee: 2500 },
  { name: "Swimming", icon: "🏊", stdFee: 2000, premFee: 3500 },
  { name: "Cricket", icon: "🏏", stdFee: 1200, premFee: 2000 },
  { name: "Tennis", icon: "🎾", stdFee: 1800, premFee: 3000 },
  { name: "Yoga", icon: "🧘", stdFee: 800, premFee: 1500 },
  { name: "Karate", icon: "🥋", stdFee: 1500, premFee: 2500 },
  { name: "Football", icon: "⚽", stdFee: 1200, premFee: 2000 },
  { name: "Basketball", icon: "🏀", stdFee: 1500, premFee: 2500 },
  { name: "Table Tennis", icon: "🏓", stdFee: 1000, premFee: 1800 },
  { name: "Skating", icon: "⛸️", stdFee: 1200, premFee: 2000 },
  { name: "Chess", icon: "♟️", stdFee: 600, premFee: 1000 },
  { name: "Gymnastics", icon: "🤸", stdFee: 2000, premFee: 3500 },
];

const coaches = [
  { name: "Rajesh Kumar", phone: "9876543210", id: "co-1" },
  { name: "Sunita Rao", phone: "9876543211", id: "co-2" },
  { name: "Vikas Patil", phone: "9876543212", id: "co-3" },
  { name: "Priya Menon", phone: "9876543213", id: "co-4" },
  { name: "Arjun Desai", phone: "9876543214", id: "co-5" },
  { name: "Meera Nair", phone: "9876543215", id: "co-6" },
  { name: "Ramesh Tiwari", phone: "9876543216", id: "co-7" },
  { name: "Anita Sharma", phone: "9876543217", id: "co-8" },
];

const batchTimes = [
  ["4:00 PM", "5:00 PM"],
  ["5:00 PM", "6:00 PM"],
  ["6:00 PM", "7:00 PM"],
  ["7:00 PM", "8:00 PM"],
  ["6:00 AM", "7:00 AM"],
  ["7:00 AM", "8:00 AM"],
  ["8:00 AM", "9:00 AM"],
];

function makeSport(sportIndex: number): Sport {
  sportCounter++;
  const t = sportTemplates[sportIndex % sportTemplates.length];
  const coach = randomFrom(coaches);
  const batchCount = Math.floor(Math.random() * 3) + 2; // 2-4
  const batches: Batch[] = [];
  const usedTimes = new Set<number>();

  for (let i = 0; i < batchCount; i++) {
    let timeIdx: number;
    do { timeIdx = Math.floor(Math.random() * batchTimes.length); } while (usedTimes.has(timeIdx) && usedTimes.size < batchTimes.length);
    usedTimes.add(timeIdx);
    const [start, end] = batchTimes[timeIdx];
    const ageGroup: "kids" | "adults" = i % 2 === 0 ? "kids" : "adults";
    const batchType: "standard" | "premium" = i % 3 === 0 ? "premium" : "standard";
    const fee = batchType === "premium" ? t.premFee : t.stdFee;
    const studentCount = Math.floor(Math.random() * 8) + 8; // 8-15
    batches.push(makeBatch(start, end, ageGroup, batchType, fee, studentCount, batchType === "premium" ? 20 : 30));
  }

  return {
    id: `sp-${sportCounter}`,
    name: t.name,
    icon: t.icon,
    coach: coach.name,
    coachPhone: coach.phone,
    coachId: coach.id,
    standardFee: t.stdFee,
    premiumFee: t.premFee,
    batches,
  };
}

const communityDefs: { name: string; location: string; contact: string; phone: string; sportCount: number }[] = [
  { name: "Sunshine Apartments", location: "HSR Layout, Bangalore", contact: "Mr. Sharma", phone: "9876543210", sportCount: 5 },
  { name: "Green Valley Society", location: "Whitefield, Bangalore", contact: "Mrs. Desai", phone: "9876543220", sportCount: 4 },
  { name: "Lake View Residency", location: "Koramangala, Bangalore", contact: "Mr. Reddy", phone: "9876543230", sportCount: 6 },
  { name: "Blue Ridge Township", location: "Electronic City, Bangalore", contact: "Mr. Patel", phone: "9876543240", sportCount: 4 },
  { name: "Royal Orchid Villas", location: "Marathahalli, Bangalore", contact: "Mrs. Nair", phone: "9876543250", sportCount: 3 },
  { name: "Palm Meadows", location: "Sarjapur Road, Bangalore", contact: "Mr. Iyer", phone: "9876543260", sportCount: 5 },
  { name: "Prestige Garden Bay", location: "Yelahanka, Bangalore", contact: "Mrs. Kapoor", phone: "9876543270", sportCount: 4 },
  { name: "Brigade Gateway", location: "Rajajinagar, Bangalore", contact: "Mr. Mehta", phone: "9876543280", sportCount: 3 },
];

let sportTemplateIdx = 0;

export const mockCommunities: Community[] = communityDefs.map((def, i) => {
  const sports: Sport[] = [];
  for (let j = 0; j < def.sportCount; j++) {
    sports.push(makeSport(sportTemplateIdx));
    sportTemplateIdx = (sportTemplateIdx + 1) % sportTemplates.length;
  }
  return {
    id: `cm-${i + 1}`,
    name: def.name,
    location: def.location,
    contactPerson: def.contact,
    contactPhone: def.phone,
    status: i < 7 ? "active" as const : "inactive" as const,
    sports,
  };
});

// Helper functions
export function getCommunityById(id: string): Community | undefined {
  return mockCommunities.find(c => c.id === id);
}

export function getCommunityStudentCount(community: Community): number {
  return community.sports.reduce((sum, s) => sum + s.batches.reduce((bs, b) => bs + b.students.length, 0), 0);
}

export function getCommunityRevenue(community: Community): number {
  return community.sports.reduce((sum, s) =>
    sum + s.batches.reduce((bs, b) =>
      bs + b.students.filter(st => st.feeStatus === "paid").reduce((a, st) => a + st.fee, 0), 0), 0);
}

export function getSportStudentCount(sport: Sport): number {
  return sport.batches.reduce((sum, b) => sum + b.students.length, 0);
}

export function getSportRevenue(sport: Sport): number {
  return sport.batches.reduce((sum, b) =>
    sum + b.students.filter(s => s.feeStatus === "paid").reduce((a, s) => a + s.fee, 0), 0);
}

export function getSportPaidCount(sport: Sport): number {
  return sport.batches.reduce((sum, b) => sum + b.students.filter(s => s.feeStatus === "paid").length, 0);
}

export function getSportPendingCount(sport: Sport): number {
  return sport.batches.reduce((sum, b) => sum + b.students.filter(s => s.feeStatus === "pending").length, 0);
}

export function getSportOverdueCount(sport: Sport): number {
  return sport.batches.reduce((sum, b) => sum + b.students.filter(s => s.feeStatus === "overdue").length, 0);
}

export function getBatchRevenue(batch: Batch): number {
  return batch.students.filter(s => s.feeStatus === "paid").reduce((a, s) => a + s.fee, 0);
}

export function getBatchPaidCount(batch: Batch): number {
  return batch.students.filter(s => s.feeStatus === "paid").length;
}

export function getBatchPendingCount(batch: Batch): number {
  return batch.students.filter(s => s.feeStatus !== "paid").length;
}

export function getPaymentHealth(paidPercent: number): "good" | "attention" | "critical" {
  if (paidPercent > 90) return "good";
  if (paidPercent >= 70) return "attention";
  return "critical";
}

export function formatCurrency(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatCurrencyFull(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function getAllStudents(): { student: Student; batchId: string; sportName: string; sportIcon: string; communityName: string; communityId: string }[] {
  const results: { student: Student; batchId: string; sportName: string; sportIcon: string; communityName: string; communityId: string }[] = [];
  for (const c of mockCommunities) {
    for (const s of c.sports) {
      for (const b of s.batches) {
        for (const st of b.students) {
          results.push({ student: st, batchId: b.id, sportName: s.name, sportIcon: s.icon, communityName: c.name, communityId: c.id });
        }
      }
    }
  }
  return results;
}

export function findStudentById(studentId: string): { student: Student; batch: Batch; sport: Sport; community: Community } | undefined {
  for (const c of mockCommunities) {
    for (const s of c.sports) {
      for (const b of s.batches) {
        const st = b.students.find(x => x.id === studentId);
        if (st) return { student: st, batch: b, sport: s, community: c };
      }
    }
  }
  return undefined;
}

// Global stats
export function getGlobalStats() {
  let communities = mockCommunities.length;
  let sports = 0;
  let students = 0;
  let revenue = 0;
  for (const c of mockCommunities) {
    sports += c.sports.length;
    for (const s of c.sports) {
      for (const b of s.batches) {
        students += b.students.length;
        revenue += b.students.filter(st => st.feeStatus === "paid").reduce((a, st) => a + st.fee, 0);
      }
    }
  }
  return { communities, sports, students, revenue };
}
