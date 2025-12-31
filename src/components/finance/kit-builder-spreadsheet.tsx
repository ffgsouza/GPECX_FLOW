
"use client";

import { useState, useMemo, useEffect } from "react";
import { Save, Search, Check, Loader2, DollarSign, Trash2, Pencil, Package, X } from "lucide-react";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot, 
  type Firestore 
} from "firebase/firestore";
import { format } from "date-fns";

import { initializeFirebase } from "@/firebase";
import { useAppContext } from "@/context/app-context";
import { SaleProduct, ProductKit } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from "recharts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "../ui/separator";

let db: Firestore;

// Estilos visuais da planilha
const HEADER_STYLE = "bg-[#70ad47] text-white font-bold uppercase text-xs"; // Verde Planilha
const TOTAL_STYLE = "bg-[#ffff00] font-bold text-black"; // Amarelo Planilha
const SECTION_BORDER = "border border-gray-300";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 border bg-background rounded-lg shadow-lg">
                <p className="font-bold">{`${payload[0].name}`}</p>
                <p className="text-sm">{`${formatCurrency(payload[0].value, 'BRL')} (${(payload[0].percent * 100).toFixed(1)}%)`}</p>
            </div>
        );
    }
    return null;
};

export function KitBuilderSpreadsheet() {
  const { products, productTypes, globalSettings } = useAppContext();
  const { toast } = useToast();

  // --- ESTADOS ---
  const [editingKitId, setEditingKitId] = useState<string | null>(null);
  const [kitName, setKitName] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<SaleProduct[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedKits, setSavedKits] = useState<ProductKit[]>([]);
  const [isLoadingKits, setIsLoadingKits] = useState(true);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState("");

  // --- PARÂMETROS VARIÁVEIS (Inputs da Planilha) ---
  const [dolarRate, setDolarRate] = useState(globalSettings.exchangeRateUSD);
  const [freteIntHardwareUSD, setFreteIntHardwareUSD] = useState(globalSettings.freightCostUSD);
  
  // --- CARREGAR DADOS ---
  useEffect(() => {
    const { db: firestoreDb } = initializeFirebase();
    db = firestoreDb;
    
    const qKits = query(collection(db, "product_kits"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(qKits, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ProductKit[];
        setSavedKits(data);
        setIsLoadingKits(false);
    }, (error) => {
        console.error("Erro ao carregar kits salvos: ", error);
        toast({ title: "Erro ao buscar kits", variant: "destructive" });
        setIsLoadingKits(false);
    });

    return () => unsubscribe();
  }, [toast]);

  // --- SELEÇÃO DE PRODUTOS ---
  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const toggleProduct = (product: SaleProduct) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      return exists ? prev.filter(p => p.id !== product.id) : [...prev, product];
    });
  };

  // --- ENGINE DE CÁLCULO (CORE) ---
  const calc = useMemo(() => {
    let fobHwUSD = 0;
    let fobSwUSD = 0;

    selectedProducts.forEach(p => {
      const typeName = productTypes.find(t => t.id === p.productTypeId)?.name.toLowerCase() || "";
      if (typeName.includes("hardware") || typeName.includes("acess") || p.ncm) {
        fobHwUSD += (p.costUSD || 0);
      } else {
        fobSwUSD += (p.costUSD || 0);
      }
    });

    const hasHardware = fobHwUSD > 0;
    const hasSoftware = fobSwUSD > 0;

    // 1. DESPESAS ADUANEIRAS
    const desconsolidacaoBRL = globalSettings.desconsolidacaoUSD * dolarRate;
    const totalDespesasAduaneiras = 
      globalSettings.customsClearanceFee +
      globalSettings.technicalConsultingFee +
      globalSettings.storageFee +
      globalSettings.freteInternacionalTerceiro +
      globalSettings.freteTerceirosDA +
      (hasHardware ? desconsolidacaoBRL : 0);

    // 2. HARDWARE: MERCADORIA + FRETE
    const freteHwUSD = hasHardware ? freteIntHardwareUSD : 0;
    const baseHwUSD = fobHwUSD + freteHwUSD;
    const baseHwBRL = baseHwUSD * dolarRate;

    // 3. IMPOSTOS HARDWARE
    const valII = baseHwBRL * globalSettings.hardware_importTaxII;
    const valIPI = baseHwBRL * globalSettings.hardware_ipiTax;
    const valPIS = baseHwBRL * globalSettings.hardware_pisTax;
    const valCOFINS = baseHwBRL * globalSettings.hardware_cofinsTax;
    const valSiscomex = hasHardware ? globalSettings.taxaSiscomex : 0;

    const basePreICMS = baseHwBRL + valII + valIPI + valPIS + valCOFINS + valSiscomex + totalDespesasAduaneiras;
    const divisorICMS = 1 - globalSettings.hardware_icmsTax;
    const baseICMS = divisorICMS > 0 ? basePreICMS / divisorICMS : basePreICMS;
    const valICMS = baseICMS * globalSettings.hardware_icmsTax;

    const totalImpostosHw = valII + valIPI + valPIS + valCOFINS + valICMS + valSiscomex;
    const totalHwFinal = baseHwBRL + totalImpostosHw;

    // 4. SOFTWARE: MERCADORIA
    const baseSwBRL = fobSwUSD * dolarRate;

    // 5. IMPOSTOS SOFTWARE
    const baseIRRF = baseSwBRL / (1 - globalSettings.software_irpjTax);
    const valIRRF = baseIRRF - baseSwBRL;
    const valPIS_Sw = baseSwBRL * globalSettings.software_pisTax;
    const valCOFINS_Sw = baseSwBRL * globalSettings.software_cofinsTax;
    const valIOF = baseSwBRL * globalSettings.software_iofTax;
    const valISS = baseSwBRL * globalSettings.software_issTax;
    const valSwift = hasSoftware ? globalSettings.swiftFee : 0;

    const totalImpostosSw = valIRRF + valPIS_Sw + valCOFINS_Sw + valIOF + valISS + valSwift;
    const totalSwFinal = baseSwBRL + totalImpostosSw;

    // 6. TOTAL GERAL
    const totalGeral = totalDespesasAduaneiras + totalHwFinal + totalSwFinal;

    const chartData = [
        { name: 'Mercadoria HW', value: baseHwBRL },
        { name: 'Mercadoria SW', value: baseSwBRL },
        { name: 'Impostos HW', value: totalImpostosHw },
        { name: 'Impostos SW', value: totalImpostosSw },
        { name: 'Despesas Aduaneiras', value: totalDespesasAduaneiras },
    ].filter(item => item.value > 0);


    return {
      fobHwUSD, freteHwUSD, baseHwBRL,
      fobSwUSD, baseSwBRL,
      totalDespesasAduaneiras, desconsolidacaoBRL,
      impostosHw: { valII, valIPI, valPIS, valCOFINS, valICMS, valSiscomex, total: totalImpostosHw },
      impostosSw: { valIRRF, valPIS: valPIS_Sw, valCOFINS: valCOFINS_Sw, valIOF, valISS, valSwift, total: totalImpostosSw },
      totalHwFinal,
      totalSwFinal,
      totalGeral,
      chartData
    };
  }, [selectedProducts, dolarRate, freteIntHardwareUSD, globalSettings, productTypes]);

  // --- SAVE / UPDATE ---
  const handleSave = async () => {
    if (!kitName) {
      toast({ title: "Atenção", description: "Dê um nome ao Kit.", variant: "destructive" });
      return;
    }
    if(selectedProducts.length === 0) {
      toast({ title: "Atenção", description: "Selecione ao menos um produto.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave: Omit<ProductKit, 'id'> = {
        name: kitName,
        items: selectedProducts.map(p => ({ id: p.id, name: p.name, costUSD: p.costUSD, productTypeId: p.productTypeId })),
        calculation: {
            fobHwUSD: calc.fobHwUSD,
            fobSwUSD: calc.fobSwUSD,
            totalGeral: calc.totalGeral,
        },
        createdAt: editingKitId ? (savedKits.find(k => k.id === editingKitId)?.createdAt || Date.now()) : Date.now()
      }

      if (editingKitId) {
        await updateDoc(doc(db, "product_kits", editingKitId), dataToSave);
        toast({ title: "Sucesso!", description: `O kit "${kitName}" foi atualizado.` });
      } else {
        await addDoc(collection(db, "product_kits"), dataToSave);
        toast({ title: "Sucesso!", description: `O kit "${kitName}" foi salvo.` });
      }
      
      handleCancelEdit();
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar o kit.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  // --- DELETE ---
  const handleDelete = async (kitId: string) => {
    try {
        await deleteDoc(doc(db, "product_kits", kitId));
        toast({ title: "Kit Excluído", description: "O kit foi removido com sucesso." });
    } catch (error) {
        toast({ title: "Erro", description: "Não foi possível excluir o kit.", variant: "destructive" });
    }
  };

  // --- EDIT ---
  const handleEdit = (kit: ProductKit) => {
    setEditingKitId(kit.id);
    setKitName(kit.name);
    
    const productsInKit = kit.items.map(item => {
        return products.find(p => p.id === item.id);
    }).filter((p): p is SaleProduct => p !== undefined);
    
    setSelectedProducts(productsInKit);
  };
  
  const handleCancelEdit = () => {
    setEditingKitId(null);
    setKitName("");
    setSelectedProducts([]);
  }

  return (
    <div className="space-y-6 pb-20">
      
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader>
            <CardTitle>{editingKitId ? "Editando Kit" : "Criar Novo Kit"}</CardTitle>
            <CardDescription>Monte um conjunto de produtos, configure as variáveis e salve-o para uso futuro na Calculadora de Venda.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-bold text-slate-700">Nome do Kit / Projeto</label>
              <Input 
                value={kitName} 
                onChange={e => setKitName(e.target.value)} 
                placeholder="Ex: Kit UTS 600 - Completo" 
                className="bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Dólar (PTAX)</label>
              <div className="relative">
                <span className="absolute left-2 top-2 text-xs">R$</span>
                <Input 
                  type="number" 
                  value={dolarRate} 
                  onChange={e => setDolarRate(Number(e.target.value))} 
                  className="w-24 pl-6 bg-white"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Frete Int. (USD)</label>
              <div className="relative">
                <span className="absolute left-2 top-2 text-xs">$</span>
                <Input 
                  type="number" 
                  value={freteIntHardwareUSD} 
                  onChange={e => setFreteIntHardwareUSD(Number(e.target.value))} 
                  className="w-24 pl-6 bg-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
                {editingKitId && (
                    <Button variant="ghost" onClick={handleCancelEdit}>
                        <X className="w-4 h-4 mr-2" /> Cancelar Edição
                    </Button>
                )}
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2" />}
                  {editingKitId ? "Salvar Alterações" : "Salvar Novo Kit"}
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Card className="h-full border-slate-200 shadow-sm">
            <CardHeader className="py-3 bg-slate-100 border-b">
              <CardTitle className="text-sm font-bold text-slate-700">Catálogo de Itens</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-2 bg-white border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Filtrar..." 
                    className="pl-8 h-9 text-sm bg-slate-50"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                <Table>
                  <TableBody>
                    {filteredProducts.map(p => {
                      const isSelected = selectedProducts.some(s => s.id === p.id);
                      return (
                        <TableRow 
                          key={p.id} 
                          onClick={() => toggleProduct(p)}
                          className={`cursor-pointer ${isSelected ? 'bg-primary/10' : 'hover:bg-slate-50'}`}
                        >
                          <TableCell className="w-[30px] py-2">
                            <div className={`w-4 h-4 border rounded flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-white' : 'border-slate-300'}`}>
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="font-medium text-xs text-slate-800">{p.name}</div>
                            <div className="text-[10px] text-slate-500">USD {p.costUSD}</div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Custo FOB Kit (USD)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(calc.fobHwUSD + calc.fobSwUSD, 'USD')}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Preço Base HW (BRL)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(calc.baseHwBRL, 'BRL')}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Preço Base SW (BRL)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(calc.baseSwBRL, 'BRL')}</div>
                </CardContent>
            </Card>
             <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-primary">Custo Final Kit (BRL)</CardTitle>
                    <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-primary">{formatCurrency(calc.totalGeral, 'BRL')}</div>
                </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Composição de Custos</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={calc.chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                return (
                                    <text x={x} y={y} fill="black" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs">
                                        {`${(percent * 100).toFixed(1)}%`}
                                    </text>
                                );
                            }}
                        >
                            {calc.chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className={`rounded-md overflow-hidden ${SECTION_BORDER} shadow-sm`}>
            <div className={`p-1.5 text-center ${HEADER_STYLE}`}>Despesas Aduaneiras</div>
            <Table>
              <TableBody className="text-xs">
                 <TableRow className="border-b hover:bg-transparent"><TableCell className="py-1">Desembaraço</TableCell><TableCell className="py-1 text-center">R$</TableCell><TableCell className="py-1 text-right">{formatCurrency(globalSettings.customsClearanceFee)}</TableCell></TableRow>
                 <TableRow className="border-b hover:bg-transparent"><TableCell className="py-1">Armazenagem Aeroporto</TableCell><TableCell className="py-1 text-center">R$</TableCell><TableCell className="py-1 text-right">{formatCurrency(globalSettings.storageFee)}</TableCell></TableRow>
                 <TableRow className="border-b hover:bg-transparent"><TableCell className="py-1">Assessoria Técnica</TableCell><TableCell className="py-1 text-center">R$</TableCell><TableCell className="py-1 text-right">{formatCurrency(globalSettings.technicalConsultingFee)}</TableCell></TableRow>
                 <TableRow className="border-b hover:bg-transparent"><TableCell className="py-1">Desconsolidação ({formatCurrency(globalSettings.desconsolidacaoUSD, 'USD')})</TableCell><TableCell className="py-1 text-center">R$</TableCell><TableCell className="py-1 text-right">{formatCurrency(calc.desconsolidacaoBRL)}</TableCell></TableRow>
                <TableRow className={TOTAL_STYLE}>
                  <TableCell colSpan={2} className="py-1.5">TOTAL</TableCell>
                  <TableCell className="py-1.5 text-right">{formatCurrency(calc.totalDespesasAduaneiras)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <div className={`rounded-md overflow-hidden ${SECTION_BORDER} shadow-sm`}>
                <div className={`p-1.5 text-center ${HEADER_STYLE}`}>Mercadoria Hardware</div>
                <Table>
                  <TableBody className="text-xs">
                    <TableRow className="border-b hover:bg-transparent"><TableCell className="py-1">Mercadoria (FOB)</TableCell><TableCell className="py-1 text-center">USD</TableCell><TableCell className="py-1 text-right">{calc.fobHwUSD.toFixed(2)}</TableCell></TableRow>
                    <TableRow className="border-b hover:bg-transparent"><TableCell className="py-1">Frete Internacional</TableCell><TableCell className="py-1 text-center">USD</TableCell><TableCell className="py-1 text-right text-red-600 font-bold">{calc.freteHwUSD.toFixed(2)}</TableCell></TableRow>
                    <TableRow className={TOTAL_STYLE}>
                      <TableCell colSpan={2} className="py-1.5">TOTAL (R$)</TableCell>
                      <TableCell className="py-1.5 text-right">{formatCurrency(calc.baseHwBRL)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className={`rounded-md overflow-hidden ${SECTION_BORDER} shadow-sm`}>
                <div className={`p-1.5 text-center ${HEADER_STYLE}`}>Impostos (Hardware)</div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100 hover:bg-gray-100 border-b"><TableHead className="h-6 py-1 text-[10px] font-bold text-black">Descrição</TableHead><TableHead className="h-6 py-1 text-[10px] text-center font-bold text-black">%</TableHead><TableHead className="h-6 py-1 text-[10px] text-right font-bold text-black">Valor</TableHead></TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    <TableRow className="border-b hover:bg-transparent"><TableCell className="py-1">II</TableCell><TableCell className="py-1 text-center">{(globalSettings.hardware_importTaxII * 100).toFixed(2)}%</TableCell><TableCell className="py-1 text-right">{formatCurrency(calc.impostosHw.valII)}</TableCell></TableRow>
                    <TableRow className="border-b hover:bg-transparent"><TableCell className="py-1">IPI</TableCell><TableCell className="py-1 text-center">{(globalSettings.hardware_ipiTax * 100).toFixed(2)}%</TableCell><TableCell className="py-1 text-right">{formatCurrency(calc.impostosHw.valIPI)}</TableCell></TableRow>
                    <TableRow className="border-b hover:bg-transparent"><TableCell className="py-1">PIS</TableCell><TableCell className="py-1 text-center">{(globalSettings.hardware_pisTax * 100).toFixed(2)}%</TableCell><TableCell className="py-1 text-right">{formatCurrency(calc.impostosHw.valPIS)}</TableCell></TableRow>
                    <TableRow className="border-b hover:bg-transparent"><TableCell className="py-1">COFINS</TableCell><TableCell className="py-1 text-center">{(globalSettings.hardware_cofinsTax * 100).toFixed(2)}%</TableCell><TableCell className="py-1 text-right">{formatCurrency(calc.impostosHw.valCOFINS)}</TableCell></TableRow>
                    <TableRow className="border-b hover:bg-transparent"><TableCell className="py-1">ICMS</TableCell><TableCell className="py-1 text-center">{(globalSettings.hardware_icmsTax * 100).toFixed(2)}%</TableCell><TableCell className="py-1 text-right">{formatCurrency(calc.impostosHw.valICMS)}</TableCell></TableRow>
                    <TableRow className="border-b hover:bg-transparent"><TableCell className="py-1">Taxa Siscomex</TableCell><TableCell className="py-1 text-center">-</TableCell><TableCell className="py-1 text-right">{formatCurrency(calc.impostosHw.valSiscomex)}</TableCell></TableRow>
                    <TableRow className={TOTAL_STYLE}>
                      <TableCell colSpan={2} className="py-1.5">TOTAL</TableCell>
                      <TableCell className="py-1.5 text-right">{formatCurrency(calc.impostosHw.total)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="space-y-4">
              <div className={`rounded-md overflow-hidden ${SECTION_BORDER} shadow-sm`}>
                <div className={`p-1.5 text-center ${HEADER_STYLE}`}>Mercadoria Software</div>
                <Table>
                  <TableBody className="text-xs">
                    <TableRow className="border-b hover:bg-transparent"><TableCell className="py-1">Mercadoria (USD)</TableCell><TableCell className="py-1 text-right">{calc.fobSwUSD.toFixed(2)}</TableCell></TableRow>
                    <TableRow className="border-b hover:bg-transparent"><TableCell className="py-1 text-gray-400">Frete Internacional</TableCell><TableCell className="py-1 text-right text-gray-400">-</TableCell></TableRow>
                    <TableRow className={TOTAL_STYLE}>
                      <TableCell className="py-1.5">TOTAL (R$)</TableCell>
                      <TableCell className="py-1.5 text-right">{formatCurrency(calc.baseSwBRL)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className={`rounded-md overflow-hidden ${SECTION_BORDER} shadow-sm`}>
                <div className={`p-1.5 text-center ${HEADER_STYLE}`}>Impostos (Software)</div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100 hover:bg-gray-100 border-b"><TableHead className="h-6 py-1 text-[10px] font-bold text-black">Descrição</TableHead><TableHead className="h-6 py-1 text-[10px] text-center font-bold text-black">%</TableHead><TableHead className="h-6 py-1 text-[10px] text-right font-bold text-black">Valor</TableHead></TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    <TableRow className="border-b hover:bg-transparent"><TableCell className="py-1">IRPJ (Gross-Up)</TableCell><TableCell className="py-1 text-center">{(globalSettings.software_irpjTax * 100).toFixed(2)}%</TableCell><TableCell className="py-1 text-right">{formatCurrency(calc.impostosSw.valIRRF)}</TableCell></TableRow>
                    <TableRow className="border-b hover:bg-transparent"><TableCell className="py-1">PIS</TableCell><TableCell className="py-1 text-center">{(globalSettings.software_pisTax * 100).toFixed(2)}%</TableCell><TableCell className="py-1 text-right">{formatCurrency(calc.impostosSw.valPIS)}</TableCell></TableRow>
                    <TableRow className="border-b hover:bg-transparent"><TableCell className="py-1">COFINS</TableCell><TableCell className="py-1 text-center">{(globalSettings.software_cofinsTax * 100).toFixed(2)}%</TableCell><TableCell className="py-1 text-right">{formatCurrency(calc.impostosSw.valCOFINS)}</TableCell></TableRow>
                    <TableRow className="border-b hover:bg-transparent"><TableCell className="py-1">IOF</TableCell><TableCell className="py-1 text-center">{(globalSettings.software_iofTax * 100).toFixed(2)}%</TableCell><TableCell className="py-1 text-right">{formatCurrency(calc.impostosSw.valIOF)}</TableCell></TableRow>
                    <TableRow className="border-b hover:bg-transparent"><TableCell className="py-1">ISS</TableCell><TableCell className="py-1 text-center">{(globalSettings.software_issTax * 100).toFixed(2)}%</TableCell><TableCell className="py-1 text-right">{formatCurrency(calc.impostosSw.valISS)}</TableCell></TableRow>
                    <TableRow className="border-b hover:bg-transparent"><TableCell className="py-1">Taxa Swift</TableCell><TableCell className="py-1 text-center">-</TableCell><TableCell className="py-1 text-right">{formatCurrency(calc.impostosSw.valSwift)}</TableCell></TableRow>
                    <TableRow className={TOTAL_STYLE}>
                      <TableCell colSpan={2} className="py-1.5">TOTAL</TableCell>
                      <TableCell className="py-1.5 text-right">{formatCurrency(calc.impostosSw.total)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="border-2 border-black rounded-sm overflow-hidden">
            <Table>
              <TableBody className="font-bold text-sm">
                <TableRow className="bg-[#fff2cc] hover:bg-[#fff2cc] border-b border-black"><TableCell>TOTAL DESPESAS ADUANEIRAS</TableCell><TableCell className="text-right">{formatCurrency(calc.totalDespesasAduaneiras)}</TableCell></TableRow>
                <TableRow className="bg-[#fff2cc] hover:bg-[#fff2cc] border-b border-black"><TableCell>TOTAL HARDWARE (Mercadoria + Impostos)</TableCell><TableCell className="text-right">{formatCurrency(calc.totalHwFinal)}</TableCell></TableRow>
                <TableRow className="bg-[#fff2cc] hover:bg-[#fff2cc] border-b border-black"><TableCell>TOTAL SOFTWARE (Mercadoria + Impostos)</TableCell><TableCell className="text-right">{formatCurrency(calc.totalSwFinal)}</TableCell></TableRow>
                <TableRow className={`${TOTAL_STYLE} text-lg`}>
                  <TableCell>CUSTO TOTAL NACIONALIZADO (LANDED COST)</TableCell>
                  <TableCell className="text-right">{formatCurrency(calc.totalGeral)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

        </div>
      </div>
      
      <Separator className="my-8"/>

      <Card>
        <CardHeader>
          <CardTitle>Kits Salvos</CardTitle>
          <CardDescription>Gerencie os kits de produtos pré-calculados.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingKits ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : savedKits.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium text-muted-foreground">Nenhum kit salvo encontrado</h3>
                <p className="mt-1 text-sm text-muted-foreground">Monte e salve um kit para que ele apareça aqui.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Kit</TableHead>
                  <TableHead>Custo Total (BRL)</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedKits.map(kit => (
                  <TableRow key={kit.id}>
                    <TableCell className="font-medium">{kit.name}</TableCell>
                    <TableCell>{formatCurrency(kit.calculation.totalGeral, 'BRL')}</TableCell>
                    <TableCell>{format(new Date(kit.createdAt), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(kit)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o kit "{kit.name}".
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(kit.id)}>Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
