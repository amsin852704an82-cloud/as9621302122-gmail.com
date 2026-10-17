/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Dispute, Order, User, AiDisputeTriageResult, DisputeCategory } from '../types/marketplace';
import { formatINR } from '../utils/compliance';
import { 
  AlertTriangle, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Send, 
  Info,
  Building2,
  FileText
} from 'lucide-react';

interface DisputeCenterProps {
  currentUser: User;
  disputes: Dispute[];
  orders: Order[];
  onAddDispute: (dispute: Dispute) => void;
  onResolveDispute: (disputeId: string, resolutionType: Dispute['resolutionType'], notes: string, refundAmount?: number) => void;
}

export const DisputeCenter: React.FC<DisputeCenterProps> = ({
  currentUser,
  disputes,
  orders,
  onAddDispute,
  onResolveDispute,
}) => {
  // New Dispute Form
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.orderId || '');
  const [reasonCategory, setReasonCategory] = useState<DisputeCategory>('Quality Inconsistency');
  const [description, setDescription] = useState(
    'Received shipment with 3 torn bags. Moisture reading showed 13.5% with visible mold near bag seams.'
  );
  const [evidenceDescription, setEvidenceDescription] = useState('Photos of wet outer burlap bags and digital moisture meter reading 13.5%');
  const [claimAmount, setClaimAmount] = useState<number>(20000);

  // AI Triage State
  const [isTriaging, setIsTriaging] = useState(false);
  const [triageResult, setTriageResult] = useState<AiDisputeTriageResult | null>(null);

  // Admin Resolution State
  const [activeResolvingDisputeId, setActiveResolvingDisputeId] = useState<string | null>(null);
  const [adminResolutionType, setAdminResolutionType] = useState<Dispute['resolutionType']>('Partial Compensation');
  const [adminNotes, setAdminNotes] = useState('');
  const [refundAmountInput, setRefundAmountInput] = useState<number>(15000);

  // Handle AI Dispute Triage
  const handleRunAiTriage = async () => {
    if (!description.trim()) return;
    setIsTriaging(true);

    try {
      const response = await fetch('/api/ai/dispute-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderId,
          retailerComplaint: description,
          evidenceDescriptions: evidenceDescription,
          claimAmount,
        }),
      });

      if (response.ok) {
        const data: AiDisputeTriageResult = await response.json();
        setTriageResult(data);
      }
    } catch (err) {
      console.error('Failed to triage dispute', err);
    } finally {
      setIsTriaging(false);
    }
  };

  // Submit dispute to marketplace
  const handleCreateDispute = () => {
    const targetOrder = orders.find((o) => o.orderId === selectedOrderId);
    if (!targetOrder) return;

    const newDispute: Dispute = {
      disputeId: `DISP-2026-${Math.floor(100 + Math.random() * 900)}`,
      orderId: selectedOrderId,
      reportedBy: currentUser.uid,
      reportedByName: currentUser.businessName,
      vendorId: targetOrder.vendorId,
      vendorBusinessName: targetOrder.vendorBusinessName,
      reasonCategory: triageResult ? triageResult.disputeCategory : reasonCategory,
      description,
      evidenceUrls: [
        'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&q=80',
      ],
      claimAmount,
      status: 'open',
      createdAt: new Date().toISOString(),
      aiTriageResult: triageResult || undefined,
    };

    onAddDispute(newDispute);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded border border-red-300">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Platform Owner Mediation & Risk Analysis</span>
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mt-1">AI Dispute Triage & Settlement Center</h2>
          <p className="text-xs text-stone-500">
            Automated sentiment analysis, liability classification (Vendor vs Logistics Transporter), and recommended mediation refunds.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Raise Dispute / AI Triage Form */}
        <div className="lg:col-span-1 bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4 h-fit">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-stone-900 text-sm">Raise Complaint / Return</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Select Order ID:</label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 font-mono text-stone-900"
              >
                {orders.map((o) => (
                  <option key={o.orderId} value={o.orderId}>
                    {o.orderId} • {o.items[0]?.title.slice(0, 25)}... ({formatINR(o.grandTotal)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Dispute Reason:</label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value as DisputeCategory)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900"
              >
                <option value="Quality Inconsistency">Quality Inconsistency (Moisture / Aroma / Grade)</option>
                <option value="Transit Damage">Transit Damage (Torn bags / Rain soaking)</option>
                <option value="Short Shipment">Short Shipment (Missing bag weight)</option>
                <option value="Counterfeit/Adulteration">Adulteration / Synthetic Polish Suspected</option>
                <option value="Delayed Dispatch">Excessive Dispatch Delay &gt; 7 Days</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Claim Amount Requested (₹):</label>
              <input
                type="number"
                value={claimAmount}
                onChange={(e) => setClaimAmount(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 font-bold text-stone-900"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Retailer Complaint Description:</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900 leading-relaxed"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Physical Evidence / Photo Details:</label>
              <input
                type="text"
                value={evidenceDescription}
                onChange={(e) => setEvidenceDescription(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleRunAiTriage}
              disabled={isTriaging || !description.trim()}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isTriaging ? 'Running Gemini Triage...' : 'Analyze with AI Triage Assistant'}</span>
            </button>

            <button
              onClick={handleCreateDispute}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Dispute to Platform Owner</span>
            </button>
          </div>
        </div>

        {/* Right Column: Active Disputes & AI Triage Insights */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active AI Triage Output */}
          {triageResult && (
            <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-5 shadow-sm space-y-4 text-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-orange-200 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <span className="font-bold text-orange-950 text-sm">Gemini AI Dispute Triage & Mediation Analysis</span>
                </div>
                <span className="bg-white border border-orange-300 text-orange-900 font-bold px-2 py-0.5 rounded text-[10px]">
                  Confidence: {Math.round(triageResult.confidenceScore * 100)}%
                </span>
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2 rounded-lg border border-orange-200">
                  <span className="text-[10px] text-stone-500 block">Classified Category</span>
                  <strong className="text-stone-900 font-bold">{triageResult.disputeCategory}</strong>
                </div>
                <div className="bg-white p-2 rounded-lg border border-orange-200">
                  <span className="text-[10px] text-stone-500 block">Retailer Sentiment</span>
                  <strong
                    className={`font-bold ${
                      triageResult.sentimentScore === 'Aggressive'
                        ? 'text-red-700'
                        : triageResult.sentimentScore === 'Frustrated'
                        ? 'text-orange-700'
                        : 'text-stone-800'
                    }`}
                  >
                    {triageResult.sentimentScore}
                  </strong>
                </div>
                <div className="bg-white p-2 rounded-lg border border-orange-200">
                  <span className="text-[10px] text-stone-500 block">Liability Assessed To</span>
                  <strong className="text-purple-900 font-bold">{triageResult.liabilityAssessment}</strong>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white p-3 rounded-xl border border-orange-200 space-y-1">
                <span className="font-bold text-stone-900">Analysis Summary:</span>
                <p className="text-stone-700 leading-relaxed">{triageResult.summaryAnalysis}</p>
              </div>

              {/* Suggested Actions */}
              <div className="bg-white p-3 rounded-xl border border-orange-200 space-y-2">
                <span className="font-bold text-stone-900">Recommended Mediation Actions for Platform Owner:</span>
                <div className="space-y-1.5">
                  {triageResult.suggestedMediationActions.map((act, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 p-2 bg-stone-50 rounded-lg border border-stone-200">
                      <div>
                        <strong className="text-stone-900 block">{act.action}</strong>
                        <span className="text-[11px] text-stone-500">{act.impact}</span>
                      </div>
                      {act.recommendedRefundPercentage > 0 && (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] shrink-0">
                          Refund {act.recommendedRefundPercentage}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Draft Notice */}
              <div className="bg-white p-3 rounded-xl border border-orange-200 space-y-1">
                <span className="font-bold text-stone-900">Draft Official Resolution Notice:</span>
                <p className="font-mono text-[11px] text-stone-700 bg-stone-50 p-2.5 rounded border border-stone-200">
                  {triageResult.draftResolutionNotice}
                </p>
              </div>
            </div>
          )}

          {/* Existing Disputes List */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900">Active Disputes on Platform</h3>
              <span className="text-xs text-stone-500">{disputes.length} cases</span>
            </div>

            <div className="space-y-4">
              {disputes.map((disp) => (
                <div key={disp.disputeId} className="border border-stone-200 rounded-xl p-4 text-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900 text-sm">{disp.disputeId}</span>
                        <span className="bg-red-50 text-red-800 font-bold px-2 py-0.5 rounded text-[10px] border border-red-200">
                          {disp.reasonCategory}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            disp.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {disp.status}
                        </span>
                      </div>
                      <p className="text-stone-500 mt-1">
                        Order Ref: <strong className="font-mono text-stone-800">{disp.orderId}</strong> &bull; Filed by: <strong className="text-stone-800">{disp.reportedByName}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-stone-400 block">Claim Amount</span>
                      <strong className="text-stone-900 text-sm">{formatINR(disp.claimAmount)}</strong>
                    </div>
                  </div>

                  {/* Complaint Text */}
                  <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-stone-700 leading-relaxed">
                    <strong className="text-stone-900 block mb-0.5">Complaint:</strong>
                    {disp.description}
                  </div>

                  {/* AI Triage Attached to Dispute */}
                  {disp.aiTriageResult && (
                    <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 text-stone-700 space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-amber-900">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>AI Triage Finding:</span>
                        </span>
                        <span className="text-[10px] font-normal text-stone-600">
                          Liability: <strong className="text-stone-900">{disp.aiTriageResult.liabilityAssessment}</strong>
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600">{disp.aiTriageResult.summaryAnalysis}</p>
                    </div>
                  )}

                  {/* Resolution Notes if Resolved */}
                  {disp.status === 'resolved' && (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-900 space-y-1">
                      <strong className="flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Resolution: {disp.resolutionType}</span>
                      </strong>
                      <p className="text-xs text-stone-700">{disp.adminResolutionNotes}</p>
                      {disp.refundAmount && (
                        <p className="text-xs font-bold text-emerald-800">
                          Refund credited to retailer: {formatINR(disp.refundAmount)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Admin Resolution Trigger */}
                  {currentUser.role === 'admin' && disp.status !== 'resolved' && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          setActiveResolvingDisputeId(disp.disputeId);
                          setRefundAmountInput(disp.claimAmount);
                        }}
                        className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                      >
                        Execute Platform Owner Resolution
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Resolution Modal */}
      {activeResolvingDisputeId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <h4 className="font-bold text-stone-900 text-sm">Platform Owner Dispute Resolution</h4>
                <p className="text-xs text-stone-500">Case ID: {activeResolvingDisputeId}</p>
              </div>
              <button onClick={() => setActiveResolvingDisputeId(null)} className="text-stone-400 hover:text-stone-700 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Resolution Action:</label>
                <select
                  value={adminResolutionType}
                  onChange={(e) => setAdminResolutionType(e.target.value as Dispute['resolutionType'])}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 font-semibold text-stone-900"
                >
                  <option value="Partial Compensation">Partial Compensation (Credit Note)</option>
                  <option value="Full Refund">Full Refund (100% of Claim)</option>
                  <option value="Replacement Goods">Vendor Dispatch Replacement Lot</option>
                  <option value="Vendor Favor Dismissal">Dismiss Dispute (Vendor Compliant)</option>
                </select>
              </div>

              {adminResolutionType !== 'Vendor Favor Dismissal' && (
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Refund / Credit Amount (₹):</label>
                  <input
                    type="number"
                    value={refundAmountInput}
                    onChange={(e) => setRefundAmountInput(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 font-bold text-stone-900"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-stone-700 block mb-1">Platform Settlement Memo:</label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Official memo explaining mediation finding..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setActiveResolvingDisputeId(null)}
                className="px-3 py-1.5 bg-stone-100 text-stone-700 rounded-lg font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onResolveDispute(
                    activeResolvingDisputeId,
                    adminResolutionType,
                    adminNotes || 'Platform owner mediation finding executed in accordance with Spice Board cleanliness protocols.',
                    refundAmountInput
                  );
                  setActiveResolvingDisputeId(null);
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm"
              >
                Confirm & Settle Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
