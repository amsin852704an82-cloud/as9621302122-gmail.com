/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Product, User, Order } from '../types/marketplace';
import { calculateSpiceGst, formatINR } from '../utils/compliance';
import { ShoppingBag, X, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currentUser: User;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOrderPlaced: (order: Order) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  currentUser,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderPlaced,
}) => {
  if (!isOpen) return null;

  // Group or calculate cart total
  const subtotal = cartItems.reduce((sum, item) => {
    const tier = item.product.priceTiers.find(
      (t) => item.quantity >= t.minQty && (t.maxQty ? item.quantity <= t.maxQty : true)
    ) || { unitPrice: item.product.basePricePerUnit };
    return sum + item.quantity * tier.unitPrice;
  }, 0);

  // Take primary vendor state from first item
  const primaryVendorState = cartItems[0]?.product.originState || 'Gujarat';
  const gstDetails = calculateSpiceGst(subtotal, primaryVendorState, currentUser.state, 5);
  const shippingCharges = cartItems.length > 0 ? (subtotal > 100000 ? 3000 : 1500) : 0;
  const grandTotal = Math.round((subtotal + gstDetails.totalGst + shippingCharges) * 100) / 100;

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    const newOrder: Order = {
      orderId: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      retailerId: currentUser.uid,
      retailerBusinessName: currentUser.businessName,
      retailerGstin: currentUser.gstin || '24AAEFG9812C1ZH',
      retailerState: currentUser.state,
      vendorId: cartItems[0].product.vendorId,
      vendorBusinessName: cartItems[0].product.vendorBusinessName,
      vendorGstin: '24AAACS1429B1Z5',
      vendorState: primaryVendorState,
      items: cartItems.map((item) => {
        const tier = item.product.priceTiers.find(
          (t) => item.quantity >= t.minQty && (t.maxQty ? item.quantity <= t.maxQty : true)
        ) || { unitPrice: item.product.basePricePerUnit };
        const lineTotal = item.quantity * tier.unitPrice;
        const lineGst = Math.round((lineTotal * 0.05) * 100) / 100;
        return {
          productId: item.product.productId,
          title: item.product.title,
          category: item.product.category,
          hsnCode: item.product.hsnCode,
          qty: item.quantity,
          unitPrice: tier.unitPrice,
          lineTotal,
          gstAmount: lineGst,
        };
      }),
      subtotal,
      gstTotal: gstDetails.totalGst,
      cgstAmount: gstDetails.cgstAmount,
      sgstAmount: gstDetails.sgstAmount,
      igstAmount: gstDetails.igstAmount,
      isInterState: gstDetails.isInterState,
      shippingCharges,
      platformCommissionRate: 3.0,
      platformCommissionAmount: Math.round((subtotal * 0.03) * 100) / 100,
      grandTotal,
      paymentStatus: 'paid',
      fulfillmentStatus: 'confirmed',
      shippingDetails: {
        provider: 'VRL Logistics B2B Freight',
        trackingNumber: `VRL-CHECKOUT-${Math.floor(100000 + Math.random() * 900000)}`,
        dispatchedAt: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      disputeStatus: null,
      createdAt: new Date().toISOString(),
    };

    onOrderPlaced(newOrder);
    onClearCart();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-stone-900 text-base">Wholesale Procurement Cart</h3>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {cartItems.length}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body: Cart Items */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 space-y-3 p-8">
              <ShoppingBag className="w-12 h-12 text-stone-200" />
              <p className="text-sm font-semibold text-stone-600">Your wholesale cart is empty</p>
              <p className="text-xs text-stone-400">Add spice lots from the Mandi Marketplace to proceed with GST checkout.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map(({ product, quantity }) => {
                const tier = product.priceTiers.find(
                  (t) => quantity >= t.minQty && (t.maxQty ? quantity <= t.maxQty : true)
                ) || { unitPrice: product.basePricePerUnit };
                const lineTotal = quantity * tier.unitPrice;

                return (
                  <div key={product.productId} className="border border-stone-200 rounded-xl p-3 text-xs space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-mono text-[10px] text-stone-400">HSN {product.hsnCode}</span>
                        <h4 className="font-bold text-stone-900 line-clamp-1">{product.title}</h4>
                        <span className="text-stone-500 text-[11px]">{formatINR(tier.unitPrice)} / kg</span>
                      </div>
                      <button
                        onClick={() => onRemoveItem(product.productId)}
                        className="text-stone-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-stone-500 font-medium">Qty (kg):</label>
                        <input
                          type="number"
                          step={25}
                          min={product.moq}
                          value={quantity}
                          onChange={(e) => onUpdateQuantity(product.productId, Math.max(product.moq, Number(e.target.value)))}
                          className="w-20 bg-stone-50 border border-stone-300 rounded p-1 font-bold text-stone-900 text-center"
                        />
                      </div>
                      <span className="font-extrabold text-stone-900 text-sm">{formatINR(lineTotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer: GST & Total */}
        {cartItems.length > 0 && (
          <div className="p-5 border-t border-stone-200 bg-stone-50 space-y-3 text-xs">
            <div className="space-y-1 text-stone-600">
              <div className="flex justify-between">
                <span>Taxable Lot Subtotal:</span>
                <span className="font-semibold text-stone-800">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5% HSN 0904-0910):</span>
                <span className="font-semibold text-stone-800">{formatINR(gstDetails.totalGst)}</span>
              </div>
              <div className="flex justify-between">
                <span>B2B Freight Transport:</span>
                <span className="font-semibold text-stone-800">{formatINR(shippingCharges)}</span>
              </div>
              <div className="border-t border-stone-200 pt-2 flex justify-between font-black text-sm text-stone-900">
                <span>Grand Total (incl. GST):</span>
                <span className="text-amber-800 text-base">{formatINR(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors text-xs"
            >
              <span>Confirm & Generate GST Tax Invoice</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
