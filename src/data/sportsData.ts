export interface Student {
  id: string;
  name: string;
  parentName: string;
  phone: string;
  feeStatus: "paid" | "pending" | "overdue";
  fee: number;
}

export interface Batch {
  id: string;
  startTime: string;
  endTime: string;
  ageGroup: "kids" | "adults";
  batchType: "standard" | "premium";
  maxStudents?: number;
  students: Student[];
}

export interface Sport {
  id: string;
  name: string;
  icon: string;
  community: string;
  communityId: string;
  coach: string;
  coachId: string;
  standardFee: number;
  premiumFee: number;
  batches: Batch[];
}

const makeSt = (id: string, name: string, parent: string, phone: string, status: Student["feeStatus"], fee: number): Student => ({
  id, name, parentName: parent, phone, feeStatus: status, fee,
});

export const mockSports: Sport[] = [
  {
    id: "sp-1",
    name: "Badminton",
    icon: "🏸",
    community: "Sunshine Apartments",
    communityId: "c-1",
    coach: "Rajesh Kumar",
    coachId: "co-1",
    standardFee: 1500,
    premiumFee: 2500,
    batches: [
      {
        id: "b-1", startTime: "5:00 PM", endTime: "6:00 PM", ageGroup: "kids", batchType: "premium", maxStudents: 15,
        students: [
          makeSt("s-1", "Rahul Sharma", "Suresh Sharma", "9876543210", "paid", 2500),
          makeSt("s-2", "Priya Gupta", "Ramesh Gupta", "9988776655", "pending", 2500),
          makeSt("s-3", "Amit Patel", "Neha Patel", "8877665544", "paid", 2500),
          makeSt("s-4", "Sneha Reddy", "Vikram Reddy", "7766554433", "paid", 2500),
          makeSt("s-5", "Arjun Singh", "Harpreet Singh", "6655443322", "overdue", 2500),
          makeSt("s-6", "Kavya Nair", "Deepak Nair", "9123456780", "paid", 2500),
          makeSt("s-7", "Rohan Das", "Sumit Das", "9234567891", "paid", 2500),
          makeSt("s-8", "Ananya Iyer", "Mohan Iyer", "9345678902", "pending", 2500),
          makeSt("s-9", "Vivek Joshi", "Anil Joshi", "9456789013", "paid", 2500),
          makeSt("s-10", "Meera Kapoor", "Ravi Kapoor", "9567890124", "paid", 2500),
          makeSt("s-11", "Karan Mehta", "Sunil Mehta", "9678901235", "paid", 2500),
          makeSt("s-12", "Divya Rao", "Prasad Rao", "9789012346", "paid", 2500),
        ],
      },
      {
        id: "b-2", startTime: "6:00 PM", endTime: "7:00 PM", ageGroup: "adults", batchType: "standard", maxStudents: 20,
        students: [
          makeSt("s-13", "Arun Kumar", "Self", "9890123457", "paid", 1500),
          makeSt("s-14", "Neeta Shah", "Self", "9901234568", "pending", 1500),
          makeSt("s-15", "Sanjay Verma", "Self", "8012345679", "paid", 1500),
          makeSt("s-16", "Pooja Desai", "Self", "8123456780", "paid", 1500),
          makeSt("s-17", "Ravi Menon", "Self", "8234567891", "overdue", 1500),
          makeSt("s-18", "Tanya Roy", "Self", "8345678902", "paid", 1500),
          makeSt("s-19", "Vinay Pillai", "Self", "8456789013", "paid", 1500),
          makeSt("s-20", "Sunita Bhat", "Self", "8567890124", "pending", 1500),
        ],
      },
      {
        id: "b-3", startTime: "4:00 PM", endTime: "5:00 PM", ageGroup: "kids", batchType: "standard",
        students: [
          makeSt("s-21", "Ishaan Malhotra", "Ajay Malhotra", "8678901235", "paid", 1500),
          makeSt("s-22", "Riya Saxena", "Pradeep Saxena", "8789012346", "paid", 1500),
          makeSt("s-23", "Harsh Agarwal", "Nitin Agarwal", "8890123457", "pending", 1500),
          makeSt("s-24", "Sakshi Tiwari", "Manoj Tiwari", "8901234568", "paid", 1500),
          makeSt("s-25", "Dev Chauhan", "Rakesh Chauhan", "9012345679", "paid", 1500),
        ],
      },
    ],
  },
  {
    id: "sp-2",
    name: "Swimming",
    icon: "🏊",
    community: "Green Valley Society",
    communityId: "c-2",
    coach: "Sunita Rao",
    coachId: "co-2",
    standardFee: 2000,
    premiumFee: 3500,
    batches: [
      {
        id: "b-4", startTime: "6:00 AM", endTime: "7:00 AM", ageGroup: "adults", batchType: "premium",
        students: [
          makeSt("s-26", "Manoj Thakur", "Self", "7012345670", "paid", 3500),
          makeSt("s-27", "Lakshmi Nair", "Self", "7123456781", "paid", 3500),
          makeSt("s-28", "Rajiv Mishra", "Self", "7234567892", "pending", 3500),
          makeSt("s-29", "Deepa Kulkarni", "Self", "7345678903", "paid", 3500),
          makeSt("s-30", "Ashok Pandey", "Self", "7456789014", "paid", 3500),
          makeSt("s-31", "Geeta Bhatt", "Self", "7567890125", "overdue", 3500),
        ],
      },
      {
        id: "b-5", startTime: "7:00 AM", endTime: "8:00 AM", ageGroup: "kids", batchType: "standard",
        students: [
          makeSt("s-32", "Tanvi Shetty", "Arun Shetty", "7678901236", "paid", 2000),
          makeSt("s-33", "Nikhil Chopra", "Suresh Chopra", "7789012347", "paid", 2000),
          makeSt("s-34", "Aditi Deshpande", "Vijay Deshpande", "7890123458", "paid", 2000),
          makeSt("s-35", "Yash Bajaj", "Mohit Bajaj", "7901234569", "pending", 2000),
        ],
      },
    ],
  },
  {
    id: "sp-3",
    name: "Cricket",
    icon: "🏏",
    community: "Sunshine Apartments",
    communityId: "c-1",
    coach: "Vikas Patil",
    coachId: "co-3",
    standardFee: 1200,
    premiumFee: 2000,
    batches: [
      {
        id: "b-6", startTime: "5:00 PM", endTime: "6:30 PM", ageGroup: "kids", batchType: "standard",
        students: [
          makeSt("s-36", "Aarav Jain", "Pankaj Jain", "6012345670", "paid", 1200),
          makeSt("s-37", "Siddharth Bansal", "Rajesh Bansal", "6123456781", "paid", 1200),
          makeSt("s-38", "Diya Choudhary", "Naveen Choudhary", "6234567892", "overdue", 1200),
          makeSt("s-39", "Aryan Malik", "Sudhir Malik", "6345678903", "paid", 1200),
          makeSt("s-40", "Nisha Goyal", "Arun Goyal", "6456789014", "pending", 1200),
          makeSt("s-41", "Om Shukla", "Dinesh Shukla", "6567890125", "paid", 1200),
          makeSt("s-42", "Tara Sethi", "Raman Sethi", "6678901236", "paid", 1200),
        ],
      },
    ],
  },
  {
    id: "sp-4",
    name: "Tennis",
    icon: "🎾",
    community: "Lake View Residency",
    communityId: "c-3",
    coach: "Rajesh Kumar",
    coachId: "co-1",
    standardFee: 1800,
    premiumFee: 3000,
    batches: [
      {
        id: "b-7", startTime: "6:00 AM", endTime: "7:00 AM", ageGroup: "adults", batchType: "standard",
        students: [
          makeSt("s-43", "Gaurav Sinha", "Self", "5012345670", "paid", 1800),
          makeSt("s-44", "Prerna Rawat", "Self", "5123456781", "paid", 1800),
          makeSt("s-45", "Kunal Gupta", "Self", "5234567892", "pending", 1800),
        ],
      },
      {
        id: "b-8", startTime: "4:00 PM", endTime: "5:00 PM", ageGroup: "kids", batchType: "premium",
        students: [
          makeSt("s-46", "Lavanya Iyer", "Karthik Iyer", "5345678903", "paid", 3000),
          makeSt("s-47", "Manav Dubey", "Ashish Dubey", "5456789014", "paid", 3000),
          makeSt("s-48", "Saanvi Kohli", "Piyush Kohli", "5567890125", "paid", 3000),
          makeSt("s-49", "Reyansh Mishra", "Tarun Mishra", "5678901236", "overdue", 3000),
          makeSt("s-50", "Anika Bose", "Debashis Bose", "5789012347", "paid", 3000),
        ],
      },
    ],
  },
];

export function getSportById(id: string): Sport | undefined {
  return mockSports.find((s) => s.id === id);
}

export function getTotalStudents(sport: Sport): number {
  return sport.batches.reduce((sum, b) => sum + b.students.length, 0);
}

export function getTotalRevenue(sport: Sport): number {
  return sport.batches.reduce(
    (sum, b) => sum + b.students.filter((s) => s.feeStatus === "paid").reduce((a, s) => a + s.fee, 0),
    0
  );
}

export function getBatchRevenue(batch: Batch): number {
  return batch.students.filter((s) => s.feeStatus === "paid").reduce((a, s) => a + s.fee, 0);
}

export function getBatchPaidCount(batch: Batch): number {
  return batch.students.filter((s) => s.feeStatus === "paid").length;
}

export function getBatchPendingCount(batch: Batch): number {
  return batch.students.filter((s) => s.feeStatus !== "paid").length;
}
