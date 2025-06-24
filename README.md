# Gerador de Relatório de Contagem - Connect

Este projeto é uma aplicação web simples para gerar relatórios de contagem de participantes em eventos, como cultos e atividades ministeriais. O usuário insere as quantidades em um formulário, e a aplicação permite gerar um arquivo HTML estilizado ou uma imagem PNG do relatório para download ou compartilhamento.

## ✨ Recursos

*   **Formulário Intuitivo:** Interface simples para inserir o nome do evento/período e as contagens de participantes por categoria (Culto, Babies, Kids, Teens).
*   **Novos Campos:** Inclusão de campos para contagem de "Mães" nas salas Babies e Kids.
*   **Geração de Relatório em HTML:** Cria um arquivo HTML completo com os dados inseridos, mostrando todas as categorias (incluindo as com valor zero).
*   **Geração de Imagem do Relatório (PNG):** Cria uma imagem PNG do relatório, ideal para compartilhamento rápido (ex: WhatsApp). A imagem exibe **apenas as categorias com valores preenchidos** (maiores que zero), otimizando a visualização.
*   **Download Automático:** O arquivo HTML ou a imagem gerada são automaticamente disponibilizados para download (com fallback para download caso o compartilhamento da imagem não seja suportado/cancelado).
*   **Compartilhamento via Web Share API:** Tenta compartilhar a imagem gerada diretamente com outros aplicativos (como WhatsApp), se suportado pelo navegador.
*   **Design Limpo e Profissional:** O relatório (HTML e imagem) possui um layout moderno e agradável, com estilos CSS embutidos para portabilidade.
*   **Cálculo de Totais:** Apresenta o total geral de participantes no relatório.
*   **Data de Geração:** Exibe a data e hora em que o relatório foi gerado, tanto na página principal quanto no arquivo/imagem.
*   **Responsivo (Visualização):** O design da página principal e do relatório gerado é adaptável a diferentes tamanhos de tela.

## 🚀 Como Usar

1.  **Abra o arquivo `index.html`** em qualquer navegador web moderno (Chrome, Firefox, Edge, Safari, incluindo versões mobile como Chrome para Android).
2.  **Preencha o formulário:**
    *   **Nome do Evento/Período:** Insira um nome descritivo para o relatório (ex: "Culto de Domingo - Manhã - 23/06/2024"). Este campo é obrigatório.
    *   **Participantes do Culto:** Informe a quantidade de presentes no culto principal.
    *   **Sala Babies:**
        *   Bebês: Quantidade de bebês.
        *   Mães: Quantidade de mães na sala.
        *   Pais/Responsáveis: Quantidade de outros pais ou responsáveis.
    *   **Kids:**
        *   Crianças (Kids): Quantidade de crianças.
        *   Mães: Quantidade de mães na sala.
        *   Tias/Voluntários (Kids): Quantidade de voluntários.
    *   **Teens:**
        *   Adolescentes (Teens): Quantidade de adolescentes.
        *   Tios/Voluntários (Teens): Quantidade de voluntários.
    *   Deixe como "0" se não houver participantes na categoria ou se o campo não for aplicável.
3.  **Escolha uma ação:**
    *   **Clique no botão "Gerar Relatório HTML"**: O navegador iniciará o download de um arquivo HTML (ex: `Relatorio_Connect_Culto_Domingo_Manha_23-06-2024_10-30.html`). O nome do arquivo incluirá o nome do evento e a data/hora de geração. Abra este arquivo em qualquer navegador para visualizar o relatório completo.
    *   **Clique no botão "Gerar e Compartilhar Imagem (WhatsApp)"**:
        *   Uma imagem do relatório será gerada.
        *   Se o seu navegador suportar, uma caixa de diálogo de compartilhamento aparecerá, permitindo enviar a imagem para aplicativos como WhatsApp.
        *   Se o compartilhamento não for suportado ou for cancelado, a imagem será baixada para o seu dispositivo.
        *   A imagem mostrará apenas as categorias que tiveram contagens maiores que zero.
4.  **Visualize:** Abra o arquivo HTML ou a imagem baixada para visualizar o relatório formatado.

## 📂 Estrutura dos Arquivos

*   `index.html`: A página principal da aplicação, contendo o formulário de entrada de dados e a interface do usuário.
*   `style.css`: Folha de estilos CSS para a aparência da página `index.html`. Os estilos relevantes deste arquivo também são embutidos no relatório HTML e na imagem gerada.
*   `script.js`: Contém toda a lógica JavaScript para:
    *   Capturar os dados do formulário.
    *   Validar as entradas (ex: nome do evento).
    *   Construir a estrutura HTML completa do relatório para download (mostrando todas as categorias).
    *   Construir a estrutura HTML do conteúdo visual do relatório para conversão em imagem (mostrando apenas categorias com valores > 0).
    *   Embutir os estilos CSS necessários diretamente no conteúdo do relatório.
    *   Gerar o total de participantes.
    *   Iniciar o processo de download do arquivo HTML ou da imagem.
    *   Utilizar a API `html2canvas` para converter HTML em imagem.
    *   Utilizar a Web Share API para compartilhamento de imagem.
    *   Atualizar a data e hora de geração na página principal.

## 🛠️ Tecnologias Utilizadas

*   **HTML5:** Para a estrutura da página e do relatório.
*   **CSS3:** Para a estilização visual (incluindo variáveis CSS para um design consistente).
*   **JavaScript (ES6+):** Para a interatividade, manipulação do DOM, geração de conteúdo dinâmico, funcionalidade de download (usando `Blob` e `URL.createObjectURL`), e integração com APIs.
*   **html2canvas:** Biblioteca JavaScript para capturar screenshots de páginas ou partes delas diretamente no navegador.
*   **Web Share API:** Para permitir o compartilhamento nativo de conteúdo (texto, links, arquivos) a partir de aplicações web.

## 🧑‍💻 Para Desenvolvedores

*   **Estilos do Relatório:** Os estilos CSS para o arquivo HTML baixado e para a imagem gerada são embutidos diretamente (`<style>`). Eles são baseados no `style.css` principal, mas estão definidos como uma string dentro da função `getReportStyles` no arquivo `script.js` para garantir que o relatório seja autossuficiente e portável.
*   **Modificações:**
    *   Para alterar a **aparência da página principal (`index.html`)**, modifique o arquivo `style.css`.
    *   Para alterar a **aparência do relatório HTML baixado ou da imagem gerada**, você precisará modificar a string retornada pela função `getReportStyles` no arquivo `script.js`. Se a mudança de estilo for comum a ambos, lembre-se de aplicar no `style.css` e replicar na string dentro do JavaScript.
    *   Para adicionar ou modificar **campos de entrada ou categorias de contagem**, você precisará:
        1.  Atualizar o `index.html` com os novos campos.
        2.  Ajustar o array `dataEntriesConfig` no `script.js` para incluir as novas configurações de entrada (ID, categoria, descrição).
        3.  A função `generateReportTableContentHtml` já é genérica o suficiente para lidar com novas entradas, respeitando o filtro de zerados para imagens.

## 📈 Possíveis Melhorias Futuras

*   Permitir a personalização de categorias e descrições diretamente na interface do usuário (sem precisar editar o código).
*   Opção de salvar os dados preenchidos localmente (usando `localStorage`) para preenchimento rápido em futuras sessões.
*   Adicionar gráficos simples ao relatório HTML gerado (ex: usando uma biblioteca como Chart.js).
*   Internacionalização (suporte a outros idiomas).
*   Validação de entrada mais robusta e feedback visual no formulário.
*   Testes unitários e de integração.
