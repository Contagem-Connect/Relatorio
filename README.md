# Gerador de Relatório de Contagem - Connect

Este projeto é uma aplicação web simples para gerar relatórios de contagem de participantes em eventos, como cultos e atividades ministeriais. O usuário insere as quantidades em um formulário, e a aplicação gera um arquivo HTML estilizado com os dados e totais, que é automaticamente baixado.

## ✨ Recursos

*   **Formulário Intuitivo:** Interface simples para inserir o nome do evento/período e as contagens de participantes por categoria (Culto, Babies, Kids, Teens).
*   **Geração de Relatório em HTML:** Cria um arquivo HTML completo com os dados inseridos.
*   **Download Automático:** O arquivo HTML gerado é automaticamente disponibilizado para download.
*   **Design Limpo e Profissional:** O relatório HTML possui um layout moderno e agradável, com estilos CSS embutidos para portabilidade.
*   **Cálculo de Totais:** Apresenta o total geral de participantes no relatório.
*   **Data de Geração:** Exibe a data em que o relatório foi gerado, tanto na página principal quanto no arquivo baixado.
*   **Responsivo (Visualização):** O design da página principal e do relatório gerado é adaptável a diferentes tamanhos de tela.

## 🚀 Como Usar

1.  **Abra o arquivo `index.html`** em qualquer navegador web moderno (Chrome, Firefox, Edge, Safari, incluindo versões mobile como Chrome para Android).
2.  **Preencha o formulário:**
    *   **Nome do Evento/Período:** Insira um nome descritivo para o relatório (ex: "Culto de Domingo - Manhã - 23/06/2024"). Este campo é obrigatório.
    *   **Participantes do Culto:** Informe a quantidade de presentes no culto principal.
    *   **Sala Babies, Kids, Teens:** Preencha as quantidades de crianças/adolescentes e voluntários/responsáveis para cada sala. Deixe como "0" se não houver participantes na categoria ou se o campo não for aplicável.
3.  **Clique no botão "Gerar Relatório"**.
4.  **Download:** O navegador iniciará o download de um arquivo HTML (ex: `Relatorio_Connect_Culto_Domingo_Manha_23-06-2024.html`). O nome do arquivo incluirá o nome do evento e a data de geração.
5.  **Visualize:** Abra o arquivo HTML baixado em qualquer navegador para visualizar o relatório formatado.

## 📂 Estrutura dos Arquivos

*   `index.html`: A página principal da aplicação, contendo o formulário de entrada de dados e a interface do usuário.
*   `style.css`: Folha de estilos CSS para a aparência da página `index.html`. Os estilos relevantes deste arquivo também são embutidos no relatório HTML gerado.
*   `script.js` (ou `javascript.js` conforme o seu nome): Contém toda a lógica JavaScript para:
    *   Capturar os dados do formulário.
    *   Validar as entradas (ex: nome do evento).
    *   Construir a estrutura HTML completa do relatório.
    *   Embutir os estilos CSS necessários diretamente no arquivo HTML do relatório.
    *   Gerar o total de participantes.
    *   Iniciar o processo de download do arquivo HTML.
    *   Atualizar a data de geração na página principal.

## 🛠️ Tecnologias Utilizadas

*   **HTML5:** Para a estrutura da página e do relatório.
*   **CSS3:** Para a estilização visual (incluindo variáveis CSS para um design consistente).
*   **JavaScript (ES6+):** Para a interatividade, manipulação do DOM, geração de conteúdo dinâmico e funcionalidade de download (usando `Blob` e `URL.createObjectURL`).

## 🧑‍💻 Para Desenvolvedores

*   **Estilos do Relatório:** Os estilos CSS para o arquivo HTML baixado são embutidos diretamente no cabeçalho (`<head>`) do arquivo gerado. Eles são baseados no `style.css` principal, mas estão definidos como uma string dentro da função `generateFullHtmlReport` no arquivo `script.js` para garantir que o relatório seja autossuficiente e portável.
*   **Modificações:**
    *   Para alterar a **aparência da página principal (`index.html`)**, modifique o arquivo `style.css`.
    *   Para alterar a **aparência do relatório HTML baixado**, você precisará modificar a string `styles` dentro da função `generateFullHtmlReport` no arquivo `script.js`. Se a mudança de estilo for comum a ambos, lembre-se de aplicar no `style.css` e replicar na string dentro do JavaScript.
    *   Para adicionar ou modificar **campos de entrada ou categorias de contagem**, você precisará:
        1.  Atualizar o `index.html` com os novos campos.
        2.  Ajustar o array `dataEntries` no `script.js` para incluir as novas configurações de entrada.
        3.  Garantir que a lógica de processamento e exibição no `generateFullHtmlReport` acomode as novas categorias, se necessário.

## 📈 Possíveis Melhorias Futuras

*   Permitir a personalização de categorias e descrições diretamente na interface do usuário (sem precisar editar o código).
*   Opção de salvar os dados preenchidos localmente (usando `localStorage`) para preenchimento rápido em futuras sessões.
*   Adicionar gráficos simples ao relatório HTML gerado (ex: usando uma biblioteca como Chart.js, o que aumentaria a complexidade).
*   Internacionalização (suporte a outros idiomas).
*   Validação de entrada mais robusta e feedback visual no formulário.
