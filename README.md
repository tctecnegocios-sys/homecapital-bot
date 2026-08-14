# Home Capital

Repositório com dois componentes independentes:

## 1. ERP Home Capital (app / PWA)

App do ERP em arquivo único (`index.html`), tema escuro, identidade oficial da
Home Capital. Instalável como aplicativo (ícone no celular/desktop, abre em tela
cheia, funciona offline). Dados ficam em `localStorage` — **uso local/privado,
nada vai para a internet pública**.

### Como rodar e instalar como app

```bash
npm run app
```

Abra **http://localhost:8080** no navegador e clique em **Instalar app**:

- **Chrome/Edge (desktop):** ícone de instalar na barra de endereço → *Instalar*.
- **Android (Chrome):** menu ⋮ → *Instalar app / Adicionar à tela inicial*.
- **iPhone (Safari):** Compartilhar → *Adicionar à Tela de Início*.

Depois de instalado, abre como aplicativo próprio, sem barra do navegador, e
funciona offline (a "casca" fica em cache; os dados no aparelho).

> O service worker só registra em `http://localhost` ou `https://` — por isso o
> app é servido pelo `npm run app`, e não aberto direto do arquivo (`file://`).

### Estrutura

| Arquivo | Função |
|---|---|
| `index.html` | O ERP completo (dashboard, comercial, financeiro, jurídico, pessoas, portal) |
| `manifest.webmanifest` | Metadados da PWA (nome, ícones, cores) |
| `sw.js` | Service worker — cache offline da casca do app |
| `serve.js` | Servidor estático local (sem dependências) |
| `assets/` | Logo e ícones do app (192/512/maskable/apple-touch) |

### Dados & backup

- **💾 Salvar** (auto-save) e restauração automática ao reabrir (`localStorage`).
- **⤓ Backup / ⤒ Restaurar** — exporta/importa o estado em JSON para levar
  entre computadores.

## 2. Chatbot WhatsApp (Z-API)

Webhook Node que responde mensagens automaticamente.

```bash
npm run bot   # ou: npm start
```

Escuta em `PORT` (padrão 4040) e responde via Z-API.
