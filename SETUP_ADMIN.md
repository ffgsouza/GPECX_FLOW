# Configuração Inicial - Super Administrador e Logo

## 📝 Cadastrar Super Administrador

Você tem **3 opções** para criar o primeiro usuário administrador:

### ✅ Opção 1: Via Console do Firebase (RECOMENDADO - Mais Fácil)

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto GPECx
3. No menu lateral, clique em **Authentication**
4. Clique na aba **Users**
5. Clique no botão **Add user**
6. Preencha:
   - **Email**: seu.email@gpecx.com.br (ou outro email desejado)
   - **Password**: sua senha segura
7. Clique em **Add user**

✅ Pronto! Agora você pode fazer login em `http://localhost:9002/login`

---

### Opção 2: Via Script Node.js (Automático)

Criei um script para você cadastrar via linha de comando:

**Arquivo criado**: `scripts/create-admin.js`

**Como usar:**

```bash
# No terminal, execute:
node scripts/create-admin.js
```

O script vai pedir:
- Email do administrador
- Senha (mínimo 6 caracteres)

E criará o usuário automaticamente no Firebase.

---

### Opção 3: Cadastro Direto na Interface

Se preferir, posso criar uma **página de setup inicial** que:
- Só aparece quando não há nenhum usuário cadastrado
- Permite criar o primeiro admin
- Se auto-desativa após o primeiro cadastro

---

## 🎨 Adicionar Logo da Empresa

### Como enviar a logo

**Opção A**: Envie o link da imagem
- Cole o link aqui no chat
- Eu faço o download e adiciono ao projeto

**Opção B**: Envie o arquivo
- Arraste e solte a imagem no chat
- Eu adiciono automaticamente

### Onde a logo será usada

A logo será adicionada em:
1. ✅ Página de login (lado esquerdo)
2. ✅ Sidebar do sistema
3. ✅ Cabeçalho de propostas/documentos

### Formatos aceitos
- PNG (recomendado - fundo transparente)
- SVG (melhor qualidade)
- JPG/JPEG

### Tamanho recomendado
- Largura: 200-400px
- Altura: 200-400px
- Formato quadrado ou retangular horizontal

---

## 🔐 Próximos Passos

1. **Escolha uma opção** para criar o super admin
2. **Envie a logo** (link ou arquivo)
3. Eu atualizo o código automaticamente
4. Teste o login com seu novo usuário!

---

**Qual opção você prefere para criar o admin? E já tem a logo para enviar?**
