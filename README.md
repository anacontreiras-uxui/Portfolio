# Portefólio — Ana Contreiras

Páginas responsivas implementadas a partir de **SITE FINAL PT** no Figma:

- Desktop: `582:3635` — Homepage Desktop · FINAL.
- Mobile: `288:5215` — Homepage Mobile · FINAL.
- Sobre mim: desktop `582:3968`, mobile `288:5520`.
- Contacto: desktop `582:4305`, mobile `288:5801`.

HTML, CSS e JavaScript nativos. Sem dependências de produção nem compilação.
Imagens, vetores e fontes estão guardados localmente em `assets/`.

## Abrir localmente

Com Node.js instalado:

```sh
npm run dev
```

Abrir <http://localhost:5173>. Também é possível abrir `index.html` diretamente.

Para testar no telemóvel, ligar ambos os dispositivos à mesma rede Wi-Fi e abrir o endereço `Rede local` apresentado pelo servidor. Usar `http://`, não `https://`. O servidor aceita ligações da rede local por defeito; definir `HOST=127.0.0.1` para restringir acesso ao próprio computador.

## Implementado

- Layout desktop e carrossel mobile com scroll, botões e teclado.
- Header com seleção e hover em `#416252`; Contacto usa fundo verde.
- Menu mobile, seleção informativa de idioma e navegação entre páginas.
- Sobre mim com fotografia, valores, competências, ferramentas e percurso.
- Carrossel de competências no mobile, reutilizando comportamento dos projetos.
- Contacto com email, localização e disponibilidade.
- Conteúdos e composições gráficas das duas versões Figma.
- Contacto por email, estados de foco, redução de movimento e ligação para saltar navegação.
- Cartões inteiros e setas abrem páginas locais: `lifecare.html`, `cupra-raval.html`, `aima.html` e `prime-video.html`.
- Estudos de caso com conteúdo Figma, etapas navegáveis por clique/teclado e comparação antes/depois da Lifecare.

Os grafismos dos cartões mantêm coordenadas próprias do Figma dentro de pequenos artboards escaláveis. O resto da página usa fluxo normal, Flexbox e Grid. `data-figma-node` identifica as camadas dos grafismos para comparação com a origem. O lettering CUPRA desktop foi exportado como SVG para preservar a fonte original. O título CUPRA mobile foi ajustado de 24 para 20 px para caber na caixa original sem sobrepor o subtítulo. A barra de estado do iPhone é parte do mockup, não da página web.

## Pendentes

- PDF ou URL público do CV. O botão apresenta estado de atualização.
- URL confirmado do perfil LinkedIn.
- Vídeos dos protótipos: as páginas apresentam pré-visualizações estáticas exportadas dos respetivos nós Figma.
- Repositório GitHub, alojamento e domínio.

Início abre Homepage; Projetos leva à secção de projetos, incluindo a partir das páginas internas. Sobre mim abre `sobre-mim.html`; Contacto abre `contacto.html`. A seleção da página atual persiste após atualização e navegação pelo histórico. A versão de idioma implementada é português.

## Verificar

```sh
npm ci
npm test
```

Os testes usam Google Chrome em `/usr/bin/google-chrome`. Noutro sistema, definir `CHROME_PATH` com caminho para Chrome/Chromium.

Os testes validam larguras de 320–1920 px, carregamento e geometria dos recursos, ausência de overflow horizontal, navegação, seleção e hover, menus, carrosséis, teclado, contactos e estados pendentes. Incluem cliques nos cartões e setas dos quatro projetos, atualização direta, regresso aos projetos, etapas e comparações. Capturas geradas em `test-results/` (ignoradas pelo Git).

## Publicação futura

Publicar todos os ficheiros `.html`, `styles.css`, `pages.css`, `projects.css`, `app.js`, `projects.js` e `assets/` em alojamento estático. Caminhos relativos permitem publicação num subdiretório, incluindo GitHub Pages. Não publicar `node_modules/` ou `test-results/`.
