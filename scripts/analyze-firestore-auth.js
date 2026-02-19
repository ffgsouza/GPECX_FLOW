// Script para explorar Firestore COM AUTENTICAÇÃO
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, getCountFromServer, limit, query } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const readline = require('readline');

const firebaseConfig = {
    apiKey: "AIzaSyAhn85m2KDDeIZE51uHem5MHM0VwoNlWaU",
    authDomain: "comexs-r1g97.firebaseapp.com",
    projectId: "comexs-r1g97",
    storageBucket: "comexs-r1g97.firebasestorage.app",
    messagingSenderId: "1083099377370",
    appId: "1:1083099377370:web:abd9647fbd14f75ea4bfe3"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Lista de coleções conhecidas
const KNOWN_COLLECTIONS = [
    'users',
    'customers',
    'quotes',
    'orders',
    'vendors',
    'products',
    'categories',
    'product_types',
    'companies',
    'rental_equipments',
    'product_kits',
    'settings'
];

// Função para pedir credenciais
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

async function analyzeCollection(collectionName) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📂 Coleção: ${collectionName.toUpperCase()}`);
    console.log('='.repeat(70));

    try {
        const colRef = collection(db, collectionName);

        // Tentar pegar contagem
        let totalCount = 0;
        try {
            const countSnapshot = await getCountFromServer(colRef);
            totalCount = countSnapshot.data().count;
            console.log(`📊 Total de documentos: ${totalCount}`);
        } catch (e) {
            console.log(`⚠️  Erro ao contar: ${e.code || e.message}`);
        }

        if (totalCount === 0) {
            console.log(`❌ Coleção vazia ou sem permissão de leitura`);
            return { name: collectionName, count: 0, samples: [], accessible: false };
        }

        // Pegar exemplos
        const q = query(colRef, limit(5));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log(`❌ Nenhum documento acessível`);
            return { name: collectionName, count: totalCount, samples: [], accessible: false };
        }

        console.log(`✅ Documentos acessados: ${snapshot.size}`);
        console.log(`\n📄 Exemplos (máximo 5):\n`);

        const samples = [];
        snapshot.forEach((doc, index) => {
            const data = doc.data();
            samples.push({ id: doc.id, data });

            console.log(`  ${index + 1}. ID: ${doc.id}`);
            console.log(`     Campos: ${Object.keys(data).join(', ')}`);

            // Mostrar preview compacto
            const fieldPreviews = {};
            Object.keys(data).forEach(key => {
                const value = data[key];
                if (typeof value === 'string') {
                    fieldPreviews[key] = value.length > 50 ? value.substring(0, 50) + '...' : value;
                } else if (typeof value === 'object' && value !== null) {
                    fieldPreviews[key] = Array.isArray(value) ? `[Array(${value.length})]` : '[Object]';
                } else {
                    fieldPreviews[key] = value;
                }
            });

            console.log(`     Preview: ${JSON.stringify(fieldPreviews, null, 2)}`);
            console.log('');
        });

        // Detectar schema
        const allFields = new Set();
        samples.forEach(sample => {
            Object.keys(sample.data).forEach(field => allFields.add(field));
        });

        return {
            name: collectionName,
            count: totalCount,
            samples,
            schema: Array.from(allFields),
            accessible: true
        };

    } catch (error) {
        console.error(`❌ Erro ao acessar ${collectionName}:`, error.code || error.message);
        return { name: collectionName, error: error.code || error.message, accessible: false };
    }
}

async function main() {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 ANÁLISE COMPLETA DO FIRESTORE - GPECX FLOW (COM AUTH)');
    console.log('='.repeat(70));
    console.log(`📦 Projeto: ${firebaseConfig.projectId}`);
    console.log('='.repeat(70));

    // Pedir credenciais
    console.log('\n🔐 Autenticação necessária para acessar o Firestore');
    const email = await askQuestion('Email: ');
    const password = await askQuestion('Senha: ');

    try {
        console.log('\n🔄 Fazendo login...');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log(`✅ Login bem-sucedido! Usuário: ${userCredential.user.email}`);
    } catch (error) {
        console.error(`\n❌ Erro no login: ${error.code} - ${error.message}`);
        console.error('Por favor, verifique suas credenciais e tente novamente.');
        process.exit(1);
    }

    const report = {
        project: firebaseConfig.projectId,
        analyzedAt: new Date().toISOString(),
        authenticatedUser: auth.currentUser?.email,
        collections: []
    };

    console.log(`\n🎯 Analisando ${KNOWN_COLLECTIONS.length} coleções...\n`);

    for (const collectionName of KNOWN_COLLECTIONS) {
        const analysis = await analyzeCollection(collectionName);
        report.collections.push(analysis);
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Resumo
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMO DA ANÁLISE');
    console.log('='.repeat(70));

    const withData = report.collections.filter(c => c.accessible && c.count > 0);
    const empty = report.collections.filter(c => c.accessible && c.count === 0);
    const errors = report.collections.filter(c => c.error || (!c.accessible && c.count > 0));

    console.log(`\n✅ Coleções com dados (${withData.length}):`);
    withData.forEach(col => {
        console.log(`   📂 ${col.name}: ${col.count} documentos`);
        console.log(`      Campos: ${col.schema.join(', ')}`);
    });

    if (empty.length > 0) {
        console.log(`\n⚪ Coleções vazias (${empty.length}):`);
        empty.forEach(col => console.log(`   - ${col.name}`));
    }

    if (errors.length > 0) {
        console.log(`\n❌ Erros de acesso (${errors.length}):`);
        errors.forEach(col => console.log(`   - ${col.name}: ${col.error || 'sem permissão'}`));
    }

    // Salvar relatório
    const fs = require('fs');
    const reportPath = './firestore-full-analysis.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    console.log(`\n💾 Relatório completo salvo em: ${reportPath}`);
    console.log('='.repeat(70));

    process.exit(0);
}

main().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});
