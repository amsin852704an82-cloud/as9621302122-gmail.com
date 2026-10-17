/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, MandiBenchmark, User, AiMultilingualFilterResult } from '../types/marketplace';
import { formatINR } from '../utils/compliance';
import { 
  Search, 
  Mic, 
  Sparkles, 
  SlidersHorizontal, 
  CheckCircle2, 
  MapPin, 
  ShieldCheck, 
  TrendingUp, 
  Layers, 
  Tag, 
  RotateCcw,
  Info,
  Package
} from 'lucide-react';

interface MarketplaceProps {
  products: Product[];
  benchmarks: MandiBenchmark[];
  currentUser: User;
  onOpenOrderModal: (product: Product) => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({
  products,
  benchmarks,
  currentUser: _currentUser,
  onOpenOrderModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiFilterResult, setAiFilterResult] = useState<AiMultilingualFilterResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSpiceType, setSelectedSpiceType] = useState<string>('All');
  const [selectedMandi, setSelectedMandi] = useState<string>('All');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(3000);
  const [minMoqFilter, setMinMoqFilter] = useState<number>(0);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);

  const categories = ['All', 'Cumin', 'Turmeric', 'Chilli', 'Coriander', 'Cardamom', 'Pepper'];
  const spiceTypes = ['All', 'whole', 'ground', 'blend'];

  // Handle AI Multilingual Query Execution
  const handleAiQuery = async (queryToRun: string) => {
    if (!queryToRun.trim()) return;
    setIsAiSearching(true);
    setSearchQuery(queryToRun);

    try {
      const response = await fetch('/api/ai/multilingual-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryToRun }),
      });

      if (response.ok) {
        const data: AiMultilingualFilterResult = await response.json();
        setAiFilterResult(data);

        // Auto-apply extracted filters
        if (data.filters.category && data.filters.category !== 'Other') {
          setSelectedCategory(data.filters.category);
        }
        if (data.filters.spiceType && data.filters.spiceType !== 'all') {
          setSelectedSpiceType(data.filters.spiceType);
        }
        if (data.filters.originMandi && data.filters.originMandi !== 'any') {
          setSelectedMandi(data.filters.originMandi);
        }
        if (data.filters.maxPricePerKg) {
          setMaxPriceFilter(data.filters.maxPricePerKg);
        }
        if (data.filters.minMoqKg) {
          setMinMoqFilter(data.filters.minMoqKg);
        }
      }
    } catch (err) {
      console.error('Failed to parse AI query', err);
    } finally {
      setIsAiSearching(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setAiFilterResult(null);
    setSelectedCategory('All');
    setSelectedSpiceType('All');
    setSelectedMandi('All');
    setMaxPriceFilter(3000);
    setMinMoqFilter(0);
  };

  // Filter products based on active criteria
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'All' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (selectedSpiceType !== 'All' && p.spiceType !== selectedSpiceType) {
      return false;
    }
    if (selectedMandi !== 'All' && p.originMandi && !p.originMandi.toLowerCase().includes(selectedMandi.toLowerCase())) {
      return false;
    }
    if (p.basePricePerUnit > maxPriceFilter) {
      return false;
    }
    if (minMoqFilter > 0 && p.moq > minMoqFilter) {
      return false;
    }
    if (searchQuery.trim() && !aiFilterResult) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      const matchTags = (p.searchTags || []).some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTags) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Banner with Indian Spice Identity */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white p-6 sm:p-8 shadow-xl border border-amber-900/40">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 text-xs font-semibold px-3 py-1 rounded-full border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mandi-to-Kirana Direct B2B Wholesale</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Direct Spice Sourcing from India&apos;s Leading Mandis
          </h1>
          <p className="text-sm sm:text-base text-stone-300">
            Unjha Cumin, Erode & Salem Turmeric, Guntur Red Chilli, Alleppey Cardamom, and Byadgi Mirchi.
            Verified Agmark Grade I & FSSAI certified lots with transparent tier pricing & 5% GST invoicing.
          </p>

          {/* Multilingual Voice / Text Search Engine */}
          <div className="pt-2">
            <div className="relative flex items-center bg-white rounded-xl shadow-lg border-2 border-amber-400 overflow-hidden">
              <div className="pl-4 text-stone-400">
                <Search className="w-5 h-5 text-amber-600" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiQuery(searchQuery)}
                placeholder="Ask in Hindi, Gujarati, or English (e.g. 'कम से कम 50 किलो जीरा ऊंझा मंडी' or 'Salem Turmeric')..."
                className="w-full py-3.5 px-3 text-stone-900 text-sm focus:outline-none placeholder:text-stone-400"
              />
              <div className="flex items-center gap-1.5 pr-2">
                <button
                  type="button"
                  onClick={() => handleAiQuery("कम से कम 50 किलो जीरा ऊंझा मंडी रेट पर चाहिए")}
                  className="p-2 text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Voice search simulation (Hindi)"
                >
                  <Mic className="w-4 h-4 text-amber-600" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAiQuery(searchQuery)}
                  disabled={isAiSearching}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isAiSearching ? (
                    <span>AI Parsing...</span>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Query Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-3 text-xs">
              <span className="text-stone-400 font-medium">Try Kirana queries:</span>
              <button
                onClick={() => handleAiQuery("कम से कम 50 किलो जीरा ऊंझा मंडी रेट पर चाहिए")}
                className="bg-stone-800 hover:bg-stone-700 text-amber-200 px-2.5 py-1 rounded-md border border-stone-700 transition-colors"
              >
                🇮🇳 &ldquo;कम से कम 50 किलो जीरा ऊंझा मंडी&rdquo;
              </button>
              <button
                onClick={() => handleAiQuery("સુરત ડિલિવરી માટે બેસ્ટ ધાણા પાવડર 100 કિલો")}
                className="bg-stone-800 hover:bg-stone-700 text-amber-200 px-2.5 py-1 rounded-md border border-stone-700 transition-colors"
              >
                🌾 &ldquo;સુરત ડિલિવરી ધાણા પાવડર 100 કિલો&rdquo;
              </button>
              <button
                onClick={() => handleAiQuery("Salem Turmeric 3.5% Curcumin 500kg under 170")}
                className="bg-stone-800 hover:bg-stone-700 text-amber-200 px-2.5 py-1 rounded-md border border-stone-700 transition-colors"
              >
                💛 &ldquo;Salem Turmeric Curcumin &gt; 3.5%&rdquo;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Intent & Translation Feedback Box */}
      {aiFilterResult && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-200 text-amber-900 text-xs font-bold px-2 py-0.5 rounded">
                Detected: {aiFilterResult.detectedLanguage}
              </span>
              <span className="text-xs text-stone-500 font-medium">
                Intent: {aiFilterResult.intentSummary}
              </span>
            </div>
            <p className="text-xs text-stone-700">
              <strong className="text-stone-900">Translation:</strong> &ldquo;{aiFilterResult.englishTranslation}&rdquo;
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-amber-800 pt-1">
              {aiFilterResult.filters.category && (
                <span className="bg-white border border-amber-300 px-2 py-0.5 rounded-full">
                  Category: {aiFilterResult.filters.category}
                </span>
              )}
              {aiFilterResult.filters.originMandi && (
                <span className="bg-white border border-amber-300 px-2 py-0.5 rounded-full">
                  Mandi: {aiFilterResult.filters.originMandi}
                </span>
              )}
              {aiFilterResult.filters.minMoqKg && (
                <span className="bg-white border border-amber-300 px-2 py-0.5 rounded-full">
                  MOQ: &le; {aiFilterResult.filters.minMoqKg} kg
                </span>
              )}
              {aiFilterResult.filters.maxPricePerKg && (
                <span className="bg-white border border-amber-300 px-2 py-0.5 rounded-full">
                  Max Price: ₹{aiFilterResult.filters.maxPricePerKg}/kg
                </span>
              )}
            </div>
          </div>

          <button
            onClick={clearFilters}
            className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1 bg-white border border-stone-300 px-3 py-1.5 rounded-lg shrink-0 shadow-2xs hover:bg-stone-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset AI Filters</span>
          </button>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6 bg-white p-5 rounded-xl border border-stone-200 h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-amber-600" />
              <span>Marketplace Filters</span>
            </h3>
            {(selectedCategory !== 'All' || selectedSpiceType !== 'All' || selectedMandi !== 'All' || maxPriceFilter < 3000) && (
              <button
                onClick={clearFilters}
                className="text-xs text-amber-700 hover:underline font-medium"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Spice Categories */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-2">Spice Category</label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-amber-600 text-white font-semibold'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Spice Form / Type */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-2">Spice Form</label>
            <div className="grid grid-cols-2 gap-1.5">
              {spiceTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedSpiceType(type)}
                  className={`text-xs py-1.5 px-2 rounded-md capitalize transition-colors text-center ${
                    selectedSpiceType === type
                      ? 'bg-stone-900 text-white font-semibold'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Mandi Benchmark Price Indicator */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-2">Regional Mandi Hub</label>
            <select
              value={selectedMandi}
              onChange={(e) => setSelectedMandi(e.target.value)}
              className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="All">All Mandi Hubs</option>
              <option value="Unjha">Unjha APMC (Cumin/Fennel)</option>
              <option value="Erode">Erode APMC (Turmeric)</option>
              <option value="Guntur">Guntur APMC (Red Chilli)</option>
              <option value="Ramganj">Ramganj APMC (Coriander)</option>
              <option value="Alleppey">Alleppey Auction (Cardamom)</option>
              <option value="Kochi">Kochi Exchange (Black Pepper)</option>
            </select>
          </div>

          {/* Max Price Slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-stone-700">Max Base Rate</span>
              <span className="font-bold text-amber-700">₹{maxPriceFilter} / kg</span>
            </div>
            <input
              type="range"
              min="50"
              max="3000"
              step="50"
              value={maxPriceFilter}
              onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          {/* Compliance Assurance Box */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-[11px] text-stone-600 space-y-1.5">
            <div className="font-bold text-stone-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>BharatSpice Trust Protocol</span>
            </div>
            <p>Every lot is sampled at dispatch against ASTA cleanliness & Agmark standards. 5% GST automatically split per state rules.</p>
          </div>
        </div>

        {/* Product Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Showing <strong className="text-stone-900 font-semibold">{filteredProducts.length}</strong> active B2B spice lots</span>
            <div className="flex items-center gap-2">
              <span className="text-stone-400">Default GST:</span>
              <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                5% (HSN 0904-0910)
              </span>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-12 text-center space-y-3">
              <Package className="w-12 h-12 text-stone-300 mx-auto" />
              <h4 className="font-bold text-stone-800">No spice lots match your search filters</h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Try loosening your maximum price or resetting AI query filters to view all available auction arrivals.
              </p>
              <button
                onClick={clearFilters}
                className="bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-amber-700"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProducts.map((product) => {
                // Find matching Mandi benchmark
                const benchmark = benchmarks.find(
                  (b) => b.spiceCategory.toLowerCase() === product.category.toLowerCase()
                );
                const mandiDiff = benchmark
                  ? Math.round(((product.basePricePerUnit - benchmark.modalPrice) / benchmark.modalPrice) * 100)
                  : 0;

                return (
                  <div
                    key={product.productId}
                    className="bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      {/* Image & Badges */}
                      <div className="relative h-48 bg-stone-100 overflow-hidden group">
                        <img
                          src={product.images[0] || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80'}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          <span className="bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                            HSN {product.hsnCode}
                          </span>
                          {product.qualitySpecs?.agmarkGrade && (
                            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                              {product.qualitySpecs.agmarkGrade}
                            </span>
                          )}
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-xs">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>FSSAI Verified</span>
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        {/* Vendor & Origin */}
                        <div className="flex items-center justify-between text-[11px] text-stone-500">
                          <span className="font-medium truncate max-w-[160px]">{product.vendorBusinessName}</span>
                          <span className="flex items-center gap-1 text-stone-600">
                            <MapPin className="w-3 h-3 text-amber-600" />
                            {product.originMandi || product.originState}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-stone-900 text-sm line-clamp-2 leading-snug">
                          {product.title}
                        </h3>

                        {/* Mandi Benchmark Spread */}
                        {benchmark && (
                          <div className="bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs flex items-center justify-between">
                            <div className="flex items-center gap-1 text-stone-600">
                              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                              <span className="text-[11px] font-medium">{benchmark.mandiName}:</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-semibold">
                              <span className="text-stone-800">₹{benchmark.modalPrice}/kg</span>
                              <span
                                className={`text-[10px] px-1 rounded ${
                                  mandiDiff > 0
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {mandiDiff > 0 ? `+${mandiDiff}% vs spot` : `${mandiDiff}% vs spot`}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Quality Specs Pill tags */}
                        {product.qualitySpecs && (
                          <div className="flex flex-wrap gap-1 text-[11px]">
                            {product.qualitySpecs.moisturePercent && (
                              <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                                Moisture: {product.qualitySpecs.moisturePercent}%
                              </span>
                            )}
                            {product.qualitySpecs.volatileOilPercent && (
                              <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                                Volatile Oil: {product.qualitySpecs.volatileOilPercent}%
                              </span>
                            )}
                            {product.qualitySpecs.activeBioactivePercent && (
                              <span className="bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200">
                                Bioactive: {product.qualitySpecs.activeBioactivePercent}%
                              </span>
                            )}
                          </div>
                        )}

                        {/* Tier Pricing Snippet */}
                        <div className="bg-amber-50/50 rounded-lg p-2.5 border border-amber-100 space-y-1">
                          <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
                            <span className="flex items-center gap-1">
                              <Layers className="w-3 h-3 text-amber-700" />
                              <span>Wholesale Tier Rates:</span>
                            </span>
                            <span className="text-stone-500">MOQ: {product.moq} kg</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1 pt-1 text-center">
                            {product.priceTiers.map((tier, idx) => (
                              <div key={idx} className="bg-white rounded p-1 border border-amber-200/60 shadow-2xs">
                                <p className="text-[10px] text-stone-500">{tier.minQty}{tier.maxQty < 5000 ? `-${tier.maxQty}` : '+'} kg</p>
                                <p className="text-xs font-bold text-stone-900">₹{tier.unitPrice}/kg</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 pt-0 border-t border-stone-100 mt-2 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-stone-400 block">Base Price (ex-tax)</span>
                        <div className="text-base font-extrabold text-stone-900">
                          {formatINR(product.basePricePerUnit)}
                          <span className="text-xs font-normal text-stone-500"> / kg</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedProductDetails(product)}
                          className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                          title="View Technical Specs & Lab Certificate"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenOrderModal(product)}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Tag className="w-3.5 h-3.5" />
                          <span>Order Lot</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Product Specs Modal */}
      {selectedProductDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {selectedProductDetails.category} • HSN {selectedProductDetails.hsnCode}
                </span>
                <h3 className="text-lg font-bold text-stone-900 mt-1">{selectedProductDetails.title}</h3>
                <p className="text-xs text-stone-500">Sold by {selectedProductDetails.vendorBusinessName} ({selectedProductDetails.originState})</p>
              </div>
              <button
                onClick={() => setSelectedProductDetails(null)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-stone-700">
              <div>
                <h4 className="font-bold text-stone-900 mb-1">Commodity Description:</h4>
                <p className="leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-200">
                  {selectedProductDetails.description}
                </p>
              </div>

              {/* Lab & Agmark Specs Table */}
              <div>
                <h4 className="font-bold text-stone-900 mb-2">Quality & Laboratory Specifications:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                    <span className="text-stone-500 text-[10px] block">Moisture Content</span>
                    <strong className="text-stone-900 text-sm">{selectedProductDetails.qualitySpecs?.moisturePercent || '8.5'}%</strong>
                    <span className="text-[10px] text-emerald-600 block">&lt; 10% FSSAI</span>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                    <span className="text-stone-500 text-[10px] block">Volatile Oil</span>
                    <strong className="text-stone-900 text-sm">{selectedProductDetails.qualitySpecs?.volatileOilPercent || '3.2'}% v/w</strong>
                    <span className="text-[10px] text-emerald-600 block">High aroma retention</span>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                    <span className="text-stone-500 text-[10px] block">Extraneous Matter</span>
                    <strong className="text-stone-900 text-sm">{selectedProductDetails.qualitySpecs?.foreignMatterPercent || '0.3'}%</strong>
                    <span className="text-[10px] text-emerald-600 block">Sortex Clean</span>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                    <span className="text-stone-500 text-[10px] block">Agmark Grade</span>
                    <strong className="text-amber-700 text-sm">{selectedProductDetails.qualitySpecs?.agmarkGrade || 'Grade I'}</strong>
                    <span className="text-[10px] text-stone-500 block">Govt DMI Inspected</span>
                  </div>
                </div>
              </div>

              {/* Culinary & Industrial Applications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedProductDetails.culinaryUses && selectedProductDetails.culinaryUses.length > 0 && (
                  <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200">
                    <h5 className="font-bold text-amber-900 mb-1.5">Culinary Applications:</h5>
                    <ul className="list-disc list-inside space-y-1 text-stone-700">
                      {selectedProductDetails.culinaryUses.map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedProductDetails.industrialUses && selectedProductDetails.industrialUses.length > 0 && (
                  <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                    <h5 className="font-bold text-stone-900 mb-1.5">Industrial & Commercial Extraction:</h5>
                    <ul className="list-disc list-inside space-y-1 text-stone-700">
                      {selectedProductDetails.industrialUses.map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500">Available Stock:</span>
                <span className="font-bold text-stone-900 ml-1 text-sm">{selectedProductDetails.availableStock.toLocaleString('en-IN')} kg</span>
              </div>
              <button
                onClick={() => {
                  const p = selectedProductDetails;
                  setSelectedProductDetails(null);
                  onOpenOrderModal(p);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm"
              >
                Proceed to Order Placement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
