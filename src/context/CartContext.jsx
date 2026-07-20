import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

// A cart item looks like:
// {
//   cartId: string (local uuid),
//   service: { id, name_fr, name_en, price_xaf, ... },
//   values: { [requirementId]: string | File | File[] }
// }
// Kept in memory only (not localStorage) because file inputs can't be
// serialized — the cart resets on a hard refresh. If persistence across
// reloads becomes a priority later, swap this for IndexedDB.
export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  function addItem(service, values) {
    setItems((prev) => [
      ...prev,
      { cartId: crypto.randomUUID(), service, values }
    ])
  }

  function removeItem(cartId) {
    setItems((prev) => prev.filter((i) => i.cartId !== cartId))
  }

  function clearCart() {
    setItems([])
  }

  const total = items.reduce(
    (sum, i) => sum + Number(i.service.price_xaf || 0),
    0
  )

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, clearCart, total }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
