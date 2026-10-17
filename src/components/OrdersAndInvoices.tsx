/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, User } from '../types/marketplace';
import { formatINR, INDIAN_STATES } from '../utils/compliance';
import { 
  FileText, 
  Printer, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  Building2,
  Download
} from 'lucide-react';

interface OrdersAndInvoicesProps {
  orders: Order[];
  currentUser: User;
  onOpenDisputeForOrder: (order: Order) => void;
}

export const OrdersAndInvoices: React.FC<OrdersAndInvoicesProps> = ({
  orders,
  currentUser,
  onOpenDisputeForOrder,
}) => {
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // Filter orders according to user role
  const relevantOrders = orders.filter((o) => {
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'vendor') return o.vendorId === currentUser.uid;
    return o.retailerId === currentUser.uid;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>GST-Compliant B2B E-Invoicing</span>
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mt-1">Orders & Tax Invoices (Chapter 09)</h2>
          <p className="text-xs text-stone-500">
            View orders, live tracking with logistics carriers, and generate downloadable GST B2B tax invoices with HSN breakdown.
          </p>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {relevantOrders.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-500 space-y-2">
            <FileText className="w-12 h-12 text-stone-300 mx-auto" />
            <h4 className="font-bold text-stone-800 text-sm">No orders found</h4>
            <p className="text-xs">Browse the Mandi Marketplace to place your first wholesale spice order.</p>
          </div>
        ) : (
          relevantOrders.map((order) => (
            <div
              key={order.orderId}
              className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4 transition-all hover:border-amber-200"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-stone-900">{order.orderId}</span>
                    <span className="text-xs text-stone-400">
                      • {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        order.fulfillmentStatus === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.fulfillmentStatus === 'dispatched'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.fulfillmentStatus}
                    </span>
                    {order.disputeStatus === 'open' && (
                      <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        <span>Dispute Open</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Buyer: <strong className="text-stone-800">{order.retailerBusinessName}</strong> ({order.retailerState}) &bull; Seller: <strong className="text-stone-800">{order.vendorBusinessName}</strong> ({order.vendorState})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedInvoiceOrder(order)}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-stone-600" />
                    <span>View GST Tax Invoice</span>
                  </button>

                  {order.disputeStatus !== 'open' && (
                    <button
                      onClick={() => onOpenDisputeForOrder(order)}
                      className="bg-white border border-stone-300 hover:border-red-400 hover:text-red-700 text-stone-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                      <span>Raise Dispute</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-3">Commodity & Description</th>
                      <th className="py-2.5 px-3">HSN Code</th>
                      <th className="py-2.5 px-3">Quantity</th>
                      <th className="py-2.5 px-3">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right">Taxable Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-3 font-semibold text-stone-900">{item.title}</td>
                        <td className="py-3 px-3 font-mono">{item.hsnCode}</td>
                        <td className="py-3 px-3">{item.qty} kg</td>
                        <td className="py-3 px-3">{formatINR(item.unitPrice)} / kg</td>
                        <td className="py-3 px-3 text-right font-bold text-stone-900">{formatINR(item.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial & Shipping Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                {/* Shipping Details */}
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-stone-900">
                    <Truck className="w-4 h-4 text-amber-600" />
                    <span>Logistics Dispatch Status</span>
                  </div>
                  {order.shippingDetails?.trackingNumber ? (
                    <div className="space-y-1 text-stone-600">
                      <p>Carrier: <strong className="text-stone-900">{order.shippingDetails.provider}</strong></p>
                      <p>AWB / Docket No: <strong className="font-mono text-stone-900">{order.shippingDetails.trackingNumber}</strong></p>
                      <p>Status: <span className="text-emerald-700 font-semibold">In Transit to {order.retailerState}</span></p>
                    </div>
                  ) : (
                    <p className="text-stone-500 italic">Vendor preparing lot for pickup and lab sampling.</p>
                  )}
                </div>

                {/* Tax Breakdown */}
                <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/80 space-y-1 text-stone-700">
                  <div className="flex justify-between">
                    <span>Taxable Lot Value:</span>
                    <span className="font-medium">{formatINR(order.subtotal)}</span>
                  </div>
                  {order.isInterState ? (
                    <div className="flex justify-between">
                      <span>IGST (5%):</span>
                      <span className="font-medium">{formatINR(order.igstAmount || order.gstTotal)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>CGST (2.5%):</span>
                        <span className="font-medium">{formatINR(order.cgstAmount || order.gstTotal / 2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST (2.5%):</span>
                        <span className="font-medium">{formatINR(order.sgstAmount || order.gstTotal / 2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span>Freight / Surface Transport:</span>
                    <span className="font-medium">{formatINR(order.shippingCharges)}</span>
                  </div>
                  <div className="border-t border-amber-200 pt-1 flex justify-between font-extrabold text-stone-900 text-sm">
                    <span>Invoice Grand Total:</span>
                    <span className="text-amber-800">{formatINR(order.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Official GST Tax Invoice Modal */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-stone-200 space-y-6 max-h-[95vh] overflow-y-auto">
            {/* Modal Controls */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-4 print:hidden">
              <span className="text-xs font-bold text-stone-500">Government of India GST Tax Invoice Format (Form GST INV-1)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-stone-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs hover:bg-stone-800"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
                <button
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="text-stone-400 hover:text-stone-700 font-bold text-lg p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Tax Invoice Content */}
            <div className="border border-stone-300 p-6 rounded-xl space-y-6 text-xs text-stone-800 bg-white shadow-2xs font-sans">
              {/* Header with Title & QR Simulation */}
              <div className="flex items-start justify-between border-b-2 border-stone-900 pb-4">
                <div>
                  <h1 className="text-xl font-extrabold uppercase text-stone-900 tracking-wide">TAX INVOICE</h1>
                  <p className="text-[11px] text-stone-600 font-medium">Issued under Section 31 of Central Goods and Services Tax Act, 2017</p>
                  <p className="text-[10px] text-stone-500 font-mono mt-1">IRN: 8a4b2c9e7f1d830a6c5b4e3f2a1d0987654321fedcba0987654321abcdef0123</p>
                </div>

                <div className="text-right flex flex-col items-end">
                  <div className="w-16 h-16 border border-stone-300 bg-stone-50 flex items-center justify-center text-[10px] font-mono text-center leading-tight">
                    [E-Invoice QR Code]
                  </div>
                  <span className="text-[10px] text-stone-500 mt-1">Digitally Signed & Validated</span>
                </div>
              </div>

              {/* Invoice Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-3 rounded-lg border border-stone-200">
                <div>
                  <span className="text-[10px] text-stone-500 block">Invoice Number</span>
                  <strong className="font-mono text-stone-900">{selectedInvoiceOrder.orderId}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Invoice Date</span>
                  <strong className="text-stone-900">{new Date(selectedInvoiceOrder.createdAt).toLocaleDateString('en-IN')}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Place of Supply</span>
                  <strong className="text-stone-900">
                    {selectedInvoiceOrder.retailerState} ({INDIAN_STATES[selectedInvoiceOrder.retailerState] || '24'})
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Reverse Charge Applicable</span>
                  <strong className="text-stone-900">No (Sec 9(3)/9(4))</strong>
                </div>
              </div>

              {/* Seller and Buyer Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-stone-200 pb-4">
                {/* Seller Details */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-stone-500">Details of Supplier / Seller:</span>
                  <p className="font-bold text-stone-900 text-sm">{selectedInvoiceOrder.vendorBusinessName}</p>
                  <p>Plot 42-B, GIDC Spice Yard, APMC Market</p>
                  <p>State: {selectedInvoiceOrder.vendorState}</p>
                  <p className="font-mono font-semibold">GSTIN: {selectedInvoiceOrder.vendorGstin}</p>
                  <p className="text-[11px] text-stone-600">FSSAI Lic No: 12421008000492</p>
                </div>

                {/* Buyer Details */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-stone-500">Details of Recipient / Buyer:</span>
                  <p className="font-bold text-stone-900 text-sm">{selectedInvoiceOrder.retailerBusinessName}</p>
                  <p>Shop 14, Kirana Merchant Complex</p>
                  <p>State: {selectedInvoiceOrder.retailerState}</p>
                  <p className="font-mono font-semibold">GSTIN: {selectedInvoiceOrder.retailerGstin}</p>
                  <p className="text-[11px] text-stone-600">FSSAI Lic No: 12423002000155</p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <table className="w-full text-left border border-stone-300">
                  <thead className="bg-stone-100 border-b border-stone-300 font-bold text-stone-700">
                    <tr>
                      <th className="p-2 border-r border-stone-300">#</th>
                      <th className="p-2 border-r border-stone-300">Description of Goods</th>
                      <th className="p-2 border-r border-stone-300">HSN</th>
                      <th className="p-2 border-r border-stone-300">Qty (kg)</th>
                      <th className="p-2 border-r border-stone-300">Rate (₹/kg)</th>
                      <th className="p-2 text-right">Taxable Amt (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {selectedInvoiceOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 border-r border-stone-300 font-mono">{idx + 1}</td>
                        <td className="p-2 border-r border-stone-300 font-semibold">{item.title}</td>
                        <td className="p-2 border-r border-stone-300 font-mono">{item.hsnCode}</td>
                        <td className="p-2 border-r border-stone-300">{item.qty}</td>
                        <td className="p-2 border-r border-stone-300">{item.unitPrice}</td>
                        <td className="p-2 text-right font-bold">{item.lineTotal.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tax Computation Table */}
              <div className="flex justify-end">
                <div className="w-full sm:w-1/2 space-y-1 border border-stone-300 p-3 rounded-lg bg-stone-50">
                  <div className="flex justify-between">
                    <span>Taxable Lot Value:</span>
                    <span className="font-semibold">{formatINR(selectedInvoiceOrder.subtotal)}</span>
                  </div>

                  {selectedInvoiceOrder.isInterState ? (
                    <div className="flex justify-between">
                      <span>IGST (5%):</span>
                      <span className="font-semibold">{formatINR(selectedInvoiceOrder.igstAmount || selectedInvoiceOrder.gstTotal)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>CGST (2.5%):</span>
                        <span className="font-semibold">{formatINR(selectedInvoiceOrder.cgstAmount || selectedInvoiceOrder.gstTotal / 2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST (2.5%):</span>
                        <span className="font-semibold">{formatINR(selectedInvoiceOrder.sgstAmount || selectedInvoiceOrder.gstTotal / 2)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between">
                    <span>B2B Freight Charges:</span>
                    <span className="font-semibold">{formatINR(selectedInvoiceOrder.shippingCharges)}</span>
                  </div>

                  <div className="border-t border-stone-300 pt-1 flex justify-between font-black text-sm text-stone-900">
                    <span>Total Invoice Amount (INR):</span>
                    <span>{formatINR(selectedInvoiceOrder.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Statutory Footers: Bank & TDS Section 194-O */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-stone-200 pt-3 text-[11px] text-stone-600">
                <div>
                  <strong className="text-stone-900 block mb-0.5">Supplier Bank Details for RTGS/NEFT:</strong>
                  <p>Bank: HDFC Bank - Unjha APMC Yard Branch</p>
                  <p>A/C No: 50200018944512 (Current A/c)</p>
                  <p>IFSC: HDFC0000421</p>
                  <p className="mt-1 text-[10px] text-stone-500">
                    * E-commerce TDS u/s 194-O (1%) deducted by BharatSpice Marketplace Operator.
                  </p>
                </div>

                <div className="text-right flex flex-col justify-between items-end">
                  <div className="text-right">
                    <p className="font-bold text-stone-900">For {selectedInvoiceOrder.vendorBusinessName}</p>
                    <div className="h-10 flex items-center justify-end text-emerald-800 font-mono text-[10px]">
                      [Digitally Signed via DSC BharatSpice PKI]
                    </div>
                    <p className="text-[10px] text-stone-500">Authorized Signatory</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
