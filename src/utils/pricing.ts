import { Promo, Property } from '../types';

export const calculateBestPrice = (property: Property, promos: Promo[]) => {
  const basePrice = property.basePrice;
  let bestPrice = basePrice;
  let appliedPromo: Promo | null = null;

  const now = Date.now();
  const activePromos = promos.filter(promo => 
    promo.isActive && 
    promo.startDate <= now && 
    promo.endDate >= now &&
    (!promo.applicableProperties || promo.applicableProperties.length === 0 || promo.applicableProperties.includes(property.id))
  );

  activePromos.forEach(promo => {
    let currentPrice = basePrice;
    if (promo.discountType === 'percentage') {
      currentPrice = basePrice * (1 - promo.discountAmount / 100);
    } else {
      currentPrice = basePrice - promo.discountAmount;
    }

    if (currentPrice < bestPrice) {
      bestPrice = currentPrice;
      appliedPromo = promo;
    }
  });

  return {
    originalPrice: basePrice,
    discountedPrice: bestPrice,
    appliedPromo,
    hasDiscount: bestPrice < basePrice
  };
};
