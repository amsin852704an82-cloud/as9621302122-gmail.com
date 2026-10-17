/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  User, 
  Product, 
  Order, 
  PrivateLabelRfq, 
  Settlement, 
  Dispute, 
  VendorQuotation 
} from './types/marketplace';
import { 
  MOCK_USERS, 
  MOCK_PRODUCTS, 
  MOCK_ORDERS, 
  MOCK_RFQS, 
  MOCK_SETTLEMENTS, 
  MOCK_DISPUTES, 
  MOCK_MANDI_BENCHMARKS 
} from './data/mockData';
import { Header } from './components/Header';
import { Marketplace } from './components/Marketplace';
import { VendorPortal } from './components/VendorPortal';
import { RfqHub } from './components/RfqHub';
import { OrdersAndInvoices } from './components/OrdersAndInvoices';
import { DisputeCenter } from './components/DisputeCenter';
import { SettlementsView } from './components/SettlementsView';
import { FirestoreInspector } from './components/FirestoreInspector';
import { OrderModal } from './components/OrderModal';
import { CartDrawer } from './components/CartDrawer';

export default function App() {
  // Current active persona: Retailer by default for instant procurement testing
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[3]); // Amit Gupta (Gupta Kirana)
  const [activeTab, setActiveTab] = useState<string>('marketplace');

  // Application Data States
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [rfqs, setRfqs] = useState<PrivateLabelRfq[]>(MOCK_RFQS);
  const [settlements, setSettlements] = useState<Settlement[]>(MOCK_SETTLEMENTS);
  const [disputes, setDisputes] = useState<Dispute[]>(MOCK_DISPUTES);
  const [benchmarks] = useState(MOCK_MANDI_BENCHMARKS);

  // Cart & Modals
  const [cartItems, setCartItems] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState<Product | null>(null);

  // Handlers
  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'vendor' && activeTab === 'marketplace') {
      setActiveTab('vendor');
    }
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleOrderPlaced = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);

    // Create corresponding settlement record (immutable financial ledger)
    const newSettlement: Settlement = {
      settlementId: `SETTLE-2026-${Math.floor(100 + Math.random() * 900)}`,
      vendorId: newOrder.vendorId,
      vendorBusinessName: newOrder.vendorBusinessName,
      orderId: newOrder.orderId,
      grossAmount: newOrder.subtotal,
      commissionDeducted: newOrder.platformCommissionAmount,
      tdsDeducted: Math.round((newOrder.subtotal * 0.01) * 100) / 100, // 1% Sec 194-O
      netPayable: Math.round((newOrder.subtotal - newOrder.platformCommissionAmount - (newOrder.subtotal * 0.01)) * 100) / 100,
      status: 'pending',
      payoutReference: `NEFT-PENDING-${newOrder.orderId}`,
    };

    setSettlements((prev) => [newSettlement, ...prev]);
  };

  const handleUpdateOrderStatus = (
    orderId: string, 
    status: Order['fulfillmentStatus'], 
    trackingNumber?: string
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.orderId !== orderId) return o;
        return {
          ...o,
          fulfillmentStatus: status,
          shippingDetails: trackingNumber
            ? {
                provider: o.shippingDetails?.provider || 'VRL Surface Freight',
                trackingNumber,
                dispatchedAt: new Date().toISOString(),
                estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              }
            : o.shippingDetails,
        };
      })
    );
  };

  const handleAddRfq = (newRfq: PrivateLabelRfq) => {
    setRfqs((prev) => [newRfq, ...prev]);
  };

  const handleSubmitVendorQuote = (rfqId: string, quote: VendorQuotation) => {
    setRfqs((prev) =>
      prev.map((r) => {
        if (r.rfqId !== rfqId) return r;
        return {
          ...r,
          status: 'quoted',
          vendorQuotations: [...r.vendorQuotations, quote],
        };
      })
    );
  };

  const handleAddDispute = (newDispute: Dispute) => {
    setDisputes((prev) => [newDispute, ...prev]);
    // Flag order disputeStatus
    setOrders((prev) =>
      prev.map((o) => (o.orderId === newDispute.orderId ? { ...o, disputeStatus: 'open' } : o))
    );
    // Put settlement on hold
    setSettlements((prev) =>
      prev.map((s) => (s.orderId === newDispute.orderId ? { ...s, status: 'on_hold', payoutReference: 'HOLD_PENDING_DISPUTE' } : s))
    );
  };

  const handleResolveDispute = (
    disputeId: string, 
    resolutionType: Dispute['resolutionType'], 
    notes: string, 
    refundAmount?: number
  ) => {
    setDisputes((prev) =>
      prev.map((d) => {
        if (d.disputeId !== disputeId) return d;
        return {
          ...d,
          status: 'resolved',
          resolutionType,
          adminResolutionNotes: notes,
          refundAmount,
          resolvedAt: new Date().toISOString(),
        };
      })
    );

    // Release settlement or adjust for refund
    const targetDispute = disputes.find((d) => d.disputeId === disputeId);
    if (targetDispute) {
      setOrders((prev) =>
        prev.map((o) => (o.orderId === targetDispute.orderId ? { ...o, disputeStatus: 'resolved' } : o))
      );
      setSettlements((prev) =>
        prev.map((s) => {
          if (s.orderId !== targetDispute.orderId) return s;
          const adjustedNet = refundAmount ? Math.max(0, s.netPayable - refundAmount) : s.netPayable;
          return {
            ...s,
            status: 'processed',
            netPayable: adjustedNet,
            payoutReference: `NEFT-DISPUTE-SETTLED-${Date.now().toString().slice(-6)}`,
            settledAt: new Date().toISOString(),
          };
        })
      );
    }
  };

  const handleReleaseHold = (settlementId: string) => {
    setSettlements((prev) =>
      prev.map((s) =>
        s.settlementId === settlementId
          ? {
              ...s,
              status: 'processed',
              payoutReference: `NEFT-ESCROW-RELEASE-${Date.now().toString().slice(-6)}`,
              settledAt: new Date().toISOString(),
            }
          : s
      )
    );
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 font-sans flex flex-col selection:bg-amber-200">
      {/* Navigation Header with Live Mandi Ticker and Role Switcher */}
      <Header
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        allUsers={MOCK_USERS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        benchmarks={benchmarks}
        cartCount={cartItems.length}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Main Tab Views */}
      <main className="flex-1 pb-16">
        {activeTab === 'marketplace' && (
          <Marketplace
            products={products}
            benchmarks={benchmarks}
            currentUser={currentUser}
            onOpenOrderModal={(prod) => setSelectedProductForOrder(prod)}
          />
        )}

        {activeTab === 'vendor' && (
          <VendorPortal
            currentUser={currentUser}
            products={products}
            orders={orders}
            onAddProduct={handleAddProduct}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {activeTab === 'rfq' && (
          <RfqHub
            currentUser={currentUser}
            rfqs={rfqs}
            onAddRfq={handleAddRfq}
            onSubmitQuote={handleSubmitVendorQuote}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersAndInvoices
            orders={orders}
            currentUser={currentUser}
            onOpenDisputeForOrder={(order) => {
              setActiveTab('disputes');
            }}
          />
        )}

        {activeTab === 'disputes' && (
          <DisputeCenter
            currentUser={currentUser}
            disputes={disputes}
            orders={orders}
            onAddDispute={handleAddDispute}
            onResolveDispute={handleResolveDispute}
          />
        )}

        {activeTab === 'settlements' && (
          <SettlementsView
            currentUser={currentUser}
            settlements={settlements}
            onReleaseHold={handleReleaseHold}
          />
        )}

        {activeTab === 'rules' && <FirestoreInspector />}
      </main>

      {/* Order Placement Modal */}
      {selectedProductForOrder && (
        <OrderModal
          product={selectedProductForOrder}
          currentUser={currentUser}
          onClose={() => setSelectedProductForOrder(null)}
          onOrderPlaced={(newOrder) => {
            handleOrderPlaced(newOrder);
            setActiveTab('orders');
          }}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        currentUser={currentUser}
        onUpdateQuantity={(productId, qty) => {
          setCartItems((prev) =>
            prev.map((item) => (item.product.productId === productId ? { ...item, quantity: qty } : item))
          );
        }}
        onRemoveItem={(productId) => {
          setCartItems((prev) => prev.filter((item) => item.product.productId !== productId));
        }}
        onClearCart={() => setCartItems([])}
        onOrderPlaced={(newOrder) => {
          handleOrderPlaced(newOrder);
          setActiveTab('orders');
        }}
      />
    </div>
  );
}
