import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const CartContext = createContext(null);

// Estado global del carrito: SOLO lo que necesitan varias pantallas
// (artículos y hora de recogida). El nombre y las notas viven en
// CheckoutPanel: si estuvieran aquí, cada tecla re-renderizaría todo
// el menú y se perderían caracteres al teclear.
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [pickupTime, setPickupTime] = useState('Receso 1');

  const addItem = useCallback((item) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, image_url: item.image_url, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id, qty) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.id !== id));
      return;
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.16 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const value = useMemo(() => ({
    items, addItem, removeItem, updateQuantity, clearCart,
    itemCount, subtotal, tax, total,
    pickupTime, setPickupTime
  }), [items, pickupTime, itemCount, subtotal, tax, total, addItem, removeItem, updateQuantity, clearCart]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}