
"use client";

import { useState, useMemo, useEffect } from "react";
import { Save, Search, Check, Loader2 } from "lucide-react";
import { collection, addDoc, type Firestore } from "firebase/firestore";

import { initializeFirebase } from "@/firebase";
import { useAppContext } from "@/context/app-context";
import { SaleProduct } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

let db: Firestore;

// Estilos visuais da planilha
const HEADER_STYLE = "bg-[#70ad47] text-white font-bold uppercase text-xs"; // Verde Planilha
const TOTAL_STYLE = "bg-[#ffff00] font-bold text-black"; // Amarelo Planilha
const SECTION_BORDER = "border border-gray-300";

export function KitBuilderSpreadsheet() {
  const { products, productTypes, globalSettings } = useAppContext();
  const { toast } = useToast();

  useEffect(() => {
    const { db: firestoreDb } = initializeFirebase();
    db = firestoreDb;
  }, []);

  // --- ESTADOS ---
  const [kitName, setKitName] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<SaleProduct[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState("");

  // --- PARÂMETROS VARIÁVEIS (Inputs da Planilha) ---
  const [dolarRate, setDolarRate] = useState(globalSettings.exchangeRateUSD);
  const [freteIntHardwareUSD, setFreteIntHardwareUSD] = useState(globalSettings.freightCostUSD);
  
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
    const baseIPI = baseHwBRL + valII;
    const valIPI = baseIPI * globalSettings.hardware_ipiTax;
    const valPIS = baseHwBRL * globalSettings.hardware_pisTax;
    const valCOFINS = baseHwBRL * globalSettings.hardware_cofinsTax;
    const valSiscomex = hasHardware ? globalSettings.taxaSiscomex : 0;

    const basePreICMS = baseHwBRL + valII + valIPI + valPIS + valCOFINS + valSiscomex;
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

    return {
      fobHwUSD, freteHwUSD, baseHwBRL,
      fobSwUSD, baseSwBRL,
      totalDespesasAduaneiras, desconsolidacaoBRL,
      impostosHw: { valII, valIPI, valPIS, valCOFINS, valICMS, valSiscomex, total: totalImpostosHw },
      impostosSw: { valIRRF, valPIS: valPIS_Sw, valCOFINS: valCOFINS_Sw, valIOF, valISS, valSwift, total: totalImpostosSw },
      totalHwFinal,
      totalSwFinal,
      totalGeral
    };
  }, [selectedProducts, dolarRate, freteIntHardwareUSD, globalSettings, productTypes]);

  // --- SAVE ---
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
      await addDoc(collection(db, "product_kits"), {
        name: kitName,
        items: selectedProducts.map(p => ({ id: p.id, name: p.name, costUSD: p.costUSD })),
        calculation: calc,
        createdAt: Date.now()
      });
      toast({ title: "Sucesso!", description: `O kit "${kitName}" foi salvo.` });
      setKitName("");
      setSelectedProducts([]);
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar o kit.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="pt-6">
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
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2" />}
              Salvar Kit
            </Button>
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
    </div>
  );
}
