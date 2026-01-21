import { SaleProduct, Vendor, Revision, Customer, ProductType } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Phone, Mail } from "lucide-react";
import type { WorkspaceConfig } from "@/lib/companies";

const LEGAL_TERMS = [
    { title: "5.1 Aplicação", text: "Estas condições aplicam-se à aquisição de equipamentos. As condições específicas descritas na Proposta Comercial prevalecem sobre estas condições gerais em caso de divergência. O aceite da proposta ou a emissão do Pedido de Compra implica na aceitação integral destes termos." },
    { title: "5.2 Escopo", text: "Todo fornecimento ou serviço não expressamente listado na proposta será considerado adicional e será objeto de novo orçamento." },
    { title: "5.3 Responsabilidade e Garantia", text: "A EXS Solutions não responde por lucros cessantes ou danos indiretos. A garantia limita-se ao reparo ou substituição de itens comprovadamente defeituosos, excluindo-se casos de mau uso, conforme prazo estipulado no item \"Garantia\" desta proposta." },
    { title: "5.4 Inadimplência", text: "O atraso no pagamento acarretará multa de 2% (dois por cento), juros de mora de 1% ao mês e correção monetária. Em caso de cobrança judicial, serão acrescidos honorários advocatários de 20% e custas processuais." },
    { title: "5.5 Proteção contra Atraso", text: "Caso ocorra atraso na entrega por responsabilidade da EXS, concederemos, como empréstimo, um equipamento similar para uso até a entrega do equipamento novo definitivo (Diferencial EXS)." },
    { title: "5.6 Cancelamento", text: "Em caso de cancelamento do pedido pelo cliente (quebra de contrato), incidirá multa não compensatória de 10% sobre o valor total do contrato, além da retenção dos valores já pagos suficientes para cobrir despesas tributárias e de fabricação já incorridas." },
    { title: "5.7 Tributos", text: "Os preços incluem os impostos vigentes na data da proposta. Criação de novos tributos ou alteração de alíquotas posteriores a esta data implicarão na revisão automática dos preços para manter o equilíbrio econômico-financeiro." },
    { title: "5.8 Retirada e Pagamento", text: "Após o aviso de \"Pronto para Retirada/Entrega\", o cliente terá 5 dias úteis para receber o equipamento. Após este prazo, considerar-se-á o equipamento entregue para fins de faturamento e início da contagem dos prazos de pagamento restantes." }
];

interface ProposalDocumentProps {
    quoteNumber: string;
    revisions: Revision[];
    revisionDescription: string;
    dateStr: string;
    currentVendor?: Vendor;
    currentCustomer?: Customer;
    selectedProducts: SaleProduct[];
    showTech: boolean;
    showComm: boolean;
    finalPrice: number;
    paymentTerms: string;
    deliveryTime: string;
    validityDays: string;
    freightIncluded: boolean;
    warrantyPeriod?: string;
    additionalNotes?: string;
    previewPage?: number;
    productTypes?: ProductType[];
    quoteType?: "SALES" | "RENTAL" | "SERVICE";
    workspace?: WorkspaceConfig; // Workspace para branding dinâmico
}

// Helper function to get document title based on quote type
const getDocumentTitle = (quoteType?: 'SALES' | 'RENTAL' | 'SERVICE') => {
    switch (quoteType) {
        case 'RENTAL':
            return 'PROPOSTA DE LOCAÇÃO DE EQUIPAMENTOS';
        case 'SERVICE':
            return 'PROPOSTA TÉCNICA COMERCIAL';
        case 'SALES':
        default:
            return 'PROPOSTA DE VENDA DE EQUIPAMENTOS';
    }
};

