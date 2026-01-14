import React from "react";
import { RentalEquipment, Vendor, Revision, Customer } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Phone, Mail } from "lucide-react";

const RENTAL_LEGAL_TERMS = [
    { title: "5.1", text: "Se o equipamento for danificado ou inutilizado por uso inadequado, negligência ou extravio, o locatário arcará com o custo do reparo, o período de locação continuará até o locador receber o equipamento em perfeito estado." },
    { title: "5.2", text: "No caso de danos permanentes ou extravio o locatário ressarcirá a locadora com um novo equipamento da mesma marca e iguais especificações ou deverá pagar o valor do equipamento citado na nota fiscal mais acréscimo de 20% sobre o valor da nota fiscal do equipamento." },
    { title: "5.3", text: "Caso aconteça alguma situação citada acima o locatário deverá comunicar ao locador imediatamente." },
    { title: "5.4", text: "Caso o locatário não quite o pagamento conforme o prazo estabelecido nesta proposta, incidirá em cima do valor total das diárias uma multa de 20% + 2 % ao mês sobre o valor total." },
    { title: "5.5", text: "A diária se inicia no ato da retirada/envio do equipamento e é finalizada no ato da entrega do equipamento em nossa empresa. Para diárias excedentes será gerada uma revisão automática desta proposta, todavia, será faturado o valor já previsto na proposta inicial." },
    { title: "5.6", text: "Não estamos prevendo devolução antecipada do equipamento, caso ocorra o valor já pago não será devolvido ao locatário. Isto se dá pelo fato de o locador já ter reservado este período de locação, ficando assim impedido de locar para outro locatário." },
    { title: "5.7", text: "Quaisquer tributos, encargos e/ou obrigações legais que venham a ser criados, alterados, após a data da proposta, e que repercutam direta ou indiretamente nos preços, implicarão na revisão destes." }
];

interface RentalProposalDocumentProps {
    quoteNumber: string;
    revisions: Revision[];
    revisionDescription: string;
    dateStr: string;
    currentVendor?: Vendor;
    currentCustomer?: Customer;
    selectedEquipment: RentalEquipment[];
    rentalStartDate: string;
    rentalEndDate: string;
    totalDays: number;
    totalValue: number;
    discountPercent: number;
    discountValue: number;
    finalValue: number;
    paymentTerms: string;
    validityDays: string;
    additionalNotes?: string;
    previewPage?: number;
}

// Sub-componente para o Cabeçalho Unificado
function RentalProposalHeader({ quoteNumber }: { quoteNumber: string }) {
    return (
        <div className="w-full h-[25mm] bg-[#061629] flex items-center justify-between pl-[30mm] pr-[20mm] print:pl-[30mm] print:pr-[20mm]">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tighter">
                    EXS <span className="text-[#10B981]">SOLUTIONS</span>
                </h1>
                <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mt-0.5">Inovação que define soluções</p>
            </div>
            <div className="text-right">
                <div className="bg-[#10B981] text-white px-3 py-1 rounded text-sm font-bold shadow-md">
                    {quoteNumber.replace('-', ' ')}
                </div>
            </div>
        </div>
    );
}

// Sub-componente para o Rodapé Unificado
function RentalProposalFooter({ page, total }: { page: number, total: number }) {
    return (
        <div className="absolute bottom-0 left-0 w-full h-[15mm] bg-[#061629] flex items-center justify-end pr-[20mm]">
            <span className="text-white text-xs font-bold">Página {page} de {total}</span>
        </div>
    );
}

