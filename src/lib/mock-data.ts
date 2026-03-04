import type { Community, Sport, Student, Payment, GlobalSport, SportPricing, TimeSlot } from "@/types/database";

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

const sportTypes: { name: string; icon: string }[] = [
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
  const sportPricingList: SportPricing[] = [];
  const timeSlotsList: TimeSlot[] = [];

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
      total_students: 0,
      total_sports: 0,
      total_revenue: 0,
      is_active: ci < 7,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    communities.push(community);

    const numSports = randInt(3, 5);
    const selectedSports = [...sportTypes].sort(() => Math.random() - 0.5).slice(0, numSports);
    community.total_sports = numSports;

    selectedSports.forEach((st, si) => {
      const coach = coachNames[(ci + si) % coachNames.length];
      const sport: Sport = {
        id: `spt-${ci + 1}-${si + 1}`,
        name: st.name,
        icon: st.icon,
        community_id: community.id,
        coach_name: coach.name,
        coach_phone: coach.phone,
        time_slots: [],
        active_days: ["Mon", "Wed", "Fri"],
        standard_fee: 3500,
        premium_fee: 5000,
        is_custom: false,
        total_students: 0,
        revenue_collected: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      sports.push(sport);

      // Create sport pricing
      const stdBase = randInt(25, 40) * 100;
      const prmBase = randInt(40, 60) * 100;
      sportPricingList.push({
        id: `sp-${ci + 1}-${si + 1}`,
        community_id: community.id,
        sport_id: sport.id,
        standard_1month: stdBase,
        standard_3months: Math.round(stdBase * 2.8),
        standard_6months: Math.round(stdBase * 5.2),
        premium_1month: prmBase,
        premium_3months: Math.round(prmBase * 2.7),
        premium_6months: Math.round(prmBase * 5),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Create time slots for this sport
      const slotTimes = [
        { start: "16:00", end: "17:00", label: "4-5 PM" },
        { start: "17:00", end: "18:00", label: "5-6 PM" },
        { start: "18:00", end: "19:00", label: "6-7 PM" },
        { start: "19:00", end: "20:00", label: "7-8 PM" },
      ];
      const numSlots = randInt(2, 3);
      const selectedSlots = slotTimes.slice(0, numSlots);

      selectedSlots.forEach((slot, slotIdx) => {
        const ageGroup = slotIdx % 2 === 0 ? "kids" : "adults";
        const batchType = slotIdx === 0 ? "standard" : "premium";
        const ts: TimeSlot = {
          id: `ts-${ci + 1}-${si + 1}-${slotIdx + 1}`,
          community_id: community.id,
          sport_id: sport.id,
          start_time: slot.start,
          end_time: slot.end,
          age_group: ageGroup as "kids" | "adults",
          batch_type: batchType as "standard" | "premium",
          max_students: 30,
          current_students: 0,
          active_days: ["Monday", "Wednesday", "Friday"],
          is_active: true,
          created_at: new Date().toISOString(),
        };
        timeSlotsList.push(ts);
        sport.time_slots.push(`${slot.label}`);
      });

      const numStudents = randInt(8, 18);
      sport.total_students = numStudents;
      community.total_students += numStudents;

      for (let k = 0; k < numStudents; k++) {
        studentCounter++;
        const batchType = Math.random() > 0.4 ? "standard" : "premium" as const;
        const plan = rand(["1m", "3m", "6m"] as const);
        const pricing = sportPricingList.find(sp => sp.sport_id === sport.id && sp.community_id === community.id);
        const feeAmount = pricing
          ? pricing[`${batchType}_${plan === "1m" ? "1month" : plan === "3m" ? "3months" : "6months"}` as keyof SportPricing] as number
          : 3500;
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
        const slotForStudent = timeSlotsList.find(ts => ts.sport_id === sport.id && ts.community_id === community.id);

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
          time_slot_id: slotForStudent?.id ?? null,
          batch_time: sport.time_slots[0] ?? "4-5 PM",
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
          is_on_hold: false,
          hold_reason: null,
          created_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        students.push(student);

        if (slotForStudent) slotForStudent.current_students++;

        if (feeStatus === "paid") {
          const payAmount = feeAmount;
          community.total_revenue += payAmount;
          sport.revenue_collected += payAmount;
          payments.push({
            id: `pay-${studentCounter}`,
            student_id: student.id,
            receipt_number: `REC-2026-${String(studentCounter).padStart(4, "0")}`,
            student_code: student.student_id,
            amount: payAmount,
            payment_date: joiningDate.toISOString().slice(0, 10),
            payment_mode: rand(paymentModes),
            transaction_id: `T${Date.now()}${randInt(1000, 9999)}`,
            plan_period: plan,
            period_start: joiningDate.toISOString().slice(0, 10),
            period_end: dueDate.toISOString().slice(0, 10),
            screenshot_url: null,
            verification_method: Math.random() > 0.3 ? "manual" : "auto",
            verified_at: null,
            created_at: new Date().toISOString(),
          });
        }
      }
    });
  });

  return { communities, sports, students, payments, sportPricingList, timeSlotsList };
}

const data = generateMockData();
export const mockCommunities = data.communities;
export const mockSports = data.sports;
export const mockStudents = data.students;
export const mockPayments = data.payments;
export const mockSportPricing = data.sportPricingList;
export const mockTimeSlots = data.timeSlotsList;

export const mockGlobalSports: GlobalSport[] = [
  { id: "gs-1", name: "Badminton", icon: "🏸", is_default: true, created_by: null, created_at: new Date().toISOString() },
  { id: "gs-2", name: "Yoga", icon: "🧘", is_default: true, created_by: null, created_at: new Date().toISOString() },
  { id: "gs-3", name: "Karate", icon: "🥋", is_default: true, created_by: null, created_at: new Date().toISOString() },
  { id: "gs-4", name: "Swimming", icon: "🏊", is_default: true, created_by: null, created_at: new Date().toISOString() },
  { id: "gs-5", name: "Table Tennis", icon: "🏓", is_default: true, created_by: null, created_at: new Date().toISOString() },
  { id: "gs-6", name: "Basketball", icon: "🏀", is_default: true, created_by: null, created_at: new Date().toISOString() },
  { id: "gs-7", name: "Skating", icon: "⛸️", is_default: true, created_by: null, created_at: new Date().toISOString() },
  { id: "gs-8", name: "Football", icon: "⚽", is_default: true, created_by: null, created_at: new Date().toISOString() },
  { id: "gs-9", name: "Tennis", icon: "🎾", is_default: true, created_by: null, created_at: new Date().toISOString() },
  { id: "gs-10", name: "Volleyball", icon: "🏐", is_default: true, created_by: null, created_at: new Date().toISOString() },
  { id: "gs-11", name: "Cricket", icon: "🏏", is_default: true, created_by: null, created_at: new Date().toISOString() },
  { id: "gs-12", name: "Dance", icon: "💃", is_default: true, created_by: null, created_at: new Date().toISOString() },
];

export function formatCurrency(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatCurrencyFull(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatTime(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}
