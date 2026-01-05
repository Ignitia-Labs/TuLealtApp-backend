import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Optional,
} from '@nestjs/common';
import { JwtPayload } from '@libs/application';

/**
 * Interfaz del repositorio de customer memberships
 * Se define aquí para evitar dependencia circular
 */
interface ICustomerMembershipRepository {
  findById(id: number): Promise<{ userId: number } | null>;
  findByQrCode(qrCode: string): Promise<{ userId: number } | null>;
}

/**
 * Guard para validar que un customer solo acceda a sus propias memberships
 *
 * Este guard es específico para validar ownership de memberships.
 * Puede validar por ID de membership o por QR code.
 *
 * Debe usarse después de JwtAuthGuard para asegurar que el usuario esté autenticado
 *
 * @example
 * @UseGuards(JwtAuthGuard, MembershipOwnershipGuard)
 * @Get('memberships/:id')
 * async getMembership(@Param('id') id: number, @CurrentUser() user: JwtPayload) {
 *   // El guard valida automáticamente que la membership pertenece al usuario
 * }
 *
 * @example
 * @UseGuards(JwtAuthGuard, MembershipOwnershipGuard)
 * @Get('memberships/qr/:qrCode')
 * async getMembershipByQr(@Param('qrCode') qrCode: string, @CurrentUser() user: JwtPayload) {
 *   // El guard valida automáticamente que la membership pertenece al usuario
 * }
 */
@Injectable()
export class MembershipOwnershipGuard implements CanActivate {
  constructor(
    @Optional()
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository?: ICustomerMembershipRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    // Si no hay usuario autenticado, dejar que otros guards manejen
    if (!user) {
      return true;
    }

    // Si no es customer, permitir (otros guards manejan otros roles)
    if (!user.roles.includes('CUSTOMER')) {
      return true;
    }

    // Si el repositorio no está disponible aún, permitir (se validará en handlers)
    if (!this.membershipRepository) {
      return true;
    }

    // Intentar obtener membership por ID
    const membershipId = request.params.id || request.params.membershipId;
    const qrCode = request.params.qrCode;

    let membership: { userId: number } | null = null;

    if (membershipId) {
      membership = await this.membershipRepository.findById(parseInt(membershipId));
    } else if (qrCode) {
      membership = await this.membershipRepository.findByQrCode(qrCode);
    }

    // Si no se encontró el recurso, permitir (otros guards/handlers manejarán el 404)
    if (!membership) {
      return true;
    }

    // Validar ownership
    if (membership.userId !== user.userId) {
      throw new ForbiddenException('You can only access your own memberships');
    }

    return true;
  }
}
