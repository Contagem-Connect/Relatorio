# Gerador de Relatório de Contagem - Connect

Este projeto é uma aplicação web simples para gerar relatórios de contagem de participantes em eventos, como cultos e atividades ministeriais. O usuário insere as quantidades em um formulário, e a aplicação permite gerar um arquivo HTML estilizado ou uma imagem PNG do relatório para download ou compartilhamento.

## ✨ Recursos

*   **Formulário Intuitivo:** Interface simples para inserir o nome do evento/período e as contagens de participantes por categoria (Culto, Babies, Kids, Teens).
*   **Novos Campos:** Inclusão de campos para contagem de "Mães" nas salas Babies e Kids, e "Tio(a)/Voluntário(a)" em Babies, Kids e Teens.
*   **Importação Inteligente de Dados Brutos (WhatsApp):**
    *   **Modal Dedicado:** Interface para colar texto direto de conversas do WhatsApp.
    *   **Parsing Robusto:** Reconhece quantidades mesmo com variações de texto (singular/plural, com/sem acentos, números colados à palavra, ex: "19kids").
    *   **Inteligência de Contexto:** Distingue "Tios/Tias/Voluntários" para as salas Kids, Teens ou Babies com base no contexto da linha ou da linha anterior, garantindo a atribuição correta das contagens.
    *   **Feedback Visual Completo:** Exibe um log detalhado linha por linha, mostrando em verde o que foi reconhecido e em vermelho o que foi ignorado, incluindo a quantidade e o campo associado.
    *   **Resumo de Processamento:** Apresenta um resumo claro no topo do log, indicando quantas linhas foram processadas com sucesso e quantas foram ignoradas.
    *   **Aprendizado Interativo:** Permite que o usuário, ao lado de cada linha ignorada, clique em "Associar" para "ensinar" o sistema a reconhecer novos termos ou variações, salvando essa associação localmente (`localStorage`) para uso futuro.
*   **Geração de Relatório em HTML:** Cria um arquivo HTML completo com os dados inseridos, mostrando todas as categorias (incluindo as com valor zero).
*   **Geração de Imagem do Relatório (PNG):** Cria uma imagem PNG do relatório, ideal para compartilhamento rápido (ex: WhatsApp). A imagem exibe **apenas as categorias com valores preenchidos** (maiores que zero), otimizando a visualização.
*   **Download Automático:** O arquivo HTML ou a imagem gerada são automaticamente disponibilizados para download (com fallback para download caso o compartilhamento da imagem não seja suportado/cancelado).
*   **Compartilhamento via Web Share API:** Tenta compartilhar a imagem gerada diretamente com outros aplicativos (como WhatsApp), se suportado pelo navegador.
*   **Design Limpo e Profissional:** O relatório (HTML e imagem) possui um layout moderno e agradável, com estilos CSS embutidos para portabilidade.
*   **Cálculo de Totais:** Apresenta o total geral de participantes no relatório.
*   **Data de Geração:** Exibe a data e hora em que o relatório foi gerado, tanto na página principal quanto no arquivo/imagem.
*   **Responsivo (Visualização):** O design da página principal e do relatório gerado é adaptável a diferentes tamanhos de tela.
*   **Correção de Quantidades:** O sistema agora processa e exibe as quantidades exatas inseridas, sem qualquer arredondamento ou modificação indesejada.

## 🚀 Como Usar

1.  **Abra o arquivo `index.html`** em qualquer navegador web moderno (Chrome, Firefox, Edge, Safari, incluindo versões mobile como Chrome para Android).
2.  **Preencha o formulário** ou **importe dados brutos**:
    *   **Preenchimento Manual:** Insira as quantidades nos campos do formulário para cada categoria.
    *   **Importação de Dados Brutos (via WhatsApp):**
        *   Clique no botão **"Processar Dados Brutos (WhatsApp)"**. Um modal será aberto.
        *   Cole o texto diretamente de uma conversa do WhatsApp (ex: "19 teens", "4 tios", "36 kids", "6 tias", "230 no culto").
        *   O sistema irá analisar o texto, preencher o formulário automaticamente e exibir um **log de feedback visual** no modal.
        *   **Feedback Visual:**
            *   Um resumo no topo indicará quantas linhas foram reconhecidas e quantas foram ignoradas.
            *   Linhas reconhecidas aparecem em **verde**, mostrando a quantidade e o campo associado.
            *   Linhas ignoradas aparecem em **vermelho**. Ao lado de cada linha ignorada, um botão **"Associar"** aparecerá.
        *   **Ensinando o Sistema (Recurso "Associar"):**
            *   Se uma linha for ignorada, clique no botão **"Associar"** ao lado dela.
            *   Um novo modal será aberto. Informe uma **palavra-chave** ou frase (ex: "voluntários do culto") e selecione o **campo do formulário** correspondente (ex: "Culto: Presentes").
            *   Clique em "Salvar Associação". O sistema aprenderá essa nova regra e a aplicará automaticamente em futuras importações. O modal de dados brutos será reprocessado para refletir a nova associação.
        *   Feche o modal de dados brutos para ver o formulário preenchido.
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

