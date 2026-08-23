import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerOptions = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "TaskFlow API",
      version: "1.0.0",
      description:
        "TaskFlow is a secure, multi-tenant project management REST API with background BullMQ job queues, role-based access control, and PostgreSQL data persistence.",
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT Access Token. Example: `Bearer eyJhbGci...`",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
          description: "Access token automatically passed via HttpOnly cookie.",
        },
        organizationHeader: {
          type: "apiKey",
          in: "header",
          name: "x-organization-id",
          description: "Organization UUID context for scoping multi-tenant requests.",
        },
      },
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            statusCode: { type: "integer", example: 200 },
            success: { type: "boolean", example: true },
            data: { type: "object" },
            message: { type: "string", example: "Success" },
          },
        },
        ApiError: {
          type: "object",
          properties: {
            error: { type: "string", example: "Resource not found" },
            code: { type: "string", example: "NOT_FOUND" },
            details: { type: "object" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            firstName: { type: "string", example: "John" },
            lastName: { type: "string", example: "Doe" },
            username: { type: "string", example: "john.doe" },
            email: { type: "string", format: "email", example: "john.doe@taskflow.dev" },
            role: { type: "string", enum: ["ADMIN", "MEMBER", "USER"], example: "ADMIN" },
            isVerified: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Organization: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Acme Technologies" },
            slug: { type: "string", example: "acme-technologies" },
            userId: { type: "string", format: "uuid" },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Project: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            orgId: { type: "string", format: "uuid" },
            name: { type: "string", example: "TaskFlow Web Portal" },
            description: { type: "string", example: "Frontend web application" },
            createdBy: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Task: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            projectId: { type: "string", format: "uuid" },
            title: { type: "string", example: "Design Responsive Navbar" },
            description: { type: "string", example: "Create accessible header" },
            status: { type: "string", enum: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"], example: "TODO" },
            priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], example: "HIGH" },
            dueDate: { type: "string", format: "date-time" },
            createdBy: { type: "string", format: "uuid" },
            assignedTo: { type: "string", format: "uuid", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        JobStatus: {
          type: "object",
          properties: {
            id: { type: "string", example: "1" },
            name: { type: "string", example: "send-task-assigned" },
            status: { type: "string", enum: ["pending", "active", "completed", "failed"], example: "completed" },
            attemptsMade: { type: "integer", example: 1 },
            failedReason: { type: "string", nullable: true },
            data: { type: "object" },
          },
        },
      },
    },
    paths: {
      "/health": {
        get: {
          summary: "Health Check",
          tags: ["Health"],
          responses: {
            200: {
              description: "Server is running smoothly",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },
      "/auth/register": {
        post: {
          summary: "Register new user (Step 1: Stores pending registration in Redis with OTP)",
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["firstName", "lastName", "email", "password"],
                  properties: {
                    firstName: { type: "string", example: "John" },
                    lastName: { type: "string", example: "Doe" },
                    username: { type: "string", example: "john.doe" },
                    email: { type: "string", format: "email", example: "john.doe@taskflow.dev" },
                    password: { type: "string", format: "password", example: "Password123!" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Registration initiated, OTP sent to email" },
            400: { description: "Validation error" },
            409: { description: "Email or username already exists" },
          },
        },
      },
      "/auth/verify-otp": {
        post: {
          summary: "Verify OTP (Step 2: Saves user to PostgreSQL and issues JWT cookies)",
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "otp"],
                  properties: {
                    email: { type: "string", format: "email", example: "john.doe@taskflow.dev" },
                    otp: { type: "string", example: "123456" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Email verified and access tokens issued" },
            400: { description: "Invalid or expired OTP" },
          },
        },
      },
      "/auth/login": {
        post: {
          summary: "User Login",
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email", example: "john.doe@taskflow.dev" },
                    password: { type: "string", format: "password", example: "Password123!" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Login successful, cookies set" },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/auth/refresh": {
        post: {
          summary: "Refresh Access Token with rotation",
          tags: ["Authentication"],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    refreshToken: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Tokens refreshed successfully" },
            401: { description: "Invalid or revoked refresh token" },
          },
        },
      },
      "/auth/logout": {
        post: {
          summary: "User Logout (Revokes token in DB & clears cookies)",
          tags: ["Authentication"],
          responses: {
            200: { description: "Logged out successfully" },
          },
        },
      },
      "/organizations": {
        post: {
          summary: "Create new Organization",
          tags: ["Organizations"],
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string", example: "Acme Technologies" },
                    slug: { type: "string", example: "acme-technologies" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Organization created" },
            409: { description: "Slug already in use" },
          },
        },
      },
      "/organizations/my": {
        get: {
          summary: "List user organizations",
          tags: ["Organizations"],
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            200: { description: "List of user organizations" },
          },
        },
      },
      "/organizations/members": {
        get: {
          summary: "Get organization members",
          tags: ["Organizations"],
          security: [{ bearerAuth: [] }, { cookieAuth: [] }, { organizationHeader: [] }],
          responses: {
            200: { description: "List of members" },
            403: { description: "Forbidden" },
          },
        },
        post: {
          summary: "Add member to organization (ADMIN only)",
          tags: ["Organizations"],
          security: [{ bearerAuth: [] }, { cookieAuth: [] }, { organizationHeader: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: {
                    email: { type: "string", format: "email", example: "jane.smith@taskflow.dev" },
                    role: { type: "string", enum: ["ADMIN", "MEMBER"], example: "MEMBER" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Member added successfully" },
            403: { description: "Admin role required" },
            404: { description: "User not found" },
            409: { description: "User already a member" },
          },
        },
      },
      "/projects": {
        get: {
          summary: "List organization projects (Offset & Cursor Pagination + Search)",
          tags: ["Projects"],
          security: [{ bearerAuth: [] }, { cookieAuth: [] }, { organizationHeader: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
            { name: "cursor", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Paginated projects response" },
          },
        },
        post: {
          summary: "Create Project in organization",
          tags: ["Projects"],
          security: [{ bearerAuth: [] }, { cookieAuth: [] }, { organizationHeader: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string", example: "TaskFlow Web Portal" },
                    description: { type: "string", example: "Frontend web application" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Project created" },
          },
        },
      },
      "/projects/{id}": {
        get: {
          summary: "Get project by ID (Cross-tenant protected)",
          tags: ["Projects"],
          security: [{ bearerAuth: [] }, { cookieAuth: [] }, { organizationHeader: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            200: { description: "Project details" },
            403: { description: "Cross-tenant access forbidden" },
            404: { description: "Project not found" },
          },
        },
        patch: {
          summary: "Update project",
          tags: ["Projects"],
          security: [{ bearerAuth: [] }, { cookieAuth: [] }, { organizationHeader: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Project updated" },
          },
        },
        delete: {
          summary: "Soft delete project (ADMIN only)",
          tags: ["Projects"],
          security: [{ bearerAuth: [] }, { cookieAuth: [] }, { organizationHeader: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            200: { description: "Project deleted" },
            403: { description: "Admin role required" },
          },
        },
      },
      "/tasks": {
        get: {
          summary: "List tasks with filters & pagination",
          tags: ["Tasks"],
          security: [{ bearerAuth: [] }, { cookieAuth: [] }, { organizationHeader: [] }],
          parameters: [
            { name: "projectId", in: "query", schema: { type: "string", format: "uuid" } },
            { name: "status", in: "query", schema: { type: "string", enum: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] } },
            { name: "priority", in: "query", schema: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] } },
            { name: "assignee", in: "query", schema: { type: "string", format: "uuid" } },
            { name: "dueDateFrom", in: "query", schema: { type: "string", format: "date" } },
            { name: "dueDateTo", in: "query", schema: { type: "string", format: "date" } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
            { name: "cursor", in: "query", schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Paginated tasks list" },
          },
        },
        post: {
          summary: "Create Task in Project",
          tags: ["Tasks"],
          security: [{ bearerAuth: [] }, { cookieAuth: [] }, { organizationHeader: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["projectId", "title"],
                  properties: {
                    projectId: { type: "string", format: "uuid" },
                    title: { type: "string", example: "Design Responsive Navbar" },
                    description: { type: "string", example: "Create accessible header navigation" },
                    status: { type: "string", enum: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"], default: "TODO" },
                    priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], default: "MEDIUM" },
                    dueDate: { type: "string", format: "date-time" },
                    assignedTo: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Task created" },
            400: { description: "Validation error / Assignee not in org" },
            403: { description: "Cross-tenant project forbidden" },
          },
        },
      },
      "/tasks/{id}": {
        get: {
          summary: "Get single task",
          tags: ["Tasks"],
          security: [{ bearerAuth: [] }, { cookieAuth: [] }, { organizationHeader: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            200: { description: "Task details" },
            403: { description: "Cross-tenant task forbidden" },
            404: { description: "Task not found" },
          },
        },
        patch: {
          summary: "Update task",
          tags: ["Tasks"],
          security: [{ bearerAuth: [] }, { cookieAuth: [] }, { organizationHeader: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    status: { type: "string", enum: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] },
                    priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
                    dueDate: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Task updated" },
          },
        },
        delete: {
          summary: "Soft delete task",
          tags: ["Tasks"],
          security: [{ bearerAuth: [] }, { cookieAuth: [] }, { organizationHeader: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            200: { description: "Task deleted" },
          },
        },
      },
      "/tasks/{id}/assign": {
        post: {
          summary: "Assign user to task (Enqueues BullMQ email notification)",
          tags: ["Tasks"],
          security: [{ bearerAuth: [] }, { cookieAuth: [] }, { organizationHeader: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userId"],
                  properties: {
                    userId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Task assigned and notification enqueued" },
            400: { description: "User does not belong to organization" },
          },
        },
      },
      "/tasks/{id}/unassign": {
        post: {
          summary: "Unassign user from task",
          tags: ["Tasks"],
          security: [{ bearerAuth: [] }, { cookieAuth: [] }, { organizationHeader: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["userId"],
                  properties: {
                    userId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Task unassigned" },
          },
        },
      },
      "/dashboard/counts": {
        get: {
          summary: "Get project dashboard task counts grouped by status",
          tags: ["Dashboard"],
          security: [{ bearerAuth: [] }, { cookieAuth: [] }, { organizationHeader: [] }],
          parameters: [
            { name: "projectId", in: "query", schema: { type: "string", format: "uuid" } },
          ],
          responses: {
            200: {
              description: "Status counts object: TODO, IN_PROGRESS, REVIEW, DONE, total",
            },
          },
        },
      },
      "/jobs/{id}": {
        get: {
          summary: "Check background job queue status",
          tags: ["Jobs"],
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            200: {
              description: "Job status (pending, active, completed, failed)",
              content: { "application/json": { schema: { $ref: "#/components/schemas/JobStatus" } } },
            },
            404: { description: "Job not found" },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const setupSwaggerDocs = (app) => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "TaskFlow API Docs",
      customCss: ".swagger-ui .topbar { display: none }",
    })
  );

  app.get("/api-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};

export { setupSwaggerDocs, swaggerSpec };
