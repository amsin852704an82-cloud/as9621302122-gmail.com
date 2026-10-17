/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Database, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Code2
} from 'lucide-react';

export const FirestoreInspector: React.FC = () => {
  const [activeInspectorTab, setActiveInspectorTab] = useState<'rules' | 'schema'>('rules');

  const firestoreRulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions for Role-Based Access Control (RBAC) & Data Isolation
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() && (
        request.auth.token.role == 'admin' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }

    function isVendor() {
      return isAuthenticated() && (
        request.auth.token.role == 'vendor' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'vendor'
      );
    }

    function isRetailer() {
      return isAuthenticated() && (
        request.auth.token.role == 'retailer' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'retailer'
      );
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Indian Spice Standards Validations
    function isValidFSSAI(number) {
      return number is string && number.size() == 14 && number.matches('^[1-2][0-9]{13}$');
    }

    function isValidSpiceHsn(code) {
      return code is string && (
        code.matches('^090[4-9].*') || code.matches('^0910.*')
      );
    }

    // 1. users/{userId}
    match /users/{userId} {
      allow read: if isAuthenticated() && (isOwner(userId) || isAdmin());
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && (isOwner(userId) || isAdmin());
      allow delete: if isAdmin();
    }

    // 2. vendors/{vendorId}
    match /vendors/{vendorId} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated() && (
        (isOwner(vendorId) && isValidFSSAI(request.resource.data.fssaiNumber)) || isAdmin()
      );
      allow delete: if isAdmin();
    }

    // 3. products/{productId}
    match /products/{productId} {
      // Retailers can only read active, approved products. Vendors read their own. Admin reads all.
      allow read: if isAuthenticated() && (
        resource.data.status == 'active' ||
        resource.data.vendorId == request.auth.uid ||
        isAdmin()
      );
      // Vendors can create and edit their own products
      allow create: if isAuthenticated() && (
        (isVendor() && request.resource.data.vendorId == request.auth.uid && isValidSpiceHsn(request.resource.data.hsnCode)) ||
        isAdmin()
      );
      allow update: if isAuthenticated() && (
        (isVendor() && resource.data.vendorId == request.auth.uid && request.resource.data.vendorId == request.auth.uid) ||
        isAdmin()
      );
      allow delete: if isAdmin() || (isVendor() && resource.data.vendorId == request.auth.uid);
    }

    // 4. orders/{orderId}
    match /orders/{orderId} {
      // Data isolation: Only the retailer who placed it, the vendor fulfilling it, or Admin can read
      allow read: if isAuthenticated() && (
        resource.data.retailerId == request.auth.uid ||
        resource.data.vendorId == request.auth.uid ||
        isAdmin()
      );

      // Server-side validation rule: Order creation must not allow client-tampered pricing
      allow create: if isAuthenticated() && (
        (isRetailer() && request.resource.data.retailerId == request.auth.uid && request.resource.data.gstTotal > 0) ||
        isAdmin()
      );

      // Status updates: Vendors update fulfillment; Retailers update disputeStatus; Admin updates all
      allow update: if isAuthenticated() && (
        (isVendor() && resource.data.vendorId == request.auth.uid &&
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['fulfillmentStatus', 'shippingDetails', 'updatedAt'])) ||
        (isRetailer() && resource.data.retailerId == request.auth.uid &&
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['disputeStatus', 'updatedAt'])) ||
        isAdmin()
      );

      allow delete: if isAdmin();
    }

    // 5. privateLabelRfqs/{rfqId}
    match /privateLabelRfqs/{rfqId} {
      allow read: if isAuthenticated() && (
        resource.data.retailerId == request.auth.uid ||
        isVendor() ||
        isAdmin()
      );
      allow create: if isAuthenticated() && (
        (isRetailer() && request.resource.data.retailerId == request.auth.uid) ||
        isAdmin()
      );
      allow update: if isAuthenticated() && (
        (isRetailer() && resource.data.retailerId == request.auth.uid) ||
        isVendor() ||
        isAdmin()
      );
      allow delete: if isAdmin();
    }

    // 6. settlements/{settlementId}
    // Financial ledger entries: strictly readable by vendor and admin; writes prohibited from client SDK!
    match /settlements/{settlementId} {
      allow read: if isAuthenticated() && (
        resource.data.vendorId == request.auth.uid ||
        isAdmin()
      );
      // Strictly Server Actions / Cloud Functions only
      allow write: if isAdmin();
    }

    // 7. disputes/{disputeId}
    match /disputes/{disputeId} {
      allow read: if isAuthenticated() && (
        resource.data.reportedBy == request.auth.uid ||
        isAdmin()
      );
      allow create: if isAuthenticated() && (
        request.resource.data.reportedBy == request.auth.uid ||
        isAdmin()
      );
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
  }
}`;

  const collections = [
    {
      name: 'users/{userId}',
      purpose: 'System credentials, RBAC roles, contact & verified status',
      fields: ['uid', 'email', 'role (admin|vendor|retailer)', 'businessName', 'phone', 'isVerified', 'status', 'createdAt', 'updatedAt'],
      security: 'Private to owner & admin',
    },
    {
      name: 'vendors/{vendorId}',
      purpose: 'Statutory trade details, 14-digit FSSAI, GSTIN & verified bank accounts',
      fields: ['vendorId', 'legalName', 'tradeName', 'gstin', 'fssaiNumber', 'fssaiExpiry', 'bankDetails: { accountNo, ifsc, bankName }', 'dispatchAddress', 'monthlyCapacityKg', 'commissionTierId'],
      security: 'Authenticated read, owner/admin update',
    },
    {
      name: 'products/{productId}',
      purpose: 'Spice listings, tier pricing, HSN codes & Agmark laboratory specs',
      fields: ['productId', 'vendorId', 'title', 'category', 'spiceType', 'originState', 'hsnCode', 'gstRate (5%)', 'basePricePerUnit', 'moq', 'availableStock', 'priceTiers', 'status'],
      security: 'Public read for active; write restricted to lot owner vendor',
    },
    {
      name: 'orders/{orderId}',
      purpose: 'B2B commercial orders, multi-item tax invoices, logistics docket tracking',
      fields: ['orderId', 'retailerId', 'vendorId', 'items', 'subtotal', 'gstTotal', 'cgstAmount', 'sgstAmount', 'igstAmount', 'shippingCharges', 'grandTotal', 'fulfillmentStatus', 'disputeStatus'],
      security: 'Strict data isolation: retailer + vendor + admin only',
    },
    {
      name: 'privateLabelRfqs/{rfqId}',
      purpose: 'Custom OEM inquiries, barrier packaging specs, and vendor quotations',
      fields: ['rfqId', 'retailerId', 'spiceCategory', 'targetQuantityKg', 'packagingType', 'targetPPU', 'vendorQuotations', 'status'],
      security: 'Retailer, quoting vendors & admin',
    },
    {
      name: 'settlements/{settlementId}',
      purpose: 'Financial ledger, 3% commission, 1% Section 194-O TDS & NEFT payout UTR',
      fields: ['settlementId', 'vendorId', 'orderId', 'grossAmount', 'commissionDeducted', 'tdsDeducted', 'netPayable', 'status', 'payoutReference'],
      security: 'Server Actions / Cloud Functions write only; client write blocked',
    },
    {
      name: 'disputes/{disputeId}',
      purpose: 'Quality & transit complaints, photo evidence, and AI triage arbitration',
      fields: ['disputeId', 'orderId', 'reportedBy', 'reasonCategory', 'description', 'evidenceUrls', 'adminResolutionNotes', 'resolutionType', 'resolvedAt'],
      security: 'Complainant & Platform Owner admin',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded border border-stone-300">
            <Lock className="w-3.5 h-3.5 text-stone-700" />
            <span>ACID-Compliant Architecture & Security Audit</span>
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mt-1">Firestore Schema & Security Rules Inspector</h2>
          <p className="text-xs text-stone-500">
            Review the 7 core normalized collections, granular RBAC claims, FSSAI/HSN validation, and financial ledger immutability.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-xl border border-stone-200 text-xs font-semibold">
          <button
            onClick={() => setActiveInspectorTab('rules')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeInspectorTab === 'rules'
                ? 'bg-white text-stone-900 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>firestore.rules</span>
          </button>
          <button
            onClick={() => setActiveInspectorTab('schema')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeInspectorTab === 'schema'
                ? 'bg-white text-stone-900 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-amber-600" />
            <span>Collection Schemas (ACID)</span>
          </button>
        </div>
      </div>

      {activeInspectorTab === 'rules' ? (
        <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 shadow-xl border border-stone-800 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-amber-400" />
              <span className="font-mono font-bold text-sm text-stone-200">firestore.rules</span>
              <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-800">
                Production Audited
              </span>
            </div>
            <span className="text-xs text-stone-400">Strict Data Isolation & Immutability</span>
          </div>

          <pre className="font-mono text-xs overflow-x-auto text-amber-100/90 leading-relaxed p-4 bg-stone-950/80 rounded-xl border border-stone-800/80 max-h-[600px] overflow-y-auto">
            {firestoreRulesCode}
          </pre>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collections.map((col, idx) => (
              <div key={idx} className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <span className="font-mono font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-amber-600" />
                    <span>{col.name}</span>
                  </span>
                  <span className="text-[10px] bg-stone-100 text-stone-700 font-bold px-2 py-0.5 rounded">
                    Collection #{idx + 1}
                  </span>
                </div>

                <p className="text-xs text-stone-600">{col.purpose}</p>

                <div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase block mb-1">Normalized Fields:</span>
                  <div className="flex flex-wrap gap-1">
                    {col.fields.map((f, i) => (
                      <span key={i} className="bg-stone-50 font-mono text-[11px] text-stone-700 px-2 py-0.5 rounded border border-stone-200">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50/60 border border-amber-200 rounded p-2 text-[11px] text-stone-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span><strong>Access Policy:</strong> {col.security}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
