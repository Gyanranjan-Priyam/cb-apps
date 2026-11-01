"use client";

import { use } from "react";
import DelegateScanner from "./_components/delegate-scanner";

export default function DelegateScannerPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);

  return <DelegateScanner code={code.toUpperCase()} />;
}
