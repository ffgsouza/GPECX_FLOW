
"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Search,
  Trash2,
  Check,
  Info,
  Package,
  Save,
  Calculator,
  Loader2,
  Wrench,
  ChevronDown,
  ChevronUp,
  DollarSign,
} from "lucide-react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";

import { initializeFirebase } from "@/firebase";
import { useAppContext } from "@/context/app-context";
import { SaleProduct, CostAnalysis, GlobalSettings } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";

let db: Firestore;

const COLORS = {
  fob: "#0d9488", // teal-600
  importTax: "#f97316", // orange-500
  serviceTax: "#8b5cf6", // violet-500
  freight: "#3b82f6", // blue-500
};

const calculateKitCosts = (
  products: SaleProduct[],
  settings: GlobalSettings,
  productTypes: any[]
): CostAnalysis => {
  const analysis: CostAnalysis = {
    totalFOB_USD: 0,
    totalFOB_BRL: 0,
    hardwareCost: { baseBRL: 0, taxII_BRL: 0, taxIPI_BRL: 0, taxPIS_BRL: 0, taxCOFINS_BRL: 0, taxICMS_BRL: 0, totalTaxes: 0 },
    softwareCost: { baseBRL: 0, taxIRRF_BRL: 0, taxPIS_BRL: 0, taxCOFINS_BRL: 0, taxIOF_BRL: 0, taxISS_BRL: 0, totalTaxes: 0 },
    expenseCost: { taxaSiscomex: 0, freteInternacional: 0, swiftFee: 0, totalExpenses: 0 },
    totalTaxesBRL: 0,
    totalFreightAndExpensesBRL: 0,
  };

  let hasHardware = false;

  products.forEach((p) => {
    const typeName = productTypes.find(pt => pt.id === p.productTypeId)?.name.toLowerCase() || "";
    const isHardware = typeName.includes("hardware") || typeName.includes("accessory");
    const isSoftware = typeName.includes("software");
    const costUSD = p.costUSD || 0;
    const costBRL = costUSD * settings.exchangeRateUSD;

    analysis.totalFOB_USD += costUSD;
    analysis.totalFOB_BRL += costBRL;

    if (isHardware) {
        hasHardware = true;
        const baseHw = costBRL;
        analysis.hardwareCost.baseBRL += baseHw;

        const taxII = baseHw * settings.hardware_importTaxII;
        const baseIPI = baseHw + taxII;
        const taxIPI = baseIPI * settings.hardware_ipiTax;
        
        const basePisCofins = baseHw;
        const taxPIS = basePisCofins * settings.hardware_pisTax;
        const taxCOFINS = basePisCofins * settings.hardware_cofinsTax;

        const baseICMS = (baseHw + taxII + taxIPI + taxPIS + taxCOFINS) / (1 - settings.hardware_icmsTax);
        const taxICMS = baseICMS * settings.hardware_icmsTax;
        
        analysis.hardwareCost.taxII_BRL += taxII;
        analysis.hardwareCost.taxIPI_BRL += taxIPI;
        analysis.hardwareCost.taxPIS_BRL += taxPIS;
        analysis.hardwareCost.taxCOFINS_BRL += taxCOFINS;
        analysis.hardwareCost.taxICMS_BRL += taxICMS;
    }

    if (isSoftware) {
        const baseSw = costBRL;
        analysis.softwareCost.baseBRL += baseSw;

        const baseIRRF = baseSw / (1 - settings.software_irpjTax);
        const taxIRRF = baseIRRF - baseSw;
        
        const taxPIS = baseSw * settings.software_pisTax;
        const taxCOFINS = baseSw * settings.software_cofinsTax;
        const taxIOF = baseSw * settings.software_iofTax;
        const taxISS = baseSw * settings.software_issTax;

        analysis.softwareCost.taxIRRF_BRL += taxIRRF;
        analysis.softwareCost.taxPIS_BRL += taxPIS;
        analysis.softwareCost.taxCOFINS_BRL += taxCOFINS;
        analysis.softwareCost.taxIOF_BRL += taxIOF;
        analysis.softwareCost.taxISS_BRL += taxISS;
    }
  });

  if (hasHardware) {
    analysis.expenseCost.taxaSiscomex = settings.taxaSiscomex;
    analysis.expenseCost.freteInternacional = settings.freightCostUSD * settings.exchangeRateUSD;
  }
  if (analysis.softwareCost.baseBRL > 0) {
    analysis.expenseCost.swiftFee = settings.swiftFee;
  }

  analysis.hardwareCost.totalTaxes = analysis.hardwareCost.taxII_BRL + analysis.hardwareCost.taxIPI_BRL + analysis.hardwareCost.taxPIS_BRL + analysis.hardwareCost.taxCOFINS_BRL + analysis.hardwareCost.taxICMS_BRL;
  analysis.softwareCost.totalTaxes = analysis.softwareCost.taxIRRF_BRL + analysis.softwareCost.taxPIS_BRL + analysis.softwareCost.taxCOFINS_BRL + analysis.softwareCost.taxIOF_BRL + analysis.softwareCost.taxISS_BRL;
  analysis.expenseCost.totalExpenses = analysis.expenseCost.taxaSiscomex + analysis.expenseCost.freteInternacional + analysis.expenseCost.swiftFee;
  
  analysis.totalTaxesBRL = analysis.hardwareCost.totalTaxes + analysis.softwareCost.totalTaxes;
  analysis.totalFreightAndExpensesBRL = analysis.expenseCost.totalExpenses;

  return analysis;
};

