
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
import { CalculatorIcon, DollarSign, Package, Ship, Landmark, Percent, Briefcase, TrendingUp, Code } from "lucide-react";

const calculatorSchema = z.object({
  productId: z.string().min(1, { message: "Por favor, selecione um produto." }),
  finalSellPriceBRL: z.coerce.number().positive({ message: "O preço de venda deve ser positivo." }),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

interface CostItem {
  label: string;
  value: number;
}

interface CostCategory {
  title: string;
  icon: React.ElementType;
  items: CostItem[];
  total: number;
  description?: string;
}

interface CalculationResult {
  finalSellPrice: number;
  totalCostOfGoods: number;
  totalProfit: number;
  productCosts: CostCategory;
  freightCosts: CostCategory;
  importTaxes: CostCategory;
  softwareTaxes: CostCategory;
  customsExpenses: CostCategory;
  salesExpenses: CostCategory;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const ResultCard = ({ title, icon: Icon, total, items, description }: CostCategory) => (
    <Card className="flex flex-col">
        <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <Icon className="h-5 w-5 text-primary" />
                    {title}
                </CardTitle>
            </div>
            {description && <CardDescription className="pt-1">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex-grow">
            <ul className="space-y-2 text-sm">
                {items.map(c => (
                    <li key={c.label} className="flex justify-between">
                        <span className="text-muted-foreground">{c.label}</span>
                        <span className="font-medium">{formatCurrency(c.value)}</span>
                    </li>
                ))}
            </ul>
        </CardContent>
        <CardFooter className="flex-col items-start pt-4 mt-4 border-t bg-muted/50">
            <div className="w-full flex justify-between items-center">
                <span className="text-sm text-muted-foreground font-semibold">Valor total</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
            </div>
        </CardFooter>
    </Card>
);


export function CalculatorForm() {
  const { products, settings } = useAppContext();
  const [result, setResult] = useState<CalculationResult | null>(null);

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      productId: "",
      finalSellPriceBRL: 0,
    },
  });

  const onSubmit = (data: CalculatorFormValues) => {
    const product = products.find(p => p.id === data.productId);
    if (!product || !settings) return;
    
    const finalSellPrice = data.finalSellPriceBRL;

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
      irpjTax,
      iofTax,
      issTax,
      swiftFee,
      simplesNacionalTax, 
      salesCommission,
      financialFee,
      bdiFee,
      marginFee,
      salesDiscount
    } = settings;

    // Custos do Produto (USD -> BRL)
    const hardwareCostBRL = product.hardwareCostUSD * exchangeRateUSD;
    const softwareCostBRL = product.softwareCostUSD * exchangeRateUSD;
    const productCosts: CostCategory = {
      title: "Custo do Produto",
      icon: Package,
      items: [
        { label: "Hardware (USD->BRL)", value: hardwareCostBRL },
        { label: "Software (USD->BRL)", value: softwareCostBRL },
      ],
      total: hardwareCostBRL + softwareCostBRL,
    };
    
    // Custos de Frete (USD -> BRL)
    const mainFreightBRL = product.freightCostUSD * exchangeRateUSD;
    const freightCosts: CostCategory = {
      title: "Custos de Frete",
      icon: Ship,
      items: [
        { label: "Frete Principal (USD->BRL)", value: mainFreightBRL },
        { label: "Frete Internacional Terceiro", value: freteInternacionalTerceiro },
        { label: "Frete Terceiros - DA", value: freteTerceirosDA },
      ],
      total: mainFreightBRL + freteInternacionalTerceiro + freteTerceirosDA,
    };

    // Impostos de Importação (Hardware + Frete Principal)
    const importTaxBase = hardwareCostBRL + mainFreightBRL;
    const iiValue = importTaxBase * importTaxII;

    // Base de cálculo do IPI é (Custo Hardware + Frete)
    const ipiBase = importTaxBase;
    const ipiValue = ipiBase * ipiTax;

    // Base de cálculo do PIS/COFINS é (Custo Hardware + Frete)
    const pisCofinsBase = importTaxBase;
    const pisValue = pisCofinsBase * pisTax;
    const cofinsValue = pisCofinsBase * cofinsTax;
    
    // Base de cálculo do ICMS é (Custo Hardware + Frete + II) / (1 - Alíquota ICMS)
    const icmsGrossBase = hardwareCostBRL + mainFreightBRL + iiValue;
    const icmsValue = (icmsGrossBase / (1 - icmsTax)) * icmsTax;


    const importTaxes: CostCategory = {
      title: "Impostos Hardware",
      icon: Landmark,
      items: [
        { label: "Imposto de Importação (II)", value: iiValue },
        { label: "IPI", value: ipiValue },
        { label: "PIS", value: pisValue },
        { label: "COFINS", value: cofinsValue },
        { label: "ICMS", value: icmsValue },
      ],
      total: iiValue + ipiValue + pisValue + cofinsValue + icmsValue
    };
    
    // Impostos sobre Software
    const irpjValue = softwareCostBRL * irpjTax;
    const iofValue = softwareCostBRL * iofTax;
    const issValue = softwareCostBRL * issTax;
    const softwareTaxes: CostCategory = {
        title: "Impostos Software",
        icon: Code,
        items: [
            { label: "IRPJ", value: irpjValue },
            { label: "IOF", value: iofValue },
            { label: "ISS (Americana)", value: issValue },
            { label: "Taxa Swift", value: swiftFee },
        ],
        total: irpjValue + iofValue + issValue + swiftFee
    };


    // Despesas Aduaneiras
    const exchangeClosingFeeValue = productCosts.total * exchangeClosingFee;
    const desconsolidacaoBRL = desconsolidacaoUSD * exchangeRateUSD;
    const customsExpenses: CostCategory = {
      title: "Despesas Aduaneiras",
      icon: Briefcase,
      items: [
        { label: "Taxa Siscomex", value: taxaSiscomex },
        { label: "Taxa Fechamento Câmbio", value: exchangeClosingFeeValue },
        { label: "Desembaraço", value: customsClearanceFee },
        { label: "Assessoria Técnica", value: technicalConsultingFee },
        { label: "Armazenagem Aeroporto", value: storageFee },
        { label: "Desconsolidação (USD->BRL)", value: desconsolidacaoBRL },
      ],
      total: taxaSiscomex + exchangeClosingFeeValue + customsClearanceFee + technicalConsultingFee + storageFee + desconsolidacaoBRL,
    };

    // Custo Total dos Bens (COGS)
    const totalCostOfGoods = productCosts.total + freightCosts.total + importTaxes.total + softwareTaxes.total + customsExpenses.total;

    // Despesas de Venda (baseado no preço de venda informado)
    const simplesNacionalValue = finalSellPrice * simplesNacionalTax;
    const salesCommissionValue = finalSellPrice * salesCommission;
    const marginValue = finalSellPrice * marginFee;
    const salesDiscountValue = finalSellPrice * salesDiscount;

    const salesExpenses: CostCategory = {
      title: "Despesas sobre a Venda",
      icon: Percent,
      description: "Custos, impostos e margens aplicados sobre o preço final.",
      items: [
        { label: "Imposto Simples Nacional", value: simplesNacionalValue },
        { label: "Comissão", value: salesCommissionValue },
        { label: "Custo Financeiro", value: financialFee },
        { label: "BDI (Desp. Indiretas)", value: bdiFee },
        { label: "Margem", value: marginValue },
        { label: "Desconto de Venda", value: -salesDiscountValue },
      ],
      total: simplesNacionalValue + salesCommissionValue + financialFee + bdiFee + marginValue - salesDiscountValue,
    };
    
    // Lucro Líquido
    const totalProfit = finalSellPrice - totalCostOfGoods - salesExpenses.total;

    setResult({
      finalSellPrice,
      totalCostOfGoods,
      totalProfit,
      productCosts,
      freightCosts,
      importTaxes,
      softwareTaxes,
      customsExpenses,
      salesExpenses,
    });
  };

  return (
    <div className="grid lg:grid-cols-5 gap-8 items-start">
      <div className="lg:col-span-1 space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="finalSellPriceBRL"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço de Venda Final (R$)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">R$</span>
                      <Input 
                        type="number" 
                        step="0.01" 
                        className="pl-10 font-bold"
                        placeholder="ex: 50000.00"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              <CalculatorIcon className="mr-2 h-4 w-4" /> Calcular
            </Button>
          </form>
        </Form>
      </div>

      {result && (
        <div className="lg:col-span-4">
            <Card className="bg-primary text-primary-foreground shadow-lg mb-6">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Lucro Líquido da Venda</CardTitle>
              <DollarSign className="h-4 w-4 text-primary-foreground/70" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{formatCurrency(result.totalProfit)}</div>
            </CardContent>
            <CardFooter>
               <p className="text-xs text-primary-foreground/70">
                Preço de Venda: {formatCurrency(result.finalSellPrice)} • Custo Total: {formatCurrency(result.totalCostOfGoods + result.salesExpenses.total)}
              </p>
            </CardFooter>
          </Card>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ResultCard {...result.productCosts} />
              <ResultCard {...result.freightCosts} />
              <ResultCard {...result.importTaxes} />
              <ResultCard {...result.softwareTaxes} />
              <ResultCard {...result.customsExpenses} />
              <ResultCard {...result.salesExpenses} />

            <Card className="flex flex-col justify-center">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Resumo Final
                  </CardTitle>
                   <CardDescription>Composição do preço de venda.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between items-center">
                    <span className="text-muted-foreground">Custo Total dos Bens</span>
                    <span className="font-bold text-lg">{formatCurrency(result.totalCostOfGoods)}</span>
                  </li>
                  <li className="flex justify-between items-center text-muted-foreground">
                    <span>Despesas sobre a Venda</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(result.salesExpenses.total)}
                    </span>
                  </li>
                   <li className="flex justify-between items-center text-emerald-600">
                    <span className="text-muted-foreground">Lucro Líquido</span>
                    <span className="font-bold text-lg">{formatCurrency(result.totalProfit)}</span>
                  </li>
                </ul>
                <Separator className="my-4"/>
                <div className="flex justify-between font-bold text-primary">
                    <span className="text-base">Preço Final de Venda</span>
                    <span className="text-2xl">{formatCurrency(result.finalSellPrice)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

    

    