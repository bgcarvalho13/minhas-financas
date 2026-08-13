# Minhas Finanças

PWA pessoal, local e offline-first para lançamentos, reservas, previsão de fechamento, carteira e conciliação de faturas em PDF.

## Executar localmente

Arquivos PWA não devem ser abertos diretamente com `file://` porque Service Worker e módulos ES exigem HTTP/HTTPS.

### Terminal integrado do VS Code

```bash
python3 -m http.server 8080
```

Acesse `http://localhost:8080`.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie todos os arquivos desta pasta para a raiz do repositório.
3. Em **Settings > Pages**, selecione **Deploy from a branch**.
4. Selecione a branch `main` e a pasta `/root`.
5. Aguarde a URL HTTPS do GitHub Pages.

## Instalar no iPhone

1. Abra a URL publicada no Safari.
2. Toque em **Compartilhar**.
3. Toque em **Adicionar à Tela de Início**.
4. Confirme o nome **Minhas Finanças**.

## Acesso pela tela bloqueada

O iOS não oferece widget nativo de tela bloqueada para PWA. Crie um Atalho do iOS com a ação **Abrir URL**, informe a URL do PWA e adicione esse atalho como widget na tela bloqueada. Também é possível vinculá-lo ao Botão de Ação ou ao gesto Tocar Atrás.

## Persistência

Os dados ficam no IndexedDB por meio do Dexie. A camada de persistência está isolada em `db.js`.

## Conciliação de PDF

A extração usa PDF.js carregado sob demanda. A conciliação compara data e valor, bloqueia reenvio pelo hash SHA-256 e permite importar itens não encontrados. O modo de recuperação tenta extrair texto residual de PDFs parcialmente danificados, mas não consegue reconstruir arquivos vazios ou sem conteúdo recuperável.

## Estrutura

- `index.html`: shell e telas
- `styles.css`: design system
- `app.js`: UI e regras de negócio
- `db.js`: IndexedDB/Dexie
- `seed.js`: dados iniciais
- `manifest.json`: metadados instaláveis
- `sw.js`: cache offline
- `assets/`: ícones
