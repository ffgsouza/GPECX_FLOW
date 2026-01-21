/**
 * Script para criar usuário Super Administrador no Firebase
 * 
 * Como usar:
 * 1. Certifique-se de que as variáveis de ambiente estão configuradas (.env.local)
 * 2. Execute: node scripts/create-admin.js
 * 3. Siga as instruções no terminal
 */

const readline = require('readline');

// Interface para leitura do terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function createAdminUser() {
    console.log('\n🔐 Cadastro de Super Administrador - GPECx FLOW\n');
    console.log('================================================\n');

    try {
        // Solicitar dados do administrador
        const email = await question('📧 Email do administrador: ');
        const password = await question('🔑 Senha (mínimo 6 caracteres): ');
        const confirmPassword = await question('🔑 Confirme a senha: ');

        // Validações
        if (!email || !email.includes('@')) {
            console.error('\n❌ Erro: Email inválido');
            process.exit(1);
        }

        if (password.length < 6) {
            console.error('\n❌ Erro: A senha deve ter pelo menos 6 caracteres');
            process.exit(1);
        }

        if (password !== confirmPassword) {
            console.error('\n❌ Erro: As senhas não coincidem');
            process.exit(1);
        }

        console.log('\n⏳ Criando usuário no Firebase...\n');

        // Importar Firebase dinamicamente
        const { initializeApp } = require('firebase/app');
        const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

        // Carregar variáveis de ambiente
        require('dotenv').config({ path: '.env.local' });

        const firebaseConfig = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };

        // Verificar configuração
        if (!firebaseConfig.apiKey) {
            console.error('\n❌ Erro: Variáveis de ambiente do Firebase não configuradas');
            console.error('   Certifique-se de que o arquivo .env.local existe com as configurações do Firebase');
            process.exit(1);
        }

        // Inicializar Firebase
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);

        // Criar usuário
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log('✅ Usuário criado com sucesso!\n');
        console.log('================================================');
        console.log(`📧 Email: ${user.email}`);
        console.log(`🆔 User ID: ${user.uid}`);
        console.log('================================================\n');
        console.log('🎉 Você já pode fazer login em: http://localhost:9002/login\n');

    } catch (error) {
        console.error('\n❌ Erro ao criar usuário:', error.message);

        // Mensagens de erro amigáveis
        if (error.code === 'auth/email-already-in-use') {
            console.error('   Este email já está cadastrado. Use outro email ou faça login.');
        } else if (error.code === 'auth/weak-password') {
            console.error('   A senha é muito fraca. Use uma senha mais forte.');
        } else if (error.code === 'auth/invalid-email') {
            console.error('   Email inválido. Verifique o formato.');
        }

        process.exit(1);
    } finally {
        rl.close();
    }
}

// Executar
createAdminUser().catch(console.error);
