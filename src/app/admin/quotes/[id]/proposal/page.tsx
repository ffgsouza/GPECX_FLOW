"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, type Firestore } from "firebase/firestore";
import { initializeFirebase } from "@/firebase";
import { Quote } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, ArrowLeft, Save, ShieldAlert, FileText } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

// --- TEXTOS PADRÃO (MELHORIA DE COPYWRITING) ---
const DEFAULT_INTRO = `A EXS Solutions (Grupo GPECX) agradece a oportunidade de apresentar esta proposta técnica e comercial.
Não apenas fornecemos equipamentos; entregamos confiabilidade operacional. Com expertise consolidada no setor elétrico, nossa missão é garantir a continuidade da sua operação através de tecnologia de ponta e suporte técnico especializado.`;

const DEFAULT_SCOPE = `Fornecimento de equipamentos para ensaios e medições elétricas, conforme especificado abaixo, incluindo garantia de fábrica e suporte técnico remoto para operação inicial.`;

// --- CLÁUSULAS JURÍDICAS ---
const CLAUSES = {
  cambio: {
    id: "cambio",
    title: "Proteção Cambial (Importação)",
    text: "Os preços foram calculados com base na taxa PTAX vigente. Variações cambiais superiores a 3% (três por cento) entre a data da proposta e o faturamento poderão ser repassadas, mantendo o equilíbrio econômico-financeiro."
  },
  impostos: {
    id: "impostos",
    title: "Tributos e Alíquotas",
    text: "Os preços incluem os impostos vigentes na data de emissão (II, IPI, PIS, COFINS, ICMS). Alterações na legislação tributária que impactem o custo final serão objeto de revisão de preço."
  },
  garantia: {
    id: "garantia",
    title: "Garantia Standard",
    text: "Garantia de 12 (doze) meses contra defeitos de fabricação. A assistência técnica é realizada em nosso laboratório em Americana/SP. Despesas de frete/deslocamento para reparo correm por conta do cliente."
  }
};

let db: Firestore;

