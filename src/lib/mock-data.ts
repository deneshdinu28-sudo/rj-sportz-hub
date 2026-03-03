import type { Community, Sport, Student, Payment } from "@/types/database";

const communityNames = [
  { name: "Waterford", code: "WTF", address: "HSR Layout, Bangalore", contact: "Mr. Sharma", phone: "9876543210" },
  { name: "Green Valley", code: "GVY", address: "Whitefield, Bangalore", contact: "Mrs. Patel", phone: "9887654321" },
  { name: "Blue Ridge", code: "BRG", address: "Electronic City, Bangalore", contact: "Mr. Kumar", phone: "9776543210" },
  { name: "Sunshine Apartments", code: "SSA", address: "Koramangala, Bangalore", contact: "Mr. Reddy", phone: "9665432109" },
  { name: "Palm Meadows", code: "PLM", address: "Sarjapur Road, Bangalore", contact: "Mrs. Singh", phone: "9554321098" },
  { name: "Prestige Lakeside", code: "PLS", address: "Varthur, Bangalore", contact: "Mr. Jain", phone: "9443210987" },
  { name: "Brigade Gateway", code: "BGW", address: "Rajajinagar, Bangalore", contact: "Mrs. Gupta", phone: "9332109876" },
  { name: "Sobha Dream Acres", code: "SDA", address: "Panathur, Bangalore", contact: "Mr. Rao", phone: "9221098765" },
];

const sportTypes = [
  { name: "Badminton", icon: "🏸" },
  { name: "Yoga", icon: "🧘" },
  { name: "Karate", icon: "🥋" },
  { name: "Swimming", icon: "🏊" },
  { name: "Cricket", icon: "🏏" },
  { name: "Football", icon: "⚽" },
  { name: "Table Tennis", icon: "🏓" },
  { name: "Basketball", icon: "🏀" },
];

const coachNames = [
  { name: "Ramesh Kumar", phone: "9876501234" },
  { name: "Priya Nair", phone: "9887612345" },
  { name: "Suresh Yadav", phone: "9776523456" },
  { name: "Kavita Sharma", phone: "9665434567" },
  { name: "Deepak Singh", phone: "9554345678" },
  { name: "Anita Desai", phone: "9443256789" },
  { name: "Vijay Reddy", phone: "9332167890" },
  { name: "Meena Patel", phone: "9221078901" },
];

const timeSlots = ["4-5 PM", "5-6 PM", "6-7 PM", "7-8 PM"];
const firstNames = ["Rahul", "Priya", "Amit", "Neha", "Rohan", "Kavya", "Arjun", "Sneha", "Vikram", "Ananya", "Karthik", "Divya", "Aditya", "Pooja", "Siddharth"];
const lastNames = ["Kumar", "Shah", "Singh", "Patel", "Gupta", "Reddy", "Nair", "Yadav", "Jain", "Rao"];
const parentFirstNames = ["Suresh", "Ramesh", "Rajesh", "Sunita", "Neha", "Priya", "Vijay", "Anand", "Deepa", "Rekha"];
const paymentModes = ["PhonePe", "GPay", "UPI", "Cash", "Bank Transfer"];

let studentCounter = 0;

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

export function generateMockData() {
  const communities: Community[] = [];
  const sports: Sport[] = [];
  const students: Student[] = [];
  const payments: Payment[] = [];

  communityNames.forEach((cn, ci) => {
    const community: Community = {
      id: `com-${ci + 1}`,
      name: cn.name,
      short_code: cn.code,
      address: cn.address,
      contact_person: cn.contact,
      contact_phone: cn.phone,
      pricing: {
        standard: { "1m": 3500, "3m": 10000, "6m": 19000 },
        premium: { "1m": 5000, "3m": 14000, "6m": 27000 },
      },
      status: ci < 7 ? "active" : "inactive",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    communities.push(community);

    const numSports = randInt(3, 5);
    const selectedSports = [...sportTypes].sort(() => Math.random() - 0.5).slice(0, numSports);

    selectedSports.forEach((st, si) => {
      const coach = coachNames[(ci + si) % coachNames.length];
      const slots = timeSlots.slice(0, randInt(2, 3));
      const sport: Sport = {
        id: `spt-${ci + 1}-${si + 1}`,
        name: st.name,
        icon: st.icon,
        community_id: community.id,
        coach_name: coach.name,
        coach_phone: coach.phone,
        time_slots: slots,
        active_days: ["Mon", "Wed", "Fri"],
        standard_fee: 3500,
        premium_fee: 5000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      sports.push(sport);

      const numStudents = randInt(8, 18);
      for (let k = 0; k < numStudents; k++) {
        studentCounter++;
        const batchType = Math.random() > 0.4 ? "standard" : "premium" as const;
        const plan = rand(["1m", "3m", "6m"] as const);
        const feeAmount = batchType === "standard"
          ? community.pricing.standard[plan]
          : community.pricing.premium[plan];
        const statusRoll = Math.random();
        const feeStatus = statusRoll > 0.25 ? "paid" : statusRoll > 0.1 ? "pending" : "overdue" as const;
        const firstName = rand(firstNames);
        const lastName = rand(lastNames);
        const parentFirst = rand(parentFirstNames);
        const ageGroup = Math.random() > 0.4 ? "kids" : "adults" as const;
        const age = ageGroup === "kids" ? randInt(6, 15) : randInt(20, 45);
        const joiningDate = new Date(2025, randInt(0, 11), randInt(1, 28));
        const dueDate = new Date(joiningDate);
        dueDate.setMonth(dueDate.getMonth() + (plan === "1m" ? 1 : plan === "3m" ? 3 : 6));

        const student: Student = {
          id: `stu-${studentCounter}`,
          student_id: `${cn.code}${String(studentCounter).padStart(3, "0")}`,
          name: `${firstName} ${lastName}`,
          age,
          parent_name: `${parentFirst} ${lastName}`,
          parent_whatsapp: `9${randInt(100000000, 999999999)}`,
          parent_phone: `9${randInt(100000000, 999999999)}`,
          community_id: community.id,
          sport_id: sport.id,
          batch_time: rand(slots),
          age_group: ageGroup,
          batch_type: batchType,
          payment_plan: plan,
          fee_amount: feeAmount,
          fee_status: feeStatus,
          payment_start_date: joiningDate.toISOString().slice(0, 10),
          payment_end_date: dueDate.toISOString().slice(0, 10),
          next_due_date: feeStatus !== "paid" ? dueDate.toISOString().slice(0, 10) : null,
          joining_date: joiningDate.toISOString().slice(0, 10),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        students.push(student);

        if (feeStatus === "paid") {
          payments.push({
            id: `pay-${studentCounter}`,
            student_id: student.id,
            amount: feeAmount,
            payment_date: joiningDate.toISOString().slice(0, 10),
            payment_mode: rand(paymentModes),
            transaction_id: `T${Date.now()}${randInt(1000, 9999)}`,
            plan_period: plan,
            period_start: joiningDate.toISOString().slice(0, 10),
            period_end: dueDate.toISOString().slice(0, 10),
            verification_method: Math.random() > 0.3 ? "manual" : "auto",
            created_at: new Date().toISOString(),
          });
        }
      }
    });
  });

  return { communities, sports, students, payments };
}

const data = generateMockData();
export const mockCommunities = data.communities;
export const mockSports = data.sports;
export const mockStudents = data.students;
export const mockPayments = data.payments;

export function formatCurrency(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatCurrencyFull(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
