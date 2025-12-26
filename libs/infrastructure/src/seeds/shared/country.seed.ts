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
      // Mapa de país → código de moneda para auto-selección
      const countryToCurrencyMap: Array<{
        name: string;
        code?: string; // Código ISO de 2 letras (opcional)
        currencyCode: string;
      }> = [
        // América del Norte
        { name: 'Estados Unidos', code: 'US', currencyCode: 'USD' },
        { name: 'Canadá', code: 'CA', currencyCode: 'CAD' },
        { name: 'México', code: 'MX', currencyCode: 'MXN' },

        // América Central
        { name: 'Guatemala', code: 'GT', currencyCode: 'GTQ' },
        { name: 'Honduras', code: 'HN', currencyCode: 'HNL' },
        { name: 'Nicaragua', code: 'NI', currencyCode: 'NIO' },
        { name: 'Costa Rica', code: 'CR', currencyCode: 'CRC' },
        { name: 'Panamá', code: 'PA', currencyCode: 'PAB' },
        { name: 'El Salvador', code: 'SV', currencyCode: 'SVC' },
        { name: 'Belice', code: 'BZ', currencyCode: 'BZD' },

        // América del Sur
        { name: 'Colombia', code: 'CO', currencyCode: 'COP' },
        { name: 'Argentina', code: 'AR', currencyCode: 'ARS' },
        { name: 'Chile', code: 'CL', currencyCode: 'CLP' },
        { name: 'Perú', code: 'PE', currencyCode: 'PEN' },
        { name: 'Brasil', code: 'BR', currencyCode: 'BRL' },
        { name: 'Uruguay', code: 'UY', currencyCode: 'UYU' },
        { name: 'Paraguay', code: 'PY', currencyCode: 'PYG' },
        { name: 'Bolivia', code: 'BO', currencyCode: 'BOB' },
        { name: 'Venezuela', code: 'VE', currencyCode: 'VES' },
        { name: 'Guyana', code: 'GY', currencyCode: 'GYD' },
        { name: 'Surinam', code: 'SR', currencyCode: 'SRD' },
        { name: 'Ecuador', code: 'EC', currencyCode: 'USD' }, // Ecuador usa USD

        // Caribe
        { name: 'República Dominicana', code: 'DO', currencyCode: 'DOP' },
        { name: 'Cuba', code: 'CU', currencyCode: 'CUP' },
        { name: 'Haití', code: 'HT', currencyCode: 'HTG' },
        { name: 'Jamaica', code: 'JM', currencyCode: 'JMD' },
        { name: 'Trinidad y Tobago', code: 'TT', currencyCode: 'TTD' },
        { name: 'Barbados', code: 'BB', currencyCode: 'BBD' },
        { name: 'Bahamas', code: 'BS', currencyCode: 'BSD' },

        // Caribe Oriental (países que usan XCD)
        { name: 'Antigua y Barbuda', code: 'AG', currencyCode: 'XCD' },
        { name: 'Dominica', code: 'DM', currencyCode: 'XCD' },
        { name: 'Granada', code: 'GD', currencyCode: 'XCD' },
        { name: 'San Cristóbal y Nieves', code: 'KN', currencyCode: 'XCD' },
        { name: 'Santa Lucía', code: 'LC', currencyCode: 'XCD' },
        { name: 'San Vicente y las Granadinas', code: 'VC', currencyCode: 'XCD' },
        { name: 'Anguila', code: 'AI', currencyCode: 'XCD' },
        { name: 'Montserrat', code: 'MS', currencyCode: 'XCD' },
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
            'active',
          );

          const savedCountry = await this.countryRepository.save(country);
          existingCountriesMap.set(countryKey, savedCountry);
          this.log(
            `✓ País creado: ${countryData.name} (ID: ${savedCountry.id}) - ${countryData.currencyCode}`,
          );
        } else {
          this.log(`- País ya existe: ${countryData.name} (ID: ${existingCountry.id})`);
        }
      }

      this.log('✓ Seed de países completado exitosamente');
    } catch (error) {
      this.error(`Error en seed de países: ${error.message}`, error);
      throw error;
    }
  }
}
