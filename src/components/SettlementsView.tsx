/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Settlement, User } from '../types/marketplace';
import { formatINR } from '../utils/compliance';
import { 
  IndianRupee, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  FileSpreadsheet
} from 'lucide-react';

interface SettlementsViewProps {
  currentUser: User;
  settlements: Settlement[];
  onReleaseHold?: (settlementId: string) => void;
}

export const SettlementsView: React.FC<SettlementsViewProps> = ({
  currentUser,
  settlements,
  onReleaseHold,
}) => {
  // Filter settlements for active user
  const relevantSettlements = settlements.filter((s) => {
    if (currentUser.role === 'admin') return true;
    return s.vendorId === currentUser.uid;
  });

  const totalGross = relevantSettlements.reduce((sum, s) => sum + s.grossAmount, 0);
  const totalNet = relevantSettlements.reduce((sum, s) => sum + s.netPayable, 0);
  const totalTds = relevantSettlements.reduce((sum, s) => sum + s.tdsDeducted, 0);
  const totalCommission = relevantSettlements.reduce((sum, s) => sum + s.commissionDeducted, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300">
            <IndianRupee className="w-3.5 h-3.5" />
            <span>Escrow & Merchant Payout Ledger</span>
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mt-1">Vendor Settlements & Section 194-O TDS Ledger</h2>
          <p className="text-xs text-stone-500">
            Immutable financial records calculated server-side. Automatic 3% platform commission and 1% TDS deduction per Income Tax Act.
          </p>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-medium text-stone-500 block">Gross Order Volume</span>
          <strong className="text-stone-900 text-lg font-black">{formatINR(totalGross)}</strong>
          <span className="text-[10px] text-stone-400 block">Excluding GST</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-medium text-stone-500 block">Platform Commission (3%)</span>
          <strong className="text-amber-800 text-lg font-black">{formatINR(totalCommission)}</strong>
          <span className="text-[10px] text-stone-400 block">BharatSpice Fee</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-medium text-stone-500 block">Section 194-O TDS (1%)</span>
          <strong className="text-purple-800 text-lg font-black">{formatINR(totalTds)}</strong>
          <span className="text-[10px] text-stone-400 block">Deposited to Govt of India</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-medium text-stone-500 block">Net Payable to Vendors</span>
          <strong className="text-emerald-700 text-lg font-black">{formatINR(totalNet)}</strong>
          <span className="text-[10px] text-emerald-600 font-semibold block">Bank RTGS Payout</span>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-stone-900 text-base">Settlement Disbursements & Payout References</h3>
          <span className="text-xs text-stone-500">{relevantSettlements.length} settlement batches</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase">
              <tr>
                <th className="py-3 px-3">Settlement ID</th>
                <th className="py-3 px-3">Order Ref</th>
                <th className="py-3 px-3">Vendor</th>
                <th className="py-3 px-3 text-right">Gross Lot (₹)</th>
                <th className="py-3 px-3 text-right">Comm. 3% (₹)</th>
                <th className="py-3 px-3 text-right">TDS 1% (₹)</th>
                <th className="py-3 px-3 text-right font-black">Net Disbursed (₹)</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">UTR / Payout Ref</th>
                {currentUser.role === 'admin' && <th className="py-3 px-3">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {relevantSettlements.map((s) => (
                <tr key={s.settlementId} className="hover:bg-stone-50">
                  <td className="py-3 px-3 font-mono font-bold text-stone-900">{s.settlementId}</td>
                  <td className="py-3 px-3 font-mono text-stone-600">{s.orderId}</td>
                  <td className="py-3 px-3 font-semibold text-stone-900">{s.vendorBusinessName}</td>
                  <td className="py-3 px-3 text-right">{formatINR(s.grossAmount)}</td>
                  <td className="py-3 px-3 text-right text-stone-600">-{formatINR(s.commissionDeducted)}</td>
                  <td className="py-3 px-3 text-right text-purple-700">-{formatINR(s.tdsDeducted)}</td>
                  <td className="py-3 px-3 text-right font-extrabold text-emerald-800">{formatINR(s.netPayable)}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        s.status === 'processed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.status === 'on_hold'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {s.status === 'on_hold' ? 'Dispute Hold' : s.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-stone-500">
                    {s.payoutReference || 'Pending Escrow Release'}
                  </td>
                  {currentUser.role === 'admin' && (
                    <td className="py-3 px-3">
                      {s.status === 'on_hold' && onReleaseHold && (
                        <button
                          onClick={() => onReleaseHold(s.settlementId)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded text-[10px]"
                        >
                          Release Hold
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statutory Section 194-O Note */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs text-stone-600 space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-stone-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Statutory Compliance Note on Section 194-O (Income Tax Act, 1961):</span>
        </div>
        <p className="leading-relaxed">
          Every e-commerce marketplace operator facilitating the sale of goods (including agricultural produce & spices) is legally mandated to deduct TDS at the rate of 1% from the gross amount of sales at the time of credit to the vendor’s account or payment, whichever is earlier. All deductions are mapped against the vendor’s PAN/GSTIN and quarterly Form 26AS/AIS credit slips are generated automatically.
        </p>
      </div>
    </div>
  );
};
