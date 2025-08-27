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
import { ArrowDown, CalculatorIcon, DollarSign, TrendingUp } from "lucide-react";

const calculatorSchema = z.object({
  productId: z.string().min(1, { message: "Por favor, selecione um produto." }),
  bdi: z.coerce.number().min(0, { message: "BDI não pode ser negativo." }),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

interface CalculationResult {
  finalSellPrice: number;
  totalCost: number;
  profit: number; // Margem
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
      bdi: 1000,
    },
  });

  const onSubmit = (data: CalculatorFormValues) => {
    const product = products.find(p => p.id === data.productId);
    if (!product) return;

    const { bdi } = data;
    const { 
      exchangeRateUSD, 
      exchangeClosingFee,
      taxaSiscomex,
      customsClearanceFee, 
      technicalConsultingFee, 
      storageFee,
      freteInternacionalTerceiro,
      freteTerceirosDA,
      desconsolidacaoUSD,
      importTaxII,
      ipiTax,
      pisTax,
      cofinsTax,
      icmsTax,
      simplesNacionalTax, 
      salesCommission,
    } = settings;

    // Valor de Compra (USD to BRL)
    const hardwareCostBRL = product.hardwareCostUSD * exchangeRateUSD;
    const softwareCostBRL = product.softwareCostUSD * exchangeRateUSD;
    const freightCostBRL = product.freightCostUSD * exchangeRateUSD;
    const purchaseValueBRL = hardwareCostBRL + softwareCostBRL;

    // Base de cálculo para Impostos de Importação (Hardware + Frete)
    const importTaxBase = hardwareCostBRL + freightCostBRL;

    // Cálculo dos Impostos de Importação
    const iiValue = importTaxBase * importTaxII;
    const ipiValue = (importTaxBase + iiValue) * ipiTax;
    const pisCofinsBase = importTaxBase + iiValue;
    const pisValue = pisCofinsBase * pisTax;
    const cofinsValue = pisCofinsBase * cofinsTax;

    const totalImportTaxes = iiValue + ipiValue + pisValue + cofinsValue;

    // Taxa de Fechamento de Câmbio
    const exchangeClosingFeeValue = purchaseValueBRL * exchangeClosingFee;
    
    // Despesas Aduaneiras
    const desconsolidacaoBRL = desconsolidacaoUSD * exchangeRateUSD;
    const customsExpenses = 
      customsClearanceFee + 
      technicalConsultingFee + 
      storageFee +
      freteInternacionalTerceiro +
      freteTerceirosDA +
      desconsolidacaoBRL;
    
    const totalCost = purchaseValueBRL + freightCostBRL + totalImportTaxes + exchangeClosingFeeValue + customsExpenses + taxaSiscomex;

    // Despesas - Venda (Interno)
    const sellPriceDenominator = 1 - simplesNacionalTax - salesCommission;
    const finalSellPrice = sellPriceDenominator > 0 ? (totalCost + bdi) / sellPriceDenominator : 0;
    
    const simplesNacionalValue = finalSellPrice * simplesNacionalTax;
    const salesCommissionValue = finalSellPrice * salesCommission;
    
    const profit = bdi; 
    
    setResult({
      finalSellPrice,
      totalCost,
      profit,
      costs: [
        { label: "Compra Hardware (USD->BRL)", value: hardwareCostBRL },
        { label: "Compra Software (USD->BRL)", value: softwareCostBRL },
        { label: "Frete (USD->BRL)", value: freightCostBRL },
        { label: "Imposto de Importação (II)", value: iiValue },
        { label: "IPI", value: ipiValue },
        { label: "PIS", value: pisValue },
        { label: "COFINS", value: cofinsValue },
        { label: "Taxa Siscomex", value: taxaSiscomex },
        { label: "Taxa Fechamento Câmbio", value: exchangeClosingFeeValue },
        { label: "Desembaraço", value: customsClearanceFee },
        { label: "Assessoria Técnica", value: technicalConsultingFee },
        { label: "Armazenagem Aeroporto", value: storageFee },
        { label: "Frete Internacional Terceiro", value: freteInternacionalTerceiro },
        { label: "Frete Terceiros - DA", value: freteTerceirosDA },
        { label: "Desconsolidação", value: desconsolidacaoBRL },
      ],
      sales: [
        { label: "Imposto Simples Nacional", value: simplesNacionalValue },
        { label: "Comissão", value: salesCommissionValue },
        { label: "BDI (Lucro)", value: profit },
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
                <FormLabel>Produto</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
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
            name="bdi"
            render={({ field }) => (
              <FormItem>
                <FormLabel>BDI (Lucro Desejado)</FormLabel>
                <FormControl>
                  <div className="relative">
                     <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">R$</span>
                     <Input type="number" step="0.01" className="pl-10" placeholder="ex: 1000,00" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">
            <CalculatorIcon className="mr-2 h-4 w-4" /> Calcular Preço
          </Button>
        </form>
      </Form>

      {result && (
        <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
          <Card className="md:col-span-2 bg-primary text-primary-foreground shadow-lg">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Valor de Venda Final</CardTitle>
              <DollarSign className="h-4 w-4 text-primary-foreground/70" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{formatCurrency(result.finalSellPrice)}</div>
            </CardContent>
            <CardFooter>
               <p className="text-xs text-primary-foreground/70">
                Custo Total: {formatCurrency(result.totalCost)} • Lucro (BDI): {formatCurrency(result.profit)}
              </p>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ArrowDown className="h-5 w-5 text-destructive"/> Detalhamento de Custos</CardTitle>
              <CardDescription>Da compra ao custo final do produto.</CardDescription>
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
                <span>Custo Total do Produto</span>
                <span>{formatCurrency(result.totalCost)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-500"/> Detalhamento da Venda</CardTitle>
              <CardDescription>Do preço de venda ao lucro líquido.</CardDescription>
            </CardHeader>
            <CardContent>
               <ul className="space-y-2 text-sm">
                <li className="flex justify-between font-bold">
                    <span>Valor de Venda Final</span>
                    <span>{formatCurrency(result.finalSellPrice)}</span>
                </li>
                 <Separator className="my-2" />
                <li className="flex justify-between">
                    <span>Custo Total do Produto</span>
                    <span className="font-medium text-destructive">(-{formatCurrency(result.totalCost)})</span>
                </li>
                {result.sales.map(s => (
                  <li key={s.label} className="flex justify-between">
                    <span>{s.label}</span>
                    <span className="font-medium">{s.label === 'BDI (Lucro)' ? formatCurrency(s.value) : `(-${formatCurrency(s.value)})`}</span>
                  </li>
                ))}
              </ul>
              <Separator className="my-4" />
              <div className="flex justify-between font-bold text-primary">
                <span>Lucro Final (BDI)</span>
                <span>{formatCurrency(result.profit)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
