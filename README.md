# 💰 Sistema Financeiro — Vinícius

Sistema pessoal de controle financeiro com Firebase + GitHub Pages.

## Como subir no GitHub Pages

### Passo 1 — Instalar o Git
Acesse https://git-scm.com/download/win e instale o Git.

### Passo 2 — Criar repositório no GitHub
1. Acesse https://github.com/new
2. Nome do repositório: `financeiro`
3. Deixe como **Public**
4. Clique em **Create repository**

### Passo 3 — Subir os arquivos

Abra o terminal (Git Bash) na pasta do projeto e execute:

```bash
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/viniciusgarcia85/financeiro.git
git push -u origin main
```

### Passo 4 — Ativar GitHub Pages
1. No repositório, clique em **Settings**
2. No menu lateral clique em **Pages**
3. Em "Source" selecione **Deploy from branch**
4. Branch: **main** / Folder: **/ (root)**
5. Clique em **Save**

Aguarde 2-3 minutos e acesse:
👉 https://viniciusgarcia85.github.io/financeiro

### Passo 5 — Autorizar domínio no Firebase
1. Acesse https://console.firebase.google.com
2. Seu projeto → Authentication → Settings
3. Em "Authorized domains" adicione: `viniciusgarcia85.github.io`
4. Clique em **Add domain**

Pronto! O sistema está no ar.

## Como atualizar

Sempre que modificar algum arquivo:

```bash
git add .
git commit -m "atualização"
git push
```

## Estrutura do projeto

```
financeiro/
├── index.html      — app principal
├── style.css       — estilos (3 temas)
├── app.js          — lógica principal
├── firebase.js     — conexão Firebase
└── README.md       — este arquivo
```
