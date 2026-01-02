"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend 
} from "recharts";
import { Save, Search, Check, Calculator, FileCheck, History, AlertCircle, Loader2, Package, Pencil, Trash2, X } from "lucide-react";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc,
  deleteDoc,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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
import { Separator } from "@/components/ui/separator";

// Estilos visuais da planilha
const HEADER_STYLE = "bg-[#70ad47] text-white font-bold uppercase text-xs"; 
const TOTAL_STYLE = "bg-[#ffff00] font-bold text-black"; 
const SECTION_BORDER = "border border-gray-300";

let db: Firestore;

export default function CostSimulatorPage() {
  const { products, categories, productTypes, globalSettings } = useAppContext();
  const { toast } = useToast();

  // --- ESTADOS ---
  const [simulationName, setSimulationName] = useState("");
  const [saveType, setSaveType] = useState<"TEMPLATE" | "CUSTOM">("CUSTOM");
  const [selectedProducts, setSelectedProducts] = useState<SaleProduct[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingKitId, setEditingKitId] = useState<string | null>(null);

  // Estados para Gerenciamento
  const [savedKits, setSavedKits] = useState<ProductKit[]>([]);
  const [isLoadingKits, setIsLoadingKits] = useState(true);
  const [kitSearchQuery, setKitSearchQuery] = useState("");

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

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
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = filterCategory === "all" || p.categoryId === filterCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, filterCategory]);

  const toggleProduct = (product: SaleProduct) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      return exists ? prev.filter(p => p.id !== product.id) : [...prev, product];
    });
  };

  const filteredSavedKits = useMemo(() => {
    if (!kitSearchQuery) return savedKits;
    return savedKits.filter(kit => kit.name.toLowerCase().includes(kitSearchQuery.toLowerCase()));
  }, [savedKits, kitSearchQuery]);

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

    // Despesas Aduaneiras
    const desconsolidacaoBRL = globalSettings.desconsolidacaoUSD * dolarRate;
    const totalDespesasAduaneiras = 
      globalSettings.customsClearanceFee +
      globalSettings.technicalConsultingFee +
      globalSettings.storageFee +
      globalSettings.freteInternacionalTerceiro +
      globalSettings.freteTerceirosDA +
      (hasHardware ? desconsolidacaoBRL : 0);

    // Hardware
    const freteHwUSD = hasHardware ? freteIntHardwareUSD : 0;
    const baseHwUSD = fobHwUSD + freteHwUSD;
    const baseHwBRL = baseHwUSD * dolarRate;

    const valII = baseHwBRL * globalSettings.hardware_importTaxII;
    const valIPI = baseHwBRL * globalSettings.hardware_ipiTax;
    const valPIS = baseHwBRL * globalSettings.hardware_pisTax;
    const valCOFINS = baseHwBRL * globalSettings.hardware_cofinsTax;
    const valSiscomex = hasHardware ? globalSettings.taxaSiscomex : 0;
    
    const impostosFederais = valII + valIPI + valPIS + valCOFINS + valSiscomex;

    const basePreICMS = baseHwBRL + impostosFederais + totalDespesasAduaneiras;
    const divisorICMS = 1 - globalSettings.hardware_icmsTax;
    const baseICMS = divisorICMS > 0 ? basePreICMS / divisorICMS : basePreICMS;
    const valICMS = baseICMS * globalSettings.hardware_icmsTax;

    const totalImpostosHw = impostosFederais + valICMS;
    const totalHwFinal = baseHwBRL + totalImpostosHw;

    // Software
    const baseSwBRL = fobSwUSD * dolarRate;
    const baseIRRF = baseSwBRL / (1 - globalSettings.software_irpjTax);
    const valIRRF = baseIRRF - baseSwBRL;
    const valPIS_Sw = baseSwBRL * globalSettings.software_pisTax;
    const valCOFINS_Sw = baseSwBRL * globalSettings.software_cofinsTax;
    const valIOF = baseSwBRL * globalSettings.software_iofTax;
    const valISS = baseSwBRL * globalSettings.software_issTax;
    const valSwift = hasSoftware ? globalSettings.swiftFee : 0;

    const totalImpostosSw = valIRRF + valPIS_Sw + valCOFINS_Sw + valIOF + valISS + valSwift;
    const totalSwFinal = baseSwBRL + totalImpostosSw;

    const totalGeral = totalDespesasAduaneiras + totalHwFinal + totalSwFinal;

    return {
      fobHwUSD, freteHwUSD, baseHwBRL,
      fobSwUSD, baseSwBRL,
      totalDespesasAduaneiras, desconsolidacaoBRL,
      impostosHw: { valII, valIPI, valPIS, valCOFINS, valICMS, valSiscomex, total: totalImpostosHw },
      impostosSw: { valIRRF, valPIS: valPIS_Sw, valCOFINS: valCOFINS_Sw, valIOF, valISS, valSwift, total: totalImpostosSw },
      totalHwFinal, totalSwFinal, totalGeral
    };
  }, [selectedProducts, dolarRate, freteIntHardwareUSD, globalSettings, productTypes]);

  // --- GERENCIAMENTO (SAVE / UPDATE / DELETE) ---
  const handleSave = async () => {
    if (!simulationName) {
        toast({ title: "Atenção", description: "Dê um nome para esta simulação ou kit.", variant: "destructive"});
        return;
    }
    setIsSaving(true);
    try {
       const dataToSave: Omit<ProductKit, 'id' | 'createdAt'> & { createdAt?: number } = {
        name: simulationName,
        items: selectedProducts.map(p => ({ id: p.id, name: p.name, costUSD: p.costUSD, productTypeId: p.productTypeId })),
        calculation: {
            fobHwUSD: calc.fobHwUSD,
            fobSwUSD: calc.fobSwUSD,
            totalGeral: calc.totalGeral,
        },
        type: saveType,
      }

      if (editingKitId) {
        await updateDoc(doc(db, "product_kits", editingKitId), dataToSave);
        toast({ title: "Sucesso!", description: `O kit "${simulationName}" foi atualizado.` });
      } else {
        dataToSave.createdAt = Date.now();
        await addDoc(collection(db, "product_kits"), dataToSave);
        toast({ title: "Sucesso!", description: saveType === "TEMPLATE" ? "Kit Padrão criado com sucesso!" : "Simulação salva no histórico!" });
      }
      handleCancelEdit();
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar os dados.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (kit: ProductKit) => {
    setEditingKitId(kit.id);
    setSimulationName(kit.name);
    setSaveType(kit.type);
    
    const productsInKit = kit.items.map(item => {
        return products.find(p => p.id === item.id);
    }).filter((p): p is SaleProduct => p !== undefined);
    
    setSelectedProducts(productsInKit);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancelEdit = () => {
    setEditingKitId(null);
    setSimulationName("");
    setSelectedProducts([]);
    setSaveType("CUSTOM");
  }

  const handleDelete = async (kitId: string) => {
    try {
        await deleteDoc(doc(db, "product_kits", kitId));
        toast({ title: "Kit Excluído", description: "O kit foi removido com sucesso." });
    } catch (error) {
        toast({ title: "Erro", description: "Não foi possível excluir o kit.", variant: "destructive" });
    }
  };


  return (
    <div className="space-y-6 pb-20">
      
      {/* HEADER & PARÂMETROS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Simulador de Custos (Engenharia)</h1>
          <p className="text-sm text-gray-500">
            Analise a viabilidade de importação e crie Padrões (Templates) para o Comercial.
          </p>
        </div>
      </div>

      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            
            <div className="md:col-span-4 space-y-2">
              <label className="text-sm font-bold text-slate-700">Nome do Kit / Simulação</label>
              <Input 
                value={simulationName} 
                onChange={e => setSimulationName(e.target.value)} 
                placeholder="Ex: Kit Subestação 500 Completo" 
                className="bg-white"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Dólar (PTAX)</label>
              <Input type="number" value={dolarRate} onChange={e => setDolarRate(Number(e.target.value))} className="bg-white" />
            </div>

            <div className="md:col-span-4 bg-white p-3 rounded border border-slate-200">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Finalidade</label>
              <RadioGroup value={saveType} onValueChange={(v: "TEMPLATE" | "CUSTOM") => setSaveType(v)} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="TEMPLATE" id="r-template" />
                  <Label htmlFor="r-template" className="cursor-pointer flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    Criar Padrão (Vendas)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CUSTOM" id="r-custom" />
                  <Label htmlFor="r-custom" className="cursor-pointer flex items-center gap-1.5">
                    <History className="w-4 h-4 text-blue-600" />
                    Apenas Simular
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="md:col-span-2 flex gap-2">
              {editingKitId && (
                  <Button variant="ghost" onClick={handleCancelEdit} className="w-full">
                      <X className="w-4 h-4 mr-2" /> Cancelar
                  </Button>
              )}
              <Button onClick={handleSave} disabled={isSaving || selectedProducts.length === 0} className="w-full bg-primary hover:bg-primary/90 font-bold">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                <span className="ml-2">{editingKitId ? "Salvar" : "Salvar"}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {saveType === "TEMPLATE" && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-900">
          <FileCheck className="h-4 w-4" />
          <AlertTitle>Modo: Padrão de Venda</AlertTitle>
          <AlertDescription>
            Este Kit ficará visível para todos os vendedores na tela de Proposta Comercial. Use para produtos oficiais.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-12 gap-6">
        
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Card className="h-full border-slate-200 shadow-sm">
            <CardHeader className="py-3 bg-slate-100 border-b">
              <CardTitle className="text-sm font-bold text-slate-700">Adicionar Itens</CardTitle>
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
                            <div className="font-medium text-xs text-slate-700">{p.name}</div>
                            <div className="text-[10px] text-slate-400">USD {p.costUSD}</div>
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
                  <div className={`p-1.5 text-center ${HEADER_STYLE}`}>Hardware + Impostos</div>
                  <Table>
                    <TableBody className="text-xs">
                       <TableRow className="border-b"><TableCell className="py-1">Mercadoria (FOB)</TableCell><TableCell className="text-right">{formatCurrency(calc.fobHwUSD, 'USD')}</TableCell></TableRow>
                       <TableRow className="border-b"><TableCell className="py-1">Impostos Federais</TableCell><TableCell className="text-right">{formatCurrency(calc.impostosHw.total - calc.impostosHw.valICMS, 'BRL')}</TableCell></TableRow>
                       <TableRow className="border-b"><TableCell className="py-1 font-bold text-primary">ICMS (Por Dentro)</TableCell><TableCell className="text-right font-bold text-primary">{formatCurrency(calc.impostosHw.valICMS, 'BRL')}</TableCell></TableRow>
                       <TableRow className={TOTAL_STYLE}><TableCell className="py-1.5">TOTAL</TableCell><TableCell className="py-1.5 text-right">{formatCurrency(calc.totalHwFinal, 'BRL')}</TableCell></TableRow>
                    </TableBody>
                  </Table>
               </div>
            </div>

            <div className="space-y-4">
               <div className={`rounded-md overflow-hidden ${SECTION_BORDER} shadow-sm`}>
                  <div className={`p-1.5 text-center ${HEADER_STYLE}`}>Software + Impostos</div>
                  <Table>
                    <TableBody className="text-xs">
                       <TableRow className="border-b"><TableCell className="py-1">Mercadoria (USD)</TableCell><TableCell className="text-right">{formatCurrency(calc.fobSwUSD, 'USD')}</TableCell></TableRow>
                       <TableRow className="border-b"><TableCell className="py-1 font-bold text-blue-700">IRRF (Gross-up)</TableCell><TableCell className="text-right font-bold text-blue-700">{formatCurrency(calc.impostosSw.valIRRF, 'BRL')}</TableCell></TableRow>
                       <TableRow className={TOTAL_STYLE}><TableCell className="py-1.5">TOTAL</TableCell><TableCell className="py-1.5 text-right">{formatCurrency(calc.totalSwFinal, 'BRL')}</TableCell></TableRow>
                    </TableBody>
                  </Table>
               </div>
            </div>
          </div>

          <div className="border border-black rounded-sm overflow-hidden mt-4">
            <Table>
              <TableBody className="font-bold text-sm">
                <TableRow className={`${TOTAL_STYLE} text-lg`}>
                  <TableCell>TOTAL GERAL DE CUSTOS (Landed Cost)</TableCell>
                  <TableCell className="text-right">{formatCurrency(calc.totalGeral, 'BRL')}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

       <Separator className="my-8"/>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Histórico de Simulações e Padrões</CardTitle>
              <CardDescription>Gerencie os kits e simulações salvas.</CardDescription>
            </div>
            <div className="w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome..."
                  className="pl-9"
                  value={kitSearchQuery}
                  onChange={(e) => setKitSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingKits ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredSavedKits.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium text-muted-foreground">Nenhuma simulação salva</h3>
                <p className="mt-1 text-sm text-muted-foreground">Crie e salve uma simulação para que ela apareça aqui.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Simulação / Kit</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Custo Total (BRL)</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSavedKits.map(kit => (
                  <TableRow key={kit.id}>
                    <TableCell className="font-medium">{kit.name}</TableCell>
                    <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                            kit.type === 'TEMPLATE' ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                            {kit.type === 'TEMPLATE' ? 'Padrão' : 'Simulação'}
                        </span>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(kit.calculation?.totalGeral ?? 0, 'BRL')}
                    </TableCell>
                    <TableCell>{kit.createdAt ? format(new Date(kit.createdAt), "dd/MM/yyyy") : "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
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
                                        Esta ação não pode ser desfeita. Isso excluirá permanentemente "{kit.name}".
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(kit.id)}>Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
