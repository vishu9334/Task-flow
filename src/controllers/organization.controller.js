import { organizationService } from "../services/organization.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";

class OrganizationController {
  constructor(service = organizationService) {
    this.service = service;

    this.createOrganization = asyncHandler(this.createOrganization.bind(this));
    this.getMyOrganizations = asyncHandler(this.getMyOrganizations.bind(this));
    this.addMember = asyncHandler(this.addMember.bind(this));
    this.getMembers = asyncHandler(this.getMembers.bind(this));
  }

  async createOrganization(req, res) {
    const { name, slug } = req.body;
    const organization = await this.service.createOrganization({
      userId: req.user.sub,
      name,
      slug,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, organization, "Organization created successfully"));
  }

  async getMyOrganizations(req, res) {
    const organizations = await this.service.getMyOrganizations({
      userId: req.user.sub,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, organizations, "Organizations retrieved successfully"));
  }

  async addMember(req, res) {
    const { email, role } = req.body;
    const member = await this.service.addMember({
      orgId: req.organizationId,
      requesterUserId: req.user.sub,
      requesterRole: req.membership?.role || req.user?.role,
      email,
      role,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, member, "Member added successfully"));
  }

  async getMembers(req, res) {
    const members = await this.service.getMembers({
      orgId: req.organizationId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, members, "Members retrieved successfully"));
  }
}

const organizationController = new OrganizationController();

export { OrganizationController, organizationController };
