export type ProductVariant = {
  id: string;
  label: string;
  price: number;
  /** Packed weight/size for this variant, used for shipping cost calculation. */
  shipping: {
    weightKg: number;
    dimensionsCm: { length: number; width: number; height: number };
  };
};

export type Product = {
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  /** Short scannable selling points shown as bullets on the product page. */
  highlights: string[];
  caption: string;
  image: string | null;
  /** Up to 3 gallery photos for the product detail page. */
  images: (string | null)[];
  variants: ProductVariant[];
  amazonUrl?: string;
};

const AMAZON_URL = "https://link.amazon/B010Gv0Aj";

const RICE_PRICE_PER_KG = 120;
// 3% off the linear price for every kg above 1kg (e.g. a 4kg pack gets 9% off).
const BULK_DISCOUNT_PER_KG = 0.03;

function bulkPrice(pricePerKg: number, weightKg: number): number {
  const discount = BULK_DISCOUNT_PER_KG * (weightKg - 1);
  return Math.round(pricePerKg * weightKg * (1 - discount));
}

const RICE_VARIANTS: ProductVariant[] = [
  {
    id: "2kg",
    label: "2 kg",
    price: bulkPrice(RICE_PRICE_PER_KG, 2),
    shipping: {
      weightKg: 2.1,
      dimensionsCm: { length: 30, width: 20, height: 7 },
    },
  },
  {
    id: "4kg",
    label: "4 kg",
    price: bulkPrice(RICE_PRICE_PER_KG, 4),
    shipping: {
      weightKg: 4.15,
      dimensionsCm: { length: 35, width: 25, height: 9 },
    },
  },
  {
    id: "5kg",
    label: "5 kg",
    price: bulkPrice(RICE_PRICE_PER_KG, 5),
    shipping: {
      weightKg: 5.2,
      dimensionsCm: { length: 40, width: 25, height: 9 },
    },
  },
];

export const PRODUCTS: Product[] = [
  {
    slug: "high-fiber-raw-rice",
    name: "High Fiber Raw Rice",
    description:
      "Traditional Kerala rice with excellent taste and high fiber content.",
    longDescription:
      "Grown on our own farms in Kerala, this raw rice is minimally polished to retain its natural bran and fiber. A daily staple with a satisfying bite, perfect for everyday meals.",
    highlights: [
      "Grown on our own farms in Kerala",
      "Minimally polished to retain natural bran and fiber",
      "Satisfying bite, great for everyday meals",
      "Naturally high in dietary fiber",
    ],
    caption: "high fiber raw rice — pack + grains",
    image: "/products/raw-rice.jpg",
    images: ["/products/raw-rice.jpg", "/products/raw-rice-loose.jpg", null],
    variants: RICE_VARIANTS,
    amazonUrl: AMAZON_URL,
  },
  {
    slug: "dosa-rice",
    name: "Dosa Rice",
    description: "Perfect texture for crispy, golden dosas.",
    longDescription:
      "Specially selected for its starch content and grind quality, our dosa rice delivers crispy, golden dosas every time — a South Indian breakfast essential.",
    highlights: [
      "Selected for ideal starch content and grind quality",
      "Delivers crispy, golden dosas every time",
      "A South Indian breakfast essential",
      "Grown and packed on our own farms",
    ],
    caption: "dosa rice",
    image: "/products/2-kg-dosa-rice.jpg",
    images: [
      "/products/2-kg-dosa-rice.jpg",
      "/products/raw-rice-loose.jpg",
      "/products/prpration-dosa-rice.jpg",
    ],
    variants: RICE_VARIANTS,
    amazonUrl: AMAZON_URL,
  },
  {
    slug: "appam-rice",
    name: "Appam Rice",
    description: "Traditional Kerala appam rice for lacy, soft appams.",
    longDescription:
      "Sourced from traditional Kerala paddy varieties, this appam rice ferments beautifully for lacy-edged, soft-centered appams.",
    highlights: [
      "Sourced from traditional Kerala paddy varieties",
      "Ferments beautifully for lacy-edged, soft appams",
      "Grown and packed on our own farms",
      "A trusted staple for South Indian breakfasts",
    ],
    caption: "appam rice",
    image: "/products/2-kg-appam-rice.jpg",
    images: ["/products/2-kg-appam-rice.jpg", "/products/raw-rice-loose.jpg", null],
    variants: RICE_VARIANTS,
    amazonUrl: AMAZON_URL,
  },
  {
    slug: "idli-rice",
    name: "Idli Rice",
    description: "Soft, fluffy idlis every single time.",
    longDescription:
      "A parboiled rice variety chosen for consistent fermentation, giving you soft, fluffy idlis on every batch.",
    highlights: [
      "Parboiled rice chosen for consistent fermentation",
      "Gives soft, fluffy idlis on every batch",
      "A trusted South Indian kitchen staple",
      "Grown and packed on our own farms",
    ],
    caption: "idli rice",
    image: "/products/2-kg-idli-rice.jpg",
    images: ["/products/2-kg-idli-rice.jpg", "/products/raw-rice-loose.jpg", null],
    variants: RICE_VARIANTS,
    amazonUrl: AMAZON_URL,
  },
  {
    slug: "malabar-tamarind",
    name: "Malabar Tamarind (Kudampuli)",
    description:
      "Naturally sun-dried on our own farms — the soul of Kerala fish curry.",
    longDescription:
      "Also known as kudampuli or gambooge, our Malabar tamarind is hand-picked and naturally sun-dried on our own farms, giving Kerala fish curry its signature tang.",
    highlights: [
      "Hand-picked and naturally sun-dried on our own farms",
      "Also known as kudampuli or gambooge",
      "Gives Kerala fish curry its signature tang",
      "No additives, naturally processed",
    ],
    caption: "malabar tamarind — sun-dried kudampuli",
    image: "/products/kudam-puli.jpg",
    images: [
      "/products/kudam-puli.jpg",
      "/products/malabar-tamarind-high-oil-content.jpg",
      "/products/malabar-tamarind-specs.jpg",
    ],
    amazonUrl: AMAZON_URL,
    variants: [
      {
        id: "500g",
        label: "500 g",
        price: 225,
        shipping: {
          weightKg: 0.55,
          dimensionsCm: { length: 14, width: 10, height: 6 },
        },
      },
      {
        id: "1kg",
        label: "1 kg",
        price: 450,
        shipping: {
          weightKg: 1.1,
          dimensionsCm: { length: 18, width: 12, height: 8 },
        },
      },
      {
        id: "2kg",
        label: "2 kg",
        price: 900,
        shipping: {
          weightKg: 2.15,
          dimensionsCm: { length: 22, width: 15, height: 10 },
        },
      },
    ],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((product) => product.slug === slug);
}

export function getVariant(
  slug: string,
  variantId: string,
): ProductVariant | undefined {
  return getProductBySlug(slug)?.variants.find((v) => v.id === variantId);
}

export function getDefaultVariant(product: Product): ProductVariant {
  return product.variants[0];
}

export function getLowestPrice(product: Product): number {
  return Math.min(...product.variants.map((v) => v.price));
}
