# 🚀 Integração EXS → GPECX - Cloud Function

## Descrição

Cloud Function que automatiza a geração e envio de propostas comerciais quando um cliente finaliza uma locação no EXS Locações.

## Como Funciona

1. Cliente finaliza checkout no EXS
2. EXS cria documento em `/orders`
3. **Trigger dispara automaticamente**
4. Cloud Function:
   - Mapeia equipamentos
   - Gera proposta no GPECX
   - Cria PDF profissional
   - Envia email ao cliente
   - Atualiza pedido

## Instalação

### 1. Instalar Dependências

```bash
cd functions
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie o arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Edite `.env` e adicione:
- `RESEND_API_KEY`: Sua chave do Resend (https://resend.com)
- `RESEND_FROM_EMAIL`: Email verificado no Resend

### 3. Build

```bash
npm run build
```

### 4. Deploy

```bash
firebase deploy --only functions
```

## Desenvolvimento Local

### Emulador

```bash
firebase emulators:start
```

Acesse: http://localhost:4000

### Ver Logs

```bash
firebase functions:log --only onOrderCreated
```

## Estrutura

```
functions/
├── src/
│   └── index.ts          # Função principal
├── package.json          # Dependências
├── tsconfig.json         # Config TypeScript
├── .env.example          # Template vars
└── README.md            # Este arquivo
```

## Dependências

- **firebase-admin** - SDK Admin do Firebase
- **firebase-functions** - Cloud Functions
- **puppeteer** - Geração de PDF
- **resend** - Envio de emails

## Monitoramento

Ver logs em tempo real:

```bash
firebase functions:log --only onOrderCreated --follow
```

Ou no [Firebase Console](https://console.firebase.google.com/project/comexs-r1g97/functions)

## Troubleshooting

### Função não dispara

Verifique as regras do Firestore - a função precisa ter permissão para ler `/orders`.

### Equipamentos não encontrados

Os nomes devem ter correspondência entre EXS e GPECX. O matching é flexível (case-insensitive).

### Email não enviado

1. Verifique API Key do Resend
2. Domínio deve estar verificado
3. Cliente precisa ter email válido

## Scripts Disponíveis

```bash
npm run build   # Compila TypeScript
npm run serve   # Roda emulador
npm run deploy  # Deploy para produção
npm run logs    # Ver logs
```

## Suporte

Ver documentação completa em `implementation_walkthrough.md`

---

**Desenvolvido com ❤️ usando Firebase Cloud Functions**
