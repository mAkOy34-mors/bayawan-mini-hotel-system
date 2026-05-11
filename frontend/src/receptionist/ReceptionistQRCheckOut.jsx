// src/receptionist/ReceptionistQRCheckOut.jsx
import { useState, useEffect, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import { Html5Qrcode } from 'html5-qrcode';
import { SHARED_CSS, fmt, fmtDate, Spinner, useToast, Toast } from '../admin/adminShared';
import {
  QrCode, ScanLine, CheckCircle2, AlertTriangle, LogOut,
  RefreshCw, Camera, XCircle, ArrowRight, Sparkles,
  CreditCard, Banknote, Smartphone, Wallet, DollarSign,
  Receipt, ClipboardList, Wrench, Coffee, Tv, Shirt, Package,
  Calendar, Clock
} from 'lucide-react';

import { API_BASE } from '../constants/config';

// Receipt Modal Component
const ReceiptModal = ({ show, onHide, bookingData, paymentDetails, charges, summary }) => {
  const receiptRef = useRef(null);
  
  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;
    
    const originalTitle = document.title;
    document.title = `Receipt_${bookingData?.reference || 'checkout'}`;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Check-out Receipt - Cebu Mini Hotel</title>
          <meta charset="utf-8" />
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
              background: #fff;
              padding: 2rem;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .receipt-print {
              max-width: 500px;
              width: 100%;
              margin: 0 auto;
              background: white;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
    document.title = originalTitle;
  };
  
  if (!bookingData) return null;
  
  // Calculate payment amounts correctly
  const totalPaidAtCheckout = paymentDetails?.amountCollected || 0;
  const totalDue = summary?.total_due || 0;
  const depositPaid = summary?.deposit_paid || 0;
  const roomSubtotal = summary?.subtotal || bookingData.totalAmount || 0;
  const serviceCharges = summary?.service_charges || 0;
  const totalBill = roomSubtotal + serviceCharges;
  
  // Total amount actually paid (deposit + checkout payment)
  const totalAmountPaid = depositPaid + totalPaidAtCheckout;
  const changeAmount = totalPaidAtCheckout > totalDue ? totalPaidAtCheckout - totalDue : 0;
  const isFullyPaidByDeposit = totalDue === 0 && depositPaid > 0 && totalPaidAtCheckout === 0;
  
  const receiptNumber = `RCP-${bookingData.id}-${Date.now().toString().slice(-6)}`;
  const paymentReference = paymentDetails?.reference || `PAY-${bookingData.id}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const today = new Date();
  const nights = bookingData.numberOfNights || 1;
  const ratePerNight = bookingData.ratePerNight || (roomSubtotal / nights);
  
  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="receipt-modal">
      <Modal.Body style={{ padding: 0, overflow: 'hidden' }}>
        <div ref={receiptRef} className="receipt-container">
          {/* Hotel Header */}
          <div className="receipt-header">
            <div className="hotel-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-5v-7H7v7H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h1 className="hotel-name">Cebu Mini Hotel</h1>
            <div className="hotel-tagline">Your Home Away From Home • Est. 2010</div>
            <div className="hotel-address">
              123 Queen's Street, Cebu City, Philippines 6000<br/>
              Tel: +63 (32) 123 4567 • Email: hello@cebuminihotel.com
            </div>
          </div>
          
          <div className="receipt-divider"></div>
          
          {/* Receipt Title */}
          <div className="receipt-title-section">
            <h2 className="receipt-title">OFFICIAL CHECK-OUT RECEIPT</h2>
            <div className="receipt-badge">{isFullyPaidByDeposit ? 'DEPOSIT PAID' : 'COMPLETED'}</div>
          </div>
          
          {/* Receipt Info */}
          <div className="receipt-info-grid">
            <div className="receipt-info-item">
              <span className="info-label">Receipt #:</span>
              <span className="info-value">{receiptNumber}</span>
            </div>
            <div className="receipt-info-item">
              <span className="info-label">Date:</span>
              <span className="info-value">{today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="receipt-info-item">
              <span className="info-label">Time:</span>
              <span className="info-value">{today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="receipt-info-item">
              <span className="info-label">Booking Ref:</span>
              <span className="info-value">{bookingData.reference}</span>
            </div>
          </div>
          
          <div className="receipt-divider-light"></div>
          
          {/* Guest & Room Info */}
          <div className="receipt-section">
            <h3 className="section-title">GUEST & ROOM INFORMATION</h3>
            <div className="info-row">
              <div className="info-row-label">Guest Name:</div>
              <div className="info-row-value">{bookingData.guestName}</div>
            </div>
            <div className="info-row">
              <div className="info-row-label">Room Number:</div>
              <div className="info-row-value">{bookingData.roomNumber} ({bookingData.roomType})</div>
            </div>
            <div className="info-row">
              <div className="info-row-label">Check-in:</div>
              <div className="info-row-value">{fmtDate(bookingData.checkInDate)}</div>
            </div>
            <div className="info-row">
              <div className="info-row-label">Check-out:</div>
              <div className="info-row-value">{fmtDate(bookingData.checkOutDate)}</div>
            </div>
            <div className="info-row">
              <div className="info-row-label">Nights Stayed:</div>
              <div className="info-row-value"><strong>{nights}</strong> {nights === 1 ? 'night' : 'nights'}</div>
            </div>
            <div className="info-row">
              <div className="info-row-label">Guests:</div>
              <div className="info-row-value"><strong>{bookingData.numberOfGuests || 1}</strong> {bookingData.numberOfGuests === 1 ? 'guest' : 'guests'}</div>
            </div>
          </div>
          
          <div className="receipt-divider-light"></div>
          
          {/* Charges Breakdown */}
          <div className="receipt-section">
            <h3 className="section-title">CHARGES BREAKDOWN</h3>
            
            {/* Room Charges */}
            <div className="charge-row">
              <div className="charge-details">
                <div className="charge-name">Room Charges</div>
                <div className="charge-desc">{bookingData.roomType} Room • {nights} night(s) @ {fmt(ratePerNight)}/night</div>
              </div>
              <div className="charge-amount">{fmt(roomSubtotal)}</div>
            </div>
            
            {/* Service/Extra Charges from charges array */}
            {charges && charges.filter(c => c.type !== 'ROOM_BALANCE').map((charge, idx) => (
              <div key={idx} className="charge-row">
                <div className="charge-details">
                  <div className="charge-name">{charge.description || getChargeTypeLabel(charge.type)}</div>
                  <div className="charge-desc">{charge.type?.replace(/_/g, ' ') || 'Additional charge'}</div>
                </div>
                <div className="charge-amount">{fmt(charge.amount)}</div>
              </div>
            ))}
          </div>
          
          <div className="receipt-divider-light"></div>
          
          {/* Payment Summary */}
          <div className="receipt-total-section">
            <div className="total-row">
              <span>Room Charges:</span>
              <span>{fmt(roomSubtotal)}</span>
            </div>
            {serviceCharges > 0 && (
              <div className="total-row">
                <span>Service Charges:</span>
                <span>{fmt(serviceCharges)}</span>
              </div>
            )}
            <div className="total-row grand-total">
              <span>TOTAL BILL:</span>
              <span>{fmt(totalBill)}</span>
            </div>
            
            {/* Deposit Payment */}
            {depositPaid > 0 && (
              <div className="total-row deposit-row">
                <span>Deposit Paid (at booking):</span>
                <span className="paid-amount">-{fmt(depositPaid)}</span>
              </div>
            )}
            
            {/* Checkout Payment */}
            {totalPaidAtCheckout > 0 && (
              <div className="total-row">
                <span>Payment at Checkout:</span>
                <span className="paid-amount">-{fmt(totalPaidAtCheckout)}</span>
              </div>
            )}
            
            <div className="total-divider"></div>
            
            {/* Balance Due */}
            <div className="total-row amount-due">
              <span>BALANCE DUE:</span>
              <span className={totalDue > 0 ? 'amount-due-text' : 'zero-balance'}>
                {fmt(totalDue)}
              </span>
            </div>
            
            {/* Total Paid */}
            <div className="total-row amount-paid">
              <span>TOTAL PAID:</span>
              <span className="paid-amount">{fmt(totalAmountPaid)}</span>
            </div>
            
            {/* Change (if any) */}
            {changeAmount > 0 && (
              <div className="total-row change">
                <span>Change:</span>
                <span>{fmt(changeAmount)}</span>
              </div>
            )}
            
            {/* Payment Status Message */}
            <div className="payment-summary">
              {isFullyPaidByDeposit && (
                <div className="payment-status deposit-paid">
                  <CheckCircle2 size={14} />
                  <span>✓ Full payment received via deposit (₱{depositPaid.toLocaleString()})</span>
                </div>
              )}
              {totalDue === 0 && totalPaidAtCheckout > 0 && (
                <div className="payment-status paid">
                  <CheckCircle2 size={14} />
                  <span>✓ Balance paid at checkout: {fmt(totalPaidAtCheckout)}</span>
                </div>
              )}
              {totalDue === 0 && depositPaid > 0 && totalPaidAtCheckout === 0 && (
                <div className="payment-status deposit-covered">
                  <CheckCircle2 size={14} />
                  <span>✓ Fully covered by deposit • No payment collected at checkout</span>
                </div>
              )}
              {totalDue > 0 && (
                <div className="payment-status pending">
                  <AlertTriangle size={14} />
                  <span>⚠ Remaining balance: {fmt(totalDue)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="receipt-divider-light"></div>
          
          {/* Payment Details */}
          <div className="receipt-section">
            <h3 className="section-title">PAYMENT DETAILS</h3>
            <div className="info-row">
              <div className="info-row-label">Payment Method:</div>
              <div className="info-row-value">
                {isFullyPaidByDeposit ? 'Deposit (Online)' : (
                  <>
                    {paymentDetails?.method === 'CASH' && 'Cash 💵'}
                    {paymentDetails?.method === 'CARD' && 'Credit Card 💳'}
                    {paymentDetails?.method === 'GCASH' && 'GCash 📱'}
                    {!paymentDetails?.method && 'Deposit'}
                  </>
                )}
              </div>
            </div>
            <div className="info-row">
              <div className="info-row-label">Reference #:</div>
              <div className="info-row-value">{paymentReference}</div>
            </div>
            <div className="info-row">
              <div className="info-row-label">Payment Status:</div>
              <div className="info-row-value status-completed">
                {totalDue === 0 ? 'PAID IN FULL ✓' : 'PARTIALLY PAID'}
              </div>
            </div>
            <div className="info-row">
              <div className="info-row-label">Processed By:</div>
              <div className="info-row-value">{paymentDetails?.processedBy || 'Front Desk Staff'}</div>
            </div>
          </div>
          
          <div className="receipt-divider"></div>
          
          {/* Footer */}
          <div className="receipt-footer">
            <div className="thank-you-message">
              ✦ Maraming Salamat! Thank you for staying! ✦
            </div>
            <div className="footer-message">
              We hope to welcome you again soon!<br/>
              For feedback: feedback@cebuminihotel.com
            </div>
            <div className="qr-footer-note">
              This is an electronically generated receipt — no signature required.
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="receipt-actions no-print" style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', background: '#f8f9fb' }}>
          <button className="ap-btn-ghost" onClick={onHide}>Close</button>
          <button className="ap-btn-primary" onClick={handlePrint} style={{ background: 'linear-gradient(135deg, #9a7a2e, #C9A84C)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.35rem' }}>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <path d="M6 9V3h12v6"/>
              <rect x="6" y="15" width="12" height="6" rx="2"/>
            </svg>
            Print / Download Receipt
          </button>
        </div>
      </Modal.Body>
      
      <style>{`
        .receipt-modal .modal-content {
          border-radius: 20px;
          overflow: hidden;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .receipt-container {
          background: white;
          padding: 2rem;
          font-family: 'DM Sans', sans-serif;
        }
        
        .receipt-header {
          text-align: center;
          margin-bottom: 1rem;
        }
        
        .hotel-icon {
          display: flex;
          justify-content: center;
          margin-bottom: 0.5rem;
          color: #C9A84C;
        }
        
        .hotel-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.6rem;
          font-weight: 700;
          color: #1a1f2e;
          margin: 0;
          letter-spacing: 1px;
        }
        
        .hotel-tagline {
          font-size: 0.7rem;
          color: #C9A84C;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 0.2rem;
        }
        
        .hotel-address {
          font-size: 0.7rem;
          color: #8a96a8;
          margin-top: 0.5rem;
          line-height: 1.4;
        }
        
        .receipt-divider {
          height: 2px;
          background: linear-gradient(90deg, transparent, #C9A84C, #C9A84C, transparent);
          margin: 1rem 0;
        }
        
        .receipt-divider-light {
          height: 1px;
          background: #e2e8f0;
          margin: 0.75rem 0;
        }
        
        .receipt-title-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .receipt-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1a1f2e;
          margin: 0;
          letter-spacing: 1px;
        }
        
        .receipt-badge {
          background: linear-gradient(135deg, #10b981, #34d399);
          color: white;
          padding: 0.2rem 0.8rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 700;
        }
        
        .receipt-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .receipt-info-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
        }
        
        .info-label {
          color: #8a96a8;
          font-weight: 500;
        }
        
        .info-value {
          color: #1a1f2e;
          font-weight: 600;
        }
        
        .receipt-section {
          margin: 1rem 0;
        }
        
        .section-title {
          font-size: 0.7rem;
          font-weight: 700;
          color: #C9A84C;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 0.75rem;
          border-left: 3px solid #C9A84C;
          padding-left: 0.6rem;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.8rem;
        }
        
        .info-row-label {
          color: #8a96a8;
        }
        
        .info-row-value {
          color: #1a1f2e;
          font-weight: 500;
        }
        
        .status-completed {
          color: #10b981;
          font-weight: 700;
        }
        
        .charge-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.65rem;
          padding-bottom: 0.65rem;
          border-bottom: 1px dashed #f1f5f9;
        }
        
        .charge-row:last-child {
          border-bottom: none;
        }
        
        .charge-details {
          flex: 1;
        }
        
        .charge-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: #1a1f2e;
        }
        
        .charge-desc {
          font-size: 0.65rem;
          color: #8a96a8;
          margin-top: 0.15rem;
        }
        
        .charge-amount {
          font-size: 0.8rem;
          font-weight: 600;
          color: #1a1f2e;
        }
        
        .receipt-total-section {
          background: #f8f9fb;
          padding: 1rem;
          border-radius: 12px;
          margin: 1rem 0;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
          color: #4a5568;
        }
        
        .total-row.grand-total {
          font-weight: 700;
          color: #1a1f2e;
          font-size: 0.9rem;
          border-top: 1px solid #e2e8f0;
          padding-top: 0.5rem;
          margin-top: 0.25rem;
        }
        
        .total-row.deposit-row {
          color: #10b981;
        }
        
        .paid-amount {
          color: #2d9b6f;
          font-weight: 600;
        }
        
        .total-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #C9A84C, transparent);
          margin: 0.5rem 0;
        }
        
        .total-row.amount-due {
          font-weight: 700;
          font-size: 1rem;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
        }
        
        .amount-due-text {
          color: #dc3545;
        }
        
        .zero-balance {
          color: #2d9b6f;
        }
        
        .total-row.amount-paid {
          font-weight: 700;
          color: #2d9b6f;
          font-size: 1rem;
        }
        
        .total-row.change {
          color: #64748b;
          border-top: 1px solid #e2e8f0;
          padding-top: 0.5rem;
          margin-top: 0.25rem;
        }
        
        .payment-summary {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid #e2e8f0;
        }
        
        .payment-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .payment-status.deposit-paid {
          background: rgba(45, 155, 111, 0.1);
          color: #2d9b6f;
        }
        
        .payment-status.deposit-covered {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }
        
        .payment-status.paid {
          background: rgba(45, 155, 111, 0.1);
          color: #2d9b6f;
        }
        
        .payment-status.pending {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }
        
        .receipt-footer {
          text-align: center;
          margin-top: 1.5rem;
        }
        
        .thank-you-message {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          font-weight: 600;
          color: #C9A84C;
          margin-bottom: 0.5rem;
        }
        
        .footer-message {
          font-size: 0.7rem;
          color: #8a96a8;
          line-height: 1.5;
        }
        
        .qr-footer-note {
          font-size: 0.6rem;
          color: #cbd5e1;
          margin-top: 0.75rem;
        }
        
        @media print {
          .receipt-modal .modal-content {
            box-shadow: none;
            border-radius: 0;
          }
          .receipt-container {
            padding: 0.5rem;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </Modal>
  );
};

