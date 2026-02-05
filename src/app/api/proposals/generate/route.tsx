import { NextRequest, NextResponse } from 'next/server';
// Force Vercel Rebuild - Timestamp: V4.2
import { z } from 'zod';
import { Resend } from 'resend';
import { renderToStream } from '@react-pdf/renderer';
import { ProposalDocument } from '@/components/pdf/proposal-document'; // Adjust path if needed
import React from 'react';

// Initialize Resend
// NOTE: Ideally this should come from process.env.RESEND_API_KEY
// The user needs to add this to their Vercel environment variables.
const resend = new Resend(process.env.RESEND_API_KEY);

// Validation Schema
const proposalSchema = z.object({
    customerEmail: z.string().email(),
    customerName: z.string().min(1),
    customerCNPJ: z.string().optional(),
    customerPhone: z.string().optional(),
    products: z.array(z.object({
        name: z.string(),
        price: z.number(),
        imageUrl: z.string().optional(),
    })),
    finalPrice: z.number(),
    paymentTerms: z.string().optional(),
    deadline: z.string().optional(),
});

export async function POST(req: NextRequest) {
    try {
        // 1. Parse and Validate Body
        const body = await req.json();
        const validation = proposalSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: 'Invalid data', details: validation.error.format() },
                { status: 400 }
            );
        }

        const data = validation.data;
        const today = new Date().toLocaleDateString('pt-BR');

        // 2. Generate PDF Stream
        // We use renderToStream because it's efficient for serverless functions
        const pdfStream = await renderToStream(
            <ProposalDocument 
        data={{
            ...data,
            createdAt: today
        }} 
      />
    );

    // Convert stream to buffer for Resend email attachment
    const chunks: Uint8Array[] = [];
    // @ts-ignore - NodeJS.ReadableStream vs Web ReadableStream typing mismatch in some envs
    for await (const chunk of pdfStream) {
        chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // 3. Send Email via Resend
    // Check if API Key is set to avoid crash if variable is missing
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is missing. Mocking email send.');
        return NextResponse.json({
            success: true,
            message: 'Simulation: API Key missing. PDF generated but email not sent.',
            mock: true
        });
    }

    const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'GPECX <onboarding@resend.dev>', // User should change this to their verified domain later
        to: [data.customerEmail],
        subject: `Sua Proposta GPECX - ${data.customerName}`,
        html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Olá, ${data.customerName}!</h2>
          <p>Recebemos sua solicitação de orçamento com sucesso.</p>
          <p>Segue em anexo a proposta comercial detalhada com os itens selecionados.</p>
          <br/>
          <p><strong>Detalhes rápidos:</strong></p>
          <ul>
            <li><strong>Total:</strong> ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.finalPrice)}</li>
            <li><strong>Validade:</strong> ${data.deadline || '7 dias'}</li>
          </ul>
          <br/>
          <p>Qualquer dúvida, estamos à disposição.</p>
          <p>Atenciosamente,<br/>Equipe GPECX</p>
        </div>
      `,
        attachments: [
            {
                filename: `Proposta GPECX - ${data.customerName}.pdf`,
                content: pdfBuffer,
            },
        ],
    });

    if (emailError) {
        console.error('Error sending email:', emailError);
        return NextResponse.json({ success: false, error: 'Failed to send email', details: emailError }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailId: emailData?.id });

} catch (error: any) {
    console.error('Unexpected error in proposal route:', error);
    return NextResponse.json(
        { success: false, error: 'Internal Server Error', message: error.message },
        { status: 500 }
    );
}
}
