# 📧 Como Testar o Envio de Proposta

## 🎯 Teste Rápido (Sem Deploy)

Criamos um script que envia email com proposta usando **dados fictícios**!

### Passo 1: Configure Seu Email

Edite `functions/.env` e altere:

```env
TEST_EMAIL=seu-email@exemplo.com  ← COLOQUE SEU EMAIL AQUI!
```

### Passo 2: Execute o Script

```bash
cd functions
node test-send-email.js
```

### O Que Vai Acontecer?

1. ✅ Gera PDF com dados fictícios
2. ✅ Envia email via Resend
3. ✅ Você recebe a proposta no seu email!

**Tempo:** ~5 segundos

### Dados Fictícios Usados

- **Cliente:** João Silva (TESTE)
- **CPF:** 123.456.789-00
- **Equipamentos:** CMC356, Sverker 900
- **Valor:** R$ 1.500,50
- **Período:** 10/02/2026 a 10/03/2026

---

## 📧 Email que Você Vai Receber

**Assunto:** ✨ TESTE - Proposta de Locação PLE-TEST-2026 - GPECX

**Anexo:** PDF profissional formatado

---

## ✅ Prova que Funciona

Este teste demonstra:

- ✓ Geração de PDF funciona
- ✓ Resend está configurado corretamente
- ✓ Template está bonito e profissional
- ✓ Anexo funciona

**Sem precisar:**
- ✗ Fazer pedido no EXS
- ✗ Deploy da Cloud Function
- ✗ Configurar Firebase

---

## 🔧 Troubleshooting

**Erro: RESEND_API_KEY não configurada**
→ Verifique `functions/.env`

**Email não chegou?**
→ Verifique spam
→ Confirme o email no arquivo

**Erro do Puppeteer?**
→ Ele instala automaticamente o Chromium
