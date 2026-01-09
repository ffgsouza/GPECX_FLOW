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
        <div className="absolute bottom-0 left-0 w-full h-[15mm] bg-[#061629] flex items-center justify-between pl-[30mm] pr-[20mm]">
            <span className="text-white text-[9px]">Rua Antônio Gonzáles Vasques, 128 – Bosque da Saúde. Americana - SP, 13478-510.</span>
            <span className="text-white text-xs font-bold">Página {page} de {total}</span>
        </div>
    );
}

export function RentalProposalDocument({
    quoteNumber = "NOVA",
    revisions = [],
    revisionDescription = "",
    dateStr = new Date().toLocaleDateString('pt-BR'),
    currentVendor,
    currentCustomer,
    selectedEquipment,
    rentalStartDate,
    rentalEndDate,
    totalDays,
    totalValue,
    discountPercent,
    discountValue,
    finalValue,
    paymentTerms,
    validityDays,
    additionalNotes = "",
    previewPage
}: RentalProposalDocumentProps) {

    // Helper de Renderização Condicional de Páginas
    const shouldShow = (pageNum: number) => !previewPage || previewPage === pageNum;

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
                            </div>

                            {/* TABELA DE REVISÃO */}
                            <table className="w-full text-xs border-collapse border border-slate-300 mb-8 text-center shadow-sm">
                                <thead className="bg-slate-100 font-bold text-slate-700">
                                    <tr>
                                        <td className="border border-slate-300 p-2 w-12">REV.</td>
                                        <td className="border border-slate-300 p-2">DESCRIÇÃO DA REVISÃO</td>
                                        <td className="border border-slate-300 p-2 w-20">ELAB.</td>
                                        <td className="border border-slate-300 p-2 w-20">APROV.</td>
                                        <td className="border border-slate-300 p-2 w-28">DATA</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-slate-300 p-2 font-bold">{String((revisions.length > 0 ? revisions.length - 1 : 0)).padStart(2, '0')}</td>
                                        <td className="border border-slate-300 p-2 text-left">{revisionDescription}</td>
                                        <td className="border border-slate-300 p-2">{currentVendor?.initials || 'TB'}</td>
                                        <td className="border border-slate-300 p-2">{currentVendor?.initials || 'TB'}</td>
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
                                    <p className="font-bold text-slate-900 text-lg">{currentVendor?.name || "Thais Brito"}</p>
                                    <div className="h-1 w-full bg-emerald-500 mt-1 mb-2"></div>
                                    <p className="text-slate-600">Dep. Comercial</p>
                                    <p className="text-slate-600 flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5" />
                                        Contato: {currentVendor?.phone || "(19) 97129-0901"}
                                    </p>
                                    <p className="text-slate-600 text-xs mt-1 flex items-center gap-1.5">
                                        <Mail className="w-3 h-3" />
                                        {currentVendor?.email || "comercial@gpecx.com"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <RentalProposalFooter page={1} total={7} />
                </div>
            )}

            {/* PAGINA 2: SOBRE A EMPRESA E OBJETIVO */}
            {shouldShow(2) && (
                <div className="bg-white shadow-2xl text-slate-900 flex flex-col overflow-hidden relative" style={pageStyle}>
                    <RentalProposalHeader quoteNumber={quoteNumber} />

                    <div className="flex-1 flex flex-col pl-[30mm] pr-[20mm] py-[10mm] pb-[20mm]">
                        {/* 1. Sobre a Empresa */}
                        <div className="mb-8">
                            <h2 className="text-lg font-bold text-emeral d-800 border-b-2 border-emerald-100 mb-4 pb-1">
                                1. SOBRE A EMPRESA
                            </h2>
                            <p className="text-justify mb-4 text-slate-700 leading-relaxed text-sm">
                                A EXS SOLUTION, Integrante do Grupo GPECx, possui experiência desde 2014, em atendimento ao mercado nos segmentos de geração, cogeração, distribuição e transmissão de energia elétrica, vem gradativamente se consolidando uma empresa referência para seus clientes e parceiros.
                            </p>
                            <p className="text-justify mb-6 text-slate-700 leading-relaxed text-sm">
                                Somos especialistas em desenvolvimento de produtos e soluções para setor de energia elétrica.
                            </p>
                            <p className="text-justify mb-6 text-slate-700 leading-relaxed text-sm">
                                Devido ao conhecimento diversificado dos nossos colabores, conseguimos atender nossos clientes e parceiros em vários setores tais como:
                            </p>
                            <ul className="list-disc pl-6 space-y-1 text-sm text-slate-700 mb-6">
                                <li>Engenharia Elétrica;</li>
                                <li>Engenharia de Automação;</li>
                                <li>Engenharia de Controle;</li>
                                <li>Desenvolvimento de Softwares;</li>
                                <li>Desenvolvimento de Produtos;</li>
                                <li>Consultoria;</li>
                                <li>Cursos e Treinamentos.</li>
                            </ul>

                            <h3 className="text-base font-bold text-slate-800 mb-3">1.1 Dados cadastrais</h3>
                            <p className="text-sm"><strong>Razão Social:</strong> EXS SOLUTIONS LTDA</p>
                            <p className="text-sm"><strong>CNPJ:</strong> 42.982.549/0001-79</p>
                        </div>

                        {/* 2. Objetivo */}
                        <div>
                            <h2 className="text-lg font-bold text-emerald-800 border-b-2 border-emerald-100 mb-4 pb-1">
                                2. OBJETIVO
                            </h2>
                            <p className="text-justify text-slate-700 leading-relaxed text-sm">
                                O presente documento tem como objetivo, apresentar uma proposta técnica comercial para o referido solicitante, o conteúdo desta proposta não pode ser revelado fora da empresa citada para nenhuns fins sem que haja o consentimento da <strong>EXS SOLUTIONS.</strong>
                            </p>
                        </div>
                    </div>

                    <RentalProposalFooter page={2} total={7} />
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
                                        <th className="p-3 text-left w-32">MODELO</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedEquipment.map((eq, i) => (
                                        <tr key={i} className="hover:bg-slate-50">
                                            <td className="p-3 text-slate-700">{eq.name}</td>
                                            <td className="p-3 text-slate-600">{eq.serialNumber}</td>
                                        </tr>
                                    ))}
                                    {selectedEquipment.length === 0 && <tr><td colSpan={2} className="p-6 text-center text-slate-400 italic">Nenhum equipamento selecionado.</td></tr>}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-6 border border-slate-100 mb-6">
                            <p className="font-bold text-emerald-800 mb-3 text-xs">Será fornecido junto com o equipamento:</p>
                            <ul className="space-y-2 text-xs text-slate-600">
                                {selectedEquipment[0]?.accessories && selectedEquipment[0].accessories.length > 0 ? (
                                    selectedEquipment[0].accessories.map((acc, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-emerald-500 mt-1">✓</span> {acc}
                                        </li>
                                    ))
                                ) : (
                                    <>
                                        <li className="flex items-start gap-2">
                                            <span className="text-emerald-500 mt-1">✓</span> Certificado de calibração;
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-emerald-500 mt-1">✓</span> Software de utilização atualizado (Quando aplicável);
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-emerald-500 mt-1">✓</span> Todos os acessórios (Contidos no Checklist do equipamento);
                                        </li>
                                    </>
                                )}
                            </ul>
                        </div>

                        <p className="text-sm font-bold text-slate-700 mb-2">3.2 Requisitos, Experiências e Habilidades</p>
                        <p className="text-sm text-slate-700">Para evitar danos ao equipamento e ao usuário, é necessário que seu uso seja realizado por uma pessoa capacitada.</p>
                    </div>

                    <RentalProposalFooter page={3} total={7} />
                </div>
            )}

            {/* PAGINA 4: TREINAMENTO E OBRIGAÇÕES */}
            {shouldShow(4) && (
                <div className="bg-white shadow-2xl text-slate-900 flex flex-col overflow-hidden relative" style={pageStyle}>
                    <RentalProposalHeader quoteNumber={quoteNumber} />

                    <div className="flex-1 flex flex-col pl-[30mm] pr-[20mm] py-[10mm] pb-[20mm]">
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

                    <RentalProposalFooter page={4} total={7} />
                </div>
            )}

            {/* PAGINA 5: PROPOSTA COMERCIAL */}
            {shouldShow(5) && (
                <div className="bg-white shadow-2xl text-slate-900 flex flex-col overflow-hidden relative" style={pageStyle}>
                    <RentalProposalHeader quoteNumber={quoteNumber} />

                    <div className="flex-1 flex flex-col pl-[30mm] pr-[20mm] py-[10mm] pb-[20mm]">
                        <h2 className="text-lg font-bold text-emerald-800 border-b-2 border-emerald-100 mb-6 pb-1">
                            4. PROPOSTA COMERCIAL
                        </h2>

                        <h3 className="text-sm font-bold text-slate-800 mb-3">4.1 Preços</h3>
                        <p className="text-xs text-center text-slate-600 mb-2"><em>Tabela 2 – Preços</em></p>

                        {/* Tabela de Preços */}
                        <div className="mb-8">
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
                                            <td className="border border-slate-300 p-2 text-center">{rentalStartDate} - {rentalEndDate}</td>
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
                            <p className="text-xs text-center text-slate-600"><em>OBS: DESCONTO DE {discountPercent}% COMO PARCERIA</em></p>
                        </div>

                        {/* Descontos por período */}
                        <ul className="list-disc pl-6 space-y-1 text-xs text-slate-700 mb-6">
                            <li>Locação mensal: 10% de desconto;</li>
                            <li>Locação trimestral: 12.5% de desconto;</li>
                            <li>Locação semestral: 15% de desconto;</li>
                            <li>Locação anual: 25% de desconto;</li>
                        </ul>

                        {/* PERÍODO DE LOCAÇÃO */}
                        <div className="mb-6">
                            <p className="font-bold text-slate-800 mb-2 text-sm">PERÍODO DE LOCAÇÃO:</p>
                            <ul className="space-y-1 text-xs text-slate-700">
                                <li><strong>Retirada:</strong> {rentalStartDate} a partir das 9:00 até as 11:50 e da 13:00 até às 17:00</li>
                                <li><strong>Devolução:</strong> {rentalEndDate} às 9:00 (Tolerância +- 3 horas)</li>
                                <li className="text-xs text-slate-600">Caso o equipamento seja entregue após a tolerância, será contabilizada uma nova diária.</li>
                                <li className="mt-2"><strong>Expediente:</strong> Segunda a sexta-feira</li>
                                <li><strong>Local:</strong> Sede da ExS Solutions: Rua Antônio Gonzáles Vasques – Bosque da Saúde. Americana - SP, 13478-510.</li>
                            </ul>
                        </div>

                        <p className="text-sm"><strong>4.2 Frete:</strong> Por conta do cliente, não trabalhamos com envio de equipamentos!</p>
                    </div>

                    <RentalProposalFooter page={5} total={7} />
                </div>
            )}

            {/* PAGINA 6: CONDIÇÕES DE PAGAMENTO E VALIDADE */}
            {shouldShow(6) && (
                <div className="bg-white shadow-2xl text-slate-900 flex flex-col overflow-hidden relative" style={pageStyle}>
                    <RentalProposalHeader quoteNumber={quoteNumber} />

                    <div className="flex-1 flex flex-col pl-[30mm] pr-[20mm] py-[10mm] pb-[20mm]">
                        <h2 className="text-sm font-bold text-slate-800 mb-4">4.3 Condições de Pagamento</h2>
                        <p className="text-sm text-slate-700 mb-4">Prazo pagamento, conforme opções abaixo:</p>

                        <table className="w-full text-xs border-collapse border border-slate-200 mb-4">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="border border-slate-300 p-2 text-left">ITEM</th>
                                    <th className="border border-slate-300 p-2 text-left">DESCRIÇÃO</th>
                                    <th className="border border-slate-300 p-2 text-right">Prazo</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-slate-300 p-2 text-center">1</td>
                                    <td className="border border-slate-300 p-2">{paymentTerms}</td>
                                    <td className="border border-slate-300 p-2 text-right">45 DDL</td>
                                </tr>
                            </tbody>
                        </table>

                        <p className="text-xs text-slate-700 mb-4">
                            <strong>OBSERVAÇÃO:</strong> Para período acima de 30 diárias, será emitida a nota fiscal parcial mensal, à 30DDL.
                        </p>

                        <p className="text-xs text-slate-700 mb-6">
                            <strong>NOTA:</strong> Caso seja prorrogado o prazo de locação, o locador deverá quitar os valores já devidos, o restante do valor das diárias adicionais deverá ser pago no ato da entrega do equipamento.
                        </p>

                        <h2 className="text-sm font-bold text-slate-800 mb-2">4.4 Validade da Proposta:</h2>
                        <p className="text-sm text-slate-700 mb-6">{validityDays} dias úteis ou enquanto houver disponibilidade dos equipamentos para locação.</p>

                        <h2 className="text-sm font-bold text-slate-800 mb-2">4.5 Impostos:</h2>
                        <p className="text-sm text-slate-700 mb-2">Inclusos.</p>
                        <p className="text-xs text-slate-700 text-justify leading-relaxed">
                            <strong>NOTA:</strong> A locação de bens móveis é uma das espécies de contratos previstos no Código Civil. De acordo com o art. 565 a locação de equipamentos é uma operação de locação de bens móveis, onde uma das partes se obriga a ceder à outra, por tempo determinado ou não, o uso e gozo da coisa fungível mediante certa retribuição. Além disto, os bens objeto da locação deve estar devidamente incorporados ao ativo imobilizado da empresa locadora.
                        </p>
                        <p className="text-xs text-slate-700 text-justify leading-relaxed mt-2">
                            O artigo 1° da Lei Complementar 116/2003 dispõe que o ISS tem como fato gerador a prestação de serviços constante na lista anexa. A locação de bens móveis não constitui uma prestação de serviços, pois não é item constante na lista de serviços anexa à referida Lei Complementar. Trata-se meramente de uma disponibilização de bem, seja ele imóvel ou móvel para utilização do locatário sem, entretanto, caracterizar a prestação de um serviço.
                        </p>
                    </div>

                    <RentalProposalFooter page={6} total={7} />
                </div>
            )}

            {/* PAGINA 7: CONDIÇÕES GERAIS E FORO */}
            {shouldShow(7) && (
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

                    <RentalProposalFooter page={7} total={7} />
                </div>
            )}

        </div>
    );
}