// Helper function for charge type labels
const getChargeTypeLabel = (type) => {
  switch (type) {
    case 'ROOM_BALANCE': return 'Room Balance';
    case 'SERVICE_CHARGE': return 'Service Charge';
    case 'MINIBAR': return 'Minibar Items';
    case 'LAUNDRY': return 'Laundry Service';
    case 'RESTAURANT': return 'Restaurant Charges';
    default: return 'Additional Charges';
  }
};

const EXTRA_CSS = `
  .qr-scanner-container {
    position: relative;
    background: #0f172a;
    border-radius: 20px;
    overflow: hidden;
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #qr-reader-checkout {
    width: 100% !important;
    border: none !important;
  }
  #qr-reader-checkout video {
    border-radius: 16px;
    width: 100% !important;
    object-fit: cover !important;
  }
  .qr-scanner-frame {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 250px;
    height: 250px;
    border: 2px solid rgba(245,158,11,0.8);
    border-radius: 24px;
    box-shadow: 0 0 0 9999px rgba(0,0,0,0.5);
    pointer-events: none;
    z-index: 10;
  }
  .qr-scan-line {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, transparent, #f59e0b, #60a5fa, #f59e0b, transparent);
    animation: scanMove 2s linear infinite;
    border-radius: 3px;
    pointer-events: none;
  }
  @keyframes scanMove {
    0% { top: 0%; }
    50% { top: calc(100% - 3px); }
    100% { top: 0%; }
  }
  .qr-result-card {
    background: linear-gradient(135deg, rgba(245,158,11,0.04), rgba(201,168,76,0.02));
    border: 1px solid rgba(245,158,11,0.2);
    border-radius: 16px;
    padding: 1rem 1.25rem;
    transition: all 0.2s;
  }
  .qr-result-card.valid {
    border-left: 4px solid #10b981;
  }
  .qr-result-card.invalid {
    border-left: 4px solid #ef4444;
  }
  .charges-list {
    max-height: 300px;
    overflow-y: auto;
  }
  .charge-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.65rem 0;
    border-bottom: 1px solid #e2e8f0;
  }
  .charge-item:last-child {
    border-bottom: none;
  }
  .payment-methods {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .payment-method-btn {
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    background: #fff;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.7rem;
    font-weight: 600;
  }
  .payment-method-btn.active {
    border-color: #f59e0b;
    background: rgba(245,158,11,0.05);
    color: #f59e0b;
  }
  .payment-method-btn:hover {
    border-color: #f59e0b;
    transform: translateY(-2px);
  }
  .date-warning {
    padding: 0.75rem;
    border-radius: 10px;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .date-warning.early {
    background: rgba(245,158,11,0.08);
    border: 1px solid rgba(245,158,11,0.25);
    color: #f59e0b;
  }
  .date-warning.late {
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.25);
    color: #ef4444;
  }
`;