export default function RentalProposalDocument({
    quoteNumber,
    revisions,
    revisionDescription,
    dateStr,
    currentVendor,
    currentCustomer,
    selectedProducts, // Will be treated as rental equipment
    showTech = true,
    showComm = true,
    finalPrice,
    paymentTerms,
    deliveryTime, // Will be used for rental period info
    validityDays,
    freightIncluded,
    warrantyPeriod,
    additionalNotes,
    productTypes,
    previewPage,
    quoteType = 'RENTAL',
    // Rental-specific props
    rentalStartDate,
    rentalEndDate,
    rentalDuration
}: any) { // Using any temporarily to accept ProposalDocument props

    // Helper to format date to Brazilian standard (DD/MM/YYYY)
    const formatBRDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Helper de Renderização Condicional de Páginas
    const shouldShow = (pageNum: number) => previewPage === undefined || previewPage === pageNum;

    // Calcular total dinâmico de páginas
    const calculateTotalPages = () => {
        // Base: 4 páginas fixas (Capa, Sobre, Equipamentos, Anexos)
        let total = 4;
        if (showTech) total += 1; // Requisitos/Escopo Técnico
        if (showComm) total += 2; // Proposta Comercial + Condições
        return total;
    };

    const totalPages = calculateTotalPages();

    // Mapeamento de página física → número lógico
    const getLogicalPageNumber = (physicalPage: number): number => {
        if (physicalPage === 1) return 1; // Capa
        if (physicalPage === 2) return 2; // Sobre a Empresa
        if (physicalPage === 3) return 3; // Equipamentos
        if (physicalPage === 4 && showTech) return 4; // Requisitos
        if (physicalPage === 5 && showComm) return showTech ? 5 : 4; // Proposta Comercial
        if (physicalPage === 6 && showComm) return showTech ? 6 : 5; // Condições
        if (physicalPage === 7) return totalPages; // Anexos (última)
        return physicalPage;
    };

    // Map props from ProposalDocument format to Rental format
    const selectedEquipment = selectedProducts; // Treat products as equipment
    const finalValue = finalPrice;
    const totalValue = finalPrice; // Base value before discount
    const discountValue = 0; // Will calculate from finalPrice if needed
    const discountPercent = 0; // TODO: Get discount from calculator props
    const totalDays = (rentalDuration as number) || 1;

    // Estilos comuns de página
    const pageStyle = previewPage ? {
        minHeight: '297mm', // A4
        maxHeight: '297mm',
        height: '297mm',
    } : {
        minHeight: '297mm', // A4 Scroll Mode
    };

    // Determine discount label
    const getDiscountLabel = () => {
        if (totalDays >= 365) return "Locação anual: 25% de desconto";
        if (totalDays >= 180) return "Locação semestral: 15% de desconto";
        if (totalDays >= 90) return "Locação trimestral: 12.5% de desconto";
        if (totalDays >= 30) return "Locação mensal: 10% de desconto";
        return "";
    };

    return (
        <div className="w-[210mm] mx-auto bg-white print:m-0 print:w-full">

            {/* PAGINA 1: CAPA */}
            {shouldShow(1) && (
                <div className="bg-white shadow-2xl text-slate-900 flex flex-col overflow-hidden relative" style={pageStyle}>

                    <RentalProposalHeader quoteNumber={quoteNumber} />

                    {/* CONTEÚDO */}
                    <div className="flex-1 flex flex-col pl-[30mm] pr-[20mm] py-[10mm] pb-[20mm]">

                        <div className="py-6">
                            {/* CAIXA DE TÍTULO */}
                            <div className="mb-8 border-l-4 border-emerald-600 pl-4 py-2 bg-slate-50">
                                <p className="text-xs font-bold text-slate-500 uppercase">Documento</p>
                                <p className="text-lg font-black text-slate-800 mt-1">
                                    PROPOSTA DE LOCAÇÃO DE EQUIPAMENTOS
                                </p>
                                {/* Badge de Tipo de Proposta */}
                                <div className="mt-3">
                                    {showTech && showComm && (
                                        <span className="inline-block px-3 py-1 text-xs font-bold bg-emerald-600 text-white rounded">
                                            PROPOSTA COMPLETA
                                        </span>
                                    )}
                                    {showTech && !showComm && (
                                        <span className="inline-block px-3 py-1 text-xs font-bold bg-cyan-600 text-white rounded">
                                            PROPOSTA TÉCNICA
                                        </span>
                                    )}
                                    {!showTech && showComm && (
                                        <span className="inline-block px-3 py-1 text-xs font-bold bg-purple-600 text-white rounded">
                                            PROPOSTA COMERCIAL
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* TABELA DE REVISÃO */}
                            <table className="w-full text-xs border-collapse border border-slate-300 mb-8 text-center shadow-sm">
                                <thead className="bg-slate-100 font-bold text-slate-700">
                                    <tr>
                                        <td className="border border-slate-300 p-2 w-12">REV.</td>
                                        <td className="border border-slate-300 p-2">DESCRIÇÃO DA REVISÃO</td>
                                        <td className="border border-slate-300 p-2 w-20">ELAB.</td>
                                        <td className="border border-slate-300 p-2 w-28">DATA</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-slate-300 p-2 font-bold">{String((revisions.length > 0 ? revisions.length - 1 : 0)).padStart(2, '0')}</td>
                                        <td className="border border-slate-300 p-2 text-left">{revisionDescription}</td>
                                        <td className="border border-slate-300 p-2">{currentVendor?.initials || 'VEND'}</td>
                                        <td className="border border-slate-300 p-2">{dateStr}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* TABELA DE DADOS DO CLIENTE */}
                            <div className="border border-slate-300 rounded overflow-hidden mb-12 shadow-sm">
                                <table className="w-full text-xs">
                                    <tbody>
                                        <tr className="border-b border-slate-200">
                                            <td className="p-3 font-bold bg-slate-50 w-32 text-slate-600">Solicitante:</td>
                                            <td className="p-3 text-slate-800 font-semibold">{currentCustomer?.tradeName || "..."}</td>
                                        </tr>
                                        <tr className="border-b border-slate-200">
                                            <td className="p-3 font-bold bg-slate-50 text-slate-600">CNPJ:</td>
                                            <td className="p-3 text-slate-800">{currentCustomer?.cnpj || "..."}</td>
                                        </tr>
                                        <tr className="border-b border-slate-200">
                                            <td className="p-3 font-bold bg-slate-50 text-slate-600">Responsável:</td>
                                            <td className="p-3 text-slate-800">{currentCustomer?.contactName || "..."}</td>
                                        </tr>
                                        <tr className="border-b border-slate-200">
                                            <td className="p-3 font-bold bg-slate-50 text-slate-600">Email:</td>
                                            <td className="p-3 text-slate-800">{currentCustomer?.email || "..."}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-bold bg-slate-50 text-slate-600">Telefone:</td>
                                            <td className="p-3 text-slate-800">{currentCustomer?.phone || "..."}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* ASSINATURA */}
                            <div className="mt-8 pt-8 text-sm">
                                <p className="text-slate-500 mb-4">Atenciosamente,</p>
                                <div className="inline-block">
                                    <p className="font-bold text-slate-900 text-lg">{currentVendor?.name || "Departamento Comercial"}</p>
                                    <div className="h-1 w-full bg-emerald-500 mt-1 mb-2"></div>
                                    <p className="text-slate-600">EXS Solutions - Departamento Comercial</p>
                                    <p className="text-slate-600 flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5" />
                                        {currentVendor?.phone || "(19) 3468-0000"}
                                    </p>
                                    <p className="text-slate-600 text-xs mt-1 flex items-center gap-1.5">
                                        <Mail className="w-3 h-3" />
                                        {currentVendor?.email || "comercial@gpecx.com"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <RentalProposalFooter page={getLogicalPageNumber(1)} total={totalPages} />
                </div>
            )}

            {/* PAGINA 2: SOBRE A EMPRESA E OBJETIVO */}
            {shouldShow(2) && (
                <div className="bg-white shadow-2xl text-slate-900 flex flex-col overflow-hidden relative" style={pageStyle}>
                    <RentalProposalHeader quoteNumber={quoteNumber} />

                    <div className="flex-1 flex flex-col pl-[30mm] pr-[20mm] py-[10mm] pb-[20mm]">
                        {/* 1. Sobre a Empresa */}
                        <div className="mb-8">
                            <h2 className="text-lg font-bold text-emerald-800 border-b-2 border-emerald-100 mb-4 pb-1">
                                1. Sobre a Empresa
                            </h2>
                            <p className="text-justify mb-4 text-slate-700 leading-relaxed">
                                A <strong>EXS SOLUTIONS</strong>, braço estratégico do Grupo GPECX, atua desde 2021 consolidando-se como referência nos segmentos de Geração, Transmissão e Distribuição de energia elétrica.
                            </p>
                            <p className="text-justify mb-6 text-slate-700 leading-relaxed">
                                Somos especialistas no desenvolvimento de tecnologias proprietárias, integrando Engenharia Elétrica, Automação e Controle para entregar soluções robustas e de alta confiabilidade operacional. Nosso compromisso é com a inovação e a excelência técnica.
                            </p>

                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg flex flex-col gap-4 text-sm text-emerald-900">
                                <div className="flex gap-8 flex-wrap">
                                    <div>
                                        <p className="text-xs font-bold text-emerald-600 mb-1">RAZÃO SOCIAL</p>
                                        <p className="font-semibold">EXS SOLUTIONS LTDA</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-emerald-600 mb-1">CNPJ</p>
                                        <p className="font-mono">42.982.549/0001-79</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-emerald-600 mb-1">INSCRIÇÃO ESTADUAL</p>
                                        <p className="font-mono">165.567.594.116</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-emerald-600 mb-1">ENDEREÇO</p>
                                    <p>Avenida Campos Sales, nº 1424, Loja 01 Andar Térreo, Chácara Girassol, Americana, SP, CEP: 13465-590</p>
                                </div>
                                <div className="border-t border-emerald-200 pt-4 mt-2">
                                    <p className="text-xs font-bold text-emerald-600 mb-2">DADOS BANCÁRIOS</p>
                                    <div className="flex gap-8 flex-wrap">
                                        <div>
                                            <p className="text-xs text-emerald-700 font-semibold">BANCO</p>
                                            <p className="font-mono text-xs">Sicoob (756)</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-emerald-700 font-semibold">AGÊNCIA</p>
                                            <p className="font-mono text-xs">3194</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-emerald-700 font-semibold">CONTA CORRENTE</p>
                                            <p className="font-mono text-xs">9.768.744-8</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-emerald-700 font-semibold">CHAVE PIX</p>
                                            <p className="font-mono text-xs">42.982.549/0001-79</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Objetivo */}
                        <div>
                            <h2 className="text-lg font-bold text-emerald-800 border-b-2 border-emerald-100 mb-4 pb-1">
                                2. Objetivo
                            </h2>
                            <p className="text-justify text-slate-700 leading-relaxed">
                                O presente documento tem como objetivo apresentar uma proposta de locação de equipamentos detalhada para o fornecimento de equipamentos e soluções para o referido solicitante.
                            </p>
                            <p className="text-justify text-slate-700 mt-2 text-xs italic opacity-75">
                                * O conteúdo desta proposta é confidencial e de propriedade intelectual da EXS Solutions.
                            </p>
                        </div>
                    </div>

                    <RentalProposalFooter page={getLogicalPageNumber(2)} total={totalPages} />
                </div>
            )}

            {/* PAGINA 3: PROPOSTA TÉCNICA */}
            {shouldShow(3) && (
                <div className="bg-white shadow-2xl text-slate-900 flex flex-col overflow-hidden relative" style={pageStyle}>
                    <RentalProposalHeader quoteNumber={quoteNumber} />

                    <div className="flex-1 flex flex-col pl-[30mm] pr-[20mm] py-[10mm] pb-[20mm]">
                        <h2 className="text-lg font-bold text-emerald-800 border-b-2 border-emerald-100 mb-6 pb-1">
                            3. PROPOSTA TÉCNICA
                        </h2>

                        <p className="mb-4 text-sm font-bold text-slate-700">3.1 Escopo Geral</p>
                        <p className="mb-4 text-sm text-slate-600">Fornecimento dos itens selecionados na tabela 1.</p>

                        {/* Tabela de Equipamentos */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                            <table className="w-full text-xs">
                                <thead className="bg-emerald-50 text-emerald-900 font-bold border-b border-emerald-100">
                                    <tr>
                                        <th className="p-3 text-left">DESCRIÇÃO</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedEquipment.map((eq: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-50">
                                            <td className="p-3 text-slate-700 font-semibold">{eq.name}</td>
                                        </tr>
                                    ))}
                                    {selectedEquipment.length === 0 && <tr><td className="p-6 text-center text-slate-400 italic">Nenhum equipamento selecionado.</td></tr>}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-6 border border-slate-100 mb-6">
                            <p className="font-bold text-emerald-800 mb-3 text-xs">Será fornecido junto com o equipamento:</p>
                            <ul className="space-y-2 text-xs text-slate-600">
                                {selectedEquipment[0]?.accessories && selectedEquipment[0].accessories.length > 0 ? (
                                    selectedEquipment[0].accessories.map((acc: any, i: number) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-emerald-500 mt-1">✓</span> {acc.name}
                                        </li>
                                    ))
                                ) : (
                                    <li className="flex items-start gap-2 text-slate-400 italic">
                                        Nenhum acessório cadastrado para este equipamento.
                                    </li>
                                )}
                            </ul>
                        </div>


                    </div>

                    <RentalProposalFooter page={getLogicalPageNumber(3)} total={totalPages} />
                </div>
            )}

            {/* PAGINA 4: TREINAMENTO E OBRIGAÇÕES */}
            {shouldShow(4) && showTech && (
                <div className="bg-white shadow-2xl text-slate-900 flex flex-col overflow-hidden relative" style={pageStyle}>
                    <RentalProposalHeader quoteNumber={quoteNumber} />

                    <div className="flex-1 flex flex-col pl-[30mm] pr-[20mm] py-[10mm] pb-[20mm]">
                        <h2 className="text-sm font-bold text-slate-800 mb-3">3.2 Requisitos, Experiências e Habilidades</h2>
                        <p className="text-sm text-slate-700 mb-6 text-justify leading-relaxed">
                            Para evitar danos ao equipamento e ao usuário, é necessário que seu uso seja realizado por uma pessoa capacitada.
                        </p>

                        <h2 className="text-sm font-bold text-slate-800 mb-4">3.3 Treinamento e Suporte Técnico</h2>
                        <p className="text-sm text-slate-700 mb-6 text-justify leading-relaxed">
                            O treinamento será realizado exclusivamente antes da retirada do equipamento, e o suporte técnico estará disponível somente após a efetiva retirada do mesmo. Caso o cliente deseje agendar o treinamento após a retirada, este deverá ser solicitado com, no mínimo, 3 (três) dias de antecedência, sendo agendado conforme a disponibilidade do instrutor.
                        </p>

                        <h2 className="text-sm font-bold text-slate-800 mb-3">3.4 Obrigações da EXS</h2>
                        <ul className="list-disc pl-6 space-y-2 text-sm text-slate-700 mb-6">
                            <li>Fornecer o(s) equipamento(s) em bom estado;</li>
                            <li>Fornecer todos os acessórios e softwares do(s) equipamento(s);</li>
                        </ul>

                        <h2 className="text-sm font-bold text-slate-800 mb-3">3.5 Obrigações do Locatário</h2>
                        <ul className="list-disc pl-6 space-y-2 text-sm text-slate-700">
                            <li>Preservar o estado físico do(s) equipamento(s);</li>
                            <li>Devolver o(s) equipamento(s) no mesmo estado que foi recebido;</li>
                            <li>Devolver todos os acessórios e ferramentas que foi recebido;</li>
                            <li>Enviar dados cadastrais para emissão de nota de remessa;</li>
                            <li>Enviar certidão negativa de débitos atualizada.</li>
                        </ul>
                    </div>

                    <RentalProposalFooter page={getLogicalPageNumber(4)} total={totalPages} />
                </div>
            )}

            {/* PAGINA 5: PROPOSTA COMERCIAL */}
            {shouldShow(5) && showComm && (
                <div className="bg-white shadow-2xl text-slate-900 flex flex-col overflow-hidden relative" style={pageStyle}>
                    <RentalProposalHeader quoteNumber={quoteNumber} />

                    <div className="flex-1 flex flex-col pl-[30mm] pr-[20mm] py-[8mm] pb-[18mm]">
                        <h2 className="text-lg font-bold text-emerald-800 border-b-2 border-emerald-100 mb-4 pb-1">
                            4. PROPOSTA COMERCIAL
                        </h2>

                        <h3 className="text-sm font-bold text-slate-800 mb-3">4.1 Preços</h3>
                        <p className="text-xs text-center text-slate-600 mb-2"><em>Tabela 2 – Preços</em></p>

                        {/* Tabela de Preços */}
                        <div className="mb-6">
                            <table className="w-full text-xs border-collapse border border-slate-200 mb-4">
                                <thead className="bg-slate-800 text-white">
                                    <tr>
                                        <th className="border border-slate-300 p-2">ITEM</th>
                                        <th className="border border-slate-300 p-2">DESCRIÇÃO</th>
                                        <th className="border border-slate-300 p-2">FABRICANTE</th>
                                        <th className="border border-slate-300 p-2">QTD.</th>
                                        <th className="border border-slate-300 p-2">PERÍODO</th>
                                        <th className="border border-slate-300 p-2">VALOR DIÁRIAS</th>
                                        <th className="border border-slate-300 p-2">QTD DIÁRIAS</th>
                                        <th className="border border-slate-300 p-2">VALOR TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedEquipment.map((eq, i) => (
                                        <tr key={i}>
                                            <td className="border border-slate-300 p-2 text-center">{i + 1}</td>
                                            <td className="border border-slate-300 p-2">{eq.name}</td>
                                            <td className="border border-slate-300 p-2 text-center">EXS</td>
                                            <td className="border border-slate-300 p-2 text-center">1</td>
                                            <td className="border border-slate-300 p-2 text-center">{formatBRDate(rentalStartDate)} - {formatBRDate(rentalEndDate)}</td>
                                            <td className="border border-slate-300 p-2 text-right">{formatCurrency(eq.rentPrice || 0, 'BRL')}</td>
                                            <td className="border border-slate-300 p-2 text-center">{totalDays}</td>
                                            <td className="border border-slate-300 p-2 text-right font-bold">{i === 0 ? formatCurrency(totalValue, 'BRL') : '-'}</td>
                                        </tr>
                                    ))}
                                    <tr className="font-bold">
                                        <td colSpan={7} className="border border-slate-300 p-2 text-right">DESCONTO:</td>
                                        <td className="border border-slate-300 p-2 text-right">R$ {discountValue.toFixed(2)}</td>
                                    </tr>
                                    <tr className="bg-emerald-600 text-white font-bold">
                                        <td colSpan={7} className="border border-slate-300 p-2 text-right">TOTAL:</td>
                                        <td className="border border-slate-300 p-2 text-right text-lg">{formatCurrency(finalValue, 'BRL')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* CONDIÇÕES DE LOCAÇÃO - Grid 2 colunas como PVE */}
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div className="bg-slate-50 p-4 rounded border border-slate-100">
                                <h3 className="font-bold text-emerald-800 mb-3 text-xs uppercase">Condições de Locação</h3>
                                <div className="space-y-2">
                                    <p><span className="font-semibold text-slate-600">Frete:</span> {freightIncluded ? 'CIF (Incluso)' : 'FOB (Cliente Retira)'}</p>
                                    <p><span className="font-semibold text-slate-600">Retirada:</span> {formatBRDate(rentalStartDate)} às 9:00-11:50 / 13:00-17:00</p>
                                    <p><span className="font-semibold text-slate-600">Devolução:</span> {formatBRDate(rentalEndDate)} às 9:00 (±3h)</p>
                                    <p><span className="font-semibold text-slate-600">Validade:</span> {validityDays} dias úteis</p>
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-200">
                                    <p className="text-[10px] text-slate-700 text-justify leading-tight">
                                        <strong>OBSERVAÇÃO:</strong> Para período acima de 30 diárias, será emitida a nota fiscal parcial mensal, à 30DDL.
                                    </p>
                                    <p className="text-[10px] text-slate-700 text-justify leading-tight mt-1">
                                        <strong>NOTA:</strong> Caso seja prorrogado o prazo de locação, o locador deverá quitar os valores já devidos, o restante do valor das diárias adicionais deverá ser pago no ato da entrega do equipamento.
                                    </p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded border border-slate-100">
                                <h3 className="font-bold text-emerald-800 mb-3 text-xs uppercase">Pagamento e Impostos</h3>
                                <div className="space-y-2">
                                    <p><span className="font-semibold text-slate-600">Condição:</span> {paymentTerms}</p>
                                    <p><span className="font-semibold text-slate-600">Impostos:</span> Inclusos</p>
                                    <p><span className="font-semibold text-slate-600">Expediente:</span> Segunda a sexta-feira</p>
                                    <p><span className="font-semibold text-slate-600">Local:</span> Americana - SP</p>
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-200">
                                    <p className="text-[10px] text-slate-700 text-justify leading-tight">
                                        <strong>NOTA:</strong> A locação de bens móveis é uma das espécies de contratos previstos no Código Civil. De acordo com o art. 565 a locação de equipamentos é uma operação de locação de bens móveis, onde uma das partes se obriga a ceder à outra, por tempo determinado ou não, o uso e gozo da coisa fungível mediante certa retribuição. Além disto, os bens objeto da locação deve estar devidamente incorporados ao ativo imobilizado da empresa locadora.
                                    </p>
                                    <p className="text-[10px] text-slate-700 text-justify leading-tight mt-1">
                                        O artigo 1° da Lei Complementar 116/2003 dispõe que o ISS tem como fato gerador a prestação de serviços constante na lista anexa. A locação de bens móveis não constitui uma prestação de serviços, pois não é item constante na lista de serviços anexa à referida Lei Complementar. Trata-se meramente de uma disponibilização de bem, seja ele imóvel ou móvel para utilização do locatário sem, entretanto, caracterizar a prestação de um serviço.
                                    </p>
                                </div>
                            </div>
                        </div>


                        {/* Observações Especiais */}
                        {additionalNotes && additionalNotes.trim() !== '' && (
                            <div className="mt-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                                <h3 className="font-bold text-amber-800 mb-2 text-xs uppercase flex items-center gap-2">
                                    <span>⚠️</span> Observações Especiais
                                </h3>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{additionalNotes}</p>
                            </div>
                        )}
                    </div>

                    <RentalProposalFooter page={getLogicalPageNumber(5)} total={totalPages} />
                </div>
            )}



            {/* PAGINA 6: CONDIÇÕES GERAIS E FORO */}
            {shouldShow(6) && showComm && (
                <div className="bg-white shadow-2xl text-slate-900 flex flex-col overflow-hidden relative" style={pageStyle}>
                    <RentalProposalHeader quoteNumber={quoteNumber} />

                    <div className="flex-1 flex flex-col pl-[30mm] pr-[20mm] py-[10mm] pb-[20mm]">
                        <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 mb-3 pb-1">
                            5. CONDIÇÕES GERAIS DE LOCAÇÃO
                        </h2>
                        <div className="space-y-3 text-[10px] text-justify leading-relaxed text-slate-600">
                            {RENTAL_LEGAL_TERMS.map((term, i) => (
                                <p key={i}>
                                    <strong className="text-slate-800">{term.title}</strong> {term.text}
                                </p>
                            ))}
                        </div>

                        <div className="mt-8 pt-4">
                            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 mb-2 pb-1">
                                6. FORO
                            </h2>
                            <p className="text-[10px] text-justify leading-relaxed text-slate-600">
                                O foro de Americana/SP será o único competente para ações e medidas judiciais relativas à interpretação e/ou execução do contrato, com exclusão de qualquer outro, por mais privilegiado que seja.
                            </p>
                        </div>
                    </div>

                    <RentalProposalFooter page={getLogicalPageNumber(6)} total={totalPages} />
                </div>
            )}

            {/* PAGINA 7: ANEXOS - IMAGENS */}
            {shouldShow(7) && (
                <div className="bg-white shadow-2xl text-slate-900 flex flex-col overflow-hidden relative" style={pageStyle}>
                    <RentalProposalHeader quoteNumber={quoteNumber} />

                    <div className="flex-1 flex flex-col pl-[30mm] pr-[20mm] py-[10mm] pb-[20mm]">
                        <h2 className="text-lg font-bold text-emerald-800 border-b-2 border-emerald-100 mb-6 pb-1">
                            ANEXOS - Imagens dos Equipamentos e Acessórios
                        </h2>

                        <div className="grid grid-cols-4 gap-3">
                            {/* Equipment Images */}
                            {selectedEquipment.map((equipment: any, idx: number) => (
                                <div key={`eq-${idx}`} className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                                    <div className="aspect-square bg-white rounded mb-2 flex items-center justify-center overflow-hidden">
                                        {equipment.imageUrl ? (
                                            <img
                                                src={equipment.imageUrl}
                                                alt={equipment.name}
                                                className="max-w-full max-h-full object-contain"
                                            />
                                        ) : (
                                            <span className="text-slate-400 text-xs">Sem imagem</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] leading-tight font-bold text-slate-700 text-center">{equipment.name}</p>
                                </div>
                            ))}

                            {/* Accessory Images */}
                            {selectedEquipment.flatMap((eq: any, eqIdx: number) =>
                                (eq.accessories || []).map((accessory: any, accIdx: number) => (
                                    <div key={`acc-${eqIdx}-${accIdx}`} className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                                        <div className="aspect-square bg-white rounded mb-2 flex items-center justify-center overflow-hidden">
                                            {accessory.imageUrl ? (
                                                <img
                                                    src={accessory.imageUrl}
                                                    alt={accessory.name}
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            ) : (
                                                <span className="text-slate-400 text-xs">Sem imagem</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] leading-tight font-bold text-slate-700 text-center">
                                            {accessory.name} - {eq.name}
                                        </p>
                                    </div>
                                ))
                            )}

                            {selectedEquipment.length === 0 && (
                                <div className="col-span-4 text-center text-slate-400 py-12">
                                    <p>Nenhum equipamento selecionado</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <RentalProposalFooter page={getLogicalPageNumber(7)} total={totalPages} />
                </div>
            )}

        </div>
    );
}
