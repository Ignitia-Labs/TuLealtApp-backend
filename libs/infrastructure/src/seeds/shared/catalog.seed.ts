import { Injectable, Inject } from '@nestjs/common';
import { ICatalogRepository, Catalog } from '@libs/domain';
import { BaseSeed } from '../base/base-seed';

/**
 * Seed para crear los catálogos por defecto del sistema
 */
@Injectable()
export class CatalogSeed extends BaseSeed {
  constructor(
    @Inject('ICatalogRepository')
    private readonly catalogRepository: ICatalogRepository,
  ) {
    super();
  }

  getName(): string {
    return 'CatalogSeed';
  }

  async run(): Promise<void> {
    this.log('Iniciando seed de catálogos...');

    try {
      // Obtener todos los catálogos existentes
      const existingCatalogs = await this.catalogRepository.findAll(true);
      const existingCatalogsMap = new Map<string, Catalog>();
      existingCatalogs.forEach((catalog) => {
        const key = `${catalog.type}:${catalog.slug}`;
        existingCatalogsMap.set(key.toLowerCase(), catalog);
      });

      // BUSINESS_CATEGORIES - Categorías de negocios para segmentación de partners
      const BUSINESS_CATEGORIES = [
        { value: 'restaurant', label: 'Restaurante' },
        { value: 'retail', label: 'Retail / Tienda' },
        { value: 'services', label: 'Servicios' },
        { value: 'health', label: 'Salud y Bienestar' },
        { value: 'beauty', label: 'Belleza y Estética' },
        { value: 'education', label: 'Educación' },
        { value: 'automotive', label: 'Automotriz' },
        { value: 'entertainment', label: 'Entretenimiento' },
        { value: 'technology', label: 'Tecnología' },
        { value: 'fitness', label: 'Fitness / Gimnasio' },
        { value: 'hospitality', label: 'Hotelería / Turismo' },
        { value: 'finance', label: 'Finanzas / Banca' },
        { value: 'real-estate', label: 'Bienes Raíces' },
        { value: 'food-beverage', label: 'Alimentos y Bebidas' },
        { value: 'fashion', label: 'Moda / Ropa' },
        { value: 'pharmacy', label: 'Farmacia' },
        { value: 'supermarket', label: 'Supermercado' },
        { value: 'cafe', label: 'Cafetería' },
        { value: 'pet', label: 'Mascotas' },
        { value: 'home-garden', label: 'Hogar y Jardín' },
        { value: 'sports', label: 'Deportes' },
        { value: 'arts-crafts', label: 'Arte y Manualidades' },
        { value: 'music', label: 'Música' },
        { value: 'books', label: 'Libros / Librería' },
        { value: 'jewelry', label: 'Joyería' },
        { value: 'other', label: 'Otro' },
      ];

      // REWARD_TYPES - Tipos de recompensas
      const REWARD_TYPES = [
        { value: 'por-monto-compra', label: 'Por monto de compra' },
        { value: 'por-visita', label: 'Por visita' },
        { value: 'por-visita-compra', label: 'Por visita y compra' },
        { value: 'personalizado', label: 'Personalizado' },
      ];

      // LOYALTY_PROGRAM_TYPES - Tipos de programas de lealtad disponibles
      const LOYALTY_PROGRAM_TYPES = [
        { value: 'BASE', label: 'Programa Base' },
        { value: 'PROMO', label: 'Programa Promocional' },
        { value: 'PARTNER', label: 'Programa de Partner' },
        { value: 'SUBSCRIPTION', label: 'Programa de Suscripción' },
        { value: 'EXPERIMENTAL', label: 'Programa Experimental' },
      ];

      // PAYMENT_METHODS - Métodos de pago
      const PAYMENT_METHODS = [
        { value: 'credit_card', label: 'Tarjeta de crédito' },
        { value: 'debit_card', label: 'Tarjeta de débito' },
        { value: 'bank_transfer', label: 'Transferencia bancaria' },
        { value: 'paypal', label: 'PayPal' },
        { value: 'cash', label: 'Efectivo' },
      ];

      // PAYMENT_CATEGORIES - Categorías de pago
      const PAYMENT_CATEGORIES = [
        { value: 'account_credit', label: 'Abono a Cuenta' },
        { value: 'advance_payment', label: 'Pago Anticipado' },
        { value: 'extraordinary', label: 'Pago Extraordinario' },
      ];

      // Procesar BUSINESS_CATEGORIES
      let displayOrder = 1;
      for (const category of BUSINESS_CATEGORIES) {
        const key = `BUSINESS_CATEGORIES:${category.value}`;
        const existingCatalog = existingCatalogsMap.get(key.toLowerCase());

        if (!existingCatalog) {
          // Verificar que el slug no exista ya
          const existingBySlug = await this.catalogRepository.findBySlug(category.value);
          if (existingBySlug) {
            this.log(
              `⚠ Slug '${category.value}' ya existe para otro catálogo. Usando slug con sufijo para: ${category.label}`,
            );
            // Generar slug único agregando un número
            let uniqueSlug = category.value;
            let counter = 1;
            while (await this.catalogRepository.findBySlug(uniqueSlug)) {
              uniqueSlug = `${category.value}-${counter}`;
              counter++;
            }
            const catalog = Catalog.create(
              'BUSINESS_CATEGORIES',
              category.label,
              uniqueSlug,
              displayOrder,
              true,
            );
            const savedCatalog = await this.catalogRepository.save(catalog);
            existingCatalogsMap.set(key.toLowerCase(), savedCatalog);
            this.log(
              `✓ Catálogo creado: BUSINESS_CATEGORIES - ${category.label} (slug: ${uniqueSlug}, ID: ${savedCatalog.id})`,
            );
          } else {
            const catalog = Catalog.create(
              'BUSINESS_CATEGORIES',
              category.label,
              category.value,
              displayOrder,
              true,
            );
            const savedCatalog = await this.catalogRepository.save(catalog);
            existingCatalogsMap.set(key.toLowerCase(), savedCatalog);
            this.log(
              `✓ Catálogo creado: BUSINESS_CATEGORIES - ${category.label} (slug: ${category.value}, ID: ${savedCatalog.id})`,
            );
          }
        } else {
          // Catálogo existe, verificar si tiene slug correcto
          let needsUpdate = false;
          let slugToUse = existingCatalog.slug;

          // Si no tiene slug o el slug no coincide con el esperado, actualizarlo
          if (!existingCatalog.slug || existingCatalog.slug.trim() === '') {
            needsUpdate = true;
            slugToUse = category.value;
            this.log(
              `⚠ Catálogo existe sin slug: BUSINESS_CATEGORIES - ${category.label} (ID: ${existingCatalog.id}). Generando slug...`,
            );
          } else if (existingCatalog.slug !== category.value) {
            // Verificar si el slug esperado ya existe para otro catálogo
            const existingBySlug = await this.catalogRepository.findBySlug(category.value);
            if (!existingBySlug || existingBySlug.id === existingCatalog.id) {
              needsUpdate = true;
              slugToUse = category.value;
              this.log(
                `⚠ Catálogo tiene slug diferente al esperado: BUSINESS_CATEGORIES - ${category.label} (ID: ${existingCatalog.id}). Actualizando slug de '${existingCatalog.slug}' a '${category.value}'...`,
              );
            }
          }

          // Verificar si el label necesita actualización
          if (existingCatalog.value !== category.label) {
            needsUpdate = true;
          }

          if (needsUpdate) {
            // Verificar que el slug no esté duplicado
            const duplicateBySlug = await this.catalogRepository.findBySlug(slugToUse);
            if (duplicateBySlug && duplicateBySlug.id !== existingCatalog.id) {
              this.log(
                `⚠ Slug '${slugToUse}' ya existe para otro catálogo. Manteniendo slug actual: '${existingCatalog.slug}'`,
              );
            } else {
              // Actualizar el catálogo con el nuevo slug y label
              const updatedCatalog = existingCatalog.updateValue(category.label, slugToUse);
              await this.catalogRepository.update(updatedCatalog);
              this.log(
                `✓ Catálogo actualizado: BUSINESS_CATEGORIES - ${category.label} (ID: ${existingCatalog.id}, slug: ${slugToUse})`,
              );
            }
          } else {
            this.log(
              `- Catálogo ya existe: BUSINESS_CATEGORIES - ${category.label} (ID: ${existingCatalog.id}, slug: ${existingCatalog.slug})`,
            );
          }
        }
        displayOrder++;
      }

      // Procesar REWARD_TYPES
      displayOrder = 1;
      for (const rewardType of REWARD_TYPES) {
        const key = `REWARD_TYPES:${rewardType.value}`;
        const existingCatalog = existingCatalogsMap.get(key.toLowerCase());

        if (!existingCatalog) {
          const catalog = Catalog.create(
            'REWARD_TYPES',
            rewardType.label,
            rewardType.value,
            displayOrder,
            true,
          );
          const savedCatalog = await this.catalogRepository.save(catalog);
          existingCatalogsMap.set(key.toLowerCase(), savedCatalog);
          this.log(
            `✓ Catálogo creado: REWARD_TYPES - ${rewardType.label} (slug: ${rewardType.value}, ID: ${savedCatalog.id})`,
          );
        } else {
          // Verificar si necesita actualización
          if (
            existingCatalog.value !== rewardType.label ||
            existingCatalog.slug !== rewardType.value
          ) {
            const updatedCatalog = existingCatalog.updateValue(rewardType.label, rewardType.value);
            await this.catalogRepository.update(updatedCatalog);
            this.log(
              `✓ Catálogo actualizado: REWARD_TYPES - ${rewardType.label} (ID: ${existingCatalog.id}, slug: ${rewardType.value})`,
            );
          } else {
            this.log(
              `- Catálogo ya existe: REWARD_TYPES - ${rewardType.label} (ID: ${existingCatalog.id}, slug: ${existingCatalog.slug})`,
            );
          }
        }
        displayOrder++;
      }

      // Procesar LOYALTY_PROGRAM_TYPES
      displayOrder = 1;
      for (const programType of LOYALTY_PROGRAM_TYPES) {
        const key = `LOYALTY_PROGRAM_TYPES:${programType.value}`;
        const existingCatalog = existingCatalogsMap.get(key.toLowerCase());

        if (!existingCatalog) {
          const catalog = Catalog.create(
            'LOYALTY_PROGRAM_TYPES',
            programType.label,
            programType.value,
            displayOrder,
            true,
          );
          const savedCatalog = await this.catalogRepository.save(catalog);
          existingCatalogsMap.set(key.toLowerCase(), savedCatalog);
          this.log(
            `✓ Catálogo creado: LOYALTY_PROGRAM_TYPES - ${programType.label} (slug: ${programType.value}, ID: ${savedCatalog.id})`,
          );
        } else {
          // Verificar si necesita actualización
          if (
            existingCatalog.value !== programType.label ||
            existingCatalog.slug !== programType.value
          ) {
            const updatedCatalog = existingCatalog.updateValue(
              programType.label,
              programType.value,
            );
            await this.catalogRepository.update(updatedCatalog);
            this.log(
              `✓ Catálogo actualizado: LOYALTY_PROGRAM_TYPES - ${programType.label} (ID: ${existingCatalog.id}, slug: ${programType.value})`,
            );
          } else {
            this.log(
              `- Catálogo ya existe: LOYALTY_PROGRAM_TYPES - ${programType.label} (ID: ${existingCatalog.id}, slug: ${existingCatalog.slug})`,
            );
          }
        }
        displayOrder++;
      }

      // Procesar PAYMENT_METHODS
      displayOrder = 1;
      for (const paymentMethod of PAYMENT_METHODS) {
        const key = `PAYMENT_METHODS:${paymentMethod.value}`;
        const existingCatalog = existingCatalogsMap.get(key.toLowerCase());

        if (!existingCatalog) {
          const catalog = Catalog.create(
            'PAYMENT_METHODS',
            paymentMethod.label,
            paymentMethod.value,
            displayOrder,
            true,
          );
          const savedCatalog = await this.catalogRepository.save(catalog);
          existingCatalogsMap.set(key.toLowerCase(), savedCatalog);
          this.log(
            `✓ Catálogo creado: PAYMENT_METHODS - ${paymentMethod.label} (slug: ${paymentMethod.value}, ID: ${savedCatalog.id})`,
          );
        } else {
          // Verificar si necesita actualización
          if (
            existingCatalog.value !== paymentMethod.label ||
            existingCatalog.slug !== paymentMethod.value
          ) {
            const updatedCatalog = existingCatalog.updateValue(
              paymentMethod.label,
              paymentMethod.value,
            );
            await this.catalogRepository.update(updatedCatalog);
            this.log(
              `✓ Catálogo actualizado: PAYMENT_METHODS - ${paymentMethod.label} (ID: ${existingCatalog.id}, slug: ${paymentMethod.value})`,
            );
          } else {
            this.log(
              `- Catálogo ya existe: PAYMENT_METHODS - ${paymentMethod.label} (ID: ${existingCatalog.id}, slug: ${existingCatalog.slug})`,
            );
          }
        }
        displayOrder++;
      }

      // Procesar PAYMENT_CATEGORIES
      displayOrder = 1;
      for (const paymentCategory of PAYMENT_CATEGORIES) {
        const key = `PAYMENT_CATEGORIES:${paymentCategory.value}`;
        const existingCatalog = existingCatalogsMap.get(key.toLowerCase());

        if (!existingCatalog) {
          const catalog = Catalog.create(
            'PAYMENT_CATEGORIES',
            paymentCategory.label,
            paymentCategory.value,
            displayOrder,
            true,
          );
          const savedCatalog = await this.catalogRepository.save(catalog);
          existingCatalogsMap.set(key.toLowerCase(), savedCatalog);
          this.log(
            `✓ Catálogo creado: PAYMENT_CATEGORIES - ${paymentCategory.label} (slug: ${paymentCategory.value}, ID: ${savedCatalog.id})`,
          );
        } else {
          // Verificar si necesita actualización
          if (
            existingCatalog.value !== paymentCategory.label ||
            existingCatalog.slug !== paymentCategory.value
          ) {
            const updatedCatalog = existingCatalog.updateValue(
              paymentCategory.label,
              paymentCategory.value,
            );
            await this.catalogRepository.update(updatedCatalog);
            this.log(
              `✓ Catálogo actualizado: PAYMENT_CATEGORIES - ${paymentCategory.label} (ID: ${existingCatalog.id}, slug: ${paymentCategory.value})`,
            );
          } else {
            this.log(
              `- Catálogo ya existe: PAYMENT_CATEGORIES - ${paymentCategory.label} (ID: ${existingCatalog.id}, slug: ${existingCatalog.slug})`,
            );
          }
        }
        displayOrder++;
      }

      this.log('✓ Seed de catálogos completado exitosamente');
    } catch (error) {
      this.error(`Error en seed de catálogos: ${error.message}`, error);
      throw error;
    }
  }
}
