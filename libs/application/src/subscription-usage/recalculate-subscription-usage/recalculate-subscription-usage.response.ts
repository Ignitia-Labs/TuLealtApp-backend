import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para el recálculo de uso de suscripción
 */
export class RecalculateSubscriptionUsageResponse {
  @ApiProperty({
    description: 'Mensaje de confirmación del recálculo',
    example: 'Subscription usage recalculated successfully',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'Número de partners recalculados',
    example: 1,
    type: Number,
  })
  recalculatedCount: number;

  @ApiProperty({
    description: 'Lista de partners recalculados con sus detalles',
    type: Object,
    isArray: true,
    example: [
      {
        partnerId: 1,
        partnerSubscriptionId: 1,
        tenantsCount: 3,
        branchesCount: 12,
        customersCount: 2345,
        rewardsCount: 15,
        loyaltyProgramsCount: 5,
        loyaltyProgramsBaseCount: 1,
        loyaltyProgramsPromoCount: 3,
        loyaltyProgramsPartnerCount: 0,
        loyaltyProgramsSubscriptionCount: 0,
        loyaltyProgramsExperimentalCount: 1,
      },
    ],
  })
  results: Array<{
    partnerId: number;
    partnerSubscriptionId: number;
    tenantsCount: number;
    branchesCount: number;
    customersCount: number;
    rewardsCount: number;
    loyaltyProgramsCount: number;
    loyaltyProgramsBaseCount: number;
    loyaltyProgramsPromoCount: number;
    loyaltyProgramsPartnerCount: number;
    loyaltyProgramsSubscriptionCount: number;
    loyaltyProgramsExperimentalCount: number;
  }>;

  constructor(
    message: string,
    recalculatedCount: number,
    results: Array<{
      partnerId: number;
      partnerSubscriptionId: number;
      tenantsCount: number;
      branchesCount: number;
      customersCount: number;
      rewardsCount: number;
      loyaltyProgramsCount: number;
      loyaltyProgramsBaseCount: number;
      loyaltyProgramsPromoCount: number;
      loyaltyProgramsPartnerCount: number;
      loyaltyProgramsSubscriptionCount: number;
      loyaltyProgramsExperimentalCount: number;
    }>,
  ) {
    this.message = message;
    this.recalculatedCount = recalculatedCount;
    this.results = results;
  }
}
