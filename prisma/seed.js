import { prisma } from "../src/data/prisma.js";
import bcrypt from "bcryptjs";


async function main() {
  console.log("[SEED] Starting TaskFlow database seeding...");

  // Clean existing data
  await prisma.comment.deleteMany({});
  await prisma.taskAssignment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.organizationMember.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("[SEED] Existing database records cleared.");

  // Common password hash for test users: "Password123!"
  const passwordHash = await bcrypt.hash("Password123!", 12);

  // 1. Create 5 Users
  const user1 = await prisma.user.create({
    data: {
      firstName: "John",
      lastName: "Doe",
      username: "john.doe",
      email: "john.doe@taskflow.dev",
      passwordHash,
      role: "ADMIN",
      isVerified: true,
      isActive: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      firstName: "Jane",
      lastName: "Smith",
      username: "jane.smith",
      email: "jane.smith@taskflow.dev",
      passwordHash,
      role: "MEMBER",
      isVerified: true,
      isActive: true,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      firstName: "Tony",
      lastName: "Stark",
      username: "tony.stark",
      email: "tony.stark@stark.dev",
      passwordHash,
      role: "ADMIN",
      isVerified: true,
      isActive: true,
    },
  });

  const user4 = await prisma.user.create({
    data: {
      firstName: "Peter",
      lastName: "Parker",
      username: "peter.parker",
      email: "peter.parker@stark.dev",
      passwordHash,
      role: "MEMBER",
      isVerified: true,
      isActive: true,
    },
  });

  const user5 = await prisma.user.create({
    data: {
      firstName: "Bruce",
      lastName: "Wayne",
      username: "bruce.wayne",
      email: "bruce.wayne@taskflow.dev",
      passwordHash,
      role: "MEMBER",
      isVerified: true,
      isActive: true,
    },
  });

  console.log("[SEED] 5 Users created.");

  // 2. Create 2 Organizations
  const org1 = await prisma.organization.create({
    data: {
      name: "Acme Technologies",
      slug: "acme-technologies",
      userId: user1.id,
      members: {
        create: [
          { userId: user1.id, role: "ADMIN" },
          { userId: user2.id, role: "MEMBER" },
          { userId: user5.id, role: "MEMBER" },
        ],
      },
    },
  });

  const org2 = await prisma.organization.create({
    data: {
      name: "Stark Enterprises",
      slug: "stark-enterprises",
      userId: user3.id,
      members: {
        create: [
          { userId: user3.id, role: "ADMIN" },
          { userId: user4.id, role: "MEMBER" },
        ],
      },
    },
  });

  console.log("[SEED] 2 Organizations created with member relations.");

  // 3. Create Multiple Projects
  const proj1 = await prisma.project.create({
    data: {
      name: "TaskFlow Web Portal",
      description: "Frontend web application and management dashboard",
      orgId: org1.id,
      createdBy: user1.id,
    },
  });

  const proj2 = await prisma.project.create({
    data: {
      name: "Cloud Infrastructure Migration",
      description: "Migrate legacy services to scalable Kubernetes clusters",
      orgId: org1.id,
      createdBy: user1.id,
    },
  });

  const proj3 = await prisma.project.create({
    data: {
      name: "Jarvis AI Core",
      description: "Next-gen intelligent neural processing pipeline",
      orgId: org2.id,
      createdBy: user3.id,
    },
  });

  const proj4 = await prisma.project.create({
    data: {
      name: "Suit Diagnostic System",
      description: "Real-time telemetry and armor integrity analytics",
      orgId: org2.id,
      createdBy: user3.id,
    },
  });

  console.log("[SEED] 4 Projects created across organizations.");

  // 4. Create 12 Tasks with different statuses, priorities, due dates & assignees
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const tasksData = [
    // Project 1 Tasks (Acme)
    {
      projectId: proj1.id,
      title: "Design Responsive Navbar & Dashboard Layout",
      description: "Create accessible header, sidebar navigation, and user profile drawer",
      status: "COMPLETED",
      priority: "HIGH",
      dueDate: nextWeek,
      createdBy: user1.id,
      assignedTo: user2.id,
    },
    {
      projectId: proj1.id,
      title: "Implement JWT Cookie Authentication",
      description: "Connect frontend login form with backend HttpOnly cookie auth",
      status: "IN_PROGRESS",
      priority: "URGENT",
      dueDate: nextWeek,
      createdBy: user1.id,
      assignedTo: user2.id,
    },
    {
      projectId: proj1.id,
      title: "Setup Dark Mode Theme Toggle",
      description: "Add system preference detection and localStorage persistence",
      status: "TODO",
      priority: "LOW",
      dueDate: nextMonth,
      createdBy: user1.id,
      assignedTo: user5.id,
    },
    {
      projectId: proj1.id,
      title: "Write End-to-End Cypress Tests",
      description: "Cover project creation and task assignment flows",
      status: "REVIEW",
      priority: "MEDIUM",
      dueDate: nextMonth,
      createdBy: user1.id,
      assignedTo: user5.id,
    },

    // Project 2 Tasks (Acme)
    {
      projectId: proj2.id,
      title: "Provision Production PostgreSQL RDS Cluster",
      description: "Setup Multi-AZ replication and automated daily snapshots",
      status: "DONE",
      priority: "URGENT",
      dueDate: nextWeek,
      createdBy: user1.id,
      assignedTo: user1.id,
    },
    {
      projectId: proj2.id,
      title: "Configure Redis Cluster & Sentinel",
      description: "Setup highly available Redis for BullMQ background queues",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: nextWeek,
      createdBy: user1.id,
      assignedTo: user5.id,
    },
    {
      projectId: proj2.id,
      title: "Setup Prometheus & Grafana Monitoring",
      description: "Create dashboards for request latency, error rates, and queue health",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: nextMonth,
      createdBy: user1.id,
      assignedTo: null,
    },

    // Project 3 Tasks (Stark Enterprises)
    {
      projectId: proj3.id,
      title: "Optimize Natural Language Query Pipeline",
      description: "Reduce speech-to-intent latency under 50 milliseconds",
      status: "IN_PROGRESS",
      priority: "URGENT",
      dueDate: nextWeek,
      createdBy: user3.id,
      assignedTo: user4.id,
    },
    {
      projectId: proj3.id,
      title: "Implement Quantum Encryption Protocol",
      description: "End-to-end encryption for Jarvis communication channels",
      status: "TODO",
      priority: "HIGH",
      dueDate: nextMonth,
      createdBy: user3.id,
      assignedTo: user3.id,
    },
    {
      projectId: proj3.id,
      title: "Train Object Recognition Neural Network",
      description: "Fine-tune vision models on aerial drone reconnaissance feeds",
      status: "DONE",
      priority: "HIGH",
      dueDate: nextWeek,
      createdBy: user3.id,
      assignedTo: user4.id,
    },

    // Project 4 Tasks (Stark Enterprises)
    {
      projectId: proj4.id,
      title: "Arc Reactor Power Level Telemetry Sensor",
      description: "Calibrate thermal dissipation sensors and output wattage monitors",
      status: "COMPLETED",
      priority: "URGENT",
      dueDate: nextWeek,
      createdBy: user3.id,
      assignedTo: user3.id,
    },
    {
      projectId: proj4.id,
      title: "HUD Heads-Up Display Widget Updates",
      description: "Render ammunition, altitude, and velocity in real-time AR HUD",
      status: "REVIEW",
      priority: "MEDIUM",
      dueDate: nextMonth,
      createdBy: user3.id,
      assignedTo: user4.id,
    },
  ];

  for (const taskData of tasksData) {
    const task = await prisma.task.create({
      data: taskData,
    });

    if (taskData.assignedTo) {
      await prisma.taskAssignment.create({
        data: {
          taskId: task.id,
          userId: taskData.assignedTo,
        },
      });
    }

    // Add sample comment to task
    await prisma.comment.create({
      data: {
        taskId: task.id,
        userId: taskData.createdBy,
        content: `Initial requirements defined for task: "${task.title}".`,
      },
    });
  }

  console.log("[SEED] 12 Tasks with assignments and comments seeded successfully.");
  console.log("[SEED] Seeding complete! All test accounts ready (Password: 'Password123!').");
}

main()
  .catch((e) => {
    console.error("[SEED ERROR] Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
