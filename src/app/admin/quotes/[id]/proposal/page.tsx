"use client";

import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, ArrowLeft, ShieldCheck, MapPin, PackageCheck, Users } from "lucide-react";
import Link from "next/link";

// --- TEXTOS PADRÃO ---
const DEFAULT_INTRO = `Prezados,

A EXS Solutions (Grupo GPECX) tem a satisfação de apresentar nossa proposta técnico-comercial.
Mais do que equipamentos, entregamos segurança operacional. Com nossa expertise no setor elétrico, garantimos não apenas a qualidade do produto, mas o suporte contínuo através da nossa comunidade técnica.`;

// --- LISTA DE INCLUSOS (DIFERENCIAIS) ---
const INCLUDED_ITEMS = [
    "Certificado de Calibração Rastreável",
    "Software de Utilização Atualizado (Vitalício)",
    "Kit Completo de Acessórios (Conforme Anexo A)",
    "Treinamento Operacional Gratuito",
    "Acesso à Comunidade Exclusiva EXS Colab"
];

// --- CLÁUSULAS JURÍDICAS (TEXTO EXATO DO CLIENTE) ---
// Dividi em blocos para ficar organizado, mas é o texto fiel.
const GENERAL_TERMS = [
    {
        title: "5.1 Aceite e Validade",
        text: "A aceitação desta proposta implica na concordância integral com estas Condições Gerais. Modificações na proposta prevalecem sobre estas condições. O prazo de validade desta proposta é de 5 dias corridos."
    },
    {
        title: "5.2 Escopo de Fornecimento",
        text: "Todo e qualquer item ou serviço não expressamente listado nesta proposta será considerado fornecimento adicional e sujeito a novo orçamento."
    },
    {
        title: "5.3 Garantia e Responsabilidade",
        text: "Garantia de 24 meses (2 anos) contra defeitos de fabricação (exceto mal uso). A EXS Solutions limita-se ao reparo ou substituição. Em nenhuma hipótese responderá por lucros cessantes ou danos indiretos."
    },
    {
        title: "5.4 Inadimplência",
        text: "Em caso de atraso no pagamento, incidirá multa de 10%, juros de mora de 2% ao mês e, se necessário cobrança judicial, honorários advocatícios estipulados em 20% sobre o valor da causa."
    },
    {
        title: "5.5 Proteção contra Atraso (Empréstimo)",
        text: "Diferencial EXS: Ocorrendo atraso na entrega do equipamento por nossa culpa, concederemos como empréstimo um equipamento de mesmo modelo até a entrega do novo."
    },
    {
        title: "5.6 Cancelamento (Quebra de Contrato)",
        text: "Em caso de desistência/cancelamento, incidirá multa de 10% sobre o valor total, sem devolução do sinal pago inicialmente."
    },
    {
        title: "5.7 Tributos e Revisão",
        text: "A EXS é optante pelo Simples Nacional. Novos tributos ou alterações de alíquotas que impactem o custo após a data da proposta implicarão na revisão automática dos preços."
    },
    {
        title: "5.8 Retirada e Pagamento",
        text: "Após o aviso de prontidão, o cliente tem 5 dias úteis para retirar. Após este prazo, inicia-se a contagem para vencimento das parcelas restantes, independente da retirada."
    }
];

let db: Firestore;

