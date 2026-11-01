"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Printer, CheckCircle2, Download, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

interface ReceiptClientViewProps {
  receipt: {
    responseId: string;
    referenceNumber: string;
    formTitle: string;
    formId: string;
    recipientName: string;
    recipientEmail: string;
    collegeName?: string;
    transactionId: string;
    paymentStatus: string;
    paymentAmount: number;
    submittedAt: string;
    verifiedAt: string | null;
  };
}

export function ReceiptClientView({ receipt }: ReceiptClientViewProps) {
  const router = useRouter();

  const handlePrint = () => {
    window.print();
  };

  const formattedAmount = (receipt.paymentAmount || 0).toFixed(2);
  const issuedDateStr = receipt.verifiedAt
    ? new Date(receipt.verifiedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : new Date(receipt.submittedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

  return (
    <div className="min-h-screen p-4 sm:p-4">
      <div className="space-y-6 max-w-2xl mx-auto pb-12">
        {/* Top action toolbar (hidden during printing) */}
        <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border/60 shadow-xs">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-sm font-bold text-foreground">
                Official Payment Receipt
              </h1>
              <p className="text-xs text-muted-foreground">
                Invoice Reference: {receipt.referenceNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-9 rounded-xl text-xs font-semibold gap-1.5 flex-1 sm:flex-none border-border/80"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="h-9 rounded-xl text-xs font-semibold gap-1.5 flex-1 sm:flex-none bg-primary text-primary-foreground shadow-sm"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Main Invoice Paper Canvas */}
        <article
          id="printable-receipt-card"
          className="w-full max-w-[760px] bg-[#FAF9F5] text-[#0C0A09] rounded-2xl border border-[#E7E5DE] p-8 sm:p-12 font-mono shadow-xl relative overflow-hidden print:shadow-none print:border-none print:w-full print:max-w-none print:p-6 print:m-0"
        >
          {/* Verified Watermark Stamp */}
          <div className="absolute top-8 right-8 sm:top-12 sm:right-12 opacity-10 pointer-events-none select-none rotate-[-12deg]">
            <div className="border-4 border-[#16A34A] text-[#16A34A] rounded-xl px-4 py-2 text-2xl sm:text-3xl font-black uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="h-8 w-8" />
              VERIFIED
            </div>
          </div>

          {/* Header */}
          <header className="flex flex-col gap-8 pb-8 border-b border-[#E7E5DE]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 p-1">
                  <Image
                    src="/assets/logo.png"
                    alt="CodeBreakers Logo"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base text-[#0C0A09] leading-tight">
                    CodeBreakers
                  </h3>
                  <p className="text-[11px] text-[#57534E] font-sans">
                    GCEK Bhawanipatna
                  </p>
                </div>
              </div>

              <div className="text-right">
                <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-widest text-[#0C0A09]">
                  INVOICE
                </h2>
                <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-[#16A34A] bg-[#16A34A]/10 px-2.5 py-0.5 rounded-full font-sans">
                  <CheckCircle2 className="h-3.5 w-3.5" /> PAID &amp; APPROVED
                </span>
              </div>
            </div>

            {/* Invoice Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs leading-relaxed text-[#44403C] pt-2">
              <div>
                <p>
                  <span className="text-[#78716C] uppercase text-[10px] font-bold tracking-wider block">
                    Reference Number
                  </span>{" "}
                  <strong className="text-[#0C0A09]">
                    {receipt.referenceNumber}
                  </strong>
                </p>
                <p className="mt-1">
                  <span className="text-[#78716C] uppercase text-[10px] font-bold tracking-wider block">
                    Date Issued
                  </span>{" "}
                  {issuedDateStr}
                </p>
              </div>
              <div className="sm:text-right">
                <p>
                  <span className="text-[#78716C] uppercase text-[10px] font-bold tracking-wider block">
                    Payment Method
                  </span>{" "}
                  UPI
                </p>
                <p className="mt-1">
                  <span className="text-[#78716C] uppercase text-[10px] font-bold tracking-wider block">
                    Transaction ID
                  </span>{" "}
                  <span className="font-semibold text-[#0C0A09] font-mono">
                    {receipt.transactionId}
                  </span>
                </p>
              </div>
            </div>
          </header>

          {/* Addresses Section */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-[#E7E5DE] text-xs leading-relaxed">
            <div>
              <p className="font-bold uppercase tracking-wider text-[10px] text-[#78716C] mb-2 font-sans">
                FROM
              </p>
              <p className="font-bold text-[#0C0A09]">CodeBreakers</p>
              <p>Government College of Engineering Kalahandi</p>
              <p>Bhawanipatna, Odisha 766002</p>
              <p className="text-[#78716C] mt-1">Tax ID: CB-1029384756</p>
            </div>

            <div className="sm:text-right">
              <p className="font-bold uppercase tracking-wider text-[10px] text-[#78716C] mb-2 font-sans">
                BILL TO
              </p>
              <p className="font-bold text-[#0C0A09]">
                {receipt.recipientName}
              </p>
              <p className="text-[#44403C]">{receipt.recipientEmail}</p>
              {receipt.collegeName && (
                <p className="text-[#44403C]">{receipt.collegeName}</p>
              )}
            </div>
          </section>

          {/* Line Items Table */}
          <section className="py-8">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#E7E5DE] text-[#0C0A09] font-bold uppercase text-[11px]">
                    <th className="p-3 rounded-l-lg">Description</th>
                    <th className="p-3 text-right">Units</th>
                    <th className="p-3 text-right">Unit Cost</th>
                    <th className="p-3 text-right rounded-r-lg">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E5DE]">
                  <tr>
                    <td className="p-3 font-semibold text-[#0C0A09]">
                      {receipt.formTitle}
                    </td>
                    <td className="p-3 text-right text-[#44403C]">1</td>
                    <td className="p-3 text-right text-[#44403C]">
                      ₹{formattedAmount}
                    </td>
                    <td className="p-3 text-right font-bold text-[#0C0A09]">
                      ₹{formattedAmount}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Calculations & Totals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6">
              <div className="text-xs text-[#78716C] space-y-1">
                <p>
                  Form ID:{" "}
                  <span className="font-mono text-[#0C0A09]">
                    {receipt.formId}
                  </span>
                </p>
                <p>
                  Status:{" "}
                  <span className="text-[#16A34A] font-semibold">
                    Payment Verified
                  </span>
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#44403C]">
                  <span>Net Amount:</span>
                  <span>₹{formattedAmount}</span>
                </div>
                <div className="flex justify-between text-[#44403C]">
                  <span>Discount:</span>
                  <span>₹0.00</span>
                </div>
                <div className="border-y-2 border-[#0C0A09] py-2.5 flex justify-between font-bold text-sm text-[#0C0A09] uppercase">
                  <span>Total Amount Paid:</span>
                  <span>₹{formattedAmount} (PAID)</span>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="pt-8 border-t border-[#E7E5DE] text-[11px] text-[#78716C] flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <p>cse.codebreaker@gcekbpatna.ac.in</p>
              <p>CodeBreakers • GCEK Bhawanipatna</p>
            </div>
            <div className="sm:text-right">
              <p className="font-semibold text-[#0C0A09]">
                Issued by CodeBreakers Team
              </p>
            </div>
          </footer>
        </article>
      </div>

      {/* Global CSS for printing */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          html,
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print\\:hidden,
          [data-slot="sidebar"],
          [data-sidebar],
          aside,
          nav,
          header:not(#printable-receipt-card header) {
            display: none !important;
            visibility: hidden !important;
          }
          /* Strip outer wrapper card styles in print mode */
          div:has(> #printable-receipt-card) {
            background: transparent !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          #printable-receipt-card {
            display: block !important;
            visibility: visible !important;
            position: relative !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 24px !important;
            background: #faf9f5 !important;
            color: #0c0a09 !important;
            border: 1px solid #e7e5de !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
          }
          #printable-receipt-card * {
            visibility: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
