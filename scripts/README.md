# Scripts de Migração

## add-default-accessories.ts

Script para adicionar acessórios padrão a todos os equipamentos de locação existentes.

### Acessórios que serão adicionados:
1. Cabo de Aterramento
2. Cabo Ethernet RJ45
3. Case de Transporte
4. Fonte AC
5. Kit de Cabos de Teste
6. Kit de Conectores Variados
7. Suporte de Apoio

### Como usar:

1. **Ajustar configuração do Firebase**
   
   Abra o arquivo `add-default-accessories.ts` e preencha a configuração do Firebase:
   ```typescript
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     // ... outras configurações
   };
   ```

2. **Executar o script**
   
   ```bash
   npx ts-node scripts/add-default-accessories.ts
   ```

   Ou, se preferir compilar primeiro:
   ```bash
   npx tsc scripts/add-default-accessories.ts
   node scripts/add-default-accessories.js
   ```

### O que o script faz:

- Busca todos os equipamentos de locação no Firestore
- Adiciona os 7 acessórios padrão a cada equipamento
- **Evita duplicatas**: Não adiciona acessórios que já existem
- **Converte formato antigo**: Se o equipamento tiver acessórios no formato antigo (string), converte para o novo formato (objeto com id, name, imageUrl)
- Mostra progresso e relatório final

### Características:

✅ **Seguro**: Não sobrescreve acessórios existentes  
✅ **Inteligente**: Evita duplicatas comparando nomes  
✅ **Retrocompatível**: Converte acessórios antigos automaticamente  
✅ **Informativo**: Exibe progresso detalhado
