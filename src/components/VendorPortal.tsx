/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, User, Order, AiCatalogSeoResult, AiQualityReport } from '../types/marketplace';
import { formatINR } from '../utils/compliance';
import { 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Truck, 
  PlusCircle, 
  ArrowRight,
  HelpCircle
} from 'lucide-react';

interface VendorPortalProps {
  currentUser: User;
  products: Product[];
  orders: Order[];
  onAddProduct: (product: Product) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['fulfillmentStatus'], trackingNumber?: string) => void;
}

export const VendorPortal: React.FC<VendorPortalProps> = ({
  currentUser,
  products,
  orders,
  onAddProduct,
  onUpdateOrderStatus,
}) => {
  const [activeVendorSubtab, setActiveVendorSubtab] = useState<'cataloger' | 'quality' | 'inventory' | 'dispatch'>('cataloger');

  // 1. AI Catalog & SEO Generator State
  const [rawSpiceInput, setRawSpiceInput] = useState('Salem Turmeric, 3.8% Curcumin, Finger type, Erode origin, triple-polished, moisture 8.5%');
  const [isGeneratingCatalog, setIsGeneratingCatalog] = useState(false);
  const [generatedCatalog, setGeneratedCatalog] = useState<AiCatalogSeoResult | null>(null);
  const [catalogPublishSuccess, setCatalogPublishSuccess] = useState(false);

  // 2. AI Quality & Specification Assistant State
  const [selectedSpiceCategory, setSelectedSpiceCategory] = useState('Turmeric');
  const [moistureInput, setMoistureInput] = useState('9.2');
  const [volatileOilInput, setVolatileOilInput] = useState('3.8');
  const [foreignMatterInput, setForeignMatterInput] = useState('0.3');
  const [totalAshInput, setTotalAshInput] = useState('6.2');
  const [bioactiveInput, setBioactiveInput] = useState('3.8'); // Curcumin %
  const [isAuditingQuality, setIsAuditingQuality] = useState(false);
  const [qualityReport, setQualityReport] = useState<AiQualityReport | null>(null);

  // Dispatch state
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<string | null>(null);
  const [trackingNumberInput, setTrackingNumberInput] = useState('');

  // Handle AI Catalog Generation
  const handleGenerateCatalog = async () => {
    if (!rawSpiceInput.trim()) return;
    setIsGeneratingCatalog(true);
    setCatalogPublishSuccess(false);

    try {
      const response = await fetch('/api/ai/catalog-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawDetails: rawSpiceInput }),
      });

      if (response.ok) {
        const data: AiCatalogSeoResult = await response.json();
        setGeneratedCatalog(data);
      }
    } catch (err) {
      console.error('Failed to generate AI catalog', err);
    } finally {
      setIsGeneratingCatalog(false);
    }
  };

  // Publish AI Generated Listing to Marketplace
  const handlePublishGeneratedProduct = () => {
    if (!generatedCatalog) return;

    const newProduct: Product = {
      productId: `prod-${Date.now().toString().slice(-6)}`,
      vendorId: currentUser.uid,
      vendorBusinessName: currentUser.businessName,
      title: generatedCatalog.title,
      category: generatedCatalog.category,
      spiceType: generatedCatalog.spiceType,
      originState: currentUser.state,
      originMandi: `${currentUser.state} APMC Mandi`,
      hsnCode: generatedCatalog.recommendedHsn || '091030',
      gstRate: 5,
      unitOfMeasure: 'kg',
      basePricePerUnit: 175,
      moq: generatedCatalog.suggestedMoqKg || 50,
      availableStock: 10000,
      priceTiers: [
        { minQty: 50, maxQty: 199, unitPrice: 175 },
        { minQty: 200, maxQty: 499, unitPrice: 165 },
        { minQty: 500, maxQty: 5000, unitPrice: 155 },
      ],
      privateLabelAvailable: true,
      status: 'active',
      images: [
        'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
      ],
      description: generatedCatalog.description,
      meshGranuleSize: generatedCatalog.meshGranuleSize,
      culinaryUses: generatedCatalog.culinaryUses,
      industrialUses: generatedCatalog.industrialUses,
      searchTags: generatedCatalog.searchTags,
      qualitySpecs: {
        moisturePercent: 8.8,
        volatileOilPercent: 3.5,
        foreignMatterPercent: 0.3,
        totalAshPercent: 6.0,
        activeBioactivePercent: 3.8,
        agmarkGrade: (generatedCatalog.agmarkGradeSuggested as 'Special Grade' | 'Grade I' | 'Grade II' | 'Standard') || 'Grade I',
        fssaiCompliant: true,
      },
      createdAt: new Date().toISOString(),
    };

    onAddProduct(newProduct);
    setCatalogPublishSuccess(true);
  };

  // Handle AI Quality Audit
  const handleAuditQuality = async () => {
    setIsAuditingQuality(true);
    try {
      const response = await fetch('/api/ai/quality-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spiceCategory: selectedSpiceCategory,
          testParameters: {
            moisturePercent: moistureInput,
            volatileOilPercent: volatileOilInput,
            foreignMatterPercent: foreignMatterInput,
            totalAshPercent: totalAshInput,
            curcuminOrPiperineOrCapsaicin: bioactiveInput,
          },
        }),
      });

      if (response.ok) {
        const data: AiQualityReport = await response.json();
        setQualityReport(data);
      }
    } catch (err) {
      console.error('Failed to audit quality parameters', err);
    } finally {
      setIsAuditingQuality(false);
    }
  };

  // Vendor's own orders
  const vendorOrders = orders.filter((o) => o.vendorId === currentUser.uid || currentUser.role === 'admin');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile Info */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300">
              Verified Mandi Stockist
            </span>
            <span className="text-xs text-stone-500 font-medium">GSTIN: {currentUser.gstin || '24AAACS1429B1Z5'}</span>
            <span className="text-xs text-stone-500 font-medium">FSSAI: {currentUser.fssaiNumber || '12421008000492'}</span>
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mt-1">{currentUser.businessName}</h2>
          <p className="text-xs text-stone-600">
            Dispatch Center: {currentUser.state} • Monthly Capacity: 85,000 kg • Rating: 4.8/5.0 ★
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1.5 rounded-xl border border-stone-200 text-xs font-semibold">
          <button
            onClick={() => setActiveVendorSubtab('cataloger')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeVendorSubtab === 'cataloger'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>AI Catalog & SEO</span>
          </button>
          <button
            onClick={() => setActiveVendorSubtab('quality')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeVendorSubtab === 'quality'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Quality Assistant</span>
          </button>
          <button
            onClick={() => setActiveVendorSubtab('inventory')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeVendorSubtab === 'inventory'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>My Lots ({products.filter((p) => p.vendorId === currentUser.uid).length})</span>
          </button>
          <button
            onClick={() => setActiveVendorSubtab('dispatch')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeVendorSubtab === 'dispatch'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            <span>Dispatch & Orders ({vendorOrders.length})</span>
          </button>
        </div>
      </div>

      {/* 1. AI SPICE CATALOG & SEO GENERATOR SUBTAB */}
      {activeVendorSubtab === 'cataloger' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">AI Spice Catalog & SEO Generator</h3>
                <p className="text-xs text-stone-500">
                  Transform raw mandi arrival notes into high-ranking B2B catalog specs with HSN, moisture & use cases.
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1.5">
                Raw Spice Lot Details:
              </label>
              <textarea
                rows={5}
                value={rawSpiceInput}
                onChange={(e) => setRawSpiceInput(e.target.value)}
                placeholder="e.g. Salem Turmeric, 3.5% Curcumin, Finger type, Erode origin, moisture 8.5%, triple-polished"
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Quick Templates */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-stone-500">Quick Test Prompts:</span>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setRawSpiceInput(
                      'Salem Turmeric, 3.8% Curcumin, Finger type, Erode origin, triple-polished, moisture 8.5%'
                    )
                  }
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1 rounded-md text-[11px]"
                >
                  Salem Turmeric (Erode)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRawSpiceInput(
                      'Unjha Cumin Seeds (Jeera), 99.5% Machine Clean, Volatile oil 3.4%, moisture 8.2%, sortex grade'
                    )
                  }
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1 rounded-md text-[11px]"
                >
                  Unjha Cumin 99.5%
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRawSpiceInput(
                      'Guntur Teja S17 Stemless Dry Red Chilli, Capsaicin 0.65%, SHU 70,000, moisture 9.8%, polyhouse dried'
                    )
                  }
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1 rounded-md text-[11px]"
                >
                  Guntur Teja Stemless
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerateCatalog}
              disabled={isGeneratingCatalog || !rawSpiceInput.trim()}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              {isGeneratingCatalog ? (
                <span>Generating with Gemini AI...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Standard B2B Catalog Specs</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Result Output */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            {generatedCatalog ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Standardized B2B Specification
                    </span>
                    <h4 className="text-base font-bold text-stone-900 mt-1">{generatedCatalog.title}</h4>
                  </div>
                  <span className="text-xs font-mono font-bold bg-stone-100 px-2 py-1 rounded text-stone-800">
                    HSN {generatedCatalog.recommendedHsn}
                  </span>
                </div>

                <div className="space-y-3 text-xs text-stone-700">
                  <p className="bg-stone-50 p-3 rounded-lg border border-stone-200 leading-relaxed">
                    {generatedCatalog.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                      <span className="text-[10px] text-stone-500 block">Moisture Range</span>
                      <strong className="text-stone-900">{generatedCatalog.moistureRange}</strong>
                    </div>
                    <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                      <span className="text-[10px] text-stone-500 block">Mesh / Granule Size</span>
                      <strong className="text-stone-900">{generatedCatalog.meshGranuleSize}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-stone-900 block mb-1">Commercial & Industrial Uses:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {generatedCatalog.culinaryUses.concat(generatedCatalog.industrialUses).map((u, i) => (
                        <span key={i} className="bg-amber-50 text-amber-900 text-[11px] px-2 py-0.5 rounded border border-amber-200">
                          {u}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-stone-900 block mb-1">Target B2B SEO Search Tags:</span>
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {generatedCatalog.searchTags.map((tag, i) => (
                        <span key={i} className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {catalogPublishSuccess ? (
                  <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Successfully published lot to live BharatSpice marketplace!</span>
                  </div>
                ) : (
                  <button
                    onClick={handlePublishGeneratedProduct}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Publish Lot to Live Marketplace</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 text-stone-400">
                <Sparkles className="w-12 h-12 text-amber-300" />
                <h4 className="font-bold text-stone-700">AI Listing Generator Ready</h4>
                <p className="text-xs text-stone-500 max-w-sm">
                  Enter raw spice details on the left and click Generate to see structured B2B description, HSN codes, and search tags.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. QUALITY & SPECIFICATION ASSISTANT (ASTA, FSSAI, Agmark) */}
      {activeVendorSubtab === 'quality' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Quality & Specification Assistant</h3>
                <p className="text-xs text-stone-500">
                  Pre-approval lab validation against ASTA, FSSAI regulations, and Agmark Grade I/II.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Spice Commodity:</label>
                <select
                  value={selectedSpiceCategory}
                  onChange={(e) => setSelectedSpiceCategory(e.target.value)}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Turmeric">Turmeric (Salem / Erode / Nizamabad)</option>
                  <option value="Cumin">Cumin Seeds (Unjha Machine Clean)</option>
                  <option value="Chilli">Dry Red Chilli (Guntur / Byadgi)</option>
                  <option value="Coriander">Coriander Seeds (Badami / Eagle)</option>
                  <option value="Cardamom">Green Cardamom (Alleppey Bold)</option>
                  <option value="Pepper">Black Pepper (Tellicherry TGSEB)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Moisture Level (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={moistureInput}
                    onChange={(e) => setMoistureInput(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900"
                  />
                  <span className="text-[10px] text-stone-400">Limit: &lt; 10.0%</span>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Volatile Oil (% v/w)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={volatileOilInput}
                    onChange={(e) => setVolatileOilInput(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900"
                  />
                  <span className="text-[10px] text-stone-400">Target: &ge; 3.0%</span>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Foreign Matter (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={foreignMatterInput}
                    onChange={(e) => setForeignMatterInput(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900"
                  />
                  <span className="text-[10px] text-stone-400">Limit: &lt; 0.5% Special</span>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Total Ash (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={totalAshInput}
                    onChange={(e) => setTotalAshInput(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900"
                  />
                  <span className="text-[10px] text-stone-400">Limit: &lt; 7.0%</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Active Bioactive Content (Curcumin / Piperine / Capsaicin %):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={bioactiveInput}
                  onChange={(e) => setBioactiveInput(e.target.value)}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900"
                />
              </div>

              <div className="flex gap-2 text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMoistureInput('13.2');
                    setForeignMatterInput('1.8');
                  }}
                  className="text-stone-500 underline hover:text-red-600 text-[11px]"
                >
                  Load Non-Compliant Sample (Test Rejection Flag)
                </button>
              </div>
            </div>

            <button
              onClick={handleAuditQuality}
              disabled={isAuditingQuality}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              {isAuditingQuality ? (
                <span>Auditing with Gemini Standards Engine...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Indian Spice Standards (FSSAI/Agmark)</span>
                </>
              )}
            </button>
          </div>

          {/* Audit Report Result */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            {qualityReport ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded uppercase ${
                          qualityReport.overallStatus === 'compliant'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : qualityReport.overallStatus === 'warning'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {qualityReport.overallStatus === 'compliant' ? '✓ Compliant' : qualityReport.overallStatus === 'warning' ? '⚠ Warning' : '✕ Rejected'}
                      </span>
                      <span className="text-xs text-stone-500">{qualityReport.spiceStandardName}</span>
                    </div>
                    <p className="text-xs text-stone-700 mt-1 font-semibold">{qualityReport.approvalRecommendation}</p>
                  </div>
                </div>

                {/* Discrepancy Items */}
                <div className="space-y-2 text-xs">
                  <h5 className="font-bold text-stone-900">Lab Parameters Audit:</h5>
                  {qualityReport.parametersEvaluated.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border flex items-start justify-between gap-3 ${
                        item.status === 'compliant'
                          ? 'bg-stone-50 border-stone-200'
                          : item.status === 'warning'
                          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                          : 'bg-rose-50/70 border-rose-200 text-rose-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 font-bold">
                          <span>{item.parameter}:</span>
                          <span className="font-mono text-stone-900">{item.providedValue}</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">{item.explanation}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-stone-400 block">Benchmark</span>
                        <span className="text-[11px] font-semibold text-stone-700">{item.standardBenchmark}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {qualityReport.suggestedRemediation && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs space-y-1">
                    <strong className="text-amber-900 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                      <span>Suggested Vendor Remediation:</span>
                    </strong>
                    <p className="text-amber-800">{qualityReport.suggestedRemediation}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 text-stone-400">
                <ShieldCheck className="w-12 h-12 text-emerald-300" />
                <h4 className="font-bold text-stone-700">Standards Audit Engine Ready</h4>
                <p className="text-xs text-stone-500 max-w-sm">
                  Verify test parameters to prevent compliance infractions and ensure Agmark Grade I seal assignment.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. MY INVENTORY SUBTAB */}
      {activeVendorSubtab === 'inventory' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900">Active Vendor Spice Lots</h3>
            <span className="text-xs text-stone-500">Vendor ID: {currentUser.uid}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase">
                <tr>
                  <th className="py-3 px-3">Spice Lot Title</th>
                  <th className="py-3 px-3">HSN Code</th>
                  <th className="py-3 px-3">Base Price</th>
                  <th className="py-3 px-3">MOQ (kg)</th>
                  <th className="py-3 px-3">Available Stock</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {products
                  .filter((p) => p.vendorId === currentUser.uid)
                  .map((prod) => (
                    <tr key={prod.productId} className="hover:bg-stone-50">
                      <td className="py-3 px-3 font-semibold text-stone-900 max-w-xs truncate">
                        {prod.title}
                      </td>
                      <td className="py-3 px-3 font-mono">{prod.hsnCode}</td>
                      <td className="py-3 px-3 font-bold text-stone-900">{formatINR(prod.basePricePerUnit)}/kg</td>
                      <td className="py-3 px-3">{prod.moq} kg</td>
                      <td className="py-3 px-3 font-semibold">{prod.availableStock.toLocaleString('en-IN')} kg</td>
                      <td className="py-3 px-3">
                        <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded">
                          {prod.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. DISPATCH & FULFILLMENT SUBTAB */}
      {activeVendorSubtab === 'dispatch' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900">Wholesale Orders & Dispatch Management</h3>
            <span className="text-xs text-stone-500">{vendorOrders.length} total orders</span>
          </div>

          <div className="space-y-4">
            {vendorOrders.map((order) => (
              <div key={order.orderId} className="border border-stone-200 rounded-xl p-4 text-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2">
                  <div>
                    <span className="font-mono font-bold text-stone-900 text-sm">{order.orderId}</span>
                    <span className="text-stone-400 ml-2">({new Date(order.createdAt).toLocaleDateString('en-IN')})</span>
                    <p className="text-stone-600 mt-0.5">
                      Buyer: <strong className="text-stone-900">{order.retailerBusinessName}</strong> ({order.retailerState})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold px-2.5 py-0.5 rounded uppercase text-[10px] ${
                        order.fulfillmentStatus === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.fulfillmentStatus === 'dispatched'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.fulfillmentStatus}
                    </span>
                    <span className="font-bold text-stone-900 text-sm">{formatINR(order.grandTotal)}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-stone-700">
                      <span>{item.qty} kg × {item.title}</span>
                      <span className="font-semibold">{formatINR(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>

                {/* Tracking info if dispatched */}
                {order.shippingDetails?.trackingNumber && (
                  <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-lg text-stone-600 flex items-center justify-between">
                    <span>
                      Carrier: <strong className="text-stone-900">{order.shippingDetails.provider}</strong>
                    </span>
                    <span>
                      Tracking: <strong className="font-mono text-stone-900">{order.shippingDetails.trackingNumber}</strong>
                    </span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  {order.fulfillmentStatus === 'placed' && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.orderId, 'confirmed')}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                    >
                      Accept & Confirm
                    </button>
                  )}
                  {order.fulfillmentStatus === 'confirmed' && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.orderId, 'processing')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                    >
                      Start Packaging & Lot Milling
                    </button>
                  )}
                  {order.fulfillmentStatus === 'processing' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Logistics Tracking Number (e.g. VRL-9921)"
                        value={selectedOrderForDispatch === order.orderId ? trackingNumberInput : ''}
                        onFocus={() => setSelectedOrderForDispatch(order.orderId)}
                        onChange={(e) => setTrackingNumberInput(e.target.value)}
                        className="bg-stone-50 border border-stone-300 rounded p-1.5 text-xs font-mono"
                      />
                      <button
                        onClick={() => {
                          const track = trackingNumberInput || `VRL-SURAT-${Math.floor(100000 + Math.random() * 900000)}`;
                          onUpdateOrderStatus(order.orderId, 'dispatched', track);
                          setTrackingNumberInput('');
                          setSelectedOrderForDispatch(null);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Dispatch Shipment</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
