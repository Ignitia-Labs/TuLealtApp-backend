import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para datos core de la membership
 */
export class MembershipCoreDto {
  @ApiProperty({ description: 'ID de la membership', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID del usuario (customer)', example: 10 })
  userId: number;

  @ApiProperty({ description: 'Puntos específicos de este tenant', example: 1500 })
  points: number;

  @ApiProperty({ description: 'Total gastado en este tenant', example: 2500.5 })
  totalSpent: number;

  @ApiProperty({ description: 'Total de visitas a este tenant', example: 25 })
  totalVisits: number;

  @ApiProperty({ description: 'Número de rewards disponibles para canjear', example: 3 })
  availableRewards: number;

  @ApiProperty({ description: 'Fecha de la última visita', nullable: true })
  lastVisit: Date | null;

  @ApiProperty({ description: 'Fecha de registro en este tenant' })
  joinedDate: Date;

  @ApiProperty({ description: 'QR code único específico por tenant', nullable: true })
  qrCode: string | null;

  @ApiProperty({ description: 'Estado de la membership', enum: ['active', 'inactive'] })
  status: 'active' | 'inactive';

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt: Date;

  constructor(
    id: number,
    userId: number,
    points: number,
    totalSpent: number,
    totalVisits: number,
    availableRewards: number,
    lastVisit: Date | null,
    joinedDate: Date,
    qrCode: string | null,
    status: 'active' | 'inactive',
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.userId = userId;
    this.points = points;
    this.totalSpent = totalSpent;
    this.totalVisits = totalVisits;
    this.availableRewards = availableRewards;
    this.lastVisit = lastVisit;
    this.joinedDate = joinedDate;
    this.qrCode = qrCode;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

/**
 * DTO para información del tenant
 */
export class TenantSummaryDto {
  @ApiProperty({ description: 'ID del tenant', example: 1 })
  id: number;

  @ApiProperty({ description: 'Nombre del tenant', example: 'Café Delicia' })
  name: string;

  @ApiProperty({ description: 'Logo del tenant', nullable: true })
  logo: string | null;

  @ApiProperty({ description: 'Imagen del tenant', nullable: true })
  image: string | null;

  @ApiProperty({ description: 'Categoría del tenant', example: 'restaurant' })
  category: string;

  @ApiProperty({ description: 'Color primario del tenant', example: '#FF5733' })
  primaryColor: string;

  constructor(
    id: number,
    name: string,
    logo: string | null,
    image: string | null,
    category: string,
    primaryColor: string,
  ) {
    this.id = id;
    this.name = name;
    this.logo = logo;
    this.image = image;
    this.category = category;
    this.primaryColor = primaryColor;
  }
}

/**
 * DTO para información de la branch de registro
 */
export class BranchSummaryDto {
  @ApiProperty({ description: 'ID de la branch', example: 5 })
  id: number;

  @ApiProperty({ description: 'Nombre de la branch', example: 'Café Delicia - Centro' })
  name: string;

  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }
}

/**
 * DTO para información de beneficios de un tier
 */
export class TierBenefitDetailsDto {
  @ApiProperty({ description: 'Multiplicador global de puntos', example: 1.5, nullable: true })
  pointsMultiplier: number | null;

  @ApiProperty({ description: 'IDs de recompensas exclusivas', type: [String], example: ['reward-1', 'reward-2'] })
  exclusiveRewards: string[];

  @ApiProperty({ description: 'Límites más altos', nullable: true, example: { maxPointsPerDay: 5000 } })
  higherCaps: {
    maxPointsPerEvent?: number | null;
    maxPointsPerDay?: number | null;
    maxPointsPerMonth?: number | null;
  } | null;

  @ApiProperty({ description: 'Reducción de cooldown en horas', example: 12, nullable: true })
  cooldownReduction: number | null;

  @ApiProperty({ description: 'Beneficios por categoría', nullable: true })
  categoryBenefits: Record<string, any> | null;

  constructor(
    pointsMultiplier: number | null,
    exclusiveRewards: string[],
    higherCaps: {
      maxPointsPerEvent?: number | null;
      maxPointsPerDay?: number | null;
      maxPointsPerMonth?: number | null;
    } | null,
    cooldownReduction: number | null,
    categoryBenefits: Record<string, any> | null,
  ) {
    this.pointsMultiplier = pointsMultiplier;
    this.exclusiveRewards = exclusiveRewards;
    this.higherCaps = higherCaps;
    this.cooldownReduction = cooldownReduction;
    this.categoryBenefits = categoryBenefits;
  }
}

/**
 * DTO para información detallada de un tier (para currentTier)
 */
export class TierDetailDto {
  @ApiProperty({ description: 'ID del tier', example: 2 })
  id: number;

  @ApiProperty({ description: 'Nombre del tier', example: 'Gold' })
  name: string;

  @ApiProperty({ description: 'Descripción del tier', example: 'Nivel premium', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Puntos mínimos requeridos', example: 1000 })
  minPoints: number;

  @ApiProperty({ description: 'Puntos máximos (null para tier más alto)', example: 4999, nullable: true })
  maxPoints: number | null;

  @ApiProperty({ description: 'Color del tier', example: '#FFD700' })
  color: string;

  @ApiProperty({ description: 'Icono del tier', example: 'gold-medal', nullable: true })
  icon: string | null;

  @ApiProperty({ description: 'Lista de beneficios', type: [String] })
  benefits: string[];

  @ApiProperty({ description: 'Multiplicador de puntos', example: 1.25, nullable: true })
  multiplier: number | null;

  @ApiProperty({ description: 'Prioridad/orden del tier', example: 2 })
  priority: number;

  constructor(
    id: number,
    name: string,
    description: string | null,
    minPoints: number,
    maxPoints: number | null,
    color: string,
    icon: string | null,
    benefits: string[],
    multiplier: number | null,
    priority: number,
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.minPoints = minPoints;
    this.maxPoints = maxPoints;
    this.color = color;
    this.icon = icon;
    this.benefits = benefits;
    this.multiplier = multiplier;
    this.priority = priority;
  }
}

/**
 * DTO para información completa de un tier con sus beneficios
 */
export class TierInfoDto {
  @ApiProperty({ description: 'ID del tier', example: 1 })
  id: number;

  @ApiProperty({ description: 'Nombre del tier', example: 'Oro' })
  name: string;

  @ApiProperty({ description: 'Descripción del tier', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Puntos mínimos requeridos', example: 1000 })
  minPoints: number;

  @ApiProperty({ description: 'Puntos máximos (null para tier más alto)', nullable: true })
  maxPoints: number | null;

  @ApiProperty({ description: 'Color del tier', example: '#FFD700' })
  color: string;

  @ApiProperty({ description: 'Icono del tier', nullable: true })
  icon: string | null;

  @ApiProperty({ description: 'Lista de beneficios', type: [String] })
  benefits: string[];

  @ApiProperty({ description: 'Multiplicador de puntos', nullable: true })
  multiplier: number | null;

  @ApiProperty({ description: 'Prioridad/orden del tier', example: 3 })
  priority: number;

  @ApiProperty({ description: 'Detalles adicionales de beneficios', type: TierBenefitDetailsDto, nullable: true })
  tierBenefitDetails: TierBenefitDetailsDto | null;

  constructor(
    id: number,
    name: string,
    description: string | null,
    minPoints: number,
    maxPoints: number | null,
    color: string,
    icon: string | null,
    benefits: string[],
    multiplier: number | null,
    priority: number,
    tierBenefitDetails: TierBenefitDetailsDto | null,
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.minPoints = minPoints;
    this.maxPoints = maxPoints;
    this.color = color;
    this.icon = icon;
    this.benefits = benefits;
    this.multiplier = multiplier;
    this.priority = priority;
    this.tierBenefitDetails = tierBenefitDetails;
  }
}

/**
 * DTO para política de tiers del tenant
 */
export class TierPolicyDto {
  @ApiProperty({ description: 'Ventana de evaluación', example: 'MONTHLY', enum: ['MONTHLY', 'QUARTERLY', 'ROLLING_30', 'ROLLING_90'] })
  evaluationWindow: string;

  @ApiProperty({ description: 'Tipo de evaluación', example: 'ROLLING', enum: ['FIXED', 'ROLLING'] })
  evaluationType: string;

  @ApiProperty({ description: 'Días de gracia antes de downgrade', example: 30 })
  gracePeriodDays: number;

  @ApiProperty({ description: 'Días mínimos en un tier', example: 7 })
  minTierDuration: number;

  @ApiProperty({ description: 'Estrategia de downgrade', example: 'GRACE_PERIOD', enum: ['IMMEDIATE', 'GRACE_PERIOD', 'NEVER'] })
  downgradeStrategy: string;

  @ApiProperty({ description: 'Estado de la política', example: 'active' })
  status: string;

  @ApiProperty({ description: 'Descripción de la política', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Thresholds de puntos por tier', example: { '1': 0, '2': 500, '3': 1000 } })
  thresholds: Record<string, number>;

  constructor(
    evaluationWindow: string,
    evaluationType: string,
    gracePeriodDays: number,
    minTierDuration: number,
    downgradeStrategy: string,
    status: string,
    description: string | null,
    thresholds: Record<string, number>,
  ) {
    this.evaluationWindow = evaluationWindow;
    this.evaluationType = evaluationType;
    this.gracePeriodDays = gracePeriodDays;
    this.minTierDuration = minTierDuration;
    this.downgradeStrategy = downgradeStrategy;
    this.status = status;
    this.description = description;
    this.thresholds = thresholds;
  }
}

/**
 * DTO para el sistema de tiers del tenant
 */
export class TierSystemDto {
  @ApiProperty({ description: 'Todos los tiers disponibles del tenant', type: [TierInfoDto] })
  availableTiers: TierInfoDto[];

  @ApiProperty({ description: 'Política de tiers del tenant', type: TierPolicyDto, nullable: true })
  policy: TierPolicyDto | null;

  constructor(availableTiers: TierInfoDto[], policy: TierPolicyDto | null) {
    this.availableTiers = availableTiers;
    this.policy = policy;
  }
}

/**
 * DTO para CustomerMembership con información segmentada
 * Estructura organizada por entidad para mejor claridad
 */
export class CustomerMembershipDto {
  @ApiProperty({ description: 'Datos principales de la membership', type: MembershipCoreDto })
  membership: MembershipCoreDto;

  @ApiProperty({ description: 'Información del tenant', type: TenantSummaryDto })
  tenant: TenantSummaryDto;

  @ApiProperty({ description: 'Branch de registro', type: BranchSummaryDto, nullable: true })
  registrationBranch: BranchSummaryDto | null;

  @ApiProperty({ description: 'Tier actual del customer', type: TierDetailDto, nullable: true })
  currentTier: TierDetailDto | null;

  @ApiProperty({ description: 'Sistema de tiers del tenant', type: TierSystemDto })
  tierSystem: TierSystemDto;

  constructor(
    membership: MembershipCoreDto,
    tenant: TenantSummaryDto,
    registrationBranch: BranchSummaryDto | null,
    currentTier: TierDetailDto | null,
    tierSystem: TierSystemDto,
  ) {
    this.membership = membership;
    this.tenant = tenant;
    this.registrationBranch = registrationBranch;
    this.currentTier = currentTier;
    this.tierSystem = tierSystem;
  }
}
