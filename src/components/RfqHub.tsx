/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PrivateLabelRfq, User, AiRfqEstimationResult, VendorQuotation } from '../types/marketplace';
import { formatINR } from '../utils/compliance';
import { 
  PackageCheck, 
  Sparkles, 
  Clock, 
  Layers, 
  Send, 
  Building2, 
  CheckCircle2, 
  Info,
  ShieldCheck,
  TrendingDown
} from 'lucide-react';

interface RfqHubProps {
  currentUser: User;
  rfqs: PrivateLabelRfq[];
  onAddRfq: (rfq: PrivateLabelRfq) => void;
  onSubmitQuote: (rfqId: string, quote: VendorQuotation) => void;
}

export const RfqHub: React.FC<RfqHubProps> = ({
  currentUser,
  rfqs,
  onAddRfq,
  onSubmitQuote,
}) => {
  // New RFQ Form state
  const [spiceCategory, setSpiceCategory] = useState('Cumin');
  const [targetQuantityKg, setTargetQuantityKg] = useState<number>(2000);
  const [packagingType, setPackagingType] = useState('Standup pouch with foil barrier (250g / 500g)');
  const [targetPPU, setTargetPPU] = useState<number>(310);
  const [deliveryCity, setDeliveryCity] = useState(currentUser.state || 'Surat, Gujarat');
  const [notes, setNotes] = useState('Require 4-color rotogravure printing with matte touch and nitrogen flushing.');
  
  // AI Estimator State
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimationResult, setEstimationResult] = useState<AiRfqEstimationResult | null>(null);

  // Vendor Quote Submission Modal state
  const [activeQuotingRfqId, setActiveQuotingRfqId] = useState<string | null>(null);
  const [quotePPU, setQuotePPU] = useState<number>(315);
  const [quoteMinBatch, setQuoteMinBatch] = useState<number>(1500);
  const [quoteLeadDays, setQuoteLeadDays] = useState<number>(14);
  const [quoteNotes, setQuoteNotes] = useState('Includes 3-ply foil pouches with nitrogen flushing (residual O2 < 1.2%). Cylinders waived for orders > 2500kg.');

  // Run AI Private-Label Estimator
  const handleEstimateRfq = async () => {
    setIsEstimating(true);
    try {
      const response = await fetch('/api/ai/rfq-estimator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spiceCategory,
          targetQuantityKg,
          packagingType,
          targetPPU,
          deliveryCity,
        }),
      });

      if (response.ok) {
        const data: AiRfqEstimationResult = await response.json();
        setEstimationResult(data);
      }
    } catch (err) {
      console.error('Failed to run AI RFQ estimator', err);
    } finally {
      setIsEstimating(false);
    }
  };

  // Submit RFQ to Marketplace
  const handleSubmitNewRfq = () => {
    const newRfq: PrivateLabelRfq = {
      rfqId: `RFQ-PL-2026-${Math.floor(100 + Math.random() * 900)}`,
      retailerId: currentUser.uid,
      retailerBusinessName: currentUser.businessName,
      spiceCategory,
      targetQuantityKg,
      packagingType,
      targetPPU,
      deliveryCity,
      notes,
      status: 'submitted',
      vendorQuotations: [],
      createdAt: new Date().toISOString(),
    };

    onAddRfq(newRfq);
  };

  // Vendor submits quote
  const handleVendorSubmitQuote = () => {
    if (!activeQuotingRfqId) return;

    const newQuote: VendorQuotation = {
      vendorId: currentUser.uid,
      vendorName: currentUser.businessName,
      quotePPU,
      minBatchKg: quoteMinBatch,
      leadTimeDays: quoteLeadDays,
      notes: quoteNotes,
      submittedAt: new Date().toISOString(),
    };

    onSubmitQuote(activeQuotingRfqId, newQuote);
    setActiveQuotingRfqId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero & Scope */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300">
            <PackageCheck className="w-3.5 h-3.5" />
            <span>OEM & Private-Label Contract Manufacturing</span>
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mt-1">Private-Label RFQ Hub & AI Cost Estimator</h2>
          <p className="text-xs text-stone-500">
            Design your own Kirana or supermarket branded spice pouches, nitrogen-flushed tins, or bulk export bags.
            AI estimates cost curves, volume breaks, and barrier requirements.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Panel: Submit RFQ & AI Estimator */}
        <div className="lg:col-span-1 bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4 h-fit">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-stone-900 text-sm">Create New Custom RFQ</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Spice Category:</label>
              <select
                value={spiceCategory}
                onChange={(e) => setSpiceCategory(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="Cumin">Cumin (Jeera) - Whole or Ground</option>
                <option value="Turmeric">Turmeric (Haldi) - Pure Salem Ground</option>
                <option value="Chilli">Red Chilli - Pungent Teja S17</option>
                <option value="Coriander">Coriander (Dhana) - Eagle Clean</option>
                <option value="Cardamom">Green Cardamom - 8mm Bold</option>
                <option value="Pepper">Black Pepper - Tellicherry TGSEB</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Target Volume (kg):</label>
              <input
                type="number"
                step="500"
                min="500"
                value={targetQuantityKg}
                onChange={(e) => setTargetQuantityKg(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900 font-bold"
              />
              <span className="text-[10px] text-stone-400">Typical minimum contract batch: 1,000 kg</span>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Packaging Format & Material:</label>
              <select
                value={packagingType}
                onChange={(e) => setPackagingType(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="Standup pouch with foil barrier (250g / 500g)">Standup Pouch (Ziplock foil barrier, 250g/500g)</option>
                <option value="Nitrogen-flushed tin canister (100g luxury series)">Nitrogen-Flushed Tin Canister (100g/200g)</option>
                <option value="3-ply corrugated bulk bag (25kg/50kg)">3-Ply Corrugated Multiwall Bulk Bag (25kg/50kg)</option>
                <option value="Pillow pouch (standard retail 50g/100g)">Pillow Pouch (Standard retail 50g/100g)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Target Price (₹/kg):</label>
                <input
                  type="number"
                  value={targetPPU}
                  onChange={(e) => setTargetPPU(Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900 font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">Delivery City:</label>
                <input
                  type="text"
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Printing & Artwork Specs:</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleEstimateRfq}
              disabled={isEstimating}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isEstimating ? 'Estimating with Gemini...' : 'Analyze with AI Estimator'}</span>
            </button>

            <button
              onClick={handleSubmitNewRfq}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish RFQ to Mandi Vendors</span>
            </button>
          </div>
        </div>

        {/* Estimation Output & Active RFQ Directory */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Estimation Result Card */}
          {estimationResult && (
            <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-5 shadow-sm space-y-4 text-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-950 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Gemini Private-Label Feasibility & Cost Guidance</span>
                </div>
                <span className="text-[10px] bg-white text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-300">
                  Target: {targetQuantityKg} kg • {spiceCategory}
                </span>
              </div>

              {/* Indicative Range & Lead Times */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-2.5 rounded-xl border border-amber-200 text-center">
                  <span className="text-[10px] text-stone-500 block">Indicative Price / kg</span>
                  <strong className="text-stone-900 text-sm font-black">
                    ₹{estimationResult.indicativePricePerKgRange.min} - ₹{estimationResult.indicativePricePerKgRange.max}
                  </strong>
                  <span className="text-[10px] text-emerald-600 block">Avg: ₹{estimationResult.indicativePricePerKgRange.average}</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-amber-200 text-center">
                  <span className="text-[10px] text-stone-500 block">Packaging Unit Cost</span>
                  <strong className="text-stone-900 text-sm font-black">₹{estimationResult.packagingCostPerUnit}</strong>
                  <span className="text-[10px] text-stone-400 block">per pouch/tin</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-amber-200 text-center">
                  <span className="text-[10px] text-stone-500 block">Estimated Lead Time</span>
                  <strong className="text-stone-900 text-sm font-black flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{estimationResult.estimatedLeadTimeDays.totalDays} Days</span>
                  </strong>
                  <span className="text-[10px] text-stone-500 block">
                    {estimationResult.estimatedLeadTimeDays.production}d prod + {estimationResult.estimatedLeadTimeDays.printing}d print
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-amber-200 text-center">
                  <span className="text-[10px] text-stone-500 block">Target Feasibility</span>
                  <strong className="text-emerald-700 text-sm font-black">
                    {targetPPU >= estimationResult.indicativePricePerKgRange.min ? '✓ Realistic' : '⚠ Tight Margin'}
                  </strong>
                  <span className="text-[10px] text-stone-500 block">Target: ₹{targetPPU}/kg</span>
                </div>
              </div>

              {/* Volume Breaks */}
              <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-2">
                <span className="font-bold text-stone-900 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Volume-Break Economics (Economies of Scale):</span>
                </span>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {estimationResult.volumeBreakDiscounts.map((tier, idx) => (
                    <div key={idx} className="bg-stone-50 p-2 rounded-lg border border-stone-200">
                      <span className="text-[10px] text-stone-500 block">{tier.tierKg.toLocaleString('en-IN')} kg</span>
                      <strong className="text-xs text-stone-900">₹{tier.estimatedPricePerKg}/kg</strong>
                      <span className="text-[10px] text-emerald-700 font-semibold block">
                        {tier.savingsPercent > 0 ? `-${tier.savingsPercent}%` : 'Base'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="space-y-1 bg-white p-3 rounded-xl border border-amber-200">
                <span className="font-bold text-stone-900 block">Technical Packaging & Shelf-Life Protocol:</span>
                <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                  {estimationResult.technicalConsiderations.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Active RFQ List */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900">Marketplace RFQs & Quotations</h3>
              <span className="text-xs text-stone-500">{rfqs.length} active inquiries</span>
            </div>

            <div className="space-y-4">
              {rfqs.map((rfq) => (
                <div key={rfq.rfqId} className="border border-stone-200 rounded-xl p-4 text-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900 text-sm">{rfq.rfqId}</span>
                        <span className="bg-stone-100 font-bold px-2 py-0.5 rounded text-[10px] text-stone-700">
                          {rfq.spiceCategory}
                        </span>
                      </div>
                      <p className="text-stone-500 mt-0.5">
                        Posted by <strong className="text-stone-800">{rfq.retailerBusinessName}</strong> • Target: {rfq.targetQuantityKg.toLocaleString('en-IN')} kg
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase ${
                          rfq.status === 'quoted'
                            ? 'bg-blue-100 text-blue-800'
                            : rfq.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rfq.status}
                      </span>
                      <span className="font-bold text-stone-900">Target: ₹{rfq.targetPPU}/kg</span>
                    </div>
                  </div>

                  <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 text-stone-700 space-y-1">
                    <p><strong>Packaging:</strong> {rfq.packagingType}</p>
                    <p><strong>Delivery Destination:</strong> {rfq.deliveryCity}</p>
                    {rfq.notes && <p><strong>Artwork / Technical Notes:</strong> {rfq.notes}</p>}
                  </div>

                  {/* Vendor Quotations Received */}
                  <div className="space-y-2">
                    <span className="font-bold text-stone-800 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-stone-500" />
                      <span>Vendor Quotations ({rfq.vendorQuotations.length}):</span>
                    </span>

                    {rfq.vendorQuotations.length === 0 ? (
                      <p className="text-stone-400 italic">No vendor quotes submitted yet. Awaiting mandi millers.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {rfq.vendorQuotations.map((quote, qIdx) => (
                          <div
                            key={qIdx}
                            className="bg-amber-50/50 border border-amber-200 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div>
                              <div className="flex items-center gap-2 font-bold text-stone-900">
                                <Building2 className="w-3.5 h-3.5 text-amber-700" />
                                <span>{quote.vendorName}</span>
                                <span className="text-emerald-700 text-sm font-black">₹{quote.quotePPU}/kg</span>
                              </div>
                              <p className="text-[11px] text-stone-600 mt-0.5">{quote.notes}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-stone-500 block">Min Batch: {quote.minBatchKg} kg</span>
                              <span className="text-[11px] font-semibold text-stone-700 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>{quote.leadTimeDays} days lead</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Vendor Action: Submit Quotation */}
                  {(currentUser.role === 'vendor' || currentUser.role === 'admin') && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          setActiveQuotingRfqId(rfq.rfqId);
                          setQuotePPU(rfq.targetPPU + 10);
                        }}
                        className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5 text-amber-400" />
                        <span>Submit Vendor Quotation</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Quote Submission Modal */}
      {activeQuotingRfqId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <h4 className="font-bold text-stone-900 text-sm">Submit Quotation for {activeQuotingRfqId}</h4>
                <p className="text-xs text-stone-500">Quoting as: {currentUser.businessName}</p>
              </div>
              <button onClick={() => setActiveQuotingRfqId(null)} className="text-stone-400 hover:text-stone-700 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Quote Unit Price (₹ / kg):</label>
                <input
                  type="number"
                  value={quotePPU}
                  onChange={(e) => setQuotePPU(Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 font-bold text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Min Batch (kg):</label>
                  <input
                    type="number"
                    value={quoteMinBatch}
                    onChange={(e) => setQuoteMinBatch(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Lead Time (days):</label>
                  <input
                    type="number"
                    value={quoteLeadDays}
                    onChange={(e) => setQuoteLeadDays(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Packaging Specs & Notes:</label>
                <textarea
                  rows={3}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setActiveQuotingRfqId(null)}
                className="px-3 py-1.5 bg-stone-100 text-stone-700 rounded-lg font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleVendorSubmitQuote}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-sm"
              >
                Submit Official Bid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
