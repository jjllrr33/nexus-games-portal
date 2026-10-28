# NEXUS — Games & Tecnologia

Portal estático de notícias com atualização automática por feeds RSS.

## Arquivos
- `index.html`, `style.css`, `script.js`: site.
- `scripts/fetch_news.py`: busca títulos, resumos, links e datas dos feeds.
- `.github/workflows/atualizar-noticias.yml`: executa a atualização a cada 6 horas (aproximadamente) e também pode ser executado manualmente.
- `noticias.json`: dados exibidos no portal.

## Publicar gratuitamente

1. Crie um repositório público no GitHub chamado `nexus-games-portal`.
2. Envie todos os arquivos desta pasta mantendo a estrutura e incluindo a pasta oculta `.github`.
3. No GitHub, abra **Settings → Actions → General** e confirme que workflows estão habilitados. Em **Workflow permissions**, permita escrita quando necessário.
4. Abra **Actions → Atualizar notícias automaticamente → Run workflow** para testar a primeira execução.
5. Confirme que `noticias.json` foi atualizado no repositório.
6. No Cloudflare, entre em **Workers & Pages → Create → Pages → Connect to Git** e selecione o repositório.
7. Configure o build:
   - Framework preset: **None**
   - Build command: deixe vazio
   - Build output directory: `/` (raiz do projeto)
8. Publique. A Cloudflare fornecerá um endereço `*.pages.dev`.

## Como funciona
O workflow consulta os feeds RSS de TechCrunch, Ars Technica e BBC Technology a cada seis horas. Os artigos são ordenados por data, duplicatas são removidas e os dados são salvos em `noticias.json`. O Cloudflare Pages publica automaticamente quando o repositório recebe o commit atualizado.

## Observações importantes
- O agendamento do GitHub Actions não é um relógio garantido: pode atrasar em períodos de alta demanda. Use **Actions → Run workflow** para executar manualmente.
- As fontes podem mudar ou bloquear feeds; confira os logs em **Actions**.
- O classificador simples tenta identificar notícias de games por palavras-chave; confira as categorias.
- O portal exibe títulos e resumos curtos com links para a fonte original. Respeite os termos de cada fonte, direitos autorais e marcas. A BBC tem condições específicas para uso de RSS, inclusive regras de atribuição e diferenças entre uso pessoal e comercial.
- Não há geração de artigos por IA neste projeto; isso exigiria uma integração adicional. APIs de IA podem cobrar por uso, então não são necessárias para esta versão gratuita.