export default function ProposalGeneratorPage() {
  const { id } = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DE EDIÇÃO ---
  const [introText, setIntroText] = useState(DEFAULT_INTRO);
  const [paymentTerms, setPaymentTerms] = useState("50% Sinal / 50% na Entrega/Retirada");
  const [deliveryTime, setDeliveryTime] = useState("Imediata (Estoque) ou 30 dias");
  
  // Opções de Exibição
  const [showClientsFooter, setShowClientsFooter] = useState(true);
  const [showAnnex, setShowAnnex] = useState(true);

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
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchQuote();
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) return <div className="p-10 text-center">Carregando...</div>;
  if (!quote) return <div className="p-10 text-center text-red-500">Proposta não encontrada.</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* ================= PAINEL DE CONTROLE (ESQUERDA) ================= */}
      <aside className="w-full md:w-[350px] bg-white border-r h-screen overflow-y-auto p-5 print:hidden shadow-xl z-20 flex-shrink-0">
        <div className="mb-6 flex justify-between items-center">
             <Link href="/pipeline" className="text-slate-500 hover:text-slate-900 flex items-center text-xs font-bold uppercase">
                <ArrowLeft className="w-3 h-3 mr-1"/> Voltar
            </Link>
            <h2 className="font-bold text-slate-800">Editor</h2>
        </div>

        <Tabs defaultValue="conteudo" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="conteudo">Texto</TabsTrigger>
                <TabsTrigger value="opcoes">Opções</TabsTrigger>
            </TabsList>

            <TabsContent value="conteudo" className="space-y-4">
                <div className="space-y-2">
                    <Label>Carta de Introdução</Label>
                    <Textarea className="h-40 text-xs leading-relaxed" value={introText} onChange={e => setIntroText(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Condição de Pagamento</Label>
                    <Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Prazo de Entrega</Label>
                    <Input value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} />
                </div>
            </TabsContent>

            <TabsContent value="opcoes" className="space-y-4">
                <div className="flex items-center space-x-2 border p-3 rounded bg-slate-50">
                    <Checkbox id="clients" checked={showClientsFooter} onCheckedChange={(v) => setShowClientsFooter(!!v)} />
                    <Label htmlFor="clients" className="cursor-pointer">Mostrar Rodapé "Grandes Clientes"</Label>
                </div>
                <div className="flex items-center space-x-2 border p-3 rounded bg-slate-50">
                    <Checkbox id="annex" checked={showAnnex} onCheckedChange={(v) => setShowAnnex(!!v)} />
                    <Label htmlFor="annex" className="cursor-pointer">Gerar Página de Anexo (Acessórios)</Label>
                </div>
            </TabsContent>
        </Tabs>

        <div className="mt-8 pt-4 border-t sticky bottom-0 bg-white">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12" onClick={handlePrint}>
                <Printer className="w-5 h-5 mr-2" /> IMPRIMIR PDF
            </Button>
            <p className="text-[10px] text-center text-gray-400 mt-2">Dica: Ative "Gráficos de 2º Plano" na impressão.</p>
        </div>
      </aside>

      {/* ================= PAPEL A4 (DIREITA) ================= */}
      <main className="flex-1 bg-slate-200 p-8 overflow-y-auto print:p-0 print:bg-white print:overflow-visible flex justify-center">
        
        <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none text-slate-800 relative flex flex-col">
            
            {/* CABEÇALHO COM FAIXA VERDE */}
            <div className="h-3 w-full bg-emerald-600"></div>
            <header className="px-10 py-6 flex justify-between items-end border-b border-slate-100">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
                        EXS <span className="text-emerald-600">SOLUTIONS</span>
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Grupo GPECX - Energia & Alta Tensão</p>
                </div>
                <div className="text-right">
                    <div className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded text-xs font-bold inline-block mb-1">
                        PROPOSTA #{quote.number}
                    </div>
                    <p className="text-xs text-slate-500">{new Date(quote.createdAt).toLocaleDateString()}</p>
                </div>
            </header>

            {/* CORPO DO DOCUMENTO */}
            <div className="px-10 py-6 flex-1">
                
                {/* 1. DESTINATÁRIO */}
                <div className="flex justify-between items-start mb-8 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Cliente</p>
                        <h2 className="text-lg font-bold text-slate-800">{quote.customerName}</h2>
                        <p className="text-xs text-slate-500">A/C Depto. Compras / Engenharia</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Validade</p>
                        <p className="font-bold text-emerald-700">5 DIAS</p>
                    </div>
                </div>

                {/* 2. INTRODUÇÃO */}
                <div className="text-sm text-slate-600 mb-8 whitespace-pre-line leading-relaxed text-justify">
                    {introText}
                </div>

                {/* 3. TABELA DE PREÇO (DESTAQUE) */}
                <div className="mb-8">
                    <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                        <PackageCheck className="w-4 h-4 text-emerald-600"/> INVESTIMENTO E ESCOPO
                    </h3>
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-800 text-white">
                                <th className="p-3 text-left rounded-tl-md w-2/3">Descrição do Equipamento / Serviço</th>
                                <th className="p-3 text-right rounded-tr-md">Valor Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quote.items.map((item, i) => (
                                <tr key={i} className="border-b border-slate-100">
                                    <td className="p-3 font-medium text-slate-700">{item.name}</td>
                                    {/* Exibindo apenas o total sugerido para simplificar, já que é kit */}
                                    <td className="p-3 text-right font-bold text-slate-800">
                                        {i === 0 ? formatCurrency(quote.totals.suggestedPrice, 'BRL') : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-emerald-50">
                                <td className="p-3 text-right font-bold text-xs uppercase text-emerald-800">Valor Final da Proposta</td>
                                <td className="p-3 text-right font-black text-xl text-emerald-700">
                                    {formatCurrency(quote.totals.suggestedPrice, 'BRL')}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                    <p className="text-[10px] text-slate-400 mt-2 text-right">* Valores com impostos inclusos (Simples Nacional).</p>
                </div>

                {/* 4. O QUE ESTÁ INCLUSO (DIFERENCIAIS) */}
                <div className="mb-8 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100 break-inside-avoid">
                    <h3 className="font-bold text-emerald-800 text-sm mb-3 uppercase">O que está incluso neste valor:</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {INCLUDED_ITEMS.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                {item}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5. CONDIÇÕES COMERCIAIS */}
                <div className="grid grid-cols-2 gap-6 mb-8 break-inside-avoid">
                    <div>
                        <h4 className="font-bold text-xs text-slate-400 uppercase mb-1">Pagamento</h4>
                        <p className="text-sm font-bold text-slate-800 border-l-2 border-emerald-500 pl-2">{paymentTerms}</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-xs text-slate-400 uppercase mb-1">Entrega</h4>
                        <p className="text-sm font-bold text-slate-800 border-l-2 border-emerald-500 pl-2">{deliveryTime}</p>
                    </div>
                    <div className="col-span-2">
                        <h4 className="font-bold text-xs text-slate-400 uppercase mb-1">Local de Retirada / Garantia</h4>
                        <div className="text-xs text-slate-600 flex items-start gap-2 bg-slate-50 p-2 rounded">
                            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold">Sede EXS Solutions:</span> Rua Antônio Gonzales Vasques, 126 – Bosque da Saúde, Americana/SP.<br/>
                                <span className="text-slate-400">Horário: Seg-Sex (08:30 - 11:30 | 13:00 - 16:30)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6. CONDIÇÕES GERAIS (LETRAS MIÚDAS) */}
                <div className="mb-4 border-t pt-4 break-inside-avoid">
                    <h3 className="font-bold text-slate-900 text-xs uppercase mb-3">5. Condições Gerais de Venda</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[9px] text-slate-500 text-justify leading-tight">
                        {GENERAL_TERMS.map((term, i) => (
                            <div key={i}>
                                <span className="font-bold text-slate-700">{term.title}: </span>
                                {term.text}
                            </div>
                        ))}
                    </div>
                    <p className="text-[9px] text-slate-400 mt-3 text-center italic">
                        Fica eleito o foro da comarca de Americana/SP para dirimir quaisquer dúvidas oriundas deste contrato.
                    </p>
                </div>

            </div>

            {/* ASSINATURA E RODAPÉ */}
            <div className="px-10 pb-8 mt-auto break-inside-avoid">
                 <div className="flex justify-between gap-10 mb-8 mt-4">
                    <div className="text-center w-1/2">
                        <div className="border-b border-slate-300 mb-2"></div>
                        <p className="font-bold text-xs">EXS SOLUTIONS</p>
                    </div>
                    <div className="text-center w-1/2">
                        <div className="border-b border-slate-300 mb-2"></div>
                        <p className="font-bold text-xs">DE ACORDO (CLIENTE)</p>
                    </div>
                </div>

                {/* SOCIAL PROOF (SUGESTÃO IMPLEMENTADA) */}
                {showClientsFooter && (
                    <div className="bg-slate-50 border-t border-slate-100 py-3 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex justify-center items-center gap-2">
                            <Users className="w-3 h-3"/> Quem confia na EXS Solutions
                        </p>
                        <div className="flex justify-center gap-4 text-[10px] font-bold text-slate-300 grayscale opacity-70">
                            {/* Aqui você pode trocar por logos <img> reais depois */}
                            <span>VALE</span> • <span>CPFL</span> • <span>NEOENERGIA</span> • <span>VOTORANTIM</span> • <span>SIEMENS</span> • <span>ENGIE</span>
                        </div>
                         <p className="text-[9px] text-emerald-600 font-bold mt-2 cursor-pointer hover:underline">
                            Veja nosso portfólio completo em gpecx.com.br
                        </p>
                    </div>
                )}
            </div>

            {/* MARCA D'ÁGUA DE FUNDO (OPCIONAL) */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] overflow-hidden z-0">
                 <div className="transform -rotate-45 text-9xl font-black text-slate-900 whitespace-nowrap">
                    EXS SOLUTIONS
                 </div>
            </div>

        </div>

        {/* PÁGINA 2: ANEXO (SE NECESSÁRIO) */}
        {showAnnex && (
            <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none text-slate-800 relative flex flex-col mt-8 print:mt-0 print:break-before-page">
                 <div className="h-3 w-full bg-slate-300"></div>
                 <div className="p-10">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">ANEXO A - Checklist de Acessórios</h2>
                    <p className="text-sm text-slate-600 mb-4">
                        O equipamento cotado acompanha os seguintes itens para garantir sua operação imediata:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
                        <li>Mala de transporte reforçada com rodinhas (Case Rígido)</li>
                        <li>Cabos de alimentação e conexão (Padrão ABNT e IEC)</li>
                        <li>Pontas de prova de alta tensão (quando aplicável)</li>
                        <li>Cabos de aterramento de segurança</li>
                        <li>Manual de operações em Português (Digital/Físico)</li>
                        <li>Licença de Software Vitalícia</li>
                    </ul>
                 </div>
            </div>
        )}

      </main>
    </div>
  );
}
