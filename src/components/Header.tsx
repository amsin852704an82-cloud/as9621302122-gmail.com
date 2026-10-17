/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, MandiBenchmark } from '../types/marketplace';
import { 
  Building2, 
  Store, 
  ShieldCheck, 
  ShoppingBag, 
  FileText, 
  SlidersHorizontal, 
  Sparkles, 
  AlertTriangle, 
  IndianRupee, 
  TrendingUp,
  PackageCheck
} from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  onSelectUser: (user: User) => void;
  allUsers: User[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  benchmarks: MandiBenchmark[];
  cartCount: number;
  onOpenCart: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSelectUser,
  allUsers,
  activeTab,
  setActiveTab,
  benchmarks,
  cartCount,
  onOpenCart,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-xs">
      {/* Top Mandi Spot Price Ticker */}
      <div className="bg-stone-900 text-stone-100 py-1.5 px-4 text-xs overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-6 border-b border-stone-800">
        <div className="flex items-center gap-1.5 text-amber-400 font-semibold uppercase tracking-wider shrink-0">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Live Mandi Spot Ticker:</span>
        </div>
        <div className="flex items-center gap-8 shrink-0">
          {benchmarks.map((m) => (
            <div key={m.mandiId} className="flex items-center gap-2">
              <span className="text-stone-300 font-medium">{m.mandiName} ({m.spiceCategory}):</span>
              <span className="text-emerald-400 font-bold">₹{m.modalPrice}/kg</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  m.trend === 'up'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : m.trend === 'down'
                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                    : 'bg-stone-800 text-stone-400'
                }`}
              >
                {m.trend === 'up' ? '+' : ''}{m.percentChange}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('marketplace')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 via-orange-600 to-red-700 flex items-center justify-center text-white shadow-md font-black text-lg">
              🌶️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-stone-900 text-lg tracking-tight">BharatSpice</span>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-300 uppercase">
                  B2B Trade & AI
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">Indian Spice Commodities & Mandi Intelligence</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'marketplace'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Mandi Market</span>
            </button>

            <button
              onClick={() => setActiveTab('vendor')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'vendor'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>AI Catalog & Quality</span>
            </button>

            <button
              onClick={() => setActiveTab('rfq')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'rfq'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <PackageCheck className="w-4 h-4" />
              <span>Private-Label RFQ</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Orders & Invoices</span>
            </button>

            <button
              onClick={() => setActiveTab('disputes')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'disputes'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span>AI Dispute Triage</span>
            </button>

            <button
              onClick={() => setActiveTab('settlements')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'settlements'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <IndianRupee className="w-4 h-4" />
              <span>Settlements</span>
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'rules'
                  ? 'bg-stone-100 text-stone-900 border border-stone-300'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
              }`}
              title="Audit Firestore Security Rules & ACID Schema"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden xl:inline">Security Rules</span>
            </button>
          </nav>

          {/* Right Action: Role Switcher & Cart */}
          <div className="flex items-center gap-3">
            {/* Active Persona / Role Switcher */}
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-300 rounded-lg p-1.5">
              <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium pl-1">
                {currentUser.role === 'admin' ? (
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                ) : currentUser.role === 'vendor' ? (
                  <Building2 className="w-4 h-4 text-amber-600" />
                ) : (
                  <Store className="w-4 h-4 text-emerald-600" />
                )}
                <span className="hidden sm:inline font-bold uppercase text-[10px] tracking-wide text-stone-500">
                  Role:
                </span>
              </div>
              <select
                value={currentUser.uid}
                onChange={(e) => {
                  const selected = allUsers.find((u) => u.uid === e.target.value);
                  if (selected) onSelectUser(selected);
                }}
                className="bg-white border border-stone-200 rounded text-xs font-semibold text-stone-800 py-1 px-2 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                {allUsers.map((user) => (
                  <option key={user.uid} value={user.uid}>
                    {user.role === 'admin'
                      ? `👑 Admin: ${user.businessName}`
                      : user.role === 'vendor'
                      ? `🌾 Vendor: ${user.businessName} (${user.state})`
                      : `🛒 Retailer: ${user.businessName} (${user.state})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Trigger */}
            <button
              onClick={onOpenCart}
              className="relative p-2 text-stone-700 hover:text-amber-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
              title="Wholesale Procurement Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Submenu Tabs */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-2 border-t border-stone-200 text-xs">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-2.5 py-1.5 rounded whitespace-nowrap font-medium ${
              activeTab === 'marketplace' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700'
            }`}
          >
            Mandi Market
          </button>
          <button
            onClick={() => setActiveTab('vendor')}
            className={`px-2.5 py-1.5 rounded whitespace-nowrap font-medium ${
              activeTab === 'vendor' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700'
            }`}
          >
            AI Catalog
          </button>
          <button
            onClick={() => setActiveTab('rfq')}
            className={`px-2.5 py-1.5 rounded whitespace-nowrap font-medium ${
              activeTab === 'rfq' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700'
            }`}
          >
            Private-Label RFQ
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-2.5 py-1.5 rounded whitespace-nowrap font-medium ${
              activeTab === 'orders' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700'
            }`}
          >
            Orders & GST
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-2.5 py-1.5 rounded whitespace-nowrap font-medium ${
              activeTab === 'disputes' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700'
            }`}
          >
            AI Triage
          </button>
          <button
            onClick={() => setActiveTab('settlements')}
            className={`px-2.5 py-1.5 rounded whitespace-nowrap font-medium ${
              activeTab === 'settlements' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700'
            }`}
          >
            Settlements
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-2.5 py-1.5 rounded whitespace-nowrap font-medium ${
              activeTab === 'rules' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700'
            }`}
          >
            Rules & Schema
          </button>
        </div>
      </div>
    </header>
  );
};
