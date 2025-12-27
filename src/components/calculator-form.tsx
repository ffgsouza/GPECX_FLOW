

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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CalculatorIcon, DollarSign, Package, Ship, Landmark, Percent, Briefcase, TrendingUp, Code, PieChartIcon, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SaleProduct } from "@/lib/types";
import { TAX_RULES } from "@/lib/constants";


const calculatorSchema = z.object({
  productIds: z.array(z.string()).min(1, { message: "Selecione ao menos um item." }),
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
  totalLandedCost: number;
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
  const { products, globalSettings, getProductTypeNameById, productTypes, loading } = useAppContext();
  const [result, setResult] = useState<CalculationResult | null>(null);

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      productIds: [],
    },
  });

  const onSubmit = (data: CalculatorFormValues) => {
    const selectedProducts = products.filter(p => data.productIds.includes(p.id));
    if (selectedProducts.length === 0) return;

    const { exchangeRateUSD } = globalSettings;
    const hardwareRule = TAX_RULES.HARDWARE;
    const softwareRule = TAX_RULES.SOFTWARE;
    
    const hardwareItems = selectedProducts.filter(p => {
        const type = productTypes.find(pt => pt.id === p.productTypeId);
        return type?.name === 'Hardware' || type?.name === 'Acessório';
    });

    const softwareItems = selectedProducts.filter(p => {
        const type = productTypes.find(pt => pt.id === p.productTypeId);
        return type?.name === 'Licença de Software';
    });


    // --- GRUPO A: CÁLCULO DE CUSTO DO HARDWARE ---
    const hardwareFobUSD = hardwareItems.reduce((acc, p) => acc + p.costUSD, 0);
    const mainFreightBRL = globalSettings.freightCostUSD * exchangeRateUSD;
    const hardwareCifBRL = (hardwareFobUSD * exchangeRateUSD) + mainFreightBRL;
    
    let hardwareLandedCost = 0;
    let iiValue = 0, ipiValue = 0, pisValueHw = 0, cofinsValueHw = 0, icmsValue = 0;

    if (hardwareItems.length > 0) {
      iiValue = hardwareCifBRL * hardwareRule.importTaxII;
      ipiValue = (hardwareCifBRL + iiValue) * hardwareRule.ipiTax;
      pisValueHw = hardwareCifBRL * hardwareRule.pisTax;
      cofinsValueHw = hardwareCifBRL * hardwareRule.cofinsTax;
      
      const icmsBase = (hardwareCifBRL + iiValue + ipiValue + pisValueHw + cofinsValueHw + globalSettings.taxaSiscomex) / (1 - hardwareRule.icmsTax);
      icmsValue = icmsBase * hardwareRule.icmsTax;
      
      hardwareLandedCost = hardwareCifBRL + iiValue + ipiValue + pisValueHw + cofinsValueHw + icmsValue;
    }

    // --- GRUPO B: CÁLCULO DE CUSTO DO SOFTWARE ---
    const softwareFobUSD = softwareItems.reduce((acc, p) => acc + p.costUSD, 0);
    const softwareNetCostBRL = softwareFobUSD * exchangeRateUSD;

    let softwareLandedCost = 0;
    let irpjValue = 0, iofValue = 0, issValue = 0, pisCofinsSwValue = 0;

    if (softwareItems.length > 0) {
        // Gross-up para IRRF
        const irrfGrossUpBase = softwareNetCostBRL / (1 - softwareRule.irpjTax);
        irpjValue = irrfGrossUpBase * softwareRule.irpjTax;

        // PIS/COFINS sobre serviços
        pisCofinsSwValue = softwareNetCostBRL * (softwareRule.pisTax + softwareRule.cofinsTax);

        // Outros impostos sobre o valor líquido
        iofValue = softwareNetCostBRL * softwareRule.iofTax;
        issValue = softwareNetCostBRL * softwareRule.issTax;
        
        // Custo total do software
        softwareLandedCost = softwareNetCostBRL + irpjValue + pisCofinsSwValue + iofValue + issValue + globalSettings.swiftFee;
    }

    // --- CONSOLIDAÇÃO E PRECIFICAÇÃO ---

    const totalProductCostBRL = (hardwareFobUSD + softwareFobUSD) * exchangeRateUSD;

    const productCosts: CostCategory = {
      title: "Custo do Produto (FOB)",
      icon: Package,
      items: [
        { label: "Hardware (USD->BRL)", value: hardwareFobUSD * exchangeRateUSD },
        { label: "Licença de Software (USD->BRL)", value: softwareFobUSD * exchangeRateUSD },
      ],
      total: totalProductCostBRL,
    };
    
    const freightCosts: CostCategory = {
      title: "Custos de Frete",
      icon: Ship,
      items: [
        { label: "Frete Principal (USD->BRL)", value: mainFreightBRL },
        { label: "Frete Internacional Terceiro", value: globalSettings.freteInternacionalTerceiro },
        { label: "Frete Terceiros - DA", value: globalSettings.freteTerceirosDA },
      ],
      total: mainFreightBRL + globalSettings.freteInternacionalTerceiro + globalSettings.freteTerceirosDA,
    };

    const importTaxes: CostCategory = {
      title: "Impostos Importação (Hardware)",
      icon: Landmark,
      items: [
        { label: `II (${(hardwareRule.importTaxII * 100).toFixed(1)}%)`, value: iiValue },
        { label: `IPI (${(hardwareRule.ipiTax * 100).toFixed(2)}%)`, value: ipiValue },
        { label: `PIS (${(hardwareRule.pisTax * 100).toFixed(2)}%)`, value: pisValueHw },
        { label: `COFINS (${(hardwareRule.cofinsTax * 100).toFixed(2)}%)`, value: cofinsValueHw },
        { label: `ICMS (${(hardwareRule.icmsTax * 100).toFixed(0)}%)`, value: icmsValue },
      ],
      total: iiValue + ipiValue + pisValueHw + cofinsValueHw + icmsValue
    };
    
    const softwareTaxes: CostCategory = {
        title: "Impostos Licença de Software (Serviço)",
        icon: Code,
        items: [
            { label: `IRRF (Gross-Up) (${(softwareRule.irpjTax * 100).toFixed(0)}%)`, value: irpjValue },
            { label: `PIS/COFINS (${((softwareRule.pisTax + softwareRule.cofinsTax) * 100).toFixed(2)}%)`, value: pisCofinsSwValue },
            { label: `IOF Câmbio (${(softwareRule.iofTax * 100).toFixed(2)}%)`, value: iofValue },
            { label: `ISS (${(softwareRule.issTax * 100).toFixed(0)}%)`, value: issValue },
            { label: "Taxa Swift", value: globalSettings.swiftFee },
        ],
        total: irpjValue + pisCofinsSwValue + iofValue + issValue + globalSettings.swiftFee
    };

    const desconsolidacaoBRL = globalSettings.desconsolidacaoUSD * exchangeRateUSD;
    const customsExpenses: CostCategory = {
      title: "Despesas Aduaneiras",
      icon: Briefcase,
      items: [
        { label: "Taxa Siscomex", value: hardwareItems.length > 0 ? globalSettings.taxaSiscomex : 0 },
        { label: "Desembaraço", value: globalSettings.customsClearanceFee },
        { label: "Assessoria Técnica", value: globalSettings.technicalConsultingFee },
        { label: "Armazenagem", value: globalSettings.storageFee },
        { label: "Desconsolidação (USD->BRL)", value: desconsolidacaoBRL },
      ],
      total: (hardwareItems.length > 0 ? globalSettings.taxaSiscomex : 0) + globalSettings.customsClearanceFee + globalSettings.technicalConsultingFee + globalSettings.storageFee + desconsolidacaoBRL,
    };

    const totalLandedCost = totalProductCostBRL + freightCosts.total + importTaxes.total + softwareTaxes.total + customsExpenses.total;

    const divisor = 1 - (globalSettings.simplesNacionalTax + globalSettings.salesCommission + globalSettings.marginFee - globalSettings.salesDiscount);
    
    const finalSellPrice = (totalLandedCost + globalSettings.financialFee + globalSettings.bdiFee) / divisor;

    const simplesNacionalValue = finalSellPrice * globalSettings.simplesNacionalTax;
    const salesCommissionValue = finalSellPrice * globalSettings.salesCommission;
    const marginValue = finalSellPrice * globalSettings.marginFee;
    const salesDiscountValue = finalSellPrice * globalSettings.salesDiscount;

    const salesExpenses: CostCategory = {
      title: "Despesas sobre a Venda",
      icon: Percent,
      description: "Custos, impostos e margens aplicados sobre o preço final.",
      items: [
        { label: `Imposto Simples (${(globalSettings.simplesNacionalTax * 100).toFixed(1)}%)`, value: simplesNacionalValue },
        { label: `Comissão (${(globalSettings.salesCommission * 100).toFixed(0)}%)`, value: salesCommissionValue },
        { label: "Custo Financeiro (Fixo)", value: globalSettings.financialFee },
        { label: "BDI (Fixo)", value: globalSettings.bdiFee },
        { label: `Margem (${(globalSettings.marginFee * 100).toFixed(0)}%)`, value: marginValue },
        { label: `Desconto (${(globalSettings.salesDiscount * 100).toFixed(0)}%)`, value: -salesDiscountValue },
      ],
      total: simplesNacionalValue + salesCommissionValue + globalSettings.financialFee + globalSettings.bdiFee + marginValue - salesDiscountValue,
    };
    
    const totalProfit = finalSellPrice - totalLandedCost - salesExpenses.total;

    setResult({
      finalSellPrice,
      totalLandedCost,
      totalProfit,
      productCosts,
      freightCosts,
      importTaxes,
      softwareTaxes,
      customsExpenses,
      salesExpenses,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-5 gap-8 items-start">
      <div className="lg:col-span-1 space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productIds"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Itens do Orçamento</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Selecione os itens de hardware e software para compor o kit.
                    </p>
                  </div>
                  {products.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="productIds"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {item.name} ({formatCurrency(item.costUSD * globalSettings.exchangeRateUSD)})
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
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
                Preço de Venda: {formatCurrency(result.finalSellPrice)} • Custo Total: {formatCurrency(result.totalLandedCost + result.salesExpenses.total)}
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
                    <span className="font-bold text-lg">{formatCurrency(result.totalLandedCost)}</span>
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