// Sub-componente para o Cabeçalho Unificado
function ProposalHeader({ quoteNumber, workspace }: { quoteNumber: string; workspace?: WorkspaceConfig }) {
    // Cores padrão (EXS)
    const primaryColor = workspace?.color || '#10B981';
    const companyName = workspace?.name || 'EXS Solutions';
    const slogan = workspace?.slogan || 'Inovação que define soluções';
    const logoUrl = workspace?.logoUrl;

    return (
        <div className="w-full h-[25mm] bg-[#061629] flex items-center justify-between pl-[30mm] pr-[20mm] print:pl-[30mm] print:pr-[20mm]">
            <div className="flex items-center gap-4">
                {/* Logo ou Nome Estilizado */}
                {logoUrl ? (
                    <img
                        src={logoUrl}
                        alt={companyName}
                        className="h-12 object-contain"
                        style={{ maxHeight: '48px' }}
                    />
                ) : (
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter">
                            {workspace?.shortName || 'EXS'} <span style={{ color: primaryColor }}>SOLUTIONS</span>
                        </h1>
                    </div>
                )}
                {/* Slogan - sempre visível */}
                <p
                    className="text-[10px] font-bold uppercase tracking-widest mt-0.5"
                    style={{ color: `${primaryColor}80` }}
                >
                    {slogan}
                </p>
            </div>
            <div className="text-right">
                <div
                    className="text-white px-3 py-1 rounded text-sm font-bold shadow-md"
                    style={{ backgroundColor: primaryColor }}
                >
                    {quoteNumber.replace('-', ' ')}
                </div>
            </div>
        </div>
    );
}

// Sub-componente para o Rodapé Unificado
function ProposalFooter({ page, total }: { page: number, total: number }) {
    return (
        <div className="absolute bottom-0 left-0 w-full h-[15mm] bg-[#061629] flex items-center justify-end pr-[20mm]">
            <span className="text-white text-xs font-bold">Página {page} de {total}</span>
        </div>
    );
}

