
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CalculatorIcon, DollarSign, Package, Ship, Landmark, Percent, Briefcase, TrendingUp, Code, PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const calculatorSchema = z.object({
  productId: z.string().min(1, { message: "Por favor, selecione um produto." }),
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

const ChartCard = ({ result }: { result: CalculationResult }) => {
    const chartData = [
        { name: 'Custo do Produto', value: result.productCosts.total },
        { name: 'Custos de Frete', value: result.freightCosts.total },
        { name: 'Impostos Hardware', value: result.importTaxes.total },
        { name: 'Impostos Software', value: result.softwareTaxes.total },
        { name: 'Despesas Aduaneiras', value: result.customsExpenses.total },
        { name: 'Despesas de Venda', value: result.salesExpenses.total },
        { name: 'Lucro Líquido', value: result.totalProfit },
    ].filter(item => item.value > 0);

    const COLORS = [
        'hsl(var(--chart-1))',
        'hsl(var(--chart-2))',
        'hsl(var(--chart-3))',
        'hsl(var(--chart-4))',
        'hsl(var(--chart-5))',
        'hsl(var(--accent))',
        'hsl(var(--primary))',
    ];

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent < 0.05) return null;

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <PieChartIcon className="h-5 w-5 text-primary" />
                    Composição do Preço
                </CardTitle>
                <CardDescription>Distribuição de custos e lucro.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
                <div className="w-full h-80">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)'
                                }}
                            />
                            <Legend wrapperStyle={{fontSize: '0.8rem', paddingTop: '20px'}}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}

export function CalculatorForm() {
  const { products } = useAppContext();
  const [result, setResult] = useState<CalculationResult | null>(null);

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      productId: "",
    },
  });

  const onSubmit = (data: CalculatorFormValues) => {
    const product = products.find(p => p.id === data.productId);
    if (!product) return;
    
    const { 
      finalSellPriceBRL: finalSellPrice,
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
    } = product;

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
    
    const ipiBase = hardwareCostBRL + mainFreightBRL;
    const ipiValue = ipiBase * ipiTax;
    
    const pisCofinsBase = hardwareCostBRL + mainFreightBRL;
    const pisValue = pisCofinsBase * pisTax;
    const cofinsValue = pisCofinsBase * cofinsTax;

    const icmsBase = hardwareCostBRL + mainFreightBRL + iiValue;
    const icmsValue = icmsBase * icmsTax;

    const importTaxes: CostCategory = {
      title: "Impostos Hardware",
      icon: Landmark,
      items: [
        { label: "Taxa Siscomex", value: taxaSiscomex },
        { label: "Imposto de Importação (II)", value: iiValue },
        { label: "IPI", value: ipiValue },
        { label: "PIS", value: pisValue },
        { label: "COFINS", value: cofinsValue },
        { label: "ICMS", value: icmsValue },
      ],
      total: taxaSiscomex + iiValue + ipiValue + pisValue + cofinsValue + icmsValue
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
        { label: "Taxa Fechamento Câmbio", value: exchangeClosingFeeValue },
        { label: "Desembaraço", value: customsClearanceFee },
        { label: "Assessoria Técnica", value: technicalConsultingFee },
        { label: "Armazenagem Aeroporto", value: storageFee },
        { label: "Desconsolidação (USD->BRL)", value: desconsolidacaoBRL },
      ],
      total: exchangeClosingFeeValue + customsClearanceFee + technicalConsultingFee + storageFee + desconsolidacaoBRL,
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
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <ResultCard {...result.productCosts} />
              <ResultCard {...result.freightCosts} />
              <ResultCard {...result.importTaxes} />
              <ResultCard {...result.softwareTaxes} />
              <ResultCard {...result.customsExpenses} />
              <ResultCard {...result.salesExpenses} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <ChartCard result={result} />
            
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

    