export function KitBuilderForm() {
  const { toast } = useToast();
  const { products, categories, productTypes, getCategoryNameById, globalSettings } = useAppContext();

  const [kitName, setKitName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<SaleProduct[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    const { db: firestoreDb } = initializeFirebase();
    db = firestoreDb;
  }, []);

  const costAnalysis = useMemo(
    () => calculateKitCosts(selectedProducts, globalSettings, productTypes),
    [selectedProducts, globalSettings, productTypes]
  );
  
  const totalLandedCostBRL = costAnalysis.totalFOB_BRL + costAnalysis.totalTaxesBRL + costAnalysis.totalFreightAndExpensesBRL;

  const chartData = useMemo(() => [
    { name: "Mercadoria (FOB)", value: costAnalysis.totalFOB_BRL, color: COLORS.fob },
    { name: "Impostos Importação", value: costAnalysis.hardwareCost.totalTaxes, color: COLORS.importTax },
    { name: "Impostos Serviço", value: costAnalysis.softwareCost.totalTaxes, color: COLORS.serviceTax },
    { name: "Frete & Despesas", value: costAnalysis.totalFreightAndExpensesBRL, color: COLORS.freight },
  ].filter(item => item.value > 0), [costAnalysis]);

  const handleSaveKit = async () => {
    if (!kitName.trim()) {
      toast({ title: "Atenção", description: "Por favor, dê um nome ao kit.", variant: "destructive" });
      return;
    }
    if (selectedProducts.length === 0) {
      toast({ title: "Atenção", description: "Selecione pelo menos um produto para o kit.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, "product_kits"), {
        name: kitName,
        items: selectedProducts,
        costAnalysis,
        totalLandedCostBRL,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Kit Salvo!", description: `O kit "${kitName}" foi salvo com sucesso.` });
      setKitName("");
      setSelectedProducts([]);
    } catch (error) {
      console.error("Erro ao salvar kit:", error);
      toast({ title: "Erro", description: "Não foi possível salvar o kit.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const visibleProducts = useMemo(() => {
    return searchQuery
      ? products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : products;
  }, [products, searchQuery]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, SaleProduct[]> = {};
    visibleProducts.forEach((product) => {
      const catId = product.categoryId || 'uncategorized';
      if (!groups[catId]) groups[catId] = [];
      groups[catId].push(product);
    });
    return groups;
  }, [visibleProducts]);

  const toggleProductSelection = (product: SaleProduct) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      return exists ? prev.filter(p => p.id !== product.id) : [...prev, product];
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Coluna Esquerda: Seleção de Produtos */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>1. Selecione os Itens do Kit</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input 
                        placeholder="Buscar produtos..." 
                        className="pl-9" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </CardContent>
        </Card>

        <ScrollArea className="h-[60vh] rounded-md">
          <div className="space-y-2 pr-4">
            {Object.entries(groupedProducts).map(([catId, items]) => (
              <Card key={catId} className="overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 border-b font-medium text-sm">
                  {getCategoryNameById(catId)}
                </div>
                <Table>
                  <TableBody>
                    {items.map(product => {
                      const isSelected = selectedProducts.some(p => p.id === product.id);
                      return (
                        <TableRow 
                          key={product.id} 
                          onClick={() => toggleProductSelection(product)}
                          className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted/50'}`}
                        >
                          <TableCell className="w-8">
                            <div className={`w-4 h-4 border rounded flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300 bg-white'}`}>
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-gray-800 text-sm py-2">{product.name}</TableCell>
                          <TableCell className="text-right font-mono text-gray-500 text-xs py-2">{formatCurrency(product.costUSD, 'USD')}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Coluna Direita: Dashboard de Análise */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>2. Nomeie e Analise o Kit</CardTitle>
          </CardHeader>
          <CardContent>
            <Input 
              placeholder="Ex: Kit Completo UTS-500 com Acessórios" 
              value={kitName}
              onChange={(e) => setKitName(e.target.value)}
              className="text-lg font-medium"
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-800 text-white">
                 <CardHeader className="pb-2">
                    <CardTitle className="text-base font-normal text-slate-400 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> Custo Total FOB
                    </CardTitle>
                 </CardHeader>
                 <CardContent>
                    <p className="text-4xl font-bold tracking-tight">{formatCurrency(costAnalysis.totalFOB_USD, 'USD')}</p>
                 </CardContent>
            </Card>
            <Card className="bg-primary text-primary-foreground">
                 <CardHeader className="pb-2">
                    <CardTitle className="text-base font-normal text-primary-foreground/80 flex items-center gap-2">
                        <Calculator className="w-4 h-4" /> Custo Final Nacionalizado
                    </CardTitle>
                 </CardHeader>
                 <CardContent>
                    <p className="text-4xl font-bold tracking-tight">{formatCurrency(totalLandedCostBRL)}</p>
                 </CardContent>
            </Card>
        </div>
        

        <Card>
            <CardHeader>
                <CardTitle>Composição do Custo</CardTitle>
                <CardDescription>Distribuição dos custos totais do kit.</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] w-full">
                <ResponsiveContainer>
                    <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const percentage = totalLandedCostBRL > 0 ? (data.value / totalLandedCostBRL) * 100 : 0;
                            return (
                                <div className="bg-background/90 p-2 border rounded-md shadow-lg text-sm">
                                <p className="font-bold">{data.name}</p>
                                <p>{formatCurrency(data.value)} ({percentage.toFixed(1)}%)</p>
                                </div>
                            );
                        }
                        return null;
                    }} />
                    <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Detalhamento dos Impostos e Despesas</CardTitle>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="hardware">
                        <AccordionTrigger>Impostos de Importação (Hardware)</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-1 text-sm">
                                <DetailRow label="II" value={costAnalysis.hardwareCost.taxII_BRL} />
                                <DetailRow label="IPI" value={costAnalysis.hardwareCost.taxIPI_BRL} />
                                <DetailRow label="PIS" value={costAnalysis.hardwareCost.taxPIS_BRL} />
                                <DetailRow label="COFINS" value={costAnalysis.hardwareCost.taxCOFINS_BRL} />
                                <DetailRow label="ICMS" value={costAnalysis.hardwareCost.taxICMS_BRL} />
                                <Separator className="my-2" />
                                <DetailRow label="Total (Hardware)" value={costAnalysis.hardwareCost.totalTaxes} isTotal />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="software">
                        <AccordionTrigger>Impostos sobre Serviço (Software)</AccordionTrigger>
                        <AccordionContent>
                             <div className="space-y-1 text-sm">
                                <DetailRow label="IRRF (Gross-up)" value={costAnalysis.softwareCost.taxIRRF_BRL} />
                                <DetailRow label="PIS" value={costAnalysis.softwareCost.taxPIS_BRL} />
                                <DetailRow label="COFINS" value={costAnalysis.softwareCost.taxCOFINS_BRL} />
                                <DetailRow label="IOF Câmbio" value={costAnalysis.softwareCost.taxIOF_BRL} />
                                <DetailRow label="ISS" value={costAnalysis.softwareCost.taxISS_BRL} />
                                <Separator className="my-2" />
                                <DetailRow label="Total (Software)" value={costAnalysis.softwareCost.totalTaxes} isTotal />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="expenses">
                        <AccordionTrigger>Frete e Despesas Aduaneiras</AccordionTrigger>
                        <AccordionContent>
                             <div className="space-y-1 text-sm">
                                <DetailRow label="Frete Internacional" value={costAnalysis.expenseCost.freteInternacional} />
                                <DetailRow label="Taxa Siscomex" value={costAnalysis.expenseCost.taxaSiscomex} />
                                <DetailRow label="Taxa Swift (Remessa)" value={costAnalysis.expenseCost.swiftFee} />
                                 <Separator className="my-2" />
                                <DetailRow label="Total Despesas" value={costAnalysis.expenseCost.totalExpenses} isTotal />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>

        <div className="flex justify-end">
            <Button size="lg" onClick={handleSaveKit} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-5 h-5 mr-2" />}
                Salvar Kit
            </Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, isTotal=false }: {label:string, value: number, isTotal?:boolean}) {
    return (
        <div className={`flex justify-between p-2 rounded-md ${isTotal ? 'bg-muted font-bold' : ''}`}>
            <span>{label}</span>
            <span className="font-mono">{formatCurrency(value)}</span>
        </div>
    )
}

    