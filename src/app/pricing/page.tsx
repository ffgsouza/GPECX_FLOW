

import { Suspense } from "react";
import { CalculatorForm } from "@/components/calculator-form";
import { Loader2 } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="flex flex-col gap-8 h-full">
      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>}>
        <CalculatorForm />
      </Suspense>
    </div>
  );
}