export function ReceptionistQRCheckOut({ token, setPage }) {
  const [lastResult, setLastResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showCharges, setShowCharges] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [charges, setCharges] = useState([]);
  const [summary, setSummary] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [forceCheckout, setForceCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptPaymentDetails, setReceiptPaymentDetails] = useState(null);

  const { toast, show } = useToast();
  const scannerRef = useRef(null);
  const containerId = 'qr-reader-checkout';

  const startScanner = async () => {
    if (isScanning) return;
    
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
    
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = '';
    setScannerError(null);
    
    try {
      const html5QrCode = new Html5Qrcode(containerId);
      scannerRef.current = html5QrCode;
      
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => { if (!processing) handleScanResult(decodedText); },
        () => {}
      );
      
      setIsScanning(true);
    } catch (err) {
      setScannerError('Camera access failed. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (!manualMode) {
      const timer = setTimeout(startScanner, 500);
      return () => { clearTimeout(timer); stopScanner(); };
    } else {
      stopScanner();
    }
  }, [manualMode]);

  const handleScanResult = async (qrData) => {
    if (processing) return;
    setProcessing(true);
    await stopScanner();
    
    try {
      const response = await fetch(`${API_BASE}/receptionist/verify-qr-checkout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qr_data: qrData })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        const checkIn = new Date(data.booking.checkInDate);
        const checkOut = new Date(data.booking.checkOutDate);
        const diffTime = Math.abs(checkOut - checkIn);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const enhancedBooking = {
          ...data.booking,
          numberOfNights: data.booking.numberOfNights || diffDays,
          numberOfGuests: data.booking.numberOfGuests || data.summary?.guests || 1,
          ratePerNight: data.booking.ratePerNight || (data.booking.totalAmount / diffDays),
        };
        
        setBookingData(enhancedBooking);
        setCharges(data.charges || []);
        setSummary({
          ...data.summary,
          nights: data.summary?.nights || diffDays,
          guests: data.summary?.guests || enhancedBooking.numberOfGuests,
        });
        setPaymentAmount(data.summary?.total_due || 0);
        setShowCharges(true);
        setLastResult({
          valid: true,
          booking: enhancedBooking,
          error: null,
          scannedAt: new Date().toISOString()
        });
        show(`Booking found: ${data.booking.reference}`, 'success');
      } else {
        setLastResult({
          valid: false,
          booking: data.booking || null,
          error: data.error || 'Check-out verification failed',
          scannedAt: new Date().toISOString()
        });
        show(data.error || 'Check-out verification failed', 'error');
        setTimeout(() => {
          if (!manualMode) startScanner();
        }, 2000);
      }
    } catch (err) {
      console.error('Error:', err);
      setLastResult({
        valid: false,
        booking: null,
        error: 'Network error. Please try again.',
        scannedAt: new Date().toISOString()
      });
      show('Failed to connect to server', 'error');
      setTimeout(() => {
        if (!manualMode) startScanner();
      }, 2000);
    } finally {
      setProcessing(false);
    }
  };
  
  const handleManualSubmit = async () => {
    if (!manualToken.trim()) return;
    await handleScanResult(manualToken.trim());
    setManualToken('');
  };
  
  const resetScanner = () => {
    setLastResult(null);
    setManualMode(false);
    setScannerError(null);
    setShowCharges(false);
    setBookingData(null);
    setCharges([]);
    setSummary(null);
    setForceCheckout(false);
    stopScanner();
    setTimeout(startScanner, 500);
  };
  
  const processCheckout = async () => {
    setProcessingCheckout(true);
    try {
      const response = await fetch(`${API_BASE}/receptionist/process-qr-checkout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingData?.id,
          payment_collected: paymentAmount,
          payment_method: paymentMethod,
          force_checkout: forceCheckout
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setReceiptPaymentDetails({
          amountCollected: paymentAmount,
          method: paymentMethod,
          reference: data.payment_reference || `PAY-${bookingData?.id}-${Date.now().toString().slice(-6)}`,
          processedBy: data.processed_by || 'Front Desk Staff'
        });
        
        setCheckoutSuccess(true);
        show(data.message, 'success');
        
        setTimeout(() => {
          setCheckoutSuccess(false);
          setShowReceipt(true);
        }, 2000);
      } else {
        if (data.can_force) {
          if (window.confirm(`${data.error}\n\nDo you want to force early check-out?`)) {
            setForceCheckout(true);
            const forceResponse = await fetch(`${API_BASE}/receptionist/process-qr-checkout/`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                booking_id: bookingData?.id,
                payment_collected: paymentAmount,
                payment_method: paymentMethod,
                force_checkout: true
              })
            });
            const forceData = await forceResponse.json();
            if (forceResponse.ok && forceData.success) {
              setReceiptPaymentDetails({
                amountCollected: paymentAmount,
                method: paymentMethod,
                reference: forceData.payment_reference || `PAY-${bookingData?.id}-${Date.now().toString().slice(-6)}`,
                processedBy: forceData.processed_by || 'Front Desk Staff'
              });
              setCheckoutSuccess(true);
              show(forceData.message, 'success');
              setTimeout(() => {
                setCheckoutSuccess(false);
                setShowReceipt(true);
              }, 2000);
            } else {
              show(forceData.error || 'Force check-out failed', 'error');
            }
          }
        } else {
          show(data.error || 'Check-out failed', 'error');
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
      show('Network error. Please try again.', 'error');
    } finally {
      setProcessingCheckout(false);
      setForceCheckout(false);
    }
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    setShowCharges(false);
    setBookingData(null);
    setCharges([]);
    setSummary(null);
    resetScanner();
  };
  
  const getChargeIcon = (type) => {
    switch (type) {
      case 'ROOM_BALANCE': return <DollarSign size={14} />;
      case 'SERVICE_CHARGE': return <Wrench size={14} />;
      case 'MINIBAR': return <Coffee size={14} />;
      default: return <Receipt size={14} />;
    }
  };

  return (
    <div className="ap-root">
      <style>{SHARED_CSS}</style>
      <style>{EXTRA_CSS}</style>
      <Toast toast={toast} />

      <div className="ap-hd">
        <div>
          <h1 className="ap-title" style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <LogOut size={22} color="var(--orange)"/> QR Code Check-out
          </h1>
          <p className="ap-sub">Scan guest's QR code to check them out and process payments</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button className="ap-btn-ghost" onClick={resetScanner}><RefreshCw size={14}/> Reset</button>
          <button className="ap-btn-ghost" onClick={() => setManualMode(!manualMode)}>
            {manualMode ? <Camera size={14}/> : <ScanLine size={14}/>}
            {manualMode ? 'Switch to Camera' : 'Manual Entry'}
          </button>
          <button className="ap-btn-primary" onClick={() => setPage('departures')}>
            <LogOut size={14}/> View Departures
          </button>
        </div>
      </div>

      {/* Scanner Area */}
      {!showCharges && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem' }}>
          <div className="ap-panel" style={{ marginBottom: 0 }}>
            <div className="ap-panel-hd">
              <div className="ap-panel-title"><Camera size={15}/> {manualMode ? 'Manual Entry' : 'QR Scanner'}</div>
            </div>
            <div className="ap-panel-body">
              {manualMode ? (
                <div>
                  <div className="ap-field">
                    <label className="ap-label">Enter Booking Reference</label>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                      <input 
                        className="ap-input" 
                        placeholder="e.g. CGH-XXXXXXXX"
                        value={manualToken} 
                        onChange={e => setManualToken(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                      />
                      <button className="ap-btn-primary" onClick={handleManualSubmit} disabled={processing}>
                        {processing ? <div className="ap-spin-sm"/> : <><ArrowRight size={14}/> Verify</>}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="qr-scanner-container">
                    <div id={containerId} style={{ width: '100%', minHeight: 400 }}>
                      {scannerError && (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                          <AlertTriangle size={32} color="#ef4444"/>
                          <p style={{ color: '#ef4444', marginTop: '.5rem' }}>{scannerError}</p>
                          <button className="ap-btn-primary" onClick={resetScanner} style={{ marginTop: '1rem' }}>Retry</button>
                        </div>
                      )}
                    </div>
                    {!scannerError && !isScanning && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: '.5rem' }}>
                        <Spinner/><span style={{ color: '#fff' }}>Starting camera...</span>
                      </div>
                    )}
                    {!scannerError && isScanning && (
                      <>
                        <div className="qr-scanner-frame"/>
                        <div className="qr-scan-line"/>
                      </>
                    )}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '.72rem', color: 'var(--text-muted)', marginTop: '.5rem' }}>
                    Position QR code within the frame to check out guest
                  </div>
                </div>
              )}
              
              {lastResult && !showCharges && (
                <div className={`qr-result-card ${lastResult.valid ? 'valid' : 'invalid'}`} style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.75rem' }}>
                    {lastResult.valid ? <CheckCircle2 size={22} color="#10b981"/> : <XCircle size={22} color="#ef4444"/>}
                    <div><div style={{ fontWeight: 700 }}>{lastResult.valid ? 'Booking Found!' : 'Check-out Failed'}</div></div>
                  </div>
                  {lastResult.booking && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', fontSize: '.78rem' }}>
                      <div>Reference: <strong>{lastResult.booking.reference}</strong></div>
                      <div>Guest: {lastResult.booking.guestName}</div>
                      <div>Room: {lastResult.booking.roomType} #{lastResult.booking.roomNumber}</div>
                    </div>
                  )}
                  {lastResult.error && (
                    <div style={{ marginTop: '.65rem', padding: '.5rem', background: 'rgba(239,68,68,0.08)', borderRadius: 8, fontSize: '.75rem', color: '#ef4444' }}>
                      ⚠️ {lastResult.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="ap-panel" style={{ marginBottom: 0 }}>
            <div className="ap-panel-hd">
              <div className="ap-panel-title"><ScanLine size={14}/> Check-out Info</div>
            </div>
            <div className="ap-panel-body">
              <div style={{ padding: '.5rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                  <Sparkles size={14}/> How it works
                </div>
                <ul style={{ fontSize: '.72rem', color: 'var(--text-muted)', paddingLeft: '1rem', margin: 0 }}>
                  <li>1. Scan guest's QR code</li>
                  <li>2. System shows all outstanding charges</li>
                  <li>3. Collect payment if needed</li>
                  <li>4. Confirm check-out</li>
                  <li>5. Room marked as DIRTY</li>
                  <li>6. Cleaning task created automatically</li>
                </ul>
              </div>
              <div style={{ marginTop: '1rem', padding: '.65rem', background: 'rgba(245,158,11,0.08)', borderRadius: 10, fontSize: '.7rem', color: '#f59e0b' }}>
                <AlertTriangle size={12} style={{ display: 'inline', marginRight: '.3rem' }}/>
                After check-out, the room will be marked as DIRTY and a cleaning task will be created for housekeeping.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charges Modal */}
      <Modal show={showCharges} onHide={() => { setShowCharges(false); resetScanner(); }} size="lg" centered className="ap-modal">
        <Modal.Header closeButton>
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <Receipt size={18} color="var(--orange)"/> Check-out Summary
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {bookingData && (
            <>
              {/* Guest Info */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(201,168,76,0.04))',
                borderRadius: 12,
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{bookingData.guestName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bookingData.guestEmail}</div>
                    <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', marginTop: '0.25rem' }}>Ref: {bookingData.reference}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Room</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>#{bookingData.roomNumber} - {bookingData.roomType}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(201,168,76,0.2)' }}>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Check-in</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{fmtDate(bookingData.checkInDate)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Check-out</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{fmtDate(bookingData.checkOutDate)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Nights</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{bookingData.numberOfNights}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Guests</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{bookingData.numberOfGuests}</div>
                  </div>
                </div>
              </div>

              {/* Date Warnings */}
              {summary?.is_early_checkout && (
                <div className="date-warning early">
                  <Calendar size={16} />
                  <div>
                    <strong>Early Check-out!</strong> Guest is checking out {Math.abs(summary.days_difference)} day(s) before scheduled check-out date ({fmtDate(summary.check_out_date)}).
                  </div>
                </div>
              )}
              {summary?.is_late_checkout && (
                <div className="date-warning late">
                  <Clock size={16} />
                  <div>
                    <strong>Late Check-out!</strong> Guest is checking out {Math.abs(summary.days_difference)} day(s) after scheduled check-out date ({fmtDate(summary.check_out_date)}). Additional charges may apply.
                  </div>
                </div>
              )}

              {/* Charges Section */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Receipt size={14}/> Outstanding Charges
                </div>
                <div className="charges-list">
                  {charges.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--green)' }}>
                      <CheckCircle2 size={24} />
                      <div>No outstanding charges</div>
                    </div>
                  ) : (
                    charges.map((charge, idx) => (
                      <div key={idx} className="charge-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {getChargeIcon(charge.type)}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{charge.description}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              {getChargeTypeLabel(charge.type)}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: '#dc3545' }}>₱{charge.amount.toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Summary */}
              {summary && (
                <div style={{ 
                  background: 'var(--surface2)', 
                  borderRadius: 12, 
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Subtotal</span>
                    <span>₱{summary.subtotal.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#10b981' }}>
                    <span>Deposit Paid</span>
                    <span>- ₱{summary.deposit_paid.toLocaleString()}</span>
                  </div>
                  {summary.service_charges > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#f59e0b' }}>
                      <span>Service Charges</span>
                      <span>+ ₱{summary.service_charges.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginTop: '0.5rem', 
                    paddingTop: '0.5rem', 
                    borderTop: '2px solid var(--border)',
                    fontWeight: 700,
                    fontSize: '1rem'
                  }}>
                    <span>Total Due</span>
                    <span style={{ color: summary.total_due > 0 ? '#dc3545' : '#10b981' }}>
                      ₱{summary.total_due.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Section */}
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CreditCard size={14}/> Payment Method
                </div>
                <div className="payment-methods">
                  {[
                    { value: 'CASH', label: 'Cash', icon: <Banknote size={20} /> },
                    { value: 'CARD', label: 'Credit Card', icon: <CreditCard size={20} /> },
                    { value: 'GCASH', label: 'GCash', icon: <Smartphone size={20} /> },
                  ].map(method => (
                    <button
                      key={method.value}
                      className={`payment-method-btn ${paymentMethod === method.value ? 'active' : ''}`}
                      onClick={() => setPaymentMethod(method.value)}
                    >
                      {method.icon}
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div className="ap-field" style={{ marginTop: '0.5rem' }}>
                <label className="ap-label">Amount Collected (₱)</label>
                <input
                  type="number"
                  className="ap-input"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Warning for outstanding balance */}
              {summary?.total_due > 0 && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  background: 'rgba(220,53,69,0.08)', 
                  borderRadius: 8,
                  fontSize: '0.75rem',
                  color: '#dc3545',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertTriangle size={14} />
                  Guest has outstanding balance of ₱{summary.total_due.toLocaleString()}. Collect full payment before check-out.
                </div>
              )}

              {/* Force checkout option for early check-out */}
              {summary?.is_early_checkout && !forceCheckout && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  background: 'rgba(245,158,11,0.08)', 
                  borderRadius: 8,
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={14} color="#f59e0b" />
                    <span>Early check-out requested</span>
                  </div>
                  <button
                    className="ap-btn-ghost"
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => setForceCheckout(true)}
                  >
                    Force Check-out
                  </button>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="ap-btn-ghost" onClick={() => { setShowCharges(false); resetScanner(); }}>Cancel</button>
          <button 
            className="ap-btn-primary" 
            onClick={processCheckout}
            disabled={processingCheckout}
            style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}
          >
            {processingCheckout ? <><div className="ap-spin-sm"/> Processing...</> : <><LogOut size={14}/> Confirm Check-out</>}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Checkout Success Modal */}
      <Modal show={checkoutSuccess} onHide={() => setCheckoutSuccess(false)} centered className="ap-modal">
        <Modal.Body style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <CheckCircle2 size={32} color="#fff"/>
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.3rem', fontWeight: 600, color: 'var(--green)' }}>Check-out Complete!</div>
          <div style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Guest has been checked out successfully.<br/>
            Room has been marked as DIRTY and a cleaning task has been created.
          </div>
          {bookingData && (
            <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '.75rem', textAlign: 'left', marginBottom: '1rem' }}>
              <div>Room: #{bookingData.roomNumber} - {bookingData.roomType}</div>
              <div>Guest: {bookingData.guestName}</div>
              <div>Status: <span style={{ color: '#f59e0b' }}>DIRTY - Needs Cleaning</span></div>
            </div>
          )}
        </Modal.Body>
      </Modal>
      
      {/* Receipt Modal */}
      <ReceiptModal 
        show={showReceipt}
        onHide={handleReceiptClose}
        bookingData={bookingData}
        paymentDetails={receiptPaymentDetails}
        charges={charges}
        summary={summary}
      />
    </div>
  );
}

export default ReceptionistQRCheckOut;