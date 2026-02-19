const fs = require('fs');
const PDFDocument = require('pdfkit');
const { Resend } = require('resend');
require('dotenv').config({ path: './functions/.env' });

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Mock Data
const recipientEmail = 'gpecxdev@gmail.com';

const testData = {
    quote: {
        quoteNumber: 'PLE-TEST-GEN-001',
        rentalStartDate: new Date('2026-02-20').getTime(),
        rentalEndDate: new Date('2026-03-20').getTime(),
        rentalDuration: 30,
        finalValue: 2500.00,
        paymentTerms: 'PIX',
        validityDays: '10',
        additionalNotes: 'Proposta gerada via script de teste direto (Node.js)'
    },
    customer: {
        name: 'Frederico (GPECX Dev)',
        cpfCnpj: '00.000.000/0001-91',
        email: recipientEmail,
        phone: '(11) 99999-9999'
    },
    equipment: [
        {
            name: 'Equipamento de Teste 01',
            serialNumber: 'SN-123456',
            rentPrice: 1500.00
        },
        {
            name: 'Acessório Extra',
            serialNumber: 'SN-789012',
            rentPrice: 1000.00
        }
    ]
};

/**
 * Função auxiliar para gerar PDF da proposta usando PDFKit (nativo Node.js)
 * Copiada e adaptada de functions/src/index.ts
 */
async function generateProposalPDF({ quote, customer, equipment }) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });

            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header com fundo verde
            doc.rect(0, 0, 612, 150).fill('#10b981');

            // Título
            doc.fillColor('#ffffff')
                .fontSize(28)
                .font('Helvetica-Bold')
                .text('PROPOSTA DE LOCAÇÃO', 50, 50, { align: 'center' });

            doc.fontSize(16)
                .text(quote.quoteNumber, 50, 90, { align: 'center' });

            // Reset para conteúdo
            let yPos = 180;
            doc.fillColor('#000000');

            // Seção: Dados do Cliente
            doc.fontSize(16)
                .fillColor('#10b981')
                .font('Helvetica-Bold')
                .text('Dados do Cliente', 50, yPos);

            yPos += 25;
            doc.fontSize(10)
                .fillColor('#000000')
                .font('Helvetica');

            doc.text(`Nome: ${customer.name || '-'}`, 50, yPos);
            doc.text(`CPF/CNPJ: ${customer.cpfCnpj || '-'}`, 320, yPos);
            yPos += 20;
            doc.text(`Email: ${customer.email || '-'}`, 50, yPos);
            doc.text(`Telefone: ${customer.phone || '-'}`, 320, yPos);
            yPos += 35;

            // Seção: Período de Locação
            doc.fontSize(16)
                .fillColor('#10b981')
                .font('Helvetica-Bold')
                .text('Período de Locação', 50, yPos);

            yPos += 25;
            doc.fontSize(10)
                .fillColor('#000000')
                .font('Helvetica');

            const startDate = new Date(quote.rentalStartDate).toLocaleDateString('pt-BR');
            const endDate = new Date(quote.rentalEndDate).toLocaleDateString('pt-BR');

            doc.text(`Início: ${startDate}`, 50, yPos);
            doc.text(`Término: ${endDate}`, 320, yPos);
            yPos += 20;
            doc.text(`Duração: ${quote.rentalDuration} dias`, 50, yPos);
            doc.text(`Pagamento: ${quote.paymentTerms}`, 320, yPos);
            yPos += 35;

            // Seção: Equipamentos
            doc.fontSize(16)
                .fillColor('#10b981')
                .font('Helvetica-Bold')
                .text('Equipamentos a Locar', 50, yPos);

            yPos += 25;

            // Tabela de equipamentos
            doc.fontSize(10)
                .fillColor('#ffffff')
                .font('Helvetica-Bold');

            doc.rect(50, yPos, 512, 25).fill('#10b981');
            doc.text('Equipamento', 60, yPos + 8);
            doc.text('Número de Série', 260, yPos + 8);
            doc.text('Diária', 450, yPos + 8);

            yPos += 25;
            doc.fillColor('#000000').font('Helvetica');

            equipment.forEach((eq, index) => {
                if (index % 2 === 0) {
                    doc.rect(50, yPos, 512, 25).fill('#f9fafb');
                }

                doc.fillColor('#000000');
                doc.text(eq.name || 'N/A', 60, yPos + 8, { width: 190 });
                doc.text(eq.serialNumber || '-', 260, yPos + 8);
                doc.text(`R$ ${(eq.rentPrice || 0).toFixed(2)}`, 450, yPos + 8);

                yPos += 25;
            });

            yPos += 20;

            // Valor Total
            doc.rect(50, yPos, 512, 70).fillAndStroke('#f0fdf4', '#10b981');

            doc.fontSize(12)
                .fillColor('#059669')
                .font('Helvetica-Bold')
                .text('VALOR TOTAL DO PERÍODO', 50, yPos + 15, { align: 'center', width: 512 });

            doc.fontSize(24)
                .fillColor('#10b981')
                .text(`R$ ${quote.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    50, yPos + 35, { align: 'center', width: 512 });

            yPos += 90;

            // Observações (se houver)
            if (quote.additionalNotes) {
                doc.fontSize(10)
                    .fillColor('#000000')
                    .font('Helvetica')
                    .text(`Observações: ${quote.additionalNotes}`, 50, yPos, { width: 512 });
                yPos += 40;
            }

            // Footer
            doc.fontSize(8)
                .fillColor('#6b7280')
                .text('GPECX - Soluções em Locação de Equipamentos', 50, 750, { align: 'center', width: 512 });
            doc.text(`Proposta válida por ${quote.validityDays} dias • Gerada em ${new Date().toLocaleDateString('pt-BR')}`,
                50, 765, { align: 'center', width: 512 });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

async function run() {
    console.log('--- Iniciando Teste de Geração de Proposta ---');

    if (!process.env.RESEND_API_KEY) {
        console.error('ERRO: RESEND_API_KEY não encontrada no arquivo .env');
        return;
    }

    try {
        console.log('1. Gerando PDF...');
        const pdfBuffer = await generateProposalPDF(testData);
        console.log(`PDF gerado: ${pdfBuffer.length} bytes`);

        // Opcional: Salvar PDF localmente para debug
        // fs.writeFileSync('teste_proposta.pdf', pdfBuffer);

        console.log(`2. Enviando email para ${recipientEmail}...`);
        const { data, error } = await resend.emails.send({
            from: 'Integração GPECX <onboarding@resend.dev>',
            to: recipientEmail,
            subject: `Proposta de Teste ${testData.quote.quoteNumber}`,
            html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Proposta Automatizada (Teste)</h2>
          <p>Olá,</p>
          <p>Esta é uma proposta gerada automaticamente pelo script de teste.</p>
          <p>Se você recebeu este e-mail com o PDF anexo, a integração de envio está funcionando.</p>
        </div>
      `,
            attachments: [
                {
                    filename: `proposta-${testData.quote.quoteNumber}.pdf`,
                    content: pdfBuffer
                }
            ]
        });

        if (error) {
            console.error('ERRO ao enviar email:', error);
        } else {
            console.log('SUCESSO! Email enviado.');
            console.log('ID do Email:', data.id);
        }

    } catch (err) {
        console.error('Falha na execução:', err);
    }
}

run();
