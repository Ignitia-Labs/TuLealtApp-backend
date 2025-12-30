import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  IPartnerStaffAssignmentRepository,
  IPartnerRepository,
  IUserRepository,
  PartnerStaffAssignment,
} from '@libs/domain';
import { CreatePartnerStaffAssignmentRequest } from './create-partner-staff-assignment.request';
import { CreatePartnerStaffAssignmentResponse } from './create-partner-staff-assignment.response';
import { PartnerStaffAssignmentService } from '../partner-staff-assignment.service';

/**
 * Handler para el caso de uso de crear una asignación staff-partner
 */
@Injectable()
export class CreatePartnerStaffAssignmentHandler {
  constructor(
    @Inject('IPartnerStaffAssignmentRepository')
    private readonly assignmentRepository: IPartnerStaffAssignmentRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly assignmentService: PartnerStaffAssignmentService,
  ) {}

  async execute(
    request: CreatePartnerStaffAssignmentRequest,
  ): Promise<CreatePartnerStaffAssignmentResponse> {
    // Validar que el partner existe
    const partner = await this.partnerRepository.findById(request.partnerId);
    if (!partner) {
      throw new NotFoundException(
        `Partner with ID ${request.partnerId} not found`,
      );
    }

    // Validar que el partner está activo
    if (!partner.isActive()) {
      throw new BadRequestException(
        `Partner with ID ${request.partnerId} is not active`,
      );
    }

    // Validar que el usuario existe
    const user = await this.userRepository.findById(request.staffUserId);
    if (!user) {
      throw new NotFoundException(
        `User with ID ${request.staffUserId} not found`,
      );
    }

    // Validar que el usuario tiene rol STAFF o ADMIN
    const hasAdminOrStaffRole =
      user.hasRole('ADMIN') || user.hasRole('STAFF');

    if (!hasAdminOrStaffRole) {
      throw new BadRequestException(
        `User with ID ${request.staffUserId} must have ADMIN or STAFF role`,
      );
    }

    // Validar que el usuario está activo
    if (!user.isActiveUser()) {
      throw new BadRequestException(
        `User with ID ${request.staffUserId} is not active`,
      );
    }

    // Validar que la suma de porcentajes no exceda 100%
    await this.assignmentService.validateTotalCommissionPercent(
      request.partnerId,
      request.commissionPercent,
    );

    // Validar solapamiento de fechas
    const startDate = new Date(request.startDate);
    const endDate = request.endDate ? new Date(request.endDate) : null;

    if (endDate && startDate >= endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    await this.assignmentService.validateDateOverlap(
      request.partnerId,
      request.staffUserId,
      startDate,
      endDate,
    );

    // Crear la asignación
    const assignment = PartnerStaffAssignment.create(
      request.partnerId,
      request.staffUserId,
      request.commissionPercent,
      startDate,
      endDate,
      request.notes || null,
      true, // isActive
    );

    // Guardar la asignación
    const savedAssignment =
      await this.assignmentRepository.save(assignment);

    return new CreatePartnerStaffAssignmentResponse(
      savedAssignment.id,
      savedAssignment.partnerId,
      savedAssignment.staffUserId,
      savedAssignment.commissionPercent,
      savedAssignment.isActive,
      savedAssignment.startDate,
      savedAssignment.endDate,
      savedAssignment.notes,
      savedAssignment.createdAt,
    );
  }
}

