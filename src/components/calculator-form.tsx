
"use client";

import { useState, useMemo } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppContext } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CalculatorIcon, DollarSign, Package, Ship, Landmark, Percent, Briefcase, TrendingUp, Code, PieChartIcon, Loader2, CheckCircle, Circle, Filter, Search, ImageIcon } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { SaleProduct, ProductType, SaleCategory } from "@/lib/types";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Checkbox } from "./ui/checkbox";


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

type SearchField = 'name' | 'type' | 'category' | 'cost';

const formatCurrency = (value: number, currency = 'BRL') => {
  return value.toLocaleString(currency === 'BRL' ? 'pt-BR' : 'en-US', { style: 'currency', currency });
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

const ProductSelectionTable = ({
  title,
  products,
  selectedIds,
  onToggle,
  getCategoryName,
  getProductTypeName,
  noItemsMessage,
}: {
  title: string;
  products: SaleProduct[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  getCategoryName: (id: string) => string;
  getProductTypeName: (id: string) => string;
  noItemsMessage?: string;
}) => {
  if (products.length === 0) {
    if (noItemsMessage) {
      return (
        <div className="text-center py-10 border-2 border-dashed rounded-lg col-span-full">
          <p className="text-muted-foreground">{noItemsMessage}</p>
        </div>
      );
    }
    return null;
  }
  return (
    <div className="space-y-4 col-span-full">
      <h3 className="text-lg font-bold">{title}</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <span className="sr-only">Selecionar</span>
              </TableHead>
              <TableHead className="w-[80px]">Imagem</TableHead>
              <TableHead>Nome do Item</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Custo FOB (USD)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const isSelected = selectedIds.includes(product.id);
              return (
                <TableRow
                  key={product.id}
                  data-state={isSelected ? "selected" : ""}
                  onClick={() => onToggle(product.id)}
                  className="cursor-pointer"
                >
                  <TableCell className="pl-4">
                    <Checkbox
                      checked={isSelected}
                      aria-label="Selecionar item"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center h-16 w-16 bg-muted rounded-md overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-16 w-16 object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <span
                        className={`px-2 py-1 text-xs rounded-full ${
                        getProductTypeName(product.productTypeId) === 'Hardware'
                            ? 'bg-sky-100 text-sky-800'
                            : getProductTypeName(product.productTypeId) === 'Licença de Software'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                    >
                        {getProductTypeName(product.productTypeId)}
                    </span>
                  </TableCell>
                  <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {product.costUSD.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};


export function CalculatorForm() {
  const { products, globalSettings, productTypes, categories, getCategoryNameById, getProductTypeNameById, loading } = useAppContext();
  const [result, setResult] = useState<CalculationResult | null>(null);

  const [filterTypeIds, setFilterTypeIds] = useState<string[]>([]);
  const [filterCategoryIds, setFilterCategoryIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('name');
  
  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      productIds: [],
    },
  });

  const selectedProductIds = form.watch("productIds");
  
  const totalUsdCost = selectedProductIds.reduce((total, id) => {
    const product = products.find(p => p.id === id);
    return total + (product?.costUSD || 0);
  }, 0);


  const onSubmit = (data: CalculatorFormValues) => {
    setResult(null); // Clear previous results
    const selectedProducts = products.filter(p => data.productIds.includes(p.id));
    if (selectedProducts.length === 0) return;

    const { exchangeRateUSD } = globalSettings;
    
    const hardwareItems = selectedProducts.filter(p => {
        const typeName = getProductTypeNameById(p.productTypeId);
        return typeName === 'Hardware' || typeName === 'Acessório';
    });

    const softwareItems = selectedProducts.filter(p => {
        const typeName = getProductTypeNameById(p.productTypeId);
        return typeName === 'Licença de Software';
    });


    // --- GRUPO A: CÁLCULO DE CUSTO DO HARDWARE ---
    const hardwareFobUSD = hardwareItems.reduce((acc, p) => acc + p.costUSD, 0);
    const mainFreightUSD = hardwareItems.length > 0 ? globalSettings.freightCostUSD : 0;
    const hardwareCifBRL = (hardwareFobUSD + mainFreightUSD) * exchangeRateUSD;
    
    let hardwareLandedCost = 0;
    let iiValue = 0, ipiValue = 0, pisValueHw = 0, cofinsValueHw = 0, icmsValue = 0;

    if (hardwareItems.length > 0) {
      iiValue = hardwareCifBRL * globalSettings.hardware_importTaxII;
      
      const ipiBase = hardwareCifBRL + iiValue;
      ipiValue = ipiBase * globalSettings.hardware_ipiTax;
      
      pisValueHw = hardwareCifBRL * globalSettings.hardware_pisTax;
      cofinsValueHw = hardwareCifBRL * globalSettings.hardware_cofinsTax;
      
      const custoPreICMS = hardwareCifBRL + iiValue + ipiValue + pisValueHw + cofinsValueHw;
      
      const icmsBase = custoPreICMS / (1 - globalSettings.hardware_icmsTax);
      icmsValue = icmsBase * globalSettings.hardware_icmsTax;
      
      hardwareLandedCost = custoPreICMS + icmsValue;
    }

    // --- GRUPO B: CÁLCULO DE CUSTO DO SOFTWARE ---
    let totalSoftwareNetCostBRL = 0;
    let totalIrpjValue = 0;
    let totalPisCofinsSwValue = 0;
    let totalIofValue = 0;
    let totalIssValue = 0;

    softwareItems.forEach(item => {
        const softwareNetCostBRL = item.costUSD * exchangeRateUSD;
        totalSoftwareNetCostBRL += softwareNetCostBRL;

        // Gross-up para IRRF
        const irrfGrossUpBase = softwareNetCostBRL / (1 - globalSettings.software_irpjTax);
        const irpjValue = irrfGrossUpBase * globalSettings.software_irpjTax;
        totalIrpjValue += irpjValue;

        // PIS/COFINS sobre serviços (com verificação de isenção)
        let pisCofinsSwValue = 0;
        if (!item.isSoftwarePisCofinsFree) {
            pisCofinsSwValue = softwareNetCostBRL * (globalSettings.software_pisTax + globalSettings.software_cofinsTax);
            totalPisCofinsSwValue += pisCofinsSwValue;
        }

        // Outros impostos sobre o valor líquido
        const iofValue = softwareNetCostBRL * globalSettings.software_iofTax;
        const issValue = softwareNetCostBRL * globalSettings.software_issTax;
        totalIofValue += iofValue;
        totalIssValue += issValue;
    });

    const totalSwiftFee = softwareItems.length > 0 ? globalSettings.swiftFee : 0;
    const softwareLandedCost = totalSoftwareNetCostBRL + totalIrpjValue + totalPisCofinsSwValue + totalIofValue + totalIssValue + totalSwiftFee;


    // --- CONSOLIDAÇÃO E PRECIFICAÇÃO ---
    const totalProductCostBRL = (hardwareFobUSD * exchangeRateUSD) + totalSoftwareNetCostBRL;

    const productCosts: CostCategory = {
      title: "Custo do Produto (FOB)",
      icon: Package,
      items: [
        { label: "Hardware (USD->BRL)", value: hardwareFobUSD * exchangeRateUSD },
        { label: "Licença de Software (USD->BRL)", value: totalSoftwareNetCostBRL },
      ],
      total: totalProductCostBRL,
    };
    
    const freightCosts: CostCategory = {
      title: "Custos de Frete",
      icon: Ship,
      items: [
        { label: "Frete Principal (USD->BRL)", value: mainFreightUSD * exchangeRateUSD },
        { label: "Frete Internacional Terceiro", value: globalSettings.freteInternacionalTerceiro },
        { label: "Frete Terceiros - DA", value: globalSettings.freteTerceirosDA },
      ],
      total: (mainFreightUSD * exchangeRateUSD) + globalSettings.freteInternacionalTerceiro + globalSettings.freteTerceirosDA,
    };

    const importTaxes: CostCategory = {
      title: "Impostos Importação (Hardware)",
      icon: Landmark,
      items: [
        { label: `II (${(globalSettings.hardware_importTaxII * 100).toFixed(1)}%)`, value: iiValue },
        { label: `IPI (${(globalSettings.hardware_ipiTax * 100).toFixed(2)}%)`, value: ipiValue },
        { label: `PIS (${(globalSettings.hardware_pisTax * 100).toFixed(2)}%)`, value: pisValueHw },
        { label: `COFINS (${(globalSettings.hardware_cofinsTax * 100).toFixed(2)}%)`, value: cofinsValueHw },
        { label: `ICMS (${(globalSettings.hardware_icmsTax * 100).toFixed(0)}%)`, value: icmsValue },
      ],
      total: iiValue + ipiValue + pisValueHw + cofinsValueHw + icmsValue
    };
    
    const softwareTaxes: CostCategory = {
        title: "Impostos Licença de Software (Serviço)",
        icon: Code,
        items: [
            { label: `IRRF (Gross-Up) (${(globalSettings.software_irpjTax * 100).toFixed(0)}%)`, value: totalIrpjValue },
            { label: `PIS/COFINS (${((globalSettings.software_pisTax + globalSettings.software_cofinsTax) * 100).toFixed(2)}%)`, value: totalPisCofinsSwValue },
            { label: `IOF Câmbio (${(globalSettings.software_iofTax * 100).toFixed(2)}%)`, value: totalIofValue },
            { label: `ISS (${(globalSettings.software_issTax * 100).toFixed(0)}%)`, value: totalIssValue },
            { label: "Taxa Swift", value: totalSwiftFee },
        ],
        total: totalIrpjValue + totalPisCofinsSwValue + totalIofValue + totalIssValue + totalSwiftFee
    };

    const desconsolidacaoBRL = hardwareItems.length > 0 ? (globalSettings.desconsolidacaoUSD * exchangeRateUSD) : 0;
    const siscomexFee = hardwareItems.length > 0 ? globalSettings.taxaSiscomex : 0;
    const customsExpenses: CostCategory = {
      title: "Despesas Aduaneiras",
      icon: Briefcase,
      items: [
        { label: "Desembaraço", value: globalSettings.customsClearanceFee },
        { label: "Assessoria Técnica", value: globalSettings.technicalConsultingFee },
        { label: "Armazenagem", value: globalSettings.storageFee },
        { label: "Desconsolidação (USD->BRL)", value: desconsolidacaoBRL },
      ],
      total: globalSettings.customsClearanceFee + globalSettings.technicalConsultingFee + globalSettings.storageFee + desconsolidacaoBRL,
    };

    // Recalcula o custo total, somando a taxa Siscomex APÓS os impostos
    const totalLandedCost = hardwareLandedCost + softwareLandedCost + freightCosts.total + customsExpenses.total + siscomexFee;


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

  const { hardwareProducts, softwareProducts, accessoryProducts, compatibleSoftware, compatibleAccessories } = useMemo(() => {
    let allProducts: SaleProduct[] = [...products];

    // Main search and filter logic
    if (searchQuery) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        allProducts = allProducts.filter(product => {
            switch (searchField) {
                case 'name':
                    return product.name_lower?.includes(lowerCaseQuery) || product.name.toLowerCase().includes(lowerCaseQuery);
                case 'type':
                    return getProductTypeNameById(product.productTypeId).toLowerCase().includes(lowerCaseQuery);
                case 'category':
                    return getCategoryNameById(product.categoryId).toLowerCase().includes(lowerCaseQuery);
                case 'cost':
                    return product.costUSD.toString().includes(lowerCaseQuery);
                default:
                    return true;
            }
        });
    }
    if (filterTypeIds.length > 0) {
        allProducts = allProducts.filter(p => filterTypeIds.includes(p.productTypeId));
    }
    if (filterCategoryIds.length > 0) {
        allProducts = allProducts.filter(p => filterCategoryIds.includes(p.categoryId));
    }

    // Separate products into types
    const hardwareProducts: SaleProduct[] = [];
    const softwareProducts: SaleProduct[] = [];
    const accessoryProducts: SaleProduct[] = [];

    allProducts.forEach(p => {
        const typeName = getProductTypeNameById(p.productTypeId);
        if (typeName === 'Hardware') {
            hardwareProducts.push(p);
        } else if (typeName === 'Licença de Software') {
            softwareProducts.push(p);
        } else if (typeName === 'Acessório') {
            accessoryProducts.push(p);
        }
    });

    // Logic for compatibility
    const selectedHardwareIds = selectedProductIds.filter(id => products.find(p => p.id === id && getProductTypeNameById(p.productTypeId) === 'Hardware'));
    
    let compatibleSoftware: SaleProduct[] = [];
    let compatibleAccessories: SaleProduct[] = [];

    if (selectedHardwareIds.length > 0) {
        const prefixes = selectedHardwareIds.map(id => id.split('_')[0]);
        const uniquePrefixes = [...new Set(prefixes)];

        const allSoftware = products.filter(p => getProductTypeNameById(p.productTypeId) === 'Licença de Software');
        const allAccessories = products.filter(p => getProductTypeNameById(p.productTypeId) === 'Acessório');

        compatibleSoftware = allSoftware.filter(p => uniquePrefixes.some(prefix => p.id.startsWith(prefix)));
        
        const prefixAccessories = allAccessories.filter(p => uniquePrefixes.some(prefix => p.id.startsWith(prefix)));
        const genericAccessories = allAccessories.filter(p => !p.id.includes('_'));
        
        compatibleAccessories = [...new Set([...prefixAccessories, ...genericAccessories])];
    }
    
    return { hardwareProducts, softwareProducts, accessoryProducts, compatibleSoftware, compatibleAccessories };
  }, [products, productTypes, selectedProductIds, getProductTypeNameById, searchQuery, searchField, filterTypeIds, filterCategoryIds, getCategoryNameById]);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
             <FormField
              control={form.control}
              name="productIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-bold">Itens do Orçamento</FormLabel>
                   <FormDescription>
                    {selectedProductIds.some(id => hardwareProducts.some(p => p.id === id)) 
                        ? "Hardware principal selecionado. Agora escolha os softwares e acessórios."
                        : "Selecione primeiro uma unidade principal para ver os softwares e acessórios compatíveis."
                    }
                  </FormDescription>

                  <div className="space-y-4 pt-4">
                     <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Buscar por nome..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Filtrar por Tipo
                                        {filterTypeIds.length > 0 && <span className="ml-2 rounded-full bg-primary px-2 text-xs text-primary-foreground">{filterTypeIds.length}</span>}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuLabel>Tipos de Item</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {productTypes.map((type: ProductType) => (
                                        <DropdownMenuCheckboxItem
                                            key={type.id}
                                            checked={filterTypeIds.includes(type.id)}
                                            onCheckedChange={(checked) => {
                                                setFilterTypeIds(prev => checked ? [...prev, type.id] : prev.filter(id => id !== type.id));
                                            }}
                                        >
                                            {type.name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Filtrar por Categoria
                                        {filterCategoryIds.length > 0 && <span className="ml-2 rounded-full bg-primary px-2 text-xs text-primary-foreground">{filterCategoryIds.length}</span>}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuLabel>Categorias</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {categories.map((cat: SaleCategory) => (
                                        <DropdownMenuCheckboxItem
                                            key={cat.id}
                                            checked={filterCategoryIds.includes(cat.id)}
                                            onCheckedChange={(checked) => {
                                                setFilterCategoryIds(prev => checked ? [...prev, cat.id] : prev.filter(id => id !== cat.id));
                                            }}
                                        >
                                            {cat.name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {(filterCategoryIds.length > 0 || filterTypeIds.length > 0 || searchQuery) && (
                                <Button variant="ghost" size="sm" onClick={() => { setFilterCategoryIds([]); setFilterTypeIds([]); setSearchQuery(''); }}>Limpar Filtros</Button>
                            )}
                        </div>
                    </div>
                  </div>

                  <FormControl>
                    <div className="space-y-6 pt-4">
                        <ProductSelectionTable 
                            title="Unidades Principais (Hardware)"
                            products={hardwareProducts}
                            selectedIds={field.value}
                            onToggle={(id) => {
                                const newValue = field.value?.includes(id)
                                    ? field.value.filter(val => val !== id)
                                    : [...(field.value || []), id];
                                field.onChange(newValue);
                            }}
                            getCategoryName={getCategoryNameById}
                            getProductTypeName={getProductTypeNameById}
                            noItemsMessage="Nenhum hardware encontrado com os filtros atuais."
                        />

                        <ProductSelectionTable 
                            title="Licenças de Software"
                            products={softwareProducts}
                            selectedIds={field.value}
                            onToggle={(id) => {
                                const newValue = field.value?.includes(id)
                                    ? field.value.filter(val => val !== id)
                                    : [...(field.value || []), id];
                                field.onChange(newValue);
                            }}
                            getCategoryName={getCategoryNameById}
                            getProductTypeName={getProductTypeNameById}
                            noItemsMessage="Nenhum software encontrado com os filtros atuais."
                        />

                        <ProductSelectionTable 
                            title="Acessórios"
                            products={accessoryProducts}
                            selectedIds={field.value}
                            onToggle={(id) => {
                                const newValue = field.value?.includes(id)
                                    ? field.value.filter(val => val !== id)
                                    : [...(field.value || []), id];
                                field.onChange(newValue);
                            }}
                            getCategoryName={getCategoryNameById}
                            getProductTypeName={getProductTypeNameById}
                            noItemsMessage="Nenhum acessório encontrado com os filtros atuais."
                        />

                        {selectedProductIds.some(id => hardwareProducts.some(p => p.id === id)) && (
                            <>
                                <Separator className="col-span-full" />
                                <ProductSelectionTable 
                                    title="Licenças de Software (Compatíveis)"
                                    products={compatibleSoftware}
                                    selectedIds={field.value}
                                    onToggle={(id) => {
                                        const newValue = field.value?.includes(id)
                                            ? field.value.filter(val => val !== id)
                                            : [...(field.value || []), id];
                                        field.onChange(newValue);
                                    }}
                                    getCategoryName={getCategoryNameById}
                                    getProductTypeName={getProductTypeNameById}
                                    noItemsMessage="Nenhum software compatível encontrado."
                                />
                                <Separator className="col-span-full"/>
                                <ProductSelectionTable 
                                    title="Acessórios (Compatíveis e Genéricos)"
                                    products={compatibleAccessories}
                                    selectedIds={field.value}
                                    onToggle={(id) => {
                                        const newValue = field.value?.includes(id)
                                            ? field.value.filter(val => val !== id)
                                            : [...(field.value || []), id];
                                        field.onChange(newValue);
                                    }}
                                    getCategoryName={getCategoryNameById}
                                    getProductTypeName={getProductTypeNameById}
                                    noItemsMessage="Nenhum acessório compatível encontrado."
                                />
                            </>
                        )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm py-4 rounded-lg -mx-4 px-4 border-t">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex-grow">
                        <p className="text-sm text-muted-foreground">Valor Total dos Itens (FOB)</p>
                        <p className="text-3xl font-bold text-primary">{formatCurrency(totalUsdCost, 'USD')}</p>
                    </div>
                     <Button type="submit" size="lg" className="h-14 px-8 text-lg" disabled={selectedProductIds.length === 0}>
                        <CalculatorIcon className="mr-3 h-6 w-6" /> Calcular Preço
                    </Button>
                </div>
            </div>
          </form>
        </Form>

      {result && (
        <div className="space-y-8 pt-8 border-t">
            <Card className="bg-primary text-primary-foreground shadow-lg max-w-sm mx-auto">
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

    