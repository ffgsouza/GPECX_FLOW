import PDFDocument from 'pdfkit';

// Interface for Proposal Data
export interface ProposalData {
    quote: {
        quoteNumber: string;
        rentalStartDate: number;
        rentalEndDate: number;
        rentalDuration: number;
        finalValue: number;
        paymentTerms: string;
        validityDays: string;
        additionalNotes?: string;
        description?: string; // Revision description
    };
    customer: {
        name: string;
        cpfCnpj: string;
        email: string;
        phone: string;
        contactName?: string;
        tradeName?: string;
    };
    equipment: Array<{
        name: string;
        serialNumber?: string;
        rentPrice: number;
        imageUrl?: string;
    }>;
    vendor?: {
        name: string;
        email: string;
        phone: string;
        initials?: string;
    };
}

// Colors
const COLORS = {
    primary: '#10B981', // Emerald 500
    dark: '#061629',    // Dark Blue
    text: '#334155',    // Slate 700
    lightBg: '#ECFDF5', // Emerald 50
    white: '#FFFFFF',
    gray: '#64748B'
};

// Legal Terms (Copied from React Component)
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

export async function generateProposalPDF(data: ProposalData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 0, bottom: 0, left: 0, right: 0 }, // We handle margins manually for the colored bars
                autoFirstPage: false
            });

            const chunks: Buffer[] = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const totalPages = 5; // Fixed for this layout

            // --- HELPER FUNCTIONS ---

            const drawHeader = (pageNum: number) => {
                // Dark Blue Strip
                doc.rect(0, 0, 595.28, 70.87) // ~25mm height
                    .fill(COLORS.dark);

                // Logo (Text Placeholder for now)
                doc.fillColor(COLORS.white)
                    .fontSize(18)
                    .font('Helvetica-Bold')
                    .text('EXS SOLUTIONS', 85, 20); // 30mm padding left = ~85pt

                // Slogan
                doc.fontSize(8)
                    .fillColor(COLORS.primary)
                    .text('INOVAÇÃO QUE DEFINE SOLUÇÕES', 85, 42);

                // Quote Number Pill
                const quoteNum = data.quote.quoteNumber;
                const pillWidth = 100;
                doc.roundedRect(495 - pillWidth, 25, pillWidth, 20, 10) // Right aligned (~20mm padding right)
                    .fill(COLORS.primary);

                doc.fillColor(COLORS.white)
                    .fontSize(10)
                    .text(quoteNum, 495 - pillWidth, 30, { width: pillWidth, align: 'center' });
            };

            const drawFooter = (pageNum: number) => {
                // Footer Strip
                doc.rect(0, 841.89 - 42.52, 595.28, 42.52) // ~15mm height (A4 height is 841.89pt)
                    .fill(COLORS.dark);

                doc.fillColor(COLORS.white)
                    .fontSize(9)
                    .text(`Página ${pageNum} de ${totalPages}`, 0, 841.89 - 28, { align: 'right', width: 595.28 - 56 }); // ~20mm padding right
            };

            const addPage = (pageNum: number) => {
                doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
                drawHeader(pageNum);
                drawFooter(pageNum);
                // Reset margins for content
                // 30mm left, 20mm right, 10mm top (after header), 20mm bottom (before footer)
                // Header height ~70pt. Footer height ~42pt.
            };

            // --- PAGE 1: CAPA ---
            addPage(1);

            let y = 100;
            const marginX = 85; // 30mm
            const contentWidth = 595.28 - 85 - 56; // Page - Left - Right(20mm)

            // Title Box
            doc.rect(marginX, y, 4, 50).fill(COLORS.primary);
            doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica-Bold').text('DOCUMENTO', marginX + 15, y + 5);
            doc.fillColor(COLORS.text).fontSize(18).font('Helvetica-Bold').text('PROPOSTA DE LOCAÇÃO', marginX + 15, y + 20);
            doc.fillColor(COLORS.white).rect(marginX + 15, y + 45, 120, 20).fill(COLORS.primary);
            doc.fillColor(COLORS.white).fontSize(8).text('PROPOSTA COMPLETA', marginX + 25, y + 50);

            y += 100;

            // Revision Table
            const col1 = 40;
            const col2 = 250;
            const col3 = 60;


            doc.fillColor(COLORS.text).fontSize(10).font('Helvetica-Bold');
            // Header
            doc.rect(marginX, y, contentWidth, 20).fill('#F1F5F9'); // Slate 100
            doc.fillColor(COLORS.text).text('REV.', marginX + 5, y + 5);
            doc.text('DESCRIÇÃO DA REVISÃO', marginX + col1 + 5, y + 5);
            doc.text('ELAB.', marginX + col1 + col2 + 5, y + 5);
            doc.text('DATA', marginX + col1 + col2 + col3 + 5, y + 5);

            y += 20;
            // Row
            doc.rect(marginX, y, contentWidth, 25).stroke('#E2E8F0');
            doc.fillColor(COLORS.text).font('Helvetica');
            doc.text('00', marginX + 5, y + 8);
            doc.text(data.quote.description || 'Emissão Inicial', marginX + col1 + 5, y + 8);
            doc.text(data.vendor?.initials || 'VEND', marginX + col1 + col2 + 5, y + 8);
            doc.text(new Date().toLocaleDateString('pt-BR'), marginX + col1 + col2 + col3 + 5, y + 8);

            y += 60;

            // Customer Data
            doc.fontSize(10).font('Helvetica');
            const rowHeight = 25;
            const labelWidth = 100;

            const drawCustomerRow = (label: string, value: string) => {
                doc.rect(marginX, y, labelWidth, rowHeight).fill('#F8FAFC'); // Slate 50
                doc.fillColor(COLORS.gray).font('Helvetica-Bold').text(label, marginX + 5, y + 8);

                doc.rect(marginX + labelWidth, y, contentWidth - labelWidth, rowHeight).stroke('#E2E8F0');
                doc.fillColor(COLORS.text).font('Helvetica').text(value || '-', marginX + labelWidth + 5, y + 8);
                y += rowHeight;
            };

            drawCustomerRow('Solicitante:', data.customer.tradeName || data.customer.name);
            drawCustomerRow('CNPJ:', data.customer.cpfCnpj);
            drawCustomerRow('Responsável:', data.customer.contactName || data.customer.name);
            drawCustomerRow('Email:', data.customer.email);
            drawCustomerRow('Telefone:', data.customer.phone);

            // Signature (Bottom)
            y = 650;
            doc.text('Atenciosamente,', marginX, y);
            y += 40;
            doc.fontSize(14).font('Helvetica-Bold').text(data.vendor?.name || 'Departamento Comercial', marginX, y);
            y += 20;
            doc.rect(marginX, y, 200, 2).fill(COLORS.primary);
            y += 10;
            doc.fontSize(10).font('Helvetica').fillColor(COLORS.gray).text('EXS Solutions - Departamento Comercial', marginX, y);
            doc.text(data.vendor?.phone || '(19) 3468-0000', marginX, y + 15);
            doc.text(data.vendor?.email || 'comercial@gpecx.com', marginX, y + 30);


            // --- PAGE 2: INSTITUCIONAL ---
            addPage(2);
            y = 100;

            doc.fontSize(14).font('Helvetica-Bold').fillColor('#065F46') // Emerald 800
                .text('1. Sobre a Empresa', marginX, y);
            y += 30;

            doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
                .text('A EXS SOLUTIONS, braço estratégico do Grupo GPECX, atua desde 2021 consolidando-se como referência nos segmentos de Geração, Transmissão e Distribuição de energia elétrica.', { width: contentWidth, align: 'justify' });
            y += 40;
            doc.text('Somos especialistas no desenvolvimento de tecnologias proprietárias, integrando Engenharia Elétrica, Automação e Controle para entregar soluções robustas e de alta confiabilidade operacional. Nosso compromisso é com a inovação e a excelência técnica.', { width: contentWidth, align: 'justify' });
            y += 50;

            // Bank Details Box
            doc.rect(marginX, y, contentWidth, 150).fill(COLORS.lightBg);
            doc.rect(marginX, y, contentWidth, 150).stroke('#D1FAE5');

            let boxY = y + 15;
            const boxX = marginX + 15;

            // Col 1
            doc.fillColor('#059669').fontSize(8).font('Helvetica-Bold').text('RAZÃO SOCIAL', boxX, boxY);
            doc.fillColor('#064E3B').fontSize(10).text('EXS SOLUTIONS LTDA', boxX, boxY + 12);

            // Col 2
            doc.fillColor('#059669').fontSize(8).text('CNPJ', boxX + 150, boxY);
            doc.fillColor('#064E3B').fontSize(10).font('Courier').text('42.982.549/0001-79', boxX + 150, boxY + 12);

            boxY += 40;
            doc.fillColor('#059669').fontSize(8).font('Helvetica-Bold').text('ENDEREÇO', boxX, boxY);
            doc.fillColor('#064E3B').fontSize(9).font('Helvetica').text('Avenida Campos Sales, nº 1424, Loja 01 Andar Térreo, Chácara Girassol, Americana, SP, CEP: 13465-590', boxX, boxY + 12, { width: 400 });

            boxY += 45;
            doc.rect(boxX, boxY - 5, contentWidth - 30, 1).fill('#A7F3D0'); // Divider

            doc.fillColor('#059669').fontSize(8).font('Helvetica-Bold').text('DADOS BANCÁRIOS', boxX, boxY + 5);
            boxY += 20;

            doc.text('BANCO', boxX, boxY);
            doc.fillColor('#064E3B').font('Courier').text('Sicoob (756)', boxX, boxY + 10);

            doc.fillColor('#059669').font('Helvetica-Bold').text('AGÊNCIA', boxX + 100, boxY);
            doc.fillColor('#064E3B').font('Courier').text('3194', boxX + 100, boxY + 10);

            doc.fillColor('#059669').font('Helvetica-Bold').text('CONTA', boxX + 200, boxY);
            doc.fillColor('#064E3B').font('Courier').text('9.768.744-8', boxX + 200, boxY + 10);

            doc.fillColor('#059669').font('Helvetica-Bold').text('PIX', boxX + 300, boxY);
            doc.fillColor('#064E3B').font('Courier').text('42.982.549/0001-79', boxX + 300, boxY + 10);

            y += 180;
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#065F46').text('2. Objetivo', marginX, y);
            y += 30;
            doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
                .text('O presente documento tem como objetivo apresentar uma proposta de locação detalhada para o fornecimento de equipamentos e soluções para o referido solicitante.', { width: contentWidth, align: 'justify' });


            // --- PAGE 3: TÉCNICA ---
            addPage(3);
            y = 100;

            doc.fontSize(14).font('Helvetica-Bold').fillColor('#065F46').text('3. Proposta Técnica', marginX, y);
            y += 30;

            doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('3.1 Escopo Geral de Fornecimento:', marginX, y);
            y += 20;

            // Table Header
            doc.rect(marginX, y, contentWidth, 20).fill(COLORS.lightBg);
            doc.fillColor('#064E3B').text('Item', marginX + 10, y + 5);
            doc.text('Descrição do Produto / Serviço', marginX + 60, y + 5);
            y += 20;

            // Items
            doc.font('Helvetica').fillColor(COLORS.text);
            data.equipment.forEach((item, i) => {
                doc.rect(marginX, y, contentWidth, 25).stroke('#F1F5F9');
                doc.fillColor(COLORS.primary).font('Helvetica-Bold').text(String(i + 1).padStart(2, '0'), marginX + 10, y + 8);
                doc.fillColor(COLORS.text).font('Helvetica').text(item.name, marginX + 60, y + 8);
                y += 25;
            });

            y += 30;
            // Inclusos box
            doc.rect(marginX, y, contentWidth, 100).fill('#F8FAFC');
            doc.rect(marginX, y, contentWidth, 100).stroke('#E2E8F0');

            const checkY = y + 15;
            doc.fillColor('#065F46').font('Helvetica-Bold').text('Inclusos no fornecimento:', marginX + 15, checkY);

            const checkItems = [
                'Certificado de calibração RBC (Durante o Periodo de Garantia)',
                'Treinamento operacional completo',
                'Acesso à comunidade ExS Colab',
                'Suporte técnico vitalício'
            ];

            let cy = checkY + 20;
            doc.fontSize(9).font('Helvetica');
            checkItems.forEach(txt => {
                doc.fillColor(COLORS.primary).text('✓', marginX + 15, cy);
                doc.fillColor(COLORS.text).text(txt, marginX + 30, cy);
                cy += 15;
            });


            // --- PAGE 4: COMERCIAL ---
            addPage(4);
            y = 100;

            doc.fontSize(14).font('Helvetica-Bold').fillColor('#065F46').text('4. Proposta Comercial', marginX, y);
            y += 30;

            // Header
            doc.rect(marginX, y, contentWidth, 20).fill(COLORS.dark);
            doc.fillColor(COLORS.white).fontSize(10).font('Helvetica-Bold');
            doc.text('Item', marginX + 10, y + 5);
            doc.text('Descrição', marginX + 60, y + 5);
            doc.text('Total', marginX + 350, y + 5, { align: 'right', width: contentWidth - 360 });
            y += 20;

            // Items with Price
            doc.font('Helvetica').fontSize(10);
            data.equipment.forEach((item, i) => {
                doc.fillColor(COLORS.gray).font('Helvetica-Bold').text(String(i + 1).padStart(2, '0'), marginX + 10, y + 8);
                doc.fillColor(COLORS.text).font('Helvetica-Bold').text(item.name, marginX + 60, y + 8);

                // Show total only on first item row logic in React? React logic: i===0 ? price : '-'. 
                // But here we might want to show individual prices if we had them. 
                // Currently data.equipment has rentPrice per item.
                // React Logic: "i === 0 ? formatCurrency(finalPrice) : '-'" -> This implies a bundled price.
                // Let's stick to the bundle logic to be safe, or sum it up.
                // Trigger passes `order.finalTotal` as `finalValue`.

                const priceDisplay = i === 0 ? data.quote.finalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-';

                doc.fillColor(COLORS.text).text(priceDisplay, marginX + 350, y + 8, { align: 'right', width: contentWidth - 360 });

                doc.moveTo(marginX, y + 25).lineTo(marginX + contentWidth, y + 25).stroke('#E2E8F0');
                y += 25;
            });

            // Total Row
            y += 5;
            doc.rect(marginX, y, contentWidth, 30).fill(COLORS.primary);
            doc.fillColor(COLORS.white).fontSize(12).font('Helvetica-Bold');
            doc.text('VALOR TOTAL DA PROPOSTA', marginX + 10, y + 10);
            doc.text(data.quote.finalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), marginX + 250, y + 10, { align: 'right', width: contentWidth - 260 });
            y += 50;

            // Conditions Grid
            const boxWidth = (contentWidth - 20) / 2;

            // Box 1
            doc.rect(marginX, y, boxWidth, 100).fill('#F8FAFC').stroke('#E2E8F0');
            doc.fillColor('#065F46').fontSize(10).font('Helvetica-Bold').text('CONDIÇÕES DE FORNECIMENTO', marginX + 10, y + 10);

            let cy1 = y + 30;
            doc.fontSize(9).font('Helvetica').fillColor(COLORS.text);
            doc.text(`Frete: FOB (Cliente Retira)`, marginX + 10, cy1); cy1 += 15;
            doc.text(`Prazo: ${data.quote.rentalDuration} dias (Imediato)`, marginX + 10, cy1); cy1 += 15; // Using data
            doc.text(`Validade: ${data.quote.validityDays} dias`, marginX + 10, cy1); cy1 += 15;
            doc.text(`Garantia: Balcão`, marginX + 10, cy1);

            // Box 2
            doc.rect(marginX + boxWidth + 20, y, boxWidth, 100).fill('#F8FAFC').stroke('#E2E8F0');
            doc.fillColor('#065F46').fontSize(10).font('Helvetica-Bold').text('PAGAMENTO E IMPOSTOS', marginX + boxWidth + 30, y + 10);

            let cy2 = y + 30;
            doc.fontSize(9).font('Helvetica').fillColor(COLORS.text);
            doc.text(`Condição: ${data.quote.paymentTerms}`, marginX + boxWidth + 30, cy2); cy2 += 15;
            doc.text(`Impostos: Simples Nacional`, marginX + boxWidth + 30, cy2); cy2 += 15;

            y += 120;

            // Notes
            if (data.quote.additionalNotes) {
                doc.rect(marginX, y, contentWidth, 40).fill('#FFFBEB'); // Amber 50
                doc.rect(marginX, y, 4, 40).fill('#F59E0B'); // Amber 500
                doc.fillColor('#92400E').fontSize(10).font('Helvetica-Bold').text('Observações Especiais', marginX + 10, y + 5);
                doc.fillColor('#92400E').fontSize(9).font('Helvetica').text(data.quote.additionalNotes, marginX + 10, y + 20);
            }


            // --- PAGE 5: GERAL ---
            addPage(5);
            y = 100;

            doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('5. Condições Gerais de Venda', marginX, y);
            y += 30;

            // Columns logic
            const colWidth = (contentWidth - 20) / 2;
            let leftY = y;
            let rightY = y;

            doc.fontSize(7).font('Helvetica'); // Small text

            LEGAL_TERMS.forEach((term, i) => {
                const isLeft = i % 2 === 0;
                const currentX = isLeft ? marginX : marginX + colWidth + 20;
                // Set Y to the tracked position for this column
                const startY = isLeft ? leftY : rightY;

                // Write text (this updates doc.y automatically)
                doc.font('Helvetica-Bold').text(term.title + ': ', currentX, startY, { continued: true, width: colWidth, align: 'justify' });
                doc.font('Helvetica').text(term.text, { width: colWidth, align: 'justify' });

                // Update the tracker with the new doc.y plus padding
                if (isLeft) leftY = doc.y + 10;
                else rightY = doc.y + 10;
            });

            y = Math.max(leftY, rightY) + 30;

            doc.fontSize(10).font('Helvetica-Bold').text('6. Foro', marginX, y);
            y += 25;

            doc.fontSize(7).font('Helvetica').text('O foro de Americana/SP será o único competente para ações e medidas judiciais relativas à interpretação e/ou execução do contrato, com exclusão de qualquer outro, por mais privilegiado que seja.', marginX, y, { width: contentWidth, align: 'justify' });

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}
