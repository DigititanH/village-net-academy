import { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    try {
      const res = await api.get("/cart");
      setItems(res.data);
    } catch { setItems([]); }
    setLoading(false);
  };

  useEffect(() => { fetchCart(); }, [user]);

  const addToCart = async (product_id, quantity = 1, size, color) => {
    await api.post("/cart", { product_id, quantity, size, color });
    await fetchCart();
  };

  const updateQuantity = async (id, quantity) => {
    await api.put(`/cart/${id}`, { quantity });
    await fetchCart();
  };

  const updateSize = async (id, size) => {
    await api.put(`/cart/${id}`, { size });
    await fetchCart();
  };

  const removeItem = async (id) => {
    await api.delete(`/cart/${id}`);
    await fetchCart();
  };

  const clearCart = async () => {
    await api.delete("/cart");
    setItems([]);
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, addToCart, updateQuantity, updateSize, removeItem, clearCart, total, count, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
