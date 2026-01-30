import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ILoyaltyProgramRepository,
  ITenantRepository,
  IRewardRuleRepository,
  IEnrollmentRepository,
} from '@libs/domain';
import {
  PartnerSubscriptionEntity,
  PartnerSubscriptionUsageEntity,
} from '@libs/infrastructure';
import { SubscriptionUsageHelper } from '@libs/application';
import { DeleteLoyaltyProgramRequest } from './delete-loyalty-program.request';

/**
 * Handler para eliminar un programa de lealtad
 * Nota: Por ahora hace hard delete. Se puede cambiar a soft delete si es necesario.
 */
@Injectable()
export class DeleteLoyaltyProgramHandler {
  constructor(
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IRewardRuleRepository')
    private readonly ruleRepository: IRewardRuleRepository,
    @Inject('IEnrollmentRepository')
    private readonly enrollmentRepository: IEnrollmentRepository,
    @InjectRepository(PartnerSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PartnerSubscriptionEntity>,
    @InjectRepository(PartnerSubscriptionUsageEntity)
    private readonly usageRepository: Repository<PartnerSubscriptionUsageEntity>,
  ) {}

  async execute(request: DeleteLoyaltyProgramRequest): Promise<void> {
    // Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Obtener programa
    const program = await this.programRepository.findById(request.programId);
    if (!program) {
      throw new NotFoundException(`Loyalty program with ID ${request.programId} not found`);
    }

    // Validar que el programa pertenece al tenant
    if (program.tenantId !== request.tenantId) {
      throw new NotFoundException(
        `Loyalty program ${request.programId} does not belong to tenant ${request.tenantId}`,
      );
    }

    // Validar que no sea un programa BASE activo (no se puede eliminar)
    if (program.programType === 'BASE' && program.isActive()) {
      throw new BadRequestException('Cannot delete an active BASE program. Deactivate it first.');
    }

    // Verificar si tiene reglas activas
    const rules = await this.ruleRepository.findByProgramId(request.programId);
    const activeRules = rules.filter((r) => r.status === 'active');
    if (activeRules.length > 0) {
      throw new BadRequestException(
        `Cannot delete program with ${activeRules.length} active reward rules. Deactivate or delete the rules first.`,
      );
    }

    // Verificar si tiene enrollments activos
    const enrollments = await this.enrollmentRepository.findActiveByProgramId(request.programId);
    if (enrollments.length > 0) {
      throw new BadRequestException(
        `Cannot delete program with ${enrollments.length} active enrollments. Deactivate enrollments first.`,
      );
    }

    // Guardar el tipo de programa antes de eliminarlo para actualizar contadores
    const programType = program.programType;

    // Eliminar programa
    await this.programRepository.delete(request.programId);

    // Actualizar contadores de loyalty programs en partner_subscription_usage
    try {
      const subscriptionId = await SubscriptionUsageHelper.getSubscriptionIdFromTenantId(
        request.tenantId,
        this.tenantRepository,
        this.subscriptionRepository,
      );

      if (subscriptionId) {
        // Decrementar contador según el tipo de programa
        switch (programType) {
          case 'BASE':
            await SubscriptionUsageHelper.decrementLoyaltyProgramsBaseCount(
              subscriptionId,
              this.usageRepository,
            );
            break;
          case 'PROMO':
            await SubscriptionUsageHelper.decrementLoyaltyProgramsPromoCount(
              subscriptionId,
              this.usageRepository,
            );
            break;
          case 'PARTNER':
            await SubscriptionUsageHelper.decrementLoyaltyProgramsPartnerCount(
              subscriptionId,
              this.usageRepository,
            );
            break;
          case 'SUBSCRIPTION':
            await SubscriptionUsageHelper.decrementLoyaltyProgramsSubscriptionCount(
              subscriptionId,
              this.usageRepository,
            );
            break;
          case 'EXPERIMENTAL':
            await SubscriptionUsageHelper.decrementLoyaltyProgramsExperimentalCount(
              subscriptionId,
              this.usageRepository,
            );
            break;
          default:
            // Si el tipo no está reconocido, solo decrementar el total
            await SubscriptionUsageHelper.decrementLoyaltyProgramsCount(
              subscriptionId,
              this.usageRepository,
            );
        }
      }
    } catch (error) {
      // Log error pero no lanzar excepción para no interrumpir la eliminación del programa
      console.error(
        `[DeleteLoyaltyProgramHandler] Error updating subscription usage for deleted loyalty program ${request.programId}:`,
        error,
      );
    }
  }
}