export default function ProposalDocument({
    quoteNumber,
    revisions,
    revisionDescription,
    dateStr,
    currentVendor,
    currentCustomer,
    selectedProducts,
    showTech,
    showComm,
    finalPrice,
    paymentTerms,
    deliveryTime,
    validityDays,
    freightIncluded,
    warrantyPeriod,
    additionalNotes,
    productTypes,
    previewPage,
    quoteType = 'SALES',
    workspace
}: ProposalDocumentProps) {


    const calculateTotalPages = () => {
        // Base: 3 páginas fixas (Capa, Equipamentos, Anexos)
        let total = 3;
        if (showTech) total += 1; // Página Técnica
        if (showComm) total += 2; // Páginas Comerciais (4 e 5)
        return total;
    };

    const totalPages = calculateTotalPages();

    // Novo mapeamento: Lógico (1..N) -> Físico (blocos do componente)
    const mapLogicalToPhysical = (logicalPage: number): number => {
        let currentLogical = 1;

        // 1. Capa (Sempre existe)
        if (logicalPage === currentLogical) return 1;
        currentLogical++;

        // 2. Institucional (Sempre existe)
        if (logicalPage === currentLogical) return 2;
        currentLogical++;

        // 3. Técnica (Opcional)
        if (showTech) {
            if (logicalPage === currentLogical) return 3;
            currentLogical++;
        }

        // 4. Comercial (Opcional - 2 páginas)
        if (showComm) {
            if (logicalPage === currentLogical) return 4;
            currentLogical++;
            if (logicalPage === currentLogical) return 5;
            currentLogical++;
        }

        // 5. Anexos (Sempre existe - última página)
        if (logicalPage === currentLogical) return 6;

        return -1;
    };

    // Atualizado: Renderiza baseado no mapeamento
    const shouldShow = (physicalPage: number) => {
        if (previewPage === undefined) return true; // Modo impressão: mostra tudo
        return mapLogicalToPhysical(previewPage) === physicalPage;
    };

    // Mapeamento inverso para o rodapé (Físico -> Lógico)
    const getLogicalPageNumber = (physicalPage: number): number => {
        let logical = 2; // Começa após Capa e Inst

        if (physicalPage === 1) return 1;
        if (physicalPage === 2) return 2;

        if (physicalPage === 3) {
            if (showTech) return ++logical;
            return -1; // Não deveria ser chamado se showTech false
        }

        // Ajusta contador se tech existe
        if (showTech) logical = 3;

        if (physicalPage === 4) return showComm ? ++logical : -1;
        if (physicalPage === 5) return showComm ? ++logical : -1;

        if (physicalPage === 6) return totalPages;

        return physicalPage;
    };

    // Estilos comuns de página
    const pageStyle = previewPage ? {
        minHeight: '297mm', // A4
        maxHeight: '297mm',
        height: '297mm',
    } : {
        minHeight: '297mm', // A4 Scroll Mode
    };

    // Ordenação dos Itens: UTS -> Licença -> Acessório (Por PREFIXO)
    const getTypePriority = (p: SaleProduct) => {
        const name = (p.name || '').trim();

        // Verificar apenas o INÍCIO do nome
        if (name.startsWith('UTS')) return 1;
        if (name.startsWith('Licença')) return 2;
        if (name.startsWith('Acessório')) return 3;

        return 99; // Outros (Kit, etc.)
    };

    const sortedProducts = [...selectedProducts].sort((a, b) => {
        const priorityDiff = getTypePriority(a) - getTypePriority(b);
        if (priorityDiff !== 0) return priorityDiff;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="w-[210mm] mx-auto bg-white print:m-0 print:w-full">

            {/* PAGINA 1: CAPA */}
            {shouldShow(1) && (
                <div className="bg-white shadow-2xl text-slate-900 flex flex-col overflow-hidden relative" style={pageStyle}>

                    <ProposalHeader quoteNumber={quoteNumber} workspace={workspace} />

                    {/* CONTEÚDO */}
                    <div className="flex-1 flex flex-col pl-[30mm] pr-[20mm] py-[10mm] pb-[20mm]">

                        <div className="py-6">
                            {/* CAIXA DE TÍTULO */}
                            <div className="mb-8 border-l-4 border-emerald-600 pl-4 py-2 bg-slate-50">
                                <p className="text-xs font-bold text-slate-500 uppercase">Documento</p>
                                <p className="text-lg font-black text-slate-800 mt-1">
                                    {getDocumentTitle(quoteType)}
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

                    <ProposalFooter page={getLogicalPageNumber(1)} total={totalPages} />
                </div>
            )}

            {/* ========== PÁGINA 2: INSTITUCIONAL ========== */}
            {shouldShow(2) && (
                <div className="bg-white shadow-2xl text-slate-900 flex flex-col overflow-hidden relative" style={pageStyle}>
                    <ProposalHeader quoteNumber={quoteNumber} workspace={workspace} />

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
                                O presente documento tem como objetivo apresentar uma {getDocumentTitle(quoteType).toLowerCase()} detalhada para o fornecimento de equipamentos e soluções para o referido solicitante.
                            </p>
                            <p className="text-justify text-slate-700 mt-2 text-xs italic opacity-75">
                                * O conteúdo desta proposta é confidencial e de propriedade intelectual da EXS Solutions.
                            </p>
                        </div>
                    </div>

                    <ProposalFooter page={getLogicalPageNumber(2)} total={totalPages} />
                </div>
            )}

            {/* ========== PÁGINA 3: PROPOSTA TÉCNICA ========== */}
            {shouldShow(3) && showTech && (
                <div className="bg-white shadow-2xl text-slate-900 flex flex-col overflow-hidden relative" style={pageStyle}>
                    <ProposalHeader quoteNumber={quoteNumber} workspace={workspace} />

                    <div className="flex-1 flex flex-col pl-[30mm] pr-[20mm] py-[10mm] pb-[20mm]">
                        <h2 className="text-lg font-bold text-emerald-800 border-b-2 border-emerald-100 mb-6 pb-1">
                            3. Proposta Técnica
                        </h2>

                        <p className="mb-4 text-sm font-bold text-slate-700">3.1 Escopo Geral de Fornecimento:</p>

                        <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                            <table className="w-full text-xs">
                                <thead className="bg-emerald-50 text-emerald-900 font-bold border-b border-emerald-100">
                                    <tr>
                                        <td className="p-3 w-16 text-center">Item</td>
                                        <td className="p-3">Descrição do Produto / Serviço</td>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sortedProducts.map((p, i) => (
                                        <tr key={i} className="hover:bg-slate-50">
                                            <td className="p-3 text-center font-bold text-emerald-600">{String(i + 1).padStart(2, '0')}</td>
                                            <td className="p-3 text-slate-700">
                                                <div className="flex items-center gap-3">
                                                    <span>{p.name}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {sortedProducts.length === 0 && <tr><td colSpan={2} className="p-6 text-center text-slate-400 italic">Nenhum item selecionado.</td></tr>}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-6 border border-slate-100">
                            <p className="font-bold text-emerald-800 mb-3 text-xs">Inclusos no fornecimento:</p>
                            <ul className="space-y-2 text-xs text-slate-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-500 mt-1">✓</span> Certificado de calibração RBC (Durante o Periodo de Garantia);
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-500 mt-1">✓</span> Treinamento operacional completo;
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-500 mt-1">✓</span> Acesso à comunidade ExS Colab;
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-500 mt-1">✓</span> Desconto em cursos e treinamentos de SPCS através do instituto SPCS;
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-500 mt-1">✓</span> Suporte técnico vitalício.
                                </li>
                            </ul>
                        </div>
                    </div>

                    <ProposalFooter page={getLogicalPageNumber(3)} total={totalPages} />
                </div>
            )}

            {/* ========== PÁGINA 4: PROPOSTA COMERCIAL ========== */}
            {shouldShow(4) && showComm && (
                <div className="bg-white shadow-2xl text-slate-900 flex flex-col overflow-hidden relative" style={pageStyle}>
                    <ProposalHeader quoteNumber={quoteNumber} workspace={workspace} />

                    <div className="flex-1 flex flex-col pl-[30mm] pr-[20mm] py-[10mm] pb-[20mm]">
                        <h2 className="text-lg font-bold text-emerald-800 border-b-2 border-emerald-100 mb-6 pb-1">
                            4. Proposta Comercial
                        </h2>

                        <div className="mb-8">
                            <table className="w-full text-xs border-separate border-spacing-0 rounded-lg overflow-hidden border border-slate-200">
                                <thead>
                                    <tr className="bg-slate-800 text-white">
                                        <th className="p-3 text-left w-16 pl-4">Item</th>
                                        <th className="p-3 text-left">Descrição</th>
                                        <th className="p-3 text-right pr-4 w-40">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {sortedProducts.map((p, i) => (
                                        <tr key={i}>
                                            <td className="p-3 text-center font-bold text-slate-400 border-r border-slate-100">{String(i + 1).padStart(2, '0')}</td>
                                            <td className="p-3 font-medium text-slate-700 border-r border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <span>{p.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right font-bold text-slate-800 bg-slate-50">
                                                {i === 0 ? formatCurrency(finalPrice, 'BRL') : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-emerald-600 text-white">
                                        <td colSpan={2} className="p-4 text-right font-bold text-sm uppercase tracking-wider">Valor Total da Proposta</td>
                                        <td className="p-4 text-right font-black text-xl">
                                            {formatCurrency(finalPrice, 'BRL')}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* CONDIÇÕES COMERCIAIS */}
                        <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
                            <div className="bg-slate-50 p-4 rounded border border-slate-100">
                                <h3 className="font-bold text-emerald-800 mb-3 text-xs uppercase">Condições de Fornecimento</h3>
                                <div className="space-y-2">
                                    <p><span className="font-semibold text-slate-600">Frete:</span> {freightIncluded ? "CIF (Incluso)" : "FOB (Por conta do cliente)"}</p>
                                    <p><span className="font-semibold text-slate-600">Prazo de Entrega:</span> {deliveryTime}</p>
                                    <p><span className="font-semibold text-slate-600">Validade:</span> {validityDays} dias</p>
                                    <p><span className="font-semibold text-slate-600">Garantia:</span> {warrantyPeriod || "24 Meses"} (Balcão)</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded border border-slate-100">
                                <h3 className="font-bold text-emerald-800 mb-3 text-xs uppercase">Pagamento e Impostos</h3>
                                <div className="space-y-2">
                                    <p><span className="font-semibold text-slate-600">Condição:</span> {paymentTerms}</p>
                                    <p><span className="font-semibold text-slate-600">Impostos:</span> Simples Nacional</p>
                                    <p><span className="font-semibold text-slate-600">Classificação Fiscal:</span> NCM {sortedProducts[0]?.ncm || "N/A"}</p>
                                </div>
                            </div>
                        </div>

                        {/* OBSERVAÇÕES ESPECIAIS */}
                        {additionalNotes && additionalNotes.trim() !== "" && (
                            <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                                <h3 className="font-bold text-amber-800 mb-2 text-xs uppercase flex items-center gap-2">
                                    <span>⚠️</span> Observações Especiais
                                </h3>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{additionalNotes}</p>
                            </div>
                        )}

                    </div>

                    <ProposalFooter page={getLogicalPageNumber(4)} total={totalPages} />
                </div>
            )}

            {/* ========== PÁGINA 5: CONDIÇÕES GERAIS ========== */}
            {shouldShow(5) && showComm && (
                <div className="bg-white shadow-2xl text-slate-900 flex flex-col overflow-hidden relative" style={pageStyle}>
                    <ProposalHeader quoteNumber={quoteNumber} workspace={workspace} />

                    <div className="flex-1 flex flex-col pl-[30mm] pr-[20mm] py-[10mm] pb-[20mm]">
                        <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 mb-3 pb-1">
                            5. Condições Gerais de Venda
                        </h2>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[9px] text-justify leading-relaxed text-slate-600">
                            {LEGAL_TERMS.map((term, i) => (
                                <div key={i}>
                                    <strong className="text-slate-800">{term.title}: </strong>{term.text}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-4">
                            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 mb-2 pb-1">
                                6. Foro
                            </h2>
                            <p className="text-[9px] text-justify leading-relaxed text-slate-600">
                                O foro de Americana/SP será o único competente para ações e medidas judiciais relativas à interpretação e/ou execução do contrato, com exclusão de qualquer outro, por mais privilegiado que seja.
                            </p>
                        </div>
                    </div>

                    <ProposalFooter page={getLogicalPageNumber(5)} total={totalPages} />
                </div>
            )}

            {/* ========== PÁGINA 6: ANEXOS ========== */}
            {shouldShow(6) && (
                <div className="bg-white shadow-2xl text-slate-900 flex flex-col overflow-hidden relative" style={pageStyle}>
                    <ProposalHeader quoteNumber={quoteNumber} workspace={workspace} />

                    <div className="flex-1 flex flex-col pl-[30mm] pr-[20mm] py-[10mm] pb-[20mm]">
                        <h2 className="text-lg font-bold text-emerald-800 border-b-2 border-emerald-100 mb-6 pb-1">
                            ANEXOS - Imagens dos Produtos
                        </h2>

                        <div className="grid grid-cols-4 gap-3">
                            {sortedProducts.filter(p => p.imageUrl).map((product, idx) => (
                                <div key={idx} className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                                    <div className="aspect-square bg-white rounded mb-2 flex items-center justify-center overflow-hidden">
                                        {product.imageUrl ? (
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                className="max-w-full max-h-full object-contain"
                                                loading="eager"
                                            />
                                        ) : (
                                            <span className="text-slate-400 text-xs">Sem imagem</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] leading-tight font-bold text-slate-700 text-center">{product.name}</p>
                                </div>
                            ))}
                            {sortedProducts.filter(p => p.imageUrl).length === 0 && (
                                <div className="col-span-2 text-center text-slate-400 py-12">
                                    <p>Nenhum produto com imagem disponível</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <ProposalFooter page={getLogicalPageNumber(6)} total={totalPages} />
                </div>
            )}

        </div>
    );
}
