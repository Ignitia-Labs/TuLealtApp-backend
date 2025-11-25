import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository, User } from '@libs/domain';
import { BaseSeed } from '../base/base-seed';
import * as bcrypt from 'bcrypt';

/**
 * Seed para crear el usuario administrador por defecto
 *
 * Credenciales por defecto:
 * - Email: admin@example.com
 * - Username: admin
 * - Password: Admin123!
 * - Rol: ADMIN
 *
 * ⚠️ ADVERTENCIA DE SEGURIDAD:
 * - Esta seed crea un usuario con credenciales conocidas
 * - En producción, cambiar la contraseña inmediatamente después del primer login
 * - Considerar usar variables de entorno para la contraseña en producción
 * - Este usuario debe tener acceso restringido en producción
 */
@Injectable()
export class AdminUserSeed extends BaseSeed {
  private readonly ADMIN_EMAIL = 'admin@example.com';
  private readonly ADMIN_NAME = 'admin';
  private readonly ADMIN_PASSWORD = 'Admin123!';
  private readonly ADMIN_ROLES = ['ADMIN'];

  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {
    super();
  }

  getName(): string {
    return 'AdminUserSeed';
  }

  async run(): Promise<void> {
    this.log('Iniciando seed de usuario administrador...');

    try {
      // Verificar si el usuario admin ya existe
      const existingUser = await this.userRepository.findByEmail(this.ADMIN_EMAIL);

      if (existingUser) {
        this.log(`Usuario admin ya existe con ID: ${existingUser.id}`);
        return;
      }

      // Generar hash de la contraseña
      const passwordHash = await bcrypt.hash(this.ADMIN_PASSWORD, 10);

      // Crear la entidad de dominio sin ID (la BD lo generará automáticamente)
      const adminUser = User.create(
        this.ADMIN_EMAIL,
        this.ADMIN_NAME,
        passwordHash,
        this.ADMIN_ROLES,
      );

      // Guardar usando el repositorio (la BD asignará el ID automáticamente)
      const savedUser = await this.userRepository.save(adminUser);

      this.log(`Usuario admin creado exitosamente con ID: ${savedUser.id}`);
      this.log(`Email: ${savedUser.email}`);
      this.log(`Roles: ${savedUser.roles.join(', ')}`);
      this.log(`⚠️  Password por defecto: ${this.ADMIN_PASSWORD}`);
      this.log(`⚠️  IMPORTANTE: Cambiar la contraseña en producción`);
    } catch (error) {
      this.error('Error al crear usuario admin', error);
      throw error;
    }
  }
}
