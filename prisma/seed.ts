import "dotenv/config";
import { PrismaClient, UserRole, StationStatus } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting seed...");

  // Clear existing data
  await prisma.shiftSignup.deleteMany();
  await prisma.shiftException.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.workStation.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleared existing data");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      hashedPassword: adminPassword,
      role: UserRole.ADMIN,
      skills: ["management", "supervision"],
      phone: "555-0100",
      isActive: true,
    },
  });
  console.log("Created admin user:", admin.email);

  // Create supervisor user
  const supervisorPassword = await bcrypt.hash("supervisor123", 10);
  const supervisor = await prisma.user.create({
    data: {
      name: "Supervisor User",
      email: "supervisor@example.com",
      hashedPassword: supervisorPassword,
      role: UserRole.SUPERVISOR,
      skills: ["management", "cnc", "welding"],
      phone: "555-0101",
      isActive: true,
    },
  });
  console.log("Created supervisor user:", supervisor.email);

  // Create worker users
  const workerPassword = await bcrypt.hash("worker123", 10);

  const workers = await Promise.all([
    prisma.user.create({
      data: {
        name: "John Smith",
        email: "worker@example.com",
        hashedPassword: workerPassword,
        role: UserRole.WORKER,
        skills: ["cnc", "machining"],
        phone: "555-0201",
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Sarah Johnson",
        email: "sarah@example.com",
        hashedPassword: workerPassword,
        role: UserRole.WORKER,
        skills: ["welding", "fabrication"],
        phone: "555-0202",
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Mike Davis",
        email: "mike@example.com",
        hashedPassword: workerPassword,
        role: UserRole.WORKER,
        skills: ["assembly", "quality-control"],
        phone: "555-0203",
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Lisa Wilson",
        email: "lisa@example.com",
        hashedPassword: workerPassword,
        role: UserRole.WORKER,
        skills: ["cnc", "welding", "machining"],
        phone: "555-0204",
        isActive: true,
      },
    }),
  ]);
  console.log("Created", workers.length, "worker users");

  // Create workstations
  const stations = await Promise.all([
    prisma.workStation.create({
      data: {
        name: "CNC Machine A",
        description: "Haas VF-2 CNC Vertical Mill",
        category: "Machining",
        capacity: 2,
        location: "Bay A, Row 1",
        status: StationStatus.ACTIVE,
        requiredSkills: ["cnc", "machining"],
      },
    }),
    prisma.workStation.create({
      data: {
        name: "CNC Machine B",
        description: "Haas VF-4 CNC Vertical Mill",
        category: "Machining",
        capacity: 2,
        location: "Bay A, Row 2",
        status: StationStatus.ACTIVE,
        requiredSkills: ["cnc", "machining"],
      },
    }),
    prisma.workStation.create({
      data: {
        name: "Welding Station 1",
        description: "MIG/TIG Welding Booth",
        category: "Welding",
        capacity: 1,
        location: "Bay B, Row 1",
        status: StationStatus.ACTIVE,
        requiredSkills: ["welding"],
      },
    }),
    prisma.workStation.create({
      data: {
        name: "Welding Station 2",
        description: "TIG Welding Booth",
        category: "Welding",
        capacity: 1,
        location: "Bay B, Row 2",
        status: StationStatus.ACTIVE,
        requiredSkills: ["welding"],
      },
    }),
    prisma.workStation.create({
      data: {
        name: "Assembly Line 1",
        description: "Product Assembly Station",
        category: "Assembly",
        capacity: 4,
        location: "Bay C, Row 1",
        status: StationStatus.ACTIVE,
        requiredSkills: ["assembly"],
      },
    }),
    prisma.workStation.create({
      data: {
        name: "Quality Control",
        description: "Inspection and Testing Area",
        category: "Quality",
        capacity: 2,
        location: "Bay D, Row 1",
        status: StationStatus.ACTIVE,
        requiredSkills: ["quality-control"],
      },
    }),
  ]);
  console.log("Created", stations.length, "workstations");

  // Create some one-time shifts for the current week
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);

  const shifts = await Promise.all([
    // Morning shifts
    prisma.shift.create({
      data: {
        title: "Morning CNC Operation",
        workStationId: stations[0].id,
        startTime: new Date(tomorrow.getTime() + 0 * 60 * 60 * 1000),
        endTime: new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000),
        capacity: 2,
        notes: "Regular CNC operation shift",
        isRecurring: false,
        createdById: admin.id,
      },
    }),
    prisma.shift.create({
      data: {
        title: "Welding Production",
        workStationId: stations[2].id,
        startTime: new Date(tomorrow.getTime() + 0 * 60 * 60 * 1000),
        endTime: new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000),
        capacity: 1,
        notes: "Frame welding production",
        isRecurring: false,
        createdById: admin.id,
      },
    }),
    // Afternoon shifts
    prisma.shift.create({
      data: {
        title: "Afternoon Assembly",
        workStationId: stations[4].id,
        startTime: new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000),
        endTime: new Date(tomorrow.getTime() + 16 * 60 * 60 * 1000),
        capacity: 4,
        notes: "Product assembly afternoon shift",
        isRecurring: false,
        createdById: admin.id,
      },
    }),
    // Night shift
    prisma.shift.create({
      data: {
        title: "Night QC Inspection",
        workStationId: stations[5].id,
        startTime: new Date(tomorrow.getTime() + 16 * 60 * 60 * 1000),
        endTime: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
        capacity: 2,
        notes: "Overnight quality control inspection",
        isRecurring: false,
        createdById: admin.id,
      },
    }),
  ]);
  console.log("Created", shifts.length, "one-time shifts");

  // Create a recurring shift
  const recurringShift = await prisma.shift.create({
    data: {
      title: "Daily CNC Maintenance",
      workStationId: stations[0].id,
      startTime: new Date(tomorrow.getTime() + 0 * 60 * 60 * 1000),
      endTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000),
      capacity: 1,
      notes: "Daily maintenance routine",
      isRecurring: true,
      recurrenceRule: "FREQ=DAILY;BYHOUR=6;BYMINUTE=0",
      recurrenceEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      createdById: admin.id,
    },
  });
  console.log("Created recurring shift:", recurringShift.title);

  // Create some signups
  const signups = await Promise.all([
    prisma.shiftSignup.create({
      data: {
        shiftId: shifts[0].id,
        userId: workers[0].id,
        status: "CONFIRMED",
      },
    }),
    prisma.shiftSignup.create({
      data: {
        shiftId: shifts[0].id,
        userId: workers[3].id,
        status: "CONFIRMED",
      },
    }),
    prisma.shiftSignup.create({
      data: {
        shiftId: shifts[1].id,
        userId: workers[1].id,
        status: "CONFIRMED",
      },
    }),
    prisma.shiftSignup.create({
      data: {
        shiftId: shifts[2].id,
        userId: workers[2].id,
        status: "CONFIRMED",
      },
    }),
  ]);
  console.log("Created", signups.length, "shift signups");

  console.log("\nSeed completed successfully!");
  console.log("\nDemo login credentials:");
  console.log("  Admin: admin@example.com / admin123");
  console.log("  Supervisor: supervisor@example.com / supervisor123");
  console.log("  Worker: worker@example.com / worker123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
