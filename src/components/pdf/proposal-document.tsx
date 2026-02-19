import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register a standard font to avoid issues on Vercel
Font.register({
    family: 'Helvetica',
    fonts: [
        { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf' },
        { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf', fontWeight: 'bold' }
    ]
});

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333333'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        paddingBottom: 20
    },
    logo: {
        width: 120,
        height: 40,
        backgroundColor: '#F3F4F6', // Placeholder grey
        justifyContent: 'center',
        alignItems: 'center'
    },
    companyInfo: {
        textAlign: 'right',
        fontSize: 9,
        color: '#666666'
    },
    titleSection: {
        marginBottom: 20
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#111827'
    },
    subtitle: {
        fontSize: 12,
        color: '#6B7280'
    },
    clientSection: {
        marginBottom: 30,
        padding: 15,
        backgroundColor: '#F9FAFB',
        borderRadius: 4
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#374151',
        textTransform: 'uppercase'
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4
    },
    label: {
        width: 80,
        fontWeight: 'bold',
        color: '#4B5563'
    },
    value: {
        flex: 1
    },
    table: {
        marginBottom: 30
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        paddingBottom: 5,
        marginBottom: 10,
        fontWeight: 'bold'
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        paddingBottom: 8,
        marginBottom: 8
    },
    colProduct: { flex: 3 },
    colPrice: { flex: 1, textAlign: 'right' },

    totalSection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#000000'
    },
    totalLabel: {
        width: 100,
        textAlign: 'right',
        fontWeight: 'bold',
        marginRight: 10
    },
    totalValue: {
        width: 100,
        textAlign: 'right',
        fontWeight: 'bold',
        fontSize: 12
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#9CA3AF',
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        paddingTop: 10
    }
});

interface Product {
    name: string;
    price: number;
    imageUrl?: string;
}

interface ProposalData {
    customerName: string;
    customerEmail: string;
    customerCNPJ?: string;
    customerPhone?: string;
    products: Product[];
    finalPrice: number;
    paymentTerms?: string;
    deadline?: string;
    createdAt: string;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const ProposalDocument = ({ data }: { data: ProposalData }) => (
    <Document>
        <Page size="A4" style={styles.page}>

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logo}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#888' }}>GPECX</Text>
                </View>
                <View style={styles.companyInfo}>
                    <Text style={{ fontWeight: 'bold' }}>GPECX Flow Solutions</Text>
                    <Text>CNPJ: 00.000.000/0001-00</Text>
                    <Text>contato@gpecx.com.br</Text>
                    <Text>www.gpecx.com.br</Text>
                </View>
            </View>

            {/* Title */}
            <View style={styles.titleSection}>
                <Text style={styles.title}>Orçamento Comercial</Text>
                <Text style={styles.subtitle}>Data de emissão: {data.createdAt}</Text>
            </View>

            {/* Client Info */}
            <View style={styles.clientSection}>
                <Text style={styles.sectionTitle}>Dados do Cliente</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Cliente:</Text>
                    <Text style={styles.value}>{data.customerName}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>CNPJ/CPF:</Text>
                    <Text style={styles.value}>{data.customerCNPJ || 'N/A'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>{data.customerEmail}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Telefone:</Text>
                    <Text style={styles.value}>{data.customerPhone || 'N/A'}</Text>
                </View>
            </View>

            {/* Products Table */}
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={styles.colProduct}>Descrição do Produto / Serviço</Text>
                    <Text style={styles.colPrice}>Valor</Text>
                </View>

                {data.products.map((item, index) => (
                    <View key={index} style={styles.tableRow}>
                        <Text style={styles.colProduct}>{item.name}</Text>
                        <Text style={styles.colPrice}>{formatCurrency(item.price)}</Text>
                    </View>
                ))}

                <View style={styles.totalSection}>
                    <Text style={styles.totalLabel}>TOTAL:</Text>
                    <Text style={styles.totalValue}>{formatCurrency(data.finalPrice)}</Text>
                </View>
            </View>

            {/* Terms */}
            <View style={[styles.clientSection, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEE' }]}>
                <Text style={styles.sectionTitle}>Condições Comerciais</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Pagamento:</Text>
                    <Text style={styles.value}>{data.paymentTerms || 'A combinar'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Validade:</Text>
                    <Text style={styles.value}>{data.deadline || '7 dias'}</Text>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text>Este documento é uma proposta comercial e não garante reserva de estoque sem aprovação formal.</Text>
                <Text>GPECX Flow - Soluções em Energia e Medição</Text>
            </View>

        </Page>
    </Document>
);
