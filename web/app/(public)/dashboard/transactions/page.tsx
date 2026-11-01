import { redirect } from "next/navigation";
import { getUserTransactionsData } from "./actions";
import { UserTransactionsClient } from "./_components/user-transactions-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transaction History",
  description: "View your personal transaction records, payments, verification notices, and download official receipts.",
};

export default async function TransactionsPage() {
  const data = await getUserTransactionsData();

  if (!data) {
    redirect("/login");
  }

  return <UserTransactionsClient initialData={data} />;
}
