import { useMemo, useState } from "react";

import type { Product } from "@/lib/api";

export interface CartLine {
  product: Product;
  quantity: number;
  unitPrice: number;
}

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);

  function addProduct(product: Product) {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: Number(product.costPrice) }];
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    setLines((prev) =>
      prev.map((l) => (l.product.id === productId ? { ...l, quantity: Math.max(0.001, quantity) } : l)),
    );
  }

  function updateUnitPrice(productId: string, unitPrice: number) {
    setLines((prev) =>
      prev.map((l) => (l.product.id === productId ? { ...l, unitPrice: Math.max(0, unitPrice) } : l)),
    );
  }

  function removeLine(productId: string) {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  }

  function clear() {
    setLines([]);
  }

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    for (const line of lines) {
      const lineSubtotal = line.unitPrice * line.quantity;
      const lineTax = lineSubtotal * (Number(line.product.taxRate) / 100);
      subtotal += lineSubtotal;
      tax += lineTax;
    }
    return { subtotal, tax, total: subtotal + tax };
  }, [lines]);

  return { lines, addProduct, updateQuantity, updateUnitPrice, removeLine, clear, totals };
}
