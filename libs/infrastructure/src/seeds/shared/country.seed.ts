import { Injectable, Inject } from '@nestjs/common';
import { ICountryRepository, Country } from '@libs/domain';
import { BaseSeed } from '../base/base-seed';

/**
 * Seed para crear los países por defecto
 * Basado en el mapeo de país → código de moneda
 */
@Injectable()
export class CountrySeed extends BaseSeed {
  constructor(
    @Inject('ICountryRepository')
    private readonly countryRepository: ICountryRepository,
  ) {
    super();
  }

  getName(): string {
    return 'CountrySeed';
  }

  async run(): Promise<void> {
    this.log('Iniciando seed de países...');

    try {
      // Mapa de país → código de moneda y código telefónico para auto-selección
      const countryToCurrencyMap: Array<{
        name: string;
        code?: string; // Código ISO de 2 letras (opcional)
        currencyCode: string;
        countryCode?: string; // Código telefónico internacional (opcional)
      }> = [
        // América del Norte
        { name: 'Estados Unidos', code: 'US', currencyCode: 'USD', countryCode: '+1' },
        { name: 'Canadá', code: 'CA', currencyCode: 'CAD', countryCode: '+1' },
        { name: 'México', code: 'MX', currencyCode: 'MXN', countryCode: '+52' },

        // América Central
        { name: 'Guatemala', code: 'GT', currencyCode: 'GTQ', countryCode: '+502' },
        { name: 'Honduras', code: 'HN', currencyCode: 'HNL', countryCode: '+504' },
        { name: 'Nicaragua', code: 'NI', currencyCode: 'NIO', countryCode: '+505' },
        { name: 'Costa Rica', code: 'CR', currencyCode: 'CRC', countryCode: '+506' },
        { name: 'Panamá', code: 'PA', currencyCode: 'PAB', countryCode: '+507' },
        { name: 'El Salvador', code: 'SV', currencyCode: 'SVC', countryCode: '+503' },
        { name: 'Belice', code: 'BZ', currencyCode: 'BZD', countryCode: '+501' },

        // América del Sur
        { name: 'Colombia', code: 'CO', currencyCode: 'COP', countryCode: '+57' },
        { name: 'Argentina', code: 'AR', currencyCode: 'ARS', countryCode: '+54' },
        { name: 'Chile', code: 'CL', currencyCode: 'CLP', countryCode: '+56' },
        { name: 'Perú', code: 'PE', currencyCode: 'PEN', countryCode: '+51' },
        { name: 'Brasil', code: 'BR', currencyCode: 'BRL', countryCode: '+55' },
        { name: 'Uruguay', code: 'UY', currencyCode: 'UYU', countryCode: '+598' },
        { name: 'Paraguay', code: 'PY', currencyCode: 'PYG', countryCode: '+595' },
        { name: 'Bolivia', code: 'BO', currencyCode: 'BOB', countryCode: '+591' },
        { name: 'Venezuela', code: 'VE', currencyCode: 'VES', countryCode: '+58' },
        { name: 'Guyana', code: 'GY', currencyCode: 'GYD', countryCode: '+592' },
        { name: 'Surinam', code: 'SR', currencyCode: 'SRD', countryCode: '+597' },
        { name: 'Ecuador', code: 'EC', currencyCode: 'USD', countryCode: '+593' }, // Ecuador usa USD

        // Caribe
        { name: 'República Dominicana', code: 'DO', currencyCode: 'DOP', countryCode: '+1' },
        { name: 'Cuba', code: 'CU', currencyCode: 'CUP', countryCode: '+53' },
        { name: 'Haití', code: 'HT', currencyCode: 'HTG', countryCode: '+509' },
        { name: 'Jamaica', code: 'JM', currencyCode: 'JMD', countryCode: '+1' },
        { name: 'Trinidad y Tobago', code: 'TT', currencyCode: 'TTD', countryCode: '+1' },
        { name: 'Barbados', code: 'BB', currencyCode: 'BBD', countryCode: '+1' },
        { name: 'Bahamas', code: 'BS', currencyCode: 'BSD', countryCode: '+1' },

        // Caribe Oriental (países que usan XCD)
        { name: 'Antigua y Barbuda', code: 'AG', currencyCode: 'XCD', countryCode: '+1' },
        { name: 'Dominica', code: 'DM', currencyCode: 'XCD', countryCode: '+1' },
        { name: 'Granada', code: 'GD', currencyCode: 'XCD', countryCode: '+1' },
        { name: 'San Cristóbal y Nieves', code: 'KN', currencyCode: 'XCD', countryCode: '+1' },
        { name: 'Santa Lucía', code: 'LC', currencyCode: 'XCD', countryCode: '+1' },
        { name: 'San Vicente y las Granadinas', code: 'VC', currencyCode: 'XCD', countryCode: '+1' },
        { name: 'Anguila', code: 'AI', currencyCode: 'XCD', countryCode: '+1' },
        { name: 'Montserrat', code: 'MS', currencyCode: 'XCD', countryCode: '+1' },
      ];

      // Obtener todos los países existentes una sola vez para optimizar
      const existingCountries = await this.countryRepository.findAll();
      const existingCountriesMap = new Map<string, Country>();
      existingCountries.forEach((country) => {
        existingCountriesMap.set(country.name.toLowerCase(), country);
      });

      for (const countryData of countryToCurrencyMap) {
        const countryKey = countryData.name.toLowerCase();
        const existingCountry = existingCountriesMap.get(countryKey);

        if (!existingCountry) {
          const country = Country.create(
            countryData.name,
            countryData.currencyCode,
            countryData.code || null,
            countryData.countryCode || null,
            'active',
          );

          const savedCountry = await this.countryRepository.save(country);
          existingCountriesMap.set(countryKey, savedCountry);
          this.log(
            `✓ País creado: ${countryData.name} (ID: ${savedCountry.id}) - ${countryData.currencyCode}${countryData.countryCode ? ` - ${countryData.countryCode}` : ''}`,
          );
        } else {
          // Actualizar countryCode si no existe pero el país sí
          if (!existingCountry.countryCode && countryData.countryCode) {
            const updatedCountry = Country.create(
              existingCountry.name,
              existingCountry.currencyCode,
              existingCountry.code,
              countryData.countryCode,
              existingCountry.status,
              existingCountry.id,
            );
            await this.countryRepository.save(updatedCountry);
            this.log(
              `✓ País actualizado con countryCode: ${countryData.name} - ${countryData.countryCode}`,
            );
          } else {
            this.log(`- País ya existe: ${countryData.name} (ID: ${existingCountry.id})`);
          }
        }
      }

      this.log('✓ Seed de países completado exitosamente');
    } catch (error) {
      this.error(`Error en seed de países: ${error.message}`, error);
      throw error;
    }
  }
}
