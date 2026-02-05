#!/usr/bin/env python3
"""
Script para actualizar imports relativos dentro de las entidades
"""
import os
import re
from pathlib import Path

# Mapeo de nombres de entidades a sus rutas con alias
ENTITY_MAPPING = {
    # Auth
    'user.entity': '@libs/infrastructure/entities/auth/user.entity',
    'user-profile.entity': '@libs/infrastructure/entities/auth/user-profile.entity',
    'user-permission.entity': '@libs/infrastructure/entities/auth/user-permission.entity',
    'permission.entity': '@libs/infrastructure/entities/auth/permission.entity',
    'profile.entity': '@libs/infrastructure/entities/auth/profile.entity',
    'profile-permission.entity': '@libs/infrastructure/entities/auth/profile-permission.entity',
    'user-change-history.entity': '@libs/infrastructure/entities/auth/user-change-history.entity',
    'user-role.entity': '@libs/infrastructure/entities/auth/user-role.entity',
    'user-profile-data.entity': '@libs/infrastructure/entities/auth/user-profile-data.entity',

    # Billing
    'invoice.entity': '@libs/infrastructure/entities/billing/invoice.entity',
    'invoice-item.entity': '@libs/infrastructure/entities/billing/invoice-item.entity',
    'payment.entity': '@libs/infrastructure/entities/billing/payment.entity',
    'billing-cycle.entity': '@libs/infrastructure/entities/billing/billing-cycle.entity',
    'pricing-plan.entity': '@libs/infrastructure/entities/billing/pricing-plan.entity',
    'pricing-plan-limits.entity': '@libs/infrastructure/entities/billing/pricing-plan-limits.entity',
    'pricing-period.entity': '@libs/infrastructure/entities/billing/pricing-period.entity',
    'pricing-promotion.entity': '@libs/infrastructure/entities/billing/pricing-promotion.entity',
    'pricing-feature.entity': '@libs/infrastructure/entities/billing/pricing-feature.entity',
    'saved-payment-method.entity': '@libs/infrastructure/entities/billing/saved-payment-method.entity',
    'subscription-event.entity': '@libs/infrastructure/entities/billing/subscription-event.entity',
    'subscription-alert.entity': '@libs/infrastructure/entities/billing/subscription-alert.entity',
    'coupon.entity': '@libs/infrastructure/entities/billing/coupon.entity',
    'plan-change.entity': '@libs/infrastructure/entities/billing/plan-change.entity',
    'legacy-promotion.entity': '@libs/infrastructure/entities/billing/legacy-promotion.entity',

    # Loyalty
    'loyalty-program.entity': '@libs/infrastructure/entities/loyalty/loyalty-program.entity',
    'enrollment.entity': '@libs/infrastructure/entities/loyalty/enrollment.entity',
    'points-transaction.entity': '@libs/infrastructure/entities/loyalty/points-transaction.entity',
    'reward-rule.entity': '@libs/infrastructure/entities/loyalty/reward-rule.entity',
    'reward-rule-eligibility.entity': '@libs/infrastructure/entities/loyalty/reward-rule-eligibility.entity',
    'reward-rule-eligibility-membership-status.entity': '@libs/infrastructure/entities/loyalty/reward-rule-eligibility-membership-status.entity',
    'reward-rule-eligibility-flag.entity': '@libs/infrastructure/entities/loyalty/reward-rule-eligibility-flag.entity',
    'reward-rule-eligibility-category-id.entity': '@libs/infrastructure/entities/loyalty/reward-rule-eligibility-category-id.entity',
    'reward-rule-eligibility-sku.entity': '@libs/infrastructure/entities/loyalty/reward-rule-eligibility-sku.entity',
    'reward-rule-points-formula.entity': '@libs/infrastructure/entities/loyalty/reward-rule-points-formula.entity',
    'reward-rule-points-table-entry.entity': '@libs/infrastructure/entities/loyalty/reward-rule-points-table-entry.entity',
    'reward-rule-points-formula-bonus.entity': '@libs/infrastructure/entities/loyalty/reward-rule-points-formula-bonus.entity',
    'reward.entity': '@libs/infrastructure/entities/loyalty/reward.entity',
    'redemption-code.entity': '@libs/infrastructure/entities/loyalty/redemption-code.entity',
    'loyalty-program-earning-domain.entity': '@libs/infrastructure/entities/loyalty/loyalty-program-earning-domain.entity',

    # Partner
    'partner.entity': '@libs/infrastructure/entities/partner/partner.entity',
    'partner-subscription.entity': '@libs/infrastructure/entities/partner/partner-subscription.entity',
    'partner-subscription-usage.entity': '@libs/infrastructure/entities/partner/partner-subscription-usage.entity',
    'partner-request.entity': '@libs/infrastructure/entities/partner/partner-request.entity',
    'partner-archive.entity': '@libs/infrastructure/entities/partner/partner-archive.entity',
    'partner-staff-assignment.entity': '@libs/infrastructure/entities/partner/partner-staff-assignment.entity',
    'branch.entity': '@libs/infrastructure/entities/partner/branch.entity',
    'catalog.entity': '@libs/infrastructure/entities/partner/catalog.entity',
    'commission.entity': '@libs/infrastructure/entities/partner/commission.entity',
    'goal.entity': '@libs/infrastructure/entities/partner/goal.entity',
    'partner-allowed-loyalty-program-type.entity': '@libs/infrastructure/entities/partner/partner-allowed-loyalty-program-type.entity',

    # Customer
    'customer-membership.entity': '@libs/infrastructure/entities/customer/customer-membership.entity',
    'customer-tier.entity': '@libs/infrastructure/entities/customer/customer-tier.entity',
    'customer-tier-benefit.entity': '@libs/infrastructure/entities/customer/customer-tier-benefit.entity',
    'referral.entity': '@libs/infrastructure/entities/customer/referral.entity',
    'invitation-code.entity': '@libs/infrastructure/entities/customer/invitation-code.entity',

    # Communication
    'message-template.entity': '@libs/infrastructure/entities/communication/message-template.entity',
    'partner-message.entity': '@libs/infrastructure/entities/communication/partner-message.entity',
    'message-recipient.entity': '@libs/infrastructure/entities/communication/message-recipient.entity',
    'message-filter.entity': '@libs/infrastructure/entities/communication/message-filter.entity',
    'notification.entity': '@libs/infrastructure/entities/communication/notification.entity',

    # Tier
    'tier-policy.entity': '@libs/infrastructure/entities/tier/tier-policy.entity',
    'tier-status.entity': '@libs/infrastructure/entities/tier/tier-status.entity',
    'tier-benefit.entity': '@libs/infrastructure/entities/tier/tier-benefit.entity',
    'tier-benefit-exclusive-reward.entity': '@libs/infrastructure/entities/tier/tier-benefit-exclusive-reward.entity',
    'tier-benefit-category-benefit.entity': '@libs/infrastructure/entities/tier/tier-benefit-category-benefit.entity',
    'tier-benefit-category-exclusive-reward.entity': '@libs/infrastructure/entities/tier/tier-benefit-category-exclusive-reward.entity',

    # System
    'tenant.entity': '@libs/infrastructure/entities/system/tenant.entity',
    'tenant-features.entity': '@libs/infrastructure/entities/system/tenant-features.entity',
    'tenant-analytics.entity': '@libs/infrastructure/entities/system/tenant-analytics.entity',
    'country.entity': '@libs/infrastructure/entities/system/country.entity',
    'currency.entity': '@libs/infrastructure/entities/system/currency.entity',
    'rate-exchange.entity': '@libs/infrastructure/entities/system/rate-exchange.entity',
}