export default function ProposalGeneratorPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DE EDIÇÃO ---
  const [introText, setIntroText] = useState(DEFAULT_INTRO);
  const [scopeText, setScopeText] = useState(DEFAULT_SCOPE);
  const [paymentTerms, setPaymentTerms] = useState("50% no Pedido / 50% na Entrega");
  const [deliveryTime, setDeliveryTime] = useState("30 a 45 dias");
  const [validityDays, setValidityDays] = useState("5");
  
  // Opções
  const [freightType, setFreightType] = useState<"CIF" | "FOB">("CIF");
  const [activeClauses, setActiveClauses] = useState<string[]>(["cambio", "impostos", "garantia"]);

  useEffect(() => {
    const { db: firestoreDb } = initializeFirebase();
    db = firestoreDb;
    
    const fetchQuote = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "quotes", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setQuote({ id: docSnap.id, ...docSnap.data() } as Quote);
        }
      } catch (error) {
        console.error("Erro ao carregar proposta", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [id]);

  const toggleClause = (clauseId: string) => {
    setActiveClauses(prev => 
      prev.includes(clauseId) ? prev.filter(c => c !== clauseId) : [...prev, clauseId]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-10 text-center">Carregando gerador...</div>;
  if (!quote) return <div className="p-10 text-center text-red-500">Proposta não encontrada.</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      
      {/* =================================================================
          LADO ESQUERDO: PAINEL DE EDIÇÃO (Não sai na impressão)
      ================================================================== */}
      <aside className="w-full md:w-[400px] bg-white border-r border-slate-200 h-screen overflow-y-auto p-4 flex-shrink-0 print:hidden shadow-xl z-10">
        <div className="mb-6 flex items-center justify-between">
            <Link href="/pipeline" className="text-slate-500 hover:text-slate-800 flex items-center text-sm">
                <ArrowLeft className="w-4 h-4 mr-1"/> Voltar
            </Link>
            <h2 className="font-bold text-lg">Editor de Proposta</h2>
        </div>

        <Tabs defaultValue="conteudo" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
                <TabsTrigger value="juridico">Jurídico</TabsTrigger>
            </TabsList>

            {/* ABA CONTEÚDO */}
            <TabsContent value="conteudo" className="space-y-4">
                <div className="space-y-2">
                    <Label>Introdução / Carta</Label>
                    <Textarea 
                        className="h-32 text-xs" 
                        value={introText} 
                        onChange={e => setIntroText(e.target.value)} 
                    />
                </div>
                <div className="space-y-2">
                    <Label>Escopo Técnico</Label>
                    <Textarea 
                        className="h-24 text-xs" 
                        value={scopeText} 
                        onChange={e => setScopeText(e.target.value)} 
                    />
                </div>
                <div className="space-y-2">
                    <Label>Condição de Pagamento</Label>
                    <Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                        <Label>Prazo Entrega</Label>
                        <Input value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Validade (Dias)</Label>
                        <Input value={validityDays} onChange={e => setValidityDays(e.target.value)} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Frete</Label>
                    <div className="flex gap-4 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="frete" checked={freightType === "CIF"} onChange={() => setFreightType("CIF")} />
                            <span className="text-sm">CIF (Pago)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="frete" checked={freightType === "FOB"} onChange={() => setFreightType("FOB")} />
                            <span className="text-sm">FOB (Retira)</span>
                        </label>
                    </div>
                </div>
            </TabsContent>

            {/* ABA JURÍDICO */}
            <TabsContent value="juridico" className="space-y-4">
                <Card className="bg-orange-50 border-orange-200">
                    <CardHeader className="py-2"><CardTitle className="text-xs text-orange-800 flex items-center gap-2"><ShieldAlert className="w-3 h-3"/> Proteção da Empresa</CardTitle></CardHeader>
                    <CardContent className="py-2 text-xs text-orange-700">
                        Marque as cláusulas que devem aparecer no PDF final.
                    </CardContent>
                </Card>

                {Object.values(CLAUSES).map((clause) => (
                    <div key={clause.id} className="flex items-start space-x-2 border p-2 rounded bg-slate-50">
                        <Checkbox 
                            id={clause.id} 
                            checked={activeClauses.includes(clause.id)}
                            onCheckedChange={() => toggleClause(clause.id)}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <label htmlFor={clause.id} className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {clause.title}
                            </label>
                            <p className="text-[10px] text-muted-foreground text-justify">
                                {clause.text}
                            </p>
                        </div>
                    </div>
                ))}
            </TabsContent>
        </Tabs>

        <div className="mt-8 pt-4 border-t sticky bottom-0 bg-white pb-4">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" /> IMPRIMIR PDF / SALVAR
            </Button>
            <p className="text-xs text-center text-gray-400 mt-2">Dica: Nas opções de impressão, ative "Gráficos de Segundo Plano".</p>
        </div>
      </aside>


      {/* =================================================================
          LADO DIREITO: O PAPEL A4 (O que será impresso)
          Classes 'print:...' garantem a formatação perfeita no papel
      ================================================================== */}
      <main className="flex-1 p-8 overflow-y-auto bg-slate-200 print:bg-white print:p-0 print:overflow-visible flex justify-center">
        
        {/* FOLHA A4 */}
        <div className="bg-white w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl print:shadow-none text-slate-800 relative">
            
            {/* 1. CABEÇALHO */}
            <header className="flex justify-between items-start border-b-2 border-emerald-600 pb-4 mb-8">
                <div>
                    {/* LOGO PLACEHOLDER */}
                    <div className="text-2xl font-black text-emerald-700 tracking-tighter mb-1">
                        EXS <span className="text-slate-700">SOLUTIONS</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Grupo GPECX - Energia & Soluções</div>
                </div>
                <div className="text-right">
                    <h1 className="text-xl font-bold text-slate-900">PROPOSTA COMERCIAL</h1>
                    <p className="text-sm text-slate-500">#{quote.number}</p>
                    <p className="text-xs text-slate-400 mt-1">Data: {new Date(quote.createdAt).toLocaleDateString()}</p>
                </div>
            </header>

            {/* 2. DADOS DO CLIENTE & VENDEDOR */}
            <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                <div className="bg-slate-50 p-4 rounded border border-slate-100">
                    <h3 className="font-bold text-emerald-700 mb-2 uppercase text-xs">Cliente</h3>
                    <p className="font-bold text-lg">{quote.customerName}</p>
                    <p className="text-slate-500">A/C Departamento de Compras / Engenharia</p>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-100">
                    <h3 className="font-bold text-emerald-700 mb-2 uppercase text-xs">Emissor</h3>
                    <p className="font-bold">Departamento Comercial</p>
                    <p className="text-slate-500">comercial@gpecx.com.br</p>
                    <p className="text-slate-500">(19) 3468-0000</p>
                </div>
            </div>

            {/* 3. INTRODUÇÃO */}
            <div className="mb-8 text-sm leading-relaxed text-justify text-slate-700 whitespace-pre-line">
                {introText}
            </div>

            {/* 4. ESCOPO */}
            <div className="mb-8">
                <h3 className="font-bold text-slate-900 border-l-4 border-emerald-500 pl-2 mb-2">1. Objeto e Escopo</h3>
                <p className="text-sm text-slate-600 whitespace-pre-line">{scopeText}</p>
            </div>

            {/* 5. TABELA DE ITENS */}
            <div className="mb-8">
                <h3 className="font-bold text-slate-900 border-l-4 border-emerald-500 pl-2 mb-4">2. Investimento</h3>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-emerald-600 text-white text-left">
                            <th className="p-2 pl-4 rounded-tl-lg">Item / Descrição</th>
                            <th className="p-2 text-right">Preço Unit.</th>
                            <th className="p-2 text-center">Qtd</th>
                            <th className="p-2 pr-4 text-right rounded-tr-lg">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {quote.items.map((item, idx) => (
                           <tr key={idx} className="even:bg-slate-50">
                               <td className="p-3 pl-4">
                                   <div className="font-bold text-slate-700">{item.name}</div>
                                   {/* Se tiver descrição longa, pode por aqui */}
                               </td>
                               {/* Como o quote.items simples não tem preço unitário salvo individualmente na estrutura simplificada anterior, 
                                   vamos assumir que o 'suggestedPrice' é o total e fazer a engenharia reversa para exibição ou 
                                   usar a lógica de que se for 1 item, é o valor total. 
                                   Nota: No seu sistema real, garanta que 'items' tenha 'unitPrice'. 
                                   Aqui vou simular para o layout não quebrar. */}
                               <td className="p-3 text-right text-slate-600">
                                   {/* Placeholder logic */}
                                   {formatCurrency(quote.totals.suggestedPrice / quote.items.length, 'BRL')}
                               </td>
                               <td className="p-3 text-center">1</td>
                               <td className="p-3 pr-4 text-right font-bold text-slate-800">
                                   {formatCurrency(quote.totals.suggestedPrice / quote.items.length, 'BRL')}
                               </td>
                           </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-100 border-t-2 border-slate-300">
                            <td colSpan={3} className="p-3 text-right font-bold uppercase text-xs text-slate-500">Total da Proposta</td>
                            <td className="p-3 pr-4 text-right font-bold text-xl text-emerald-700">
                                {formatCurrency(quote.totals.suggestedPrice, 'BRL')}
                            </td>
                        </tr>
                    </tfoot>
                </table>
                <p className="text-[10px] text-slate-400 mt-2 text-right">* Valores expressos em Reais (BRL). Impostos inclusos conforme seção 3.</p>
            </div>

            {/* 6. CONDIÇÕES COMERCIAIS */}
            <div className="mb-8 break-inside-avoid">
                <h3 className="font-bold text-slate-900 border-l-4 border-emerald-500 pl-2 mb-4">3. Condições Comerciais</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="border p-3 rounded bg-slate-50">
                        <span className="block text-xs font-bold text-slate-500 uppercase">Pagamento</span>
                        <span className="font-medium">{paymentTerms}</span>
                    </div>
                    <div className="border p-3 rounded bg-slate-50">
                        <span className="block text-xs font-bold text-slate-500 uppercase">Prazo de Entrega</span>
                        <span className="font-medium">{deliveryTime}</span>
                    </div>
                    <div className="border p-3 rounded bg-slate-50">
                        <span className="block text-xs font-bold text-slate-500 uppercase">Validade</span>
                        <span className="font-medium">{validityDays} dias</span>
                    </div>
                    <div className="border p-3 rounded bg-slate-50">
                        <span className="block text-xs font-bold text-slate-500 uppercase">Frete (Incoterm)</span>
                        <span className="font-medium">{freightType === "CIF" ? "CIF (Pago até o Destino)" : "FOB (Retira na EXS - Americana/SP)"}</span>
                    </div>
                </div>
            </div>

            {/* 7. CONDIÇÕES GERAIS (JURÍDICO) */}
            <div className="mb-12 break-inside-avoid">
                <h3 className="font-bold text-slate-900 border-l-4 border-emerald-500 pl-2 mb-4">4. Termos e Condições Gerais</h3>
                <div className="text-xs text-slate-600 space-y-3 text-justify">
                    
                    {/* Renderiza apenas as cláusulas ativas */}
                    {Object.values(CLAUSES).map(clause => (
                        activeClauses.includes(clause.id) && (
                            <div key={clause.id}>
                                <span className="font-bold text-slate-800">{clause.title}:</span> {clause.text}
                            </div>
                        )
                    ))}
                    
                    {/* Cláusula Fixa de Foro */}
                    <div>
                        <span className="font-bold text-slate-800">Foro:</span> Fica eleito o foro da comarca de Americana/SP para dirimir quaisquer dúvidas oriundas deste fornecimento.
                    </div>
                </div>
            </div>

            {/* 8. ASSINATURAS */}
            <div className="grid grid-cols-2 gap-12 mt-20 break-inside-avoid">
                <div className="text-center">
                    <div className="border-t border-slate-400 w-3/4 mx-auto pt-2"></div>
                    <p className="font-bold text-sm">EXS SOLUTIONS</p>
                    <p className="text-xs text-slate-500">Departamento Comercial</p>
                </div>
                <div className="text-center">
                    <div className="border-t border-slate-400 w-3/4 mx-auto pt-2"></div>
                    <p className="font-bold text-sm">DE ACORDO</p>
                    <p className="text-xs text-slate-500">{quote.customerName}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Data: ____/____/_______</p>
                </div>
            </div>

            {/* RODAPÉ DE PÁGINA */}
            <div className="absolute bottom-4 left-0 w-full text-center text-[10px] text-slate-400 border-t pt-2 mx-8 print:fixed print:bottom-4">
                EXS Solutions | Americana-SP | www.gpecx.com.br | Documento gerado eletronicamente em {new Date().toLocaleDateString()}
            </div>

        </div>
      </main>
    </div>
  );
}
