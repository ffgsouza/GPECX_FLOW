import { CalculatorForm } from "@/components/calculator-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Price Calculator</CardTitle>
          <CardDescription>Select a product and enter the profit margin to calculate the final sales price.</CardDescription>
        </CardHeader>
        <CardContent>
          <CalculatorForm />
        </CardContent>
      </Card>
    </div>
  );
}
