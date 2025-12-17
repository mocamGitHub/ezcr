// Shared TypeScript types for shipping integration

export interface ShippingQuote {
  quoteId: string;
  baseRate: number;
  residentialSurcharge: number;
  totalRate: number;
  destinationTerminal?: {
    code: string;
    name: string;
  };
  transitDays?: number;
  validUntil: string;
}

export interface ShippingAddress {
  streetAddress: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  isResidential: boolean;
}

export type DeliveryMethod = 'shipping' | 'pickup';

export type ProductSku = 'AUN200' | 'AUN250';

export interface Product {
  sku: ProductSku;
  name: string;
  price: number;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  freightClass: string;
}

export const PRODUCTS: Record<ProductSku, Product> = {
  AUN200: {
    sku: 'AUN200',
    name: 'EZ Cycle Ramp AUN 200',
    price: 2495,
    weight: 300,
    dimensions: { length: 96, width: 48, height: 12 },
    freightClass: '125',
  },
  AUN250: {
    sku: 'AUN250',
    name: 'EZ Cycle Ramp AUN 250',
    price: 2795,
    weight: 350,
    dimensions: { length: 84, width: 48, height: 14 },
    freightClass: '125',
  },
};

export const PICKUP_LOCATION = {
  name: 'EZ Cycle Ramp Warehouse',
  address: '2500 Continental Blvd',
  city: 'Woodstock',
  state: 'GA',
  zip: '30188',
  hours: 'Mon-Fri 8am-5pm',
  phone: '(937) 725-6790',
};

export const RESIDENTIAL_SURCHARGE = 150;
