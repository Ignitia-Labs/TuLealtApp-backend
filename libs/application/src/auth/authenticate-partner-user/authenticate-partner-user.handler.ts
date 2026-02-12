import {
  Injectable,
  UnauthorizedException,
  Inject,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  IUserRepository,
  IPartnerRepository,
  ITenantRepository,
  IBranchRepository,
  IRefreshTokenRepository,
  RefreshToken,
} from '@libs/domain';
import { AuthenticatePartnerUserRequest } from './authenticate-partner-user.request';
import { AuthenticateUserResponse } from '../authenticate-user/authenticate-user.response';
import { JwtAuthService } from '../services/jwt.service';
import { PartnerInfoDto } from '../partner-info.dto';
import { TenantInfoDto } from '../tenant-info.dto';
import { BranchInfoDto } from '../branch-info.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

/**
 * Handler para el caso de uso de autenticar un usuario de partner
 * Valida que el usuario pertenezca al partner especificado por su dominio
 * Genera tokens JWT (access y refresh) con información del partner incluida
 */
@Injectable()
export class AuthenticatePartnerUserHandler {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Optional()
    private readonly jwtAuthService?: JwtAuthService,
  ) {}

  /**
   * Ejecuta la autenticación del usuario de partner
   * @param request Datos de autenticación incluyendo el dominio del partner
   * @param userAgent User agent del cliente (opcional)
   * @param ipAddress IP address del cliente (opcional)
   * @returns Access token, refresh token y datos del usuario con información del partner
   */
  async execute(
    request: AuthenticatePartnerUserRequest,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthenticateUserResponse> {
    // Buscar el partner por dominio
    const partner = await this.partnerRepository.findByDomain(request.partnerDomain);

    if (!partner) {
      throw new NotFoundException(`Partner with domain '${request.partnerDomain}' not found`);
    }

    // Verificar que el partner esté activo
    if (partner.status !== 'active') {
      throw new UnauthorizedException(`Partner '${request.partnerDomain}' is not active`);
    }

    // Buscar usuario por email
    const user = await this.userRepository.findByEmail(request.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verificar que el usuario esté activo
    if (!user.isActiveUser()) {
      throw new UnauthorizedException('User account is locked');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(request.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validar que el usuario tenga rol PARTNER o PARTNER_STAFF
    const isPartnerUser = user.hasRole('PARTNER') || user.hasRole('PARTNER_STAFF');
    if (!isPartnerUser) {
      throw new UnauthorizedException('User does not have partner role (PARTNER or PARTNER_STAFF)');
    }

    // Validar que el usuario pertenezca al partner especificado
    // Un usuario puede pertenecer a un partner de dos formas:
    // 1. Tiene partnerId directo igual al partner.id
    // 2. Es PARTNER_STAFF y tiene una asignación activa al partner (esto se validaría con partner_staff_assignments)
    // Por ahora validamos solo el partnerId directo
    if (user.partnerId !== partner.id) {
      throw new UnauthorizedException(
        `User does not belong to partner '${request.partnerDomain}'. User belongs to a different partner.`,
      );
    }

    // Generar access token JWT con información del partner
    const accessToken = this.generateAccessToken(user, partner.id, 'partner');

    // Generar refresh token JWT
    const refreshTokenJwt = this.generateRefreshToken(user, partner.id, 'partner');

    // Guardar refresh token en BD (hasheado)
    await this.saveRefreshToken(user.id, refreshTokenJwt, userAgent, ipAddress);

    // Obtener información del partner
    const partnerInfo = new PartnerInfoDto(
      partner.id,
      partner.name,
      partner.domain,
      partner.email,
      partner.status,
    );

    // Obtener información del tenant si existe
    let tenantInfo: TenantInfoDto | null = null;
    if (user.tenantId) {
      const tenant = await this.tenantRepository.findById(user.tenantId);
      if (tenant && tenant.partnerId === partner.id) {
        tenantInfo = new TenantInfoDto(
          tenant.id,
          tenant.name,
          tenant.partnerId,
          tenant.quickSearchCode,
          tenant.status,
        );
      }
    }

    // Obtener información del branch si existe
    let branchInfo: BranchInfoDto | null = null;
    if (user.branchId) {
      const branch = await this.branchRepository.findById(user.branchId);
      if (branch) {
        // Validar que el branch pertenezca al tenant del usuario (si hay tenantId)
        if (!user.tenantId || branch.tenantId === user.tenantId) {
          branchInfo = new BranchInfoDto(
            branch.id,
            branch.name,
            branch.tenantId,
            branch.quickSearchCode,
            branch.status,
          );
        }
      }
    }

    return new AuthenticateUserResponse(
      accessToken,
      refreshTokenJwt,
      {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
      partnerInfo,
      tenantInfo,
      branchInfo,
    );
  }

  /**
   * Genera un access token JWT con la información del usuario y del partner
   */
  private generateAccessToken(user: any, partnerId: number, context: string): string {
    if (!this.jwtAuthService) {
      throw new Error('JWT service is not available');
    }

    return this.jwtAuthService.generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: user.roles,
      context,
      partnerId, // Incluir partnerId en el token
    });
  }

  /**
   * Genera un refresh token JWT con la información del usuario y del partner
   */
  private generateRefreshToken(user: any, partnerId: number, context: string): string {
    if (!this.jwtAuthService) {
      throw new Error('JWT service is not available');
    }

    return this.jwtAuthService.generateRefreshToken({
      userId: user.id,
      email: user.email,
      roles: user.roles,
      context,
      partnerId,
    });
  }

  /**
   * Guarda el refresh token en la base de datos (hasheado)
   */
  private async saveRefreshToken(
    userId: number,
    refreshTokenJwt: string,
    userAgent: string | undefined,
    ipAddress: string | undefined,
  ): Promise<void> {
    // Hashear el token antes de guardarlo
    const tokenHash = this.hashToken(refreshTokenJwt);

    // Calcular fecha de expiración
    const expiresAt = this.jwtAuthService!.getRefreshTokenExpirationDate();

    // Crear entidad de dominio
    const refreshToken = RefreshToken.create(
      userId,
      tokenHash,
      expiresAt,
      userAgent || null,
      ipAddress || null,
    );

    // Guardar en BD
    await this.refreshTokenRepository.save(refreshToken);

    // Limitar tokens activos por usuario
    const maxTokens = parseInt(process.env.REFRESH_TOKEN_MAX_PER_USER || '5', 10);
    await this.refreshTokenRepository.deleteOldestIfExceedsLimit(userId, maxTokens);
  }

  /**
   * Hashea un token usando SHA-256
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
