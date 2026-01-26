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
} from '@libs/domain';
import { AuthenticatePartnerUserRequest } from './authenticate-partner-user.request';
import { AuthenticateUserResponse } from '../authenticate-user/authenticate-user.response';
import { JwtAuthService } from '../services/jwt.service';
import { PartnerInfoDto } from '../partner-info.dto';
import { TenantInfoDto } from '../tenant-info.dto';
import { BranchInfoDto } from '../branch-info.dto';
import * as bcrypt from 'bcrypt';

/**
 * Handler para el caso de uso de autenticar un usuario de partner
 * Valida que el usuario pertenezca al partner especificado por su dominio
 * Genera tokens JWT con información del partner incluida
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
    @Optional()
    private readonly jwtAuthService?: JwtAuthService,
  ) {}

  /**
   * Ejecuta la autenticación del usuario de partner
   * @param request Datos de autenticación incluyendo el dominio del partner
   * @returns Token JWT y datos del usuario con información del partner
   */
  async execute(request: AuthenticatePartnerUserRequest): Promise<AuthenticateUserResponse> {
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

    // Generar token JWT con información del partner
    const token = this.generateJwtToken(user, partner.id, 'partner');

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
      token,
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
   * Genera un token JWT con la información del usuario y del partner
   */
  private generateJwtToken(user: any, partnerId: number, context: string): string {
    if (this.jwtAuthService) {
      return this.jwtAuthService.generateAccessToken({
        userId: user.id,
        email: user.email,
        roles: user.roles,
        context,
        partnerId, // Incluir partnerId en el token
      });
    }

    // Fallback si el servicio JWT no está disponible (no debería pasar en producción)
    throw new Error('JWT service is not available');
  }
}
