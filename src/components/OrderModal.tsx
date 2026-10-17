/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, User, Order } from '../types/marketplace';
import { calculateSpiceGst, formatINR } from '../utils/compliance';
import { CheckCircle2, ShieldCheck, Truck } from 'lucide-react';

interface OrderModalProps {
  product: Product;
  currentUser: User;
  onClose: () => void;
  onOrderPlaced: (order: Order) => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  product,
  currentUser,
  onClose,
  onOrderPlaced,
}) => {
  const [quantity, setQuantity] = useState<number>(product.moq);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingProvider] = useState('VRL Surface Express Logistics');

  // Determine active unit price based on tiered quantity
  const activeTier = product.priceTiers.find(
    (t) => quantity >= t.minQty && (t.maxQty ? quantity <= t.maxQty : true)
  ) || { unitPrice: product.basePricePerUnit, minQty: product.moq, maxQty: 999999 };

  const unitPrice = activeTier.unitPrice;
  const subtotal = quantity * unitPrice;
  const shippingCharges = quantity >= 500 ? 2500 : 1200;

  // Calculate Indian GST
  const gstDetails = calculateSpiceGst(
    subtotal,
    product.originState,
    currentUser.state,
    product.gstRate
  );

  const grandTotal = Math.round((subtotal + gstDetails.totalGst + shippingCharges) * 100) / 100;
  const platformCommissionRate = 3.0;
  const platformCommissionAmount = Math.round(((subtotal * platformCommissionRate) / 100) * 100) / 100;

  const handleConfirmOrder = () => {
    if (quantity < product.moq) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newOrder: Order = {
        orderId: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        retailerId: currentUser.uid,
        retailerBusinessName: currentUser.businessName,
        retailerGstin: currentUser.gstin || '24AAEFG9812C1ZH',
        retailerState: currentUser.state,
        vendorId: product.vendorId,
        vendorBusinessName: product.vendorBusinessName,
        vendorGstin: '24AAACS1429B1Z5',
        vendorState: product.originState,
        items: [
          {
            productId: product.productId,
            title: product.title,
            category: product.category,
            hsnCode: product.hsnCode,
            qty: quantity,
            unitPrice: unitPrice,
            lineTotal: subtotal,
            gstAmount: gstDetails.totalGst,
          },
        ],
        subtotal: subtotal,
        gstTotal: gstDetails.totalGst,
        cgstAmount: gstDetails.cgstAmount,
        sgstAmount: gstDetails.sgstAmount,
        igstAmount: gstDetails.igstAmount,
        isInterState: gstDetails.isInterState,
        shippingCharges: shippingCharges,
        platformCommissionRate: platformCommissionRate,
        platformCommissionAmount: platformCommissionAmount,
        grandTotal: grandTotal,
        paymentStatus: 'paid',
        fulfillmentStatus: 'confirmed',
        shippingDetails: {
          provider: shippingProvider,
          trackingNumber: `EXP-DEL-${Math.floor(100000 + Math.random() * 900000)}`,
          dispatchedAt: new Date().toISOString(),
          estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        disputeStatus: null,
        createdAt: new Date().toISOString(),
      };

      onOrderPlaced(newOrder);
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-stone-100 pb-4">
          <div>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
              B2B Commercial Tax Order
            </span>
            <h3 className="text-lg font-bold text-stone-900 mt-1">{product.title}</h3>
            <p className="text-xs text-stone-500">
              Vendor: <strong className="text-stone-700">{product.vendorBusinessName}</strong> ({product.originState})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 font-bold text-lg p-1"
          >
            ✕
          </button>
        </div>

        {/* Quantity and Tier Rate Selector */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label className="font-bold text-stone-800">Order Quantity (kg)</label>
              <span className="text-stone-500 font-medium">Minimum MOQ: {product.moq} kg</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={product.moq}
                step={25}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(product.moq, Number(e.target.value)))}
                className="w-full text-base font-bold bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-sm font-semibold text-stone-600 shrink-0">KG</span>
            </div>
            {quantity < product.moq && (
              <p className="text-[11px] text-red-600 mt-1">Quantity cannot be less than MOQ ({product.moq} kg)</p>
            )}
          </div>

          {/* Tier price preview */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs flex items-center justify-between">
            <div>
              <span className="text-stone-500 block text-[11px]">Applied Price Tier</span>
              <strong className="text-amber-800 text-sm">{formatINR(unitPrice)} / kg</strong>
            </div>
            <div className="text-right">
              <span className="text-stone-500 block text-[11px]">Taxable Lot Subtotal</span>
              <strong className="text-stone-900 text-sm">{formatINR(subtotal)}</strong>
            </div>
          </div>

          {/* Indian GST Compliance Breakdown */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between font-bold text-stone-900 border-b border-amber-200/60 pb-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>GST Breakdown (HSN {product.hsnCode})</span>
              </span>
              <span className="bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded text-[10px]">
                {gstDetails.isInterState ? 'Inter-state IGST' : 'Intra-state CGST + SGST'}
              </span>
            </div>

            <div className="flex justify-between text-stone-600">
              <span>Taxable Value:</span>
              <span className="font-semibold text-stone-800">{formatINR(subtotal)}</span>
            </div>

            {gstDetails.isInterState ? (
              <div className="flex justify-between text-stone-600">
                <span>Integrated GST (IGST 5%):</span>
                <span className="font-semibold text-stone-900">{formatINR(gstDetails.igstAmount)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-stone-600">
                  <span>Central GST (CGST 2.5%):</span>
                  <span className="font-semibold text-stone-900">{formatINR(gstDetails.cgstAmount)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>State GST (SGST 2.5%):</span>
                  <span className="font-semibold text-stone-900">{formatINR(gstDetails.sgstAmount)}</span>
                </div>
              </>
            )}

            <div className="flex justify-between text-stone-600">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-stone-500" />
                <span>Commercial B2B Surface Freight:</span>
              </span>
              <span className="font-semibold text-stone-800">{formatINR(shippingCharges)}</span>
            </div>

            <div className="border-t border-amber-200 pt-2 flex justify-between items-center text-sm font-extrabold text-stone-900">
              <span>Invoice Grand Total (incl. GST):</span>
              <span className="text-amber-700 text-base">{formatINR(grandTotal)}</span>
            </div>
          </div>

          {/* Buyer Details */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs space-y-1">
            <div className="flex justify-between text-stone-500">
              <span>Billed to:</span>
              <span className="font-semibold text-stone-800">{currentUser.businessName}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Buyer GSTIN:</span>
              <span className="font-mono text-stone-800">{currentUser.gstin || '24AAEFG9812C1ZH'}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Delivery State:</span>
              <span className="font-semibold text-stone-800">{currentUser.state}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmOrder}
            disabled={isSubmitting || quantity < product.moq}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Generating Invoice & Confirming...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Wholesale Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
