"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, AlertTriangle, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export default function CostHelpPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      
      {/* CABEÇALHO */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Entenda o Cálculo de Nacionalização</h1>
        <p className="text-gray-500">
          Por que os custos no sistema podem parecer maiores que em planilhas simplificadas? 
          Entenda a metodologia fiscal "Por Dentro" (Gross Up).
        </p>
      </div>

      {/* ALERTA PRINCIPAL */}
      <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <AlertTitle className="text-lg font-bold mb-1">O Perigo do Cálculo Simplificado</AlertTitle>
        <AlertDescription className="text-base">
          Muitas planilhas calculam o ICMS apenas sobre a Mercadoria + II. Isso é incorreto perante a legislação 
          e gera um <strong>"Prejuízo Oculto"</strong>. O sistema GPECx SGC utiliza a base de cálculo cheia 
          exigida pela Receita Estadual, protegendo a margem de lucro da empresa.
        </AlertDescription>
      </Alert>

      {/* SEÇÃO 1: A FÓRMULA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            A Fórmula Oficial (Lei Kandir)
          </CardTitle>
          <CardDescription>
            Como o governo exige que o ICMS Importação seja calculado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 bg-slate-50 rounded-lg border text-center">
            <p className="text-sm text-slate-500 mb-4 font-semibold uppercase tracking-wide">Fórmula da Base de Cálculo</p>
            <div className="text-xl md:text-2xl font-mono text-slate-800 leading-relaxed">
              Base ICMS = <span className="inline-block border-b-2 border-slate-400 pb-1 mb-1">(Valor Aduaneiro + II + IPI + PIS + COFINS + Siscomex + Despesas)</span>
              <br />
              <span className="inline-block pt-1">(1 - Alíquota ICMS)</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex gap-3 items-start">
              <div className="bg-emerald-100 p-2 rounded-full"><CheckCircle2 className="w-4 h-4 text-emerald-700" /></div>
              <div>
                <strong className="block text-gray-900">1. Somar TUDO (Numerador)</strong>
                <span className="text-gray-500">
                  Diferente da planilha simples, o governo exige que se some IPI, PIS, COFINS, Taxa Siscomex 
                  e Despesas Aduaneiras antes de calcular o ICMS.
                </span>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="bg-emerald-100 p-2 rounded-full"><CheckCircle2 className="w-4 h-4 text-emerald-700" /></div>
              <div>
                <strong className="block text-gray-900">2. Divisão "Por Dentro" (Denominador)</strong>
                <span className="text-gray-500">
                  Para uma alíquota de 18%, não multiplicamos por 18%. Dividimos por <strong>0,82</strong> (1 - 0,18). 
                  Isso infla a base para que o imposto incida sobre ele mesmo.
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 2: CASO REAL (COMPARATIVO) */}
      <Card className="overflow-hidden border-2 border-slate-200">
        <CardHeader className="bg-slate-100 border-b">
          <CardTitle>Estudo de Caso Real</CardTitle>
          <CardDescription>
            Comparativo usando valores reais de um Kit UTS Hardware.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6 grid md:grid-cols-3 gap-6 bg-white">
            <div className="col-span-1 space-y-2 text-sm">
              <h4 className="font-bold text-gray-700 border-b pb-2">Dados de Entrada</h4>
              <div className="flex justify-between"><span>Mercadoria (FOB):</span> <span>R$ 18.570,00</span></div>
              <div className="flex justify-between"><span>II (9,6%):</span> <span>R$ 1.782,72</span></div>
              <div className="flex justify-between"><span>IPI (3,25%):</span> <span>R$ 603,53</span></div>
              <div className="flex justify-between"><span>PIS (2,1%):</span> <span>R$ 390,00</span></div>
              <div className="flex justify-between"><span>COFINS (9,65%):</span> <span>R$ 1.792,00</span></div>
              <div className="flex justify-between"><span>Siscomex:</span> <span>R$ 154,23</span></div>
              <div className="flex justify-between font-semibold border-t pt-2"><span>Soma Impostos Federais:</span> <span>R$ 4.722,48</span></div>
              <div className="flex justify-between mt-2"><span>Despesas Aduaneiras:</span> <span>R$ 2.994,54</span></div>
              <Separator className="my-2"/>
              <div className="flex justify-between font-bold text-base bg-blue-50 p-2 rounded-md"><span>Base Pré-ICMS:</span> <span>R$ 26.287,02</span></div>
            </div>

            <div className="col-span-2 space-y-4">
                <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                    <div className="flex items-center gap-3">
                        <XCircle className="w-8 h-8 text-red-600 shrink-0"/>
                        <div>
                            <h4 className="font-bold text-red-800">Cálculo Simplificado (Incorreto)</h4>
                            <p className="text-sm text-red-700">Base ICMS = Mercadoria + II = R$ 20.352,72</p>
                            <p className="font-mono text-lg font-bold text-red-900 mt-1">
                                R$ 20.352,72 x 18% = <Badge variant="destructive">R$ 3.663,49</Badge> (ICMS Subavaliado)
                            </p>
                        </div>
                    </div>
                </div>

                 <div className="p-4 border rounded-lg bg-emerald-50 border-emerald-200">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0"/>
                        <div>
                            <h4 className="font-bold text-emerald-800">Cálculo Correto (GPECx SGC)</h4>
                            <p className="text-sm text-emerald-700">Base ICMS = (Base Pré-ICMS) / (1 - 0,18) = R$ 32.057,34</p>
                            <p className="font-mono text-lg font-bold text-emerald-900 mt-1">
                                R$ 32.057,34 x 18% = <Badge variant="default" className="bg-emerald-600">R$ 5.770,32</Badge>
                            </p>
                        </div>
                    </div>
                </div>

                <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Conclusão</AlertTitle>
                    <AlertDescription>
                        A diferença entre os cálculos é de <strong>R$ 2.106,83</strong>. Este valor seria um prejuízo direto absorvido pela empresa se o cálculo simplificado fosse usado para formar o preço de venda.
                    </AlertDescription>
                </Alert>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
