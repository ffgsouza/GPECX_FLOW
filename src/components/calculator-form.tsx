"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { 
  Search, 
  Trash2, 
  Check, 
  Info,
  Package, 
  Cpu, 
  FileCode, 
  Briefcase,
  Filter,
  DollarSign,
  CalculatorIcon,
  Landmark,
  Percent,
  PieChartIcon,
  Ship,
  TrendingUp
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { useAppContext } from "@/context/app-context";
import { SaleProduct } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";


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
  const { 
    products, 
    categories, 
    productTypes, 
    getCategoryNameById,
    globalSettings
  } = useAppContext();

  // Estados locais
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedProducts, setSelectedProducts] = useState<SaleProduct[]>([]);
  const [result, setResult] = useState<CalculationResult | null>(null);


  const form = useForm();

  // --- LÓGICA CORE: FILTRAGEM ---
  const { visibleProducts, activeHardwareName } = useMemo(() => {
    // Identificar Hardware
    const hardwareTypeObj = productTypes.find(t => 
      t.name.toLowerCase().includes("hardware") && !t.name.toLowerCase().includes("acess")
    );
    const hardwareTypeId = hardwareTypeObj?.id || 'hardware';
    const getProductType = (p: SaleProduct) => p.productTypeId;

    let filtered = products;

    // 1. Filtros Básicos
    if (searchQuery) {
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (filterType !== "all") {
      filtered = filtered.filter((p) => getProductType(p) === filterType);
    }
    if (filterCategory !== "all") {
      filtered = filtered.filter((p) => p.categoryId === filterCategory);
    }

    // 2. Lógica de Compatibilidade
    const selectedHardwares = selectedProducts.filter(p => getProductType(p) === hardwareTypeId);
    const selectedHardwareIds = selectedHardwares.map(p => p.id);
    const hasHardwareSelected = selectedHardwareIds.length > 0;

    let activeHwName = null;

    if (hasHardwareSelected) {
      activeHwName = selectedHardwares[0].name;
      if (selectedHardwares.length > 1) activeHwName += ` e outros...`;

      filtered = filtered.filter(product => {
        if (selectedHardwareIds.includes(product.id)) return true;
        
        const compatibleList = Array.isArray(product.compatibleWith) ? product.compatibleWith : [];
        const isCompatible = compatibleList.some((hwId: string) => 
          selectedHardwareIds.includes(hwId)
        );

        if (isCompatible) return true;
        if (getProductType(product) === hardwareTypeId) return false; 
        return false; 
      });
    }

    return { visibleProducts: filtered, activeHardwareName: activeHwName };
  }, [products, productTypes, searchQuery, filterType, filterCategory, selectedProducts]);

  // --- AGRUPAMENTO ---
  const groupedProducts = useMemo(() => {
    const groups: Record<string, SaleProduct[]> = {};
    visibleProducts.forEach((product) => {
      const catId = product.categoryId || 'uncategorized';
      if (!groups[catId]) groups[catId] = [];
      groups[catId].push(product);
    });

    Object.keys(groups).forEach(catId => {
      groups[catId].sort((a: SaleProduct, b: SaleProduct) => {
        const typeA = a.productTypeId;
        const typeB = b.productTypeId;
        
        const getPriority = (tId: string) => {
          const tName = productTypes.find(t => t.id === tId)?.name.toLowerCase() || '';
          if (tName.includes('hardware')) return 1;
          if (tName.includes('licen') || tName.includes('soft')) return 2;
          return 3; 
        };

        const prioA = getPriority(typeA);
        const prioB = getPriority(typeB);

        if (prioA !== prioB) return prioA - prioB;
        return a.name.localeCompare(b.name);
      });
    });

    return groups;
  }, [visibleProducts, productTypes]);

  // --- ACTIONS ---
  const toggleProductSelection = (product: SaleProduct) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) return prev.filter((p) => p.id !== product.id);
      return [...prev, product];
    });
  };

  const clearSelection = () => {
    if (window.confirm("Deseja limpar todos os itens selecionados?")) {
      setSelectedProducts([]);
      setResult(null);
    }
  };

  const totalUSD = useMemo(() => 
    selectedProducts.reduce((acc, curr) => acc + (curr.costUSD || 0), 0), 
  [selectedProducts]);

  const getTypeIcon = (p: SaleProduct) => {
    const tId = p.productTypeId;
    const tName = productTypes.find(t => t.id === tId)?.name.toLowerCase() || '';
    
    if (tName.includes('hardware')) return <Cpu className="w-4 h-4 text-blue-600" />;
    if (tName.includes('licen') || tName.includes('soft')) return <FileCode className="w-4 h-4 text-green-600" />;
    if (tName.includes('acess')) return <Package className="w-4 h-4 text-orange-600" />;
    return <Briefcase className="w-4 h-4 text-gray-600" />;
  };

  const getTypeName = (p: SaleProduct) => {
    const tId = p.productTypeId;
    return productTypes.find(t => t.id === tId)?.name || 'Outro';
  };
  
  const onSubmit = () => {
    setResult(null); // Clear previous results
    if (selectedProducts.length === 0) return;

    const { exchangeRateUSD } = globalSettings;
    
    const hardwareProductType = productTypes.find(pt => pt.name.toLowerCase().includes('hardware') && !pt.name.toLowerCase().includes('acess'));
    const accessoryProductType = productTypes.find(pt => pt.name.toLowerCase().includes('acess'));
    const softwareProductType = productTypes.find(pt => pt.name.toLowerCase().includes('software'));

    const hardwareItems = selectedProducts.filter(p => 
        p.productTypeId === hardwareProductType?.id || p.productTypeId === accessoryProductType?.id);
    const softwareItems = selectedProducts.filter(p => p.productTypeId === softwareProductType?.id);

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

    let totalSoftwareNetCostBRL = 0;
    let totalIrpjValue = 0;
    let totalPisCofinsSwValue = 0;
    let totalIofValue = 0;
    let totalIssValue = 0;

    softwareItems.forEach(item => {
        const softwareNetCostBRL = item.costUSD * exchangeRateUSD;
        totalSoftwareNetCostBRL += softwareNetCostBRL;
        const irrfGrossUpBase = softwareNetCostBRL / (1 - globalSettings.software_irpjTax);
        const irpjValue = irrfGrossUpBase * globalSettings.software_irpjTax;
        totalIrpjValue += irpjValue;
        let pisCofinsSwValue = 0;
        if (!item.isSoftwarePisCofinsFree) {
            pisCofinsSwValue = softwareNetCostBRL * (globalSettings.software_pisTax + globalSettings.software_cofinsTax);
            totalPisCofinsSwValue += pisCofinsSwValue;
        }
        const iofValue = softwareNetCostBRL * globalSettings.software_iofTax;
        const issValue = softwareNetCostBRL * globalSettings.software_issTax;
        totalIofValue += iofValue;
        totalIssValue += issValue;
    });

    const totalSwiftFee = softwareItems.length > 0 ? globalSettings.swiftFee : 0;
    const softwareLandedCost = totalSoftwareNetCostBRL + totalIrpjValue + totalPisCofinsSwValue + totalIofValue + totalIssValue + totalSwiftFee;

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
        icon: FileCode,
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

    const totalLandedCostWithoutSiscomex = hardwareLandedCost + softwareLandedCost + freightCosts.total + customsExpenses.total;
    customsExpenses.items.push({label: "Taxa Siscomex", value: siscomexFee});
    customsExpenses.total += siscomexFee;
    const totalLandedCost = totalLandedCostWithoutSiscomex + siscomexFee;


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
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Calculadora de Custos</h2>
          <p className="text-muted-foreground">
            Selecione os produtos para compor o kit e calcular o preço final.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" onClick={clearSelection} disabled={selectedProducts.length === 0}>
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar Seleção
           </Button>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Buscar por nome..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="md:col-span-3">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  {productTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeHardwareName && (
            <Alert className="mt-4 bg-blue-50 border-blue-200 text-blue-900">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle>Assistente de Venda Ativo</AlertTitle>
              <AlertDescription>
                Filtrando itens compatíveis com <strong>{activeHardwareName}</strong>.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        {Object.keys(groupedProducts).length === 0 ? (
           <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-gray-50 border-dashed">
             <Package className="h-10 w-10 text-muted-foreground mb-4" />
             <h3 className="text-lg font-medium text-gray-900">Nenhum produto encontrado</h3>
             <p className="text-sm text-gray-500 max-w-sm mt-2">
               Tente ajustar os filtros ou sua busca. Se estiver no modo guiado, verifique a compatibilidade.
             </p>
           </div>
        ) : (
          Object.entries(groupedProducts).map(([categoryId, catProducts]) => (
            <Card key={categoryId} className="overflow-hidden">
              <div className="bg-muted/50 px-6 py-3 border-b flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  {getCategoryNameById(categoryId)}
                </h3>
                <Badge variant="secondary">
                  {catProducts.length} itens
                </Badge>
              </div>

              <div className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead className="w-[80px]">Imagem</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="w-[200px]">Tipo</TableHead>
                      <TableHead className="w-[150px] text-right">Custo (USD)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catProducts.map((product) => {
                      const isSelected = selectedProducts.some(p => p.id === product.id);
                      return (
                        <TableRow 
                          key={product.id} 
                          className={`
                            cursor-pointer transition-colors
                            ${isSelected ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted/50'}
                          `}
                          onClick={() => toggleProductSelection(product)}
                        >
                          <TableCell>
                            <div className={`
                              w-5 h-5 rounded border flex items-center justify-center transition-all
                              ${isSelected 
                                ? 'bg-primary border-primary text-white shadow-sm' 
                                : 'border-gray-300 bg-white'}
                            `}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="w-12 h-12 rounded-md bg-gray-100 border overflow-hidden flex items-center justify-center">
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-6 h-6 text-gray-300" />
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col">
                              <span className={`font-medium ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                                {product.name}
                              </span>
                              {product.ncm && (
                                <span className="text-xs text-muted-foreground mt-0.5">NCM: {product.ncm}</span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="gap-1.5 font-normal text-gray-600">
                                {getTypeIcon(product)}
                                {getTypeName(product)}
                              </Badge>
                            </div>
                          </TableCell>

                          <TableCell className="text-right font-mono font-medium text-gray-900">
                            {formatCurrency(product.costUSD, 'USD')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ))
        )}
      </div>

       <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm py-4 rounded-lg -mx-4 px-4 border-t">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
              <div className="flex-grow">
                  <p className="text-sm text-muted-foreground">Valor Total dos Itens (FOB)</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(totalUSD, 'USD')}</p>
              </div>
                <Button onClick={onSubmit} size="lg" className="h-14 px-8 text-lg" disabled={selectedProducts.length === 0}>
                  <CalculatorIcon className="mr-3 h-6 w-6" /> Calcular Preço
              </Button>
          </div>
      </div>
      
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