*   `index.html`: A página principal da aplicação, contendo o formulário de entrada de dados e a interface do usuário. Inclui o modal para importação de dados brutos e o modal para associação de termos.
*   `style.css`: Folha de estilos CSS para a aparência da página `index.html`, incluindo os estilos para os modais, o log de feedback (sucesso/ignorado) e o resumo do processamento. Os estilos relevantes deste arquivo também são embutidos no relatório HTML e na imagem gerada.
*   `script.js`: Contém toda a lógica JavaScript para:
    *   Capturar os dados do formulário e gerenciar a interface do usuário.
    *   Integrar e interagir com o `parser.js` para o processamento de dados brutos.
    *   Gerenciar o modal de importação de dados brutos e o modal de associação de termos.
    *   Exibir o log de feedback visual (linhas coloridas e botões "Associar").
    *   Calcular e exibir o resumo do processamento de dados brutos.
    *   Construir a estrutura HTML completa do relatório para download (mostrando todas as categorias).
    *   Construir a estrutura HTML do conteúdo visual do relatório para conversão em imagem (mostrando apenas categorias com valores > 0).
    *   Embutir os estilos CSS necessários diretamente no conteúdo do relatório.
    *   Gerar o total de participantes e atualizar a data/hora de geração.
    *   Iniciar o processo de download do arquivo HTML ou da imagem, e utilizar a Web Share API.
*   `services/parser.js`: Contém a lógica JavaScript para:
    *   Analisar e extrair dados de contagem de textos brutos (copiados do WhatsApp).
    *   Normalizar o texto (minúsculas, sem acentos, etc.) para garantir um reconhecimento robusto.
    *   Implementar a inteligência de contexto para diferenciar categorias como "Tios/Tias/Voluntários" para Kids, Teens e Babies.
    *   Gerenciar os mapeamentos de palavras-chave, incluindo o carregamento e salvamento de associações personalizadas no `localStorage`.
    *   Retornar os dados processados e um log detalhado para feedback visual.

## 🛠️ Tecnologias Utilizadas

*   **HTML5:** Para a estrutura da página e do relatório.
*   **CSS3:** Para a estilização visual (incluindo variáveis CSS para um design consistente).
*   **JavaScript (ES6+):** Para a interatividade, manipulação do DOM, geração de conteúdo dinâmico, funcionalidade de download (usando `Blob` e `URL.createObjectURL`), integração com APIs e gerenciamento de `localStorage` para persistência de dados.
*   **html2canvas:** Biblioteca JavaScript para capturar screenshots de páginas ou partes delas diretamente no navegador, usada para gerar a imagem PNG do relatório.
*   **Web Share API:** Para permitir o compartilhamento nativo de conteúdo (texto, links, arquivos) a partir de aplicações web.

## 🧑‍💻 Para Desenvolvedores

*   **Estilos do Relatório:** Os estilos CSS para o arquivo HTML baixado e para a imagem gerada são embutidos diretamente (`<style>`). Eles são baseados no `style.css` principal, mas estão definidos como uma string dentro da função `getReportStyles` no arquivo `script.js` para garantir que o relatório seja autossuficiente e portável.
*   **Lógica de Parsing e Aprendizado:**
    *   O coração da inteligência de reconhecimento de texto está em `services/parser.js`. Ele utiliza um `dynamicKeywordMap` que combina regras padrão com mapeamentos salvos no `localStorage` pelo usuário.
    *   A função `saveCustomMapping` em `services/parser.js` é usada para persistir as novas associações aprendidas pelo usuário. Para que ela seja acessível em `script.js`, é necessário expô-la globalmente (ex: `window.saveCustomMapping = saveCustomMapping;` e `window.normalizeText = normalizeText;` no final do `services/parser.js`). Em um projeto maior, o uso de módulos ES6 (`import/export`) seria a abordagem recomendada.
*   **Modificações:**
    *   Para alterar a **aparência da página principal (`index.html`)** ou dos **modais**, modifique o arquivo `style.css`.
    *   Para alterar a **aparência do relatório HTML baixado ou da imagem gerada**, você precisará modificar a string retornada pela função `getReportStyles` no arquivo `script.js`.
    *   Para adicionar ou modificar **campos de entrada ou categorias de contagem**, você precisará:
        1.  Atualizar o `index.html` com os novos campos.
        2.  Ajustar o array `dataEntriesConfig` no `script.js`.
        3.  Ajustar o `defaultKeywordMap` em `services/parser.js` e, se necessário, a lógica contextual em `parseRawData` para os novos campos.
        4.  Atualizar o `select` de `associateField` no `index.html` para incluir a nova opção.

## 📈 Possíveis Melhorias Futuras

*   **Modularização do `script.js`:** Dividir `script.js` em arquivos menores e mais focados (ex: `form-handler.js`, `modal-manager.js`, `ui-feedback.js`) para melhorar a organização, legibilidade e manutenibilidade do código.
*   **Externalização do Mapeamento de Palavras-Chave:** Mover o `defaultKeywordMap` de `services/parser.js` para um arquivo JSON externo (`services/keywordMappings.json`) e carregá-lo assincronamente. Isso permitiria a atualização das regras de reconhecimento sem a necessidade de editar o código JavaScript.
*   **Gerenciamento Visual de Mapeamentos Personalizados:** Criar uma interface dedicada para que o usuário possa visualizar, editar e excluir os termos personalizados que ensinou ao sistema, oferecendo controle total sobre o aprendizado automático.
*   **Validação em Tempo Real no Modal de Associação:** Adicionar validação e sugestões enquanto o usuário digita um termo no modal de "Associar Termo", alertando sobre termos já existentes ou muito genéricos.
*   **Suporte a Múltiplas Contagens na Mesma Linha:** Aprimorar o parser para identificar e somar múltiplos números associados a diferentes categorias em uma única linha (ex: "10 kids, 5 teens").
*   **Internacionalização (i18n):** Suporte a outros idiomas para a interface e os relatórios.
*   **Adicionar Gráficos:** Incluir gráficos simples ao relatório HTML gerado (ex: usando uma biblioteca como Chart.js) para visualização de dados.
*   **Testes:** Implementar testes unitários e de integração para garantir a estabilidade e a corretude das funcionalidades, especialmente do parser.
