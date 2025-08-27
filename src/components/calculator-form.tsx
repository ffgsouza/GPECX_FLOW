"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppContext } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowDown, Calculator, DollarSign, Percent, TrendingUp } from "lucide-react";

const calculatorSchema = z.object({
  productId: z.string().min(1, { message: "Please select a product." }),
  profitMargin: z.coerce.number().min(0).max(1, { message: "Must be between 0 and 1." }),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

interface CalculationResult {
  finalSellPrice: number;
  totalCost: number;
  profit: number;
  costs: { label: string; value: number }[];
  sales: { label: string; value: number }[];
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export function CalculatorForm() {
  const { products, settings } = useAppContext();
  const [result, setResult] = useState<CalculationResult | null>(null);

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      productId: "",
      profitMargin: 0.2, // Default 20%
    },
  });

  const onSubmit = (data: CalculatorFormValues) => {
    const product = products.find(p => p.id === data.productId);
    if (!product) return;

    const { profitMargin } = data;
    const { exchangeRate, customsClearanceFee, technicalConsultingFee, storageFee, importTaxII, ipiTax, pisTax, cofinsTax, icmsTax, simplesNacionalTax, salesCommission } = settings;

    const hardwareCostBRL = product.hardwareCostUSD * exchangeRate;
    const softwareCostBRL = product.softwareCostUSD * exchangeRate;
    const productCostBRL = hardwareCostBRL + softwareCostBRL;
    
    const fixedFees = customsClearanceFee + technicalConsultingFee + storageFee;

    const baseII = productCostBRL;
    const iiValue = baseII * importTaxII;

    const baseIPI = baseII + iiValue;
    const ipiValue = baseIPI * ipiTax;

    const basePisCofins = baseII;
    const pisValue = basePisCofins * pisTax;
    const cofinsValue = basePisCofins * cofinsTax;

    const importTaxesTotal = iiValue + ipiValue + pisValue + cofinsValue;
    const costBeforeICMS = productCostBRL + fixedFees + importTaxesTotal;
    
    const icmsBase = costBeforeICMS / (1 - icmsTax);
    const icmsValue = icmsBase * icmsTax;

    const totalCost = costBeforeICMS + icmsValue;
    
    const sellPriceDenominator = 1 - simplesNacionalTax - salesCommission - profitMargin;
    const finalSellPrice = sellPriceDenominator > 0 ? totalCost / sellPriceDenominator : 0;
    
    const simplesNacionalValue = finalSellPrice * simplesNacionalTax;
    const salesCommissionValue = finalSellPrice * salesCommission;
    const profit = finalSellPrice - totalCost - simplesNacionalValue - salesCommissionValue;
    
    setResult({
      finalSellPrice,
      totalCost,
      profit,
      costs: [
        { label: "Hardware Cost", value: hardwareCostBRL },
        { label: "Software Cost", value: softwareCostBRL },
        { label: "Fixed Fees", value: fixedFees },
        { label: "Import Tax (II)", value: iiValue },
        { label: "IPI", value: ipiValue },
        { label: "PIS/COFINS", value: pisValue + cofinsValue },
        { label: "ICMS", value: icmsValue },
      ],
      sales: [
        { label: "Simples Nacional", value: simplesNacionalValue },
        { label: "Sales Commission", value: salesCommissionValue },
        { label: "Profit", value: profit },
      ],
    });
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 items-start">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="lg:col-span-1 space-y-6">
          <FormField
            control={form.control}
            name="productId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="profitMargin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Desired Profit Margin</FormLabel>
                <FormControl>
                  <div className="relative">
                     <Input type="number" step="0.01" placeholder="e.g., 0.2 for 20%" {...field} />
                     <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">%</span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">
            <Calculator className="mr-2 h-4 w-4" /> Calculate Price
          </Button>
        </form>
      </Form>

      {result && (
        <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
          <Card className="md:col-span-2 bg-primary text-primary-foreground shadow-lg">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Final Sales Price</CardTitle>
              <DollarSign className="h-4 w-4 text-primary-foreground/70" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{formatCurrency(result.finalSellPrice)}</div>
            </CardContent>
            <CardFooter>
               <p className="text-xs text-primary-foreground/70">
                Total Cost: {formatCurrency(result.totalCost)} • Profit: {formatCurrency(result.profit)}
              </p>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ArrowDown className="h-5 w-5 text-destructive"/> Cost Breakdown</CardTitle>
              <CardDescription>From purchase to final cost.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {result.costs.map(c => (
                  <li key={c.label} className="flex justify-between">
                    <span>{c.label}</span>
                    <span className="font-medium">{formatCurrency(c.value)}</span>
                  </li>
                ))}
              </ul>
              <Separator className="my-4" />
              <div className="flex justify-between font-bold">
                <span>Total Product Cost</span>
                <span>{formatCurrency(result.totalCost)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-500"/> Sales Breakdown</CardTitle>
              <CardDescription>From sales price to net profit.</CardDescription>
            </CardHeader>
            <CardContent>
               <ul className="space-y-2 text-sm">
                <li className="flex justify-between font-bold">
                    <span>Final Sales Price</span>
                    <span>{formatCurrency(result.finalSellPrice)}</span>
                </li>
                 <Separator className="my-2" />
                {result.sales.map(s => (
                  <li key={s.label} className="flex justify-between">
                    <span>{s.label}</span>
                    <span className="font-medium">{formatCurrency(s.value)}</span>
                  </li>
                ))}
              </ul>
              <Separator className="my-4" />
              <div className="flex justify-between font-bold text-primary">
                <span>Final Profit</span>
                <span>{formatCurrency(result.profit)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
