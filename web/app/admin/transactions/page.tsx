import { getAdminTransactions } from "./actions";
import { TransactionsClient } from "./_components/transactions-client";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = {
  title: "Transactions | Admin Panel",
  description: "View and manage all form registration payment transactions, view receipts, and export data.",
};

export default async function AdminTransactionsPage() {
  const result = await getAdminTransactions();
  const transactions = result.data || [];
  const paymentForms = result.paymentForms || [];
  const formsSummary = result.formsSummary || [];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 w-full">
      <PageHeader
        title="Transactions"
        description="Manage form registration payment transactions. View receipts, verify payments, and export data."
        showBackButton={false}
      />

      <TransactionsClient
        initialTransactions={transactions}
        initialPaymentForms={paymentForms}
        initialFormsSummary={formsSummary}
      />
    </div>
  );
}

