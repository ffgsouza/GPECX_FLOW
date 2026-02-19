const { Resend } = require('resend');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import the compiled generator (Ensure you run 'npm run build' first!)
// We assume the build output is in 'lib/proposal-layout.js'
const { generateProposalPDF } = require('./lib/proposal-layout');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Mock Data
const recipientEmail = 'gpecxdev@gmail.com';

const testData = {
    quote: {
        quoteNumber: 'PLE-G-26002-R0',
        rentalStartDate: new Date('2026-02-25').getTime(),
        rentalEndDate: new Date('2026-03-25').getTime(),
        rentalDuration: 30,
        finalValue: 3500.00,
        paymentTerms: '50% Pedido / 50% Entrega',
        validityDays: '5',
        additionalNotes: 'Proposta gerada com o NOVO LAYOUT (5 Páginas).',
        description: 'Emissão Inicial - Teste Automatizado V2'
    },
    customer: {
        name: 'Frederico (GPECX Dev)',
        tradeName: 'GPECX DEVELOPMENT',
        cpfCnpj: '00.000.000/0001-91',
        email: recipientEmail,
        phone: '(11) 99999-9999',
        contactName: 'Frederico Caires'
    },
    equipment: [
        {
            name: 'CMC 356 - Universal Relay Test Set',
            serialNumber: 'SN-123456',
            rentPrice: 2000.00
        },
        {
            name: 'CPC 100 - Multi-functional Primary Test System',
            serialNumber: 'SN-789012',
            rentPrice: 1500.00
        }
    ],
    vendor: {
        name: 'João Vendedor',
        initials: 'JV',
        email: 'joao@gpecx.com',
        phone: '(19) 99999-8888'
    }
};

async function run() {
    console.log('--- Iniciando Teste de Geração de Proposta (LAYOUT AVANÇADO) ---');

    if (!process.env.RESEND_API_KEY) {
        console.error('ERRO: RESEND_API_KEY não encontrada no arquivo .env');
        return;
    }

    try {
        console.log('1. Gerando PDF com novo layout...');
        const pdfBuffer = await generateProposalPDF(testData);
        console.log(`PDF gerado: ${pdfBuffer.length} bytes`);

        // Opcional: Salvar PDF localmente
        fs.writeFileSync('teste_proposta_v2.pdf', pdfBuffer);
        console.log('PDF salvo localmente como "teste_proposta_v2.pdf" para verificação.');

        console.log(`2. Enviando email para ${recipientEmail}...`);
        const { data, error } = await resend.emails.send({
            from: 'Integração GPECX <onboarding@resend.dev>',
            to: recipientEmail,
            subject: `Proposta (Novo Layout) ${testData.quote.quoteNumber}`,
            html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Nova Proposta Automatizada</h2>
          <p>Olá,</p>
          <p>Esta proposta utiliza o <strong>layout completo de 5 páginas</strong> (Capa, Institucional, Técnica, Comercial, Geral).</p>
          <p>Verifique se o visual está idêntico ao esperado.</p>
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