def update_file(file_path):
    """Actualiza los imports relativos en un archivo de entidad"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Patrón para encontrar imports relativos dentro de entidades: from './entity-name.entity'
        pattern = r"from\s+['\"]\./([^'\"]+\.entity)['\"]"

        def replace_import(match):
            entity_file = match.group(1)  # nombre del archivo

            if entity_file in ENTITY_MAPPING:
                return f"from '{ENTITY_MAPPING[entity_file]}'"
            else:
                # Si no encontramos el mapeo, mantener el original
                return match.group(0)

        content = re.sub(pattern, replace_import, content)

        # Solo escribir si hubo cambios
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True

        return False
    except Exception as e:
        print(f"Error procesando {file_path}: {e}")
        return False

def main():
    """Función principal"""
    base_path = Path(__file__).parent

    # Directorio de entidades
    entities_dir = base_path / 'libs' / 'infrastructure' / 'src' / 'persistence' / 'entities'

    updated_count = 0
    total_files = 0

    if not entities_dir.exists():
        print(f"Directorio no existe: {entities_dir}")
        return

    for file_path in entities_dir.rglob('*.entity.ts'):
        if file_path.is_file():
            total_files += 1
            if update_file(file_path):
                updated_count += 1
                print(f"Actualizado: {file_path.relative_to(base_path)}")

    print(f"\nProcesados {total_files} archivos, {updated_count} actualizados.")

if __name__ == '__main__':
    main()
