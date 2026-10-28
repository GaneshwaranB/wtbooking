import React, { useState } from 'react';
import { TicketReservationHold, Order, Transaction } from '../types/index.ts';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, Loader2, CreditCard, Ticket, Download } from 'lucide-react';

interface CheckoutModalProps {
  hold: TicketReservationHold | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ hold, onClose, onSuccess }) => {
  const [outcome, setOutcome] = useState<'APPROVE' | 'ASYNC_APPROVE' | 'REJECT'>('APPROVE');
  const [step, setStep] = useState<'REVIEW' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('REVIEW');
  const [order, setOrder] = useState<Order | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!hold) return null;

  const handleCheckoutAndPay = async () => {
    setStep('PROCESSING');
    setErrorMessage('');

    try {
      // Step 1: Convert Hold to Order (Atomic validation of hold token)
      const checkoutRes = await fetch('/api/reservations/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdToken: hold.holdToken }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok || !checkoutData.success) {
        setStep('FAILED');
        setErrorMessage(checkoutData.message || checkoutData.error || 'Checkout conversion failed.');
        return;
      }

      const createdOrder: Order = checkoutData.order;
      setOrder(createdOrder);

      // Step 2: Trigger Payment Gateway Simulator
      const payRes = await fetch('/api/payment/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: createdOrder.id, outcome }),
      });

      const payData = await payRes.json();

      if (outcome === 'APPROVE') {
        setStep('SUCCESS');
        setTransaction(payData.transaction);
        onSuccess();
      } else if (outcome === 'REJECT') {
        setStep('FAILED');
        setErrorMessage(payData.message || 'Payment card declined.');
        setTransaction(payData.transaction);
      } else {
        // ASYNC APPROVE: Poll after 2.2 seconds
        setTimeout(async () => {
          const pollRes = await fetch(`/api/payment/status/${createdOrder.id}`);
          const pollData = await pollRes.json();
          if (pollData.order?.status === 'PAID') {
            setStep('SUCCESS');
            setTransaction(pollData.transaction);
            onSuccess();
          } else {
            setStep('FAILED');
            setErrorMessage('Async webhook failed to settle transaction.');
          }
        }, 2200);
      }
    } catch (err: any) {
      setStep('FAILED');
      setErrorMessage(err.message || 'Network error during checkout');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              {step === 'SUCCESS' ? 'Booking Confirmed' : 'Complete Reservation'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on step */}
        <div className="p-6 space-y-6">
          {step === 'REVIEW' && (
            <>
              {/* Order Summary */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs text-slate-400 font-mono">
                  Hold Token: <span className="text-indigo-400">{hold.holdToken}</span>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-white text-sm">{hold.eventTitle}</h4>
                    <p className="text-xs text-slate-400">
                      Tier: {hold.tierName} · Qty: {hold.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold font-mono text-white tabular-nums">
                      ₹{(hold.totalAmount / 100).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-400">INR total</div>
                  </div>
                </div>
              </div>

              {/* Attendee Details */}
              <div className="text-xs text-slate-300 space-y-1">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Attendee Name:</span>
                  <span className="font-medium text-white">{hold.attendeeName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Attendee Email:</span>
                  <span className="font-medium text-white">{hold.attendeeEmail}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Reservation Guarantee:</span>
                  <span className="text-emerald-400 font-medium">10-Minute Ephemeral Row Lock</span>
                </div>
              </div>

              {/* Payment Gateway Simulation selector */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Select Mock Payment Gateway Response:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <label
                    className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer text-xs ${
                      outcome === 'APPROVE'
                        ? 'bg-indigo-950/40 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="outcome"
                        checked={outcome === 'APPROVE'}
                        onChange={() => setOutcome('APPROVE')}
                        className="accent-indigo-500"
                      />
                      <span>⚡ Instant Approval (Synchronous 200 OK)</span>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer text-xs ${
                      outcome === 'ASYNC_APPROVE'
                        ? 'bg-indigo-950/40 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="outcome"
                        checked={outcome === 'ASYNC_APPROVE'}
                        onChange={() => setOutcome('ASYNC_APPROVE')}
                        className="accent-indigo-500"
                      />
                      <span>⏳ Asynchronous Webhook Simulation (2s delay + poll)</span>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer text-xs ${
                      outcome === 'REJECT'
                        ? 'bg-red-950/40 border-red-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="outcome"
                        checked={outcome === 'REJECT'}
                        onChange={() => setOutcome('REJECT')}
                        className="accent-red-500"
                      />
                      <span>❌ Simulate Card Decline (Test rollback)</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Keep on Hold
                </button>
                <button
                  onClick={handleCheckoutAndPay}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Authorize ₹{(hold.totalAmount / 100).toLocaleString('en-IN')}</span>
                </button>
              </div>
            </>
          )}

          {step === 'PROCESSING' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
              <div>
                <h4 className="text-base font-semibold text-white">
                  Executing Atomic Checkout & Payment
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Validating hold lock, deducting held tickets, and dispatching gateway transaction...
                </p>
              </div>
            </div>
          )}

          {step === 'SUCCESS' && order && (
            <div className="space-y-6">
              {/* Digital Pass Card */}
              <div className="bg-gradient-to-b from-indigo-950/40 to-slate-950 p-6 rounded-2xl border border-indigo-500/30 space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      Confirmed & Paid
                    </span>
                  </div>
                  <span className="font-mono text-xs text-slate-400 font-semibold">
                    {order.orderNumber}
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-white">{order.eventTitle}</h4>
                  <div className="text-xs text-indigo-300 mt-0.5">
                    {order.tierName} · {order.quantity} Ticket(s)
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                  <div>
                    <div className="text-slate-400 text-[10px]">ATTENDEE</div>
                    <div className="font-medium text-white">{order.attendeeName}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">TOTAL SETTLED</div>
                    <div className="font-mono font-bold text-emerald-400">
                      ₹{(order.totalAmount / 100).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {transaction && (
                  <div className="text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                    Ref: {transaction.gatewayReference} ({transaction.gateway})
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const ticketText = `TICKET PASS: ${order.orderNumber}\nEvent: ${order.eventTitle}\nTier: ${order.tierName} (${order.quantity}x)\nAttendee: ${order.attendeeName}\nTotal: ₹${(order.totalAmount / 100).toLocaleString('en-IN')}\nStatus: PAID`;
                    const blob = new Blob([ticketText], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${order.orderNumber}_ticket_pass.txt`;
                    a.click();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Pass</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {step === 'FAILED' && (
            <div className="space-y-6">
              <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl space-y-2 text-center">
                <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Checkout Transaction Rejected</h4>
                <p className="text-xs text-red-300">{errorMessage}</p>
                <p className="text-[11px] text-slate-400 pt-1">
                  If the hold expired or card declined, ticket inventory is safely rolled back to prevent double-booking.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep('REVIEW')}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Change Payment
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium text-white bg-red-600 hover:bg-red-500 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
