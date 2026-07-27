"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { getVariant } from "@/data/products";

export type CartItem = {
  slug: string;
  variantId: string;
  quantity: number;
};

const STORAGE_KEY = "zaurabhya-cart";
const EMPTY_ITEMS: CartItem[] = [];

let items: CartItem[] = EMPTY_ITEMS;
const listeners = new Set<() => void>();

function isValidCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.slug === "string" &&
    item.slug.length > 0 &&
    typeof item.variantId === "string" &&
    item.variantId.length > 0 &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity >= 1
  );
}

function isKnownVariant(item: CartItem): boolean {
  return Boolean(getVariant(item.slug, item.variantId));
}

function readFromStorage(): CartItem[] {
  if (typeof window === "undefined") return EMPTY_ITEMS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_ITEMS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY_ITEMS;
    return parsed.filter(isValidCartItem).filter(isKnownVariant);
  } catch {
    return EMPTY_ITEMS;
  }
}

if (typeof window !== "undefined") {
  items = readFromStorage();
}

function setItems(next: CartItem[]) {
  items = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return items;
}

function getServerSnapshot() {
  return EMPTY_ITEMS;
}

function isSameLine(item: CartItem, slug: string, variantId: string) {
  return item.slug === slug && item.variantId === variantId;
}

function addItem(slug: string, variantId: string, quantity = 1) {
  const existing = items.find((item) => isSameLine(item, slug, variantId));
  if (existing) {
    setItems(
      items.map((item) =>
        isSameLine(item, slug, variantId)
          ? { ...item, quantity: item.quantity + quantity }
          : item,
      ),
    );
  } else {
    setItems([...items, { slug, variantId, quantity }]);
  }
}

function removeItem(slug: string, variantId: string) {
  setItems(items.filter((item) => !isSameLine(item, slug, variantId)));
}

function setQuantity(slug: string, variantId: string, quantity: number) {
  if (quantity < 1) {
    removeItem(slug, variantId);
    return;
  }
  setItems(
    items.map((item) =>
      isSameLine(item, slug, variantId) ? { ...item, quantity } : item,
    ),
  );
}

function clear() {
  setItems(EMPTY_ITEMS);
}

type CartContextValue = {
  items: CartItem[];
  addItem: typeof addItem;
  removeItem: typeof removeItem;
  setQuantity: typeof setQuantity;
  clear: typeof clear;
  itemCount: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const currentItems = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (currentItems.some((item) => !isKnownVariant(item))) {
      setItems(currentItems.filter(isKnownVariant));
    }
  }, [currentItems]);

  const itemCount = currentItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = currentItems.reduce((sum, item) => {
    const variant = getVariant(item.slug, item.variantId);
    return variant ? sum + variant.price * item.quantity : sum;
  }, 0);

  const value = useMemo(
    () => ({
      items: currentItems,
      addItem,
      removeItem,
      setQuantity,
      clear,
      itemCount,
      subtotal,
    }),
    [currentItems, itemCount, subtotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
