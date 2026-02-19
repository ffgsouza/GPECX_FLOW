import { NextRequest, NextResponse } from 'next/server';

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'comexs-r1g97';
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

/**
 * Converte um objeto JavaScript para o formato de documento do Firestore REST API
 */
function toFirestoreValue(value: any): any {
    if (value === null || value === undefined) return { nullValue: null };
    if (typeof value === 'boolean') return { booleanValue: value };
    if (typeof value === 'number') {
        if (Number.isInteger(value)) return { integerValue: String(value) };
        return { doubleValue: value };
    }
    if (typeof value === 'string') return { stringValue: value };
    if (Array.isArray(value)) {
        return { arrayValue: { values: value.map(toFirestoreValue) } };
    }
    if (value instanceof Date) return { timestampValue: value.toISOString() };
    if (typeof value === 'object') {
        const fields: Record<string, any> = {};
        for (const [k, v] of Object.entries(value)) {
            if (v !== undefined) fields[k] = toFirestoreValue(v);
        }
        return { mapValue: { fields } };
    }
    return { stringValue: String(value) };
}

function toFirestoreDocument(obj: Record<string, any>) {
    const fields: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            fields[key] = toFirestoreValue(value);
        }
    }
    return { fields };
}

/**
 * POST /api/proposals/generate
 *
 * Called by the `sendProposalOnOrderCreate` Cloud Function (us-central1)
 * when a customer completes the checkout on EXS Locações.
 *
 * Creates a RENTAL quote in Firestore `quotes` collection, which triggers
 * `onQuoteCreated` (southamerica-east1) to generate the PDF and send the email.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('[proposals/generate] Payload recebido:', JSON.stringify(body, null, 2));

        const {
            orderId,
            customer,
            items = [],
            finalTotal = 0,
            paymentMethod = 'PIX',
            userEmail,
            userName,
            userCnpj,
            userPhone,
        } = body;

        // Fallback customer object from top-level fields
        const customerData = customer || {
            name: userName || '',
            cpfCnpj: userCnpj || '',
            email: userEmail || '',
            phone: userPhone || '',
        };

        const customerEmail = customerData.email || userEmail;
        const customerName = customerData.name || userName || 'Cliente';

        if (!customerEmail) {
            console.error('[proposals/generate] Email do cliente ausente');
            return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
        }

        // Generate a quote number
        const now = new Date();
        const year = now.getFullYear();
        const timestamp = now.getTime();
        const shortId = orderId
            ? orderId.substring(0, 4).toUpperCase()
            : Math.random().toString(36).substring(2, 6).toUpperCase();
        const quoteNumber = `PLE-${shortId}-${year}`;

        // Map items to GPECX format
        const mappedItems = items.map((item: any) => {
            const rp = item.rentalPeriod;
            return {
                name: item.productName || item.name || 'Equipamento',
                productId: item.productId || '',
                type: item.type || 'rent',
                price: item.price || 0,
                quantity: item.quantity || 1,
                rentPrice: item.price || 0,
                rentalPeriod: rp || null,
            };
        });

        // Calculate rental period from the first rental item
        const rentalItems = items.filter((i: any) => i.type === 'rent' || !i.type);
        const firstItem = rentalItems[0];
        let rentalStartDate = timestamp;
        let rentalEndDate = timestamp;
        let rentalDuration = 1;

        if (firstItem?.rentalPeriod) {
            const rp = firstItem.rentalPeriod;
            if (rp.start) rentalStartDate = new Date(rp.start).getTime();
            if (rp.end) rentalEndDate = new Date(rp.end).getTime();
            rentalDuration =
                rp.days ||
                Math.max(1, Math.ceil((rentalEndDate - rentalStartDate) / (1000 * 60 * 60 * 24)));
        }

        // Build the full quote document
        const quoteDoc = {
            number: quoteNumber,
            type: 'RENTAL',
            workspaceId: 'EXS',
            source: 'exs_locacoes',
            sourceOrderId: orderId || null,
            customerId: customerEmail,
            customerData: {
                id: customerEmail,
                companyName: customerName,
                tradeName: customerName,
                cnpj: customerData.cpfCnpj || userCnpj || '',
                cpfCnpj: customerData.cpfCnpj || userCnpj || '',
                email: customerEmail,
                phone: customerData.phone || userPhone || '',
                contactName: customerName,
                address: { street: '', number: '', district: '', city: '', state: '', zipCode: '' },
            },
            vendorId: 'sistema',
            vendorData: {
                name: 'EXS Solutions',
                email: 'comercial@exs.com.br',
                phone: '(19) 3468-0000',
                initials: 'EXS',
            },
            items: mappedItems,
            totals: {
                totalLanded: finalTotal,
                tablePrice: finalTotal,
                discountValue: 0,
                suggestedPrice: finalTotal,
                marginPct: 0,
                profitValue: 0,
            },
            params: { dolarRate: 1, simplesPct: 0, commissionPct: 0, discountPct: 0 },
            proposalData: {
                paymentTerms: paymentMethod || 'PIX',
                deliveryTime: '24 horas após confirmação',
                validityDays: '10',
                docMode: 'COMPLETE',
                rentalStartDate,
                rentalEndDate,
                rentalDuration,
                additionalNotes: orderId ? `Pedido EXS Locações: ${orderId}` : null,
            },
            revisions: [
                {
                    revisionNumber: 0,
                    description: 'Emissão Inicial',
                    authorInitials: 'EXS',
                    approverInitials: 'EXS',
                    date: timestamp,
                },
            ],
            status: 'SENT',
            stage: 'PROPOSAL',
            createdAt: timestamp,
        };

        // Write to Firestore using REST API (no service account required)
        const firestoreDoc = toFirestoreDocument(quoteDoc);
        const url = `${FIRESTORE_BASE_URL}/quotes${FIREBASE_API_KEY ? `?key=${FIREBASE_API_KEY}` : ''}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(firestoreDoc),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[proposals/generate] Firestore write error:', errorText);
            throw new Error(`Firestore write failed: ${response.status} ${errorText}`);
        }

        const created = await response.json();
        const docPath = created.name || '';
        const quoteId = docPath.split('/').pop() || 'unknown';

        console.log(`[proposals/generate] ✅ Quote "${quoteNumber}" criada no Firestore: ${quoteId}`);
        console.log(`[proposals/generate] ✅ onQuoteCreated será disparado para enviar o email para ${customerEmail}`);

        return NextResponse.json({
            success: true,
            quoteId,
            quoteNumber,
            message: `Proposta ${quoteNumber} criada. Email será enviado automaticamente para ${customerEmail}.`,
        });
    } catch (error: any) {
        console.error('[proposals/generate] Erro:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        endpoint: 'proposals/generate',
        description:
            'Cria uma quote RENTAL no Firestore a partir de um pedido EXS Locações, disparando onQuoteCreated para gerar o PDF e enviar o email.',
    });
}
