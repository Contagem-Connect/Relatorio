// script.js

document.addEventListener('DOMContentLoaded', function() {
    const reportForm = document.getElementById('reportForm');
    const generationDateEl = document.getElementById('generationDate');
    const eventNameInput = document.getElementById('eventName');

    const generateHtmlReportBtn = document.getElementById('generateHtmlReport');
    const generateAndShareImageBtn = document.getElementById('generateAndShareImage');
    const hiddenReportForCanvasEl = document.getElementById('hiddenReportForCanvas');

    // --- LÓGICA DO MODAL DE DADOS BRUTOS ---
    const processRawDataBtn = document.getElementById('processRawDataBtn');
    const rawDataModal = document.getElementById('rawDataModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const rawDataInput = document.getElementById('rawDataInput');
    const fillFormBtn = document.getElementById('fillFormBtn');
    const sundayTurnoSelector = document.getElementById('sundayTurnoSelector');
    const parseFeedbackLogEl = document.getElementById('parseFeedbackLog'); // Elemento para exibir o log de feedback

    // Verifica se todos os elementos essenciais foram encontrados
    if (!reportForm || !eventNameInput || !generateHtmlReportBtn || !generateAndShareImageBtn || !hiddenReportForCanvasEl || !generationDateEl ||
        !processRawDataBtn || !rawDataModal || !closeModalBtn || !rawDataInput || !fillFormBtn || !sundayTurnoSelector || !parseFeedbackLogEl) {
        console.error("Um ou mais elementos essenciais do DOM não foram encontrados! Verifique os IDs no HTML.");
        alert("Erro na inicialização da página. Alguns elementos HTML necessários não foram encontrados. Verifique o console para mais detalhes.");
        return;
    }

    updateGenerationDate();

    // --- CONTROLE DO MODAL ---
    processRawDataBtn.addEventListener('click', () => {
        rawDataModal.style.display = 'flex';
        rawDataInput.value = ''; // Limpa o campo de texto ao abrir o modal
        parseFeedbackLogEl.innerHTML = ''; // Limpa o log de feedback ao abrir o modal
        const today = new Date();
        // Se for domingo, mostra a opção de turno
        if (today.getDay() === 0) {
            sundayTurnoSelector.style.display = 'block';
        } else {
            sundayTurnoSelector.style.display = 'none';
        }
    });

    const closeModal = () => {
        rawDataModal.style.display = 'none';
        rawDataInput.value = ''; // Limpa o campo ao fechar
        parseFeedbackLogEl.innerHTML = ''; // Limpa o log ao fechar para a próxima interação
    };
    closeModalBtn.addEventListener('click', closeModal);
    rawDataModal.addEventListener('click', (event) => {
        if (event.target === rawDataModal) {
            closeModal();
        }
    });

    fillFormBtn.addEventListener('click', () => {
        const rawText = rawDataInput.value;
        if (!rawText.trim()) {
            alert('Por favor, cole os dados no campo de texto antes de analisar.');
            return;
        }

        // 1. Chamar o parser externo e obter os dados analisados E o log de feedback
        const { parsedData, feedbackLog } = parseRawData(rawText);

        // 2. Exibir o feedback visual para o usuário no modal
        parseFeedbackLogEl.innerHTML = ''; // Limpa o log anterior antes de preencher novamente
        feedbackLog.forEach(log => {
            const p = document.createElement('p');
            // Formata a mensagem com a linha original e a explicação do parser
            p.textContent = `${log.line} -> ${log.message}`;
            // Aplica a classe CSS baseada no status (log-success ou log-ignored)
            p.className = log.status === 'success' ? 'log-success' : 'log-ignored';
            parseFeedbackLogEl.appendChild(p);
        });

        // 3. Gerar o título do evento automaticamente
        eventNameInput.value = generateEventTitle();

        // 4. Limpar o formulário atual e preencher com os dados analisados
        const numberInputs = document.querySelectorAll('form#reportForm input[type="number"]');
        numberInputs.forEach(input => input.value = 0); // Reseta todos os campos numéricos para zero
        
        // Preenche o formulário com os dados do parser
        for (const inputId in parsedData) {
            const inputElement = document.getElementById(inputId);
            if (inputElement) {
                inputElement.value = parsedData[inputId];
            } else {
                console.warn(`Tentativa de preencher campo com ID '${inputId}' que não existe no formulário.`);
            }
        }
        
        // Alerta o usuário e direciona para o log (modal permanece aberto)
        alert('Formulário analisado e preenchido com sucesso! Por favor, verifique o log de feedback abaixo para detalhes.');
        // O modal permanece aberto para que o usuário possa visualizar o log.
        // Ocultar o modal ficaria a critério de uma UX futura.
    });

    // Função para gerar o título do evento baseado no dia da semana
    function generateEventTitle() {
        const today = new Date();
        const dateString = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const dayOfWeek = today.getDay(); // 0: Domingo, ..., 3: Quarta
        
        const weekDays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
        
        if (dayOfWeek === 3) { // Quarta-feira
            return `Culto de Quarta-feira - ${dateString}`;
        }
        
        if (dayOfWeek === 0) { // Domingo
            // Pega o turno selecionado no rádio button
            const selectedTurnoEl = document.querySelector('input[name="turno"]:checked');
            const selectedTurno = selectedTurnoEl ? selectedTurnoEl.value : 'Turno Não Selecionado';
            return `Culto de ${weekDays[dayOfWeek]} - ${selectedTurno} - ${dateString}`;
        }
        
        // Padrão para outros dias da semana
        return `Culto de ${weekDays[dayOfWeek]} - ${dateString}`;
    }

    // --- LÓGICA ORIGINAL DO RELATÓRIO (mantida) ---
    function getFormData() {
        const eventName = eventNameInput.value.trim();
        if (!eventName) {
            alert("Por favor, informe o Nome do Evento/Período.");
            eventNameInput.focus();
            return null;
        }

        // Configuração das entradas de dados para o relatório
        const dataEntriesConfig = [
            { grupo: 'Culto', categoria: 'Culto', descricao: 'Presentes', id: 'cultoPresentes' },
            { grupo: 'Sala Babies', categoria: 'Babies', descricao: 'Bebês', id: 'babiesCriancas' },
            { grupo: 'Sala Babies', categoria: 'Babies', descricao: 'Mães', id: 'babiesMaes' },
            { grupo: 'Sala Babies', categoria: 'Babies', descricao: 'Tio(a) / Voluntário(a)', id: 'babiesResponsaveis' },
            { grupo: 'Kids', categoria: 'Kids', descricao: 'Crianças', id: 'kidsCriancas' },
            { grupo: 'Kids', categoria: 'Kids', descricao: 'Mães', id: 'kidsMaes' },
            { grupo: 'Kids', categoria: 'Kids', descricao: 'Tio(a) / Voluntário(a)', id: 'kidsTias' },
            { grupo: 'Teens', categoria: 'Teens', descricao: 'Adolescentes', id: 'teensAdolescentes' },
            { grupo: 'Teens', categoria: 'Teens', descricao: 'Tio(a) / Voluntário(a)', id: 'teensTios' }
        ];

        const reportData = [];
        let totalGeral = 0;

        dataEntriesConfig.forEach(entryConfig => {
            const inputElement = document.getElementById(entryConfig.id);
            if (inputElement) {
                const quantidade = parseInt(inputElement.value) || 0; // Garante que seja um número, 0 se vazio
                reportData.push({
                    categoria: entryConfig.categoria,
                    descricao: entryConfig.descricao,
                    quantidade: quantidade
                });
                totalGeral += quantidade;
            } else {
                console.warn(`Elemento de input com ID '${entryConfig.id}' não encontrado ao coletar dados.`);
            }
        });
        return { eventName, reportData, totalGeral };
    }

    reportForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Impede o envio padrão do formulário
        handleGenerateHtmlReport();
    });
    
    function handleGenerateHtmlReport() {
        try {
            const formData = getFormData();
            if (!formData) return; // Se a validação falhar, para aqui

            const { eventName, reportData, totalGeral } = formData;
            const currentDateString = updateGenerationDateAndGetIt(); // Obtém e atualiza a data/hora

            const fullHtmlReport = generateFullHtmlReportString(eventName, reportData, totalGeral, currentDateString);
            downloadHtmlReport(fullHtmlReport, eventName, currentDateString);
        } catch (error) {
            console.error("Erro ao gerar relatório HTML:", error);
            alert("Ocorreu um erro ao gerar o relatório HTML. Verifique o console para mais detalhes.");
        }
    }

    generateAndShareImageBtn.addEventListener('click', async function() {
        try {
            const formData = getFormData();
            if (!formData) return;

            const { eventName, reportData, totalGeral } = formData;
            const currentDateString = updateGenerationDateAndGetIt();

            // Gera o HTML do conteúdo do relatório que será capturado pela imagem
            const reportContentHtml = generateReportVisualContentHtml(eventName, reportData, totalGeral, currentDateString, true);
            hiddenReportForCanvasEl.innerHTML = reportContentHtml; // Injeta no elemento escondido
            
            // Seleciona o elemento real a ser capturado dentro do div escondido
            const elementToCapture = hiddenReportForCanvasEl.querySelector('.container');
            if (!elementToCapture) {
                console.error("Elemento '.container' dentro de '#hiddenReportForCanvas' não encontrado para captura.");
                alert("Erro ao preparar conteúdo para imagem: container interno não encontrado.");
                return;
            }
            
            // Feedback visual enquanto a imagem é gerada
            this.textContent = 'Gerando imagem...';
            this.disabled = true;

            // Usa html2canvas para capturar a imagem do elemento
            const canvas = await html2canvas(elementToCapture, { 
                useCORS: true, // Importante se houver imagens externas
                scale: 1.5, // Aumenta a resolução da imagem para melhor qualidade
                logging: false, // Desabilita logs do html2canvas no console
                onclone: (clonedDoc) => {
                    // Garante que os estilos do relatório sejam embutidos no DOM clonado
                    const styleSheet = clonedDoc.createElement("style");
                    styleSheet.innerHTML = getReportStylesForCanvas();
                    clonedDoc.head.appendChild(styleSheet);
                }
            });

            // Converte o canvas para um Blob (Binary Large Object)
            canvas.toBlob(async function(blob) {
                if (!blob) {
                    alert('Erro ao gerar imagem (blob nulo).');
                    generateAndShareImageBtn.textContent = 'Gerar e Compartilhar Imagem (WhatsApp)';
                    generateAndShareImageBtn.disabled = false;
                    return;
                }
                // Cria um nome de arquivo seguro para download
                const safeEventName = eventName.replace(/[^a-z0-9_-\s]/gi, '_').replace(/\s+/g, '_');
                const safeDate = currentDateString.replace(/[\/:]/g, '-').replace(/\s/g, '_');
                const fileName = `Relatorio_Connect_${safeEventName}_${safeDate}.png`;
                
                // Prepara os dados para a Web Share API
                const filesArray = [new File([blob], fileName, { type: 'image/png' })];
                const shareData = {
                    title: `Relatório: ${eventName}`,
                    text: `Relatório de contagem - Connect\nEvento: ${eventName}\nGerado em: ${currentDateString}`,
                    files: filesArray,
                };

                // Tenta usar a Web Share API para compartilhar a imagem
                if (navigator.share && navigator.canShare && navigator.canShare({ files: filesArray })) {
                    try {
                        await navigator.share(shareData);
                        console.log('Relatório compartilhado com sucesso!');
                    } catch (err) {
                        console.error('Erro ao compartilhar:', err);
                        // Se o compartilhamento for cancelado ou falhar (exceto por AbortError), oferece download
                        if (err.name !== 'AbortError') { // AbortError significa que o usuário cancelou o compartilhamento
                           alert(`Erro ao compartilhar: ${err.message}. A imagem será baixada.`);
                           downloadImage(blob, fileName);
                        } else {
                            console.log('Compartilhamento cancelado pelo usuário.');
                        }
                    }
                } else {
                    // Fallback para download se Web Share API não for suportada
                    alert('Seu navegador não suporta compartilhamento direto de imagens. A imagem será baixada para compartilhamento manual.');
                    downloadImage(blob, fileName);
                }
                
                // Restaura o botão e limpa o conteúdo do elemento escondido
                generateAndShareImageBtn.textContent = 'Gerar e Compartilhar Imagem (WhatsApp)';
                generateAndShareImageBtn.disabled = false;
                hiddenReportForCanvasEl.innerHTML = '';

            }, 'image/png', 0.95); // Qualidade da imagem (0 a 1)

        } catch (error) {
            console.error("Erro ao gerar/compartilhar imagem:", error);
            alert("Ocorreu um erro ao gerar ou compartilhar a imagem. Verifique o console.");
            // Garante que o botão seja reativado mesmo em caso de erro
            generateAndShareImageBtn.textContent = 'Gerar e Compartilhar Imagem (WhatsApp)';
            generateAndShareImageBtn.disabled = false;
            hiddenReportForCanvasEl.innerHTML = '';
        }
    });

    // Função auxiliar para baixar um Blob como arquivo
    function downloadImage(blob, fileName) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        document.body.appendChild(a); // Necessário para simular o clique
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href); // Libera o URL do objeto
    }

    // Gera o conteúdo HTML da tabela do relatório
    function generateReportTableContentHtml(data, total, filterZeros = false) {
        let tableContentHTML = '';
        let entriesToDisplay = data;

        // Filtra categorias com quantidade zero se filterZeros for true (para imagem)
        if (filterZeros) {
            entriesToDisplay = data.filter(entry => entry.quantidade > 0);
        }

        if (entriesToDisplay.length === 0 && total === 0) {
            tableContentHTML = `<tr><td colspan="3" style="text-align: center; font-style: italic;">Nenhuma contagem registrada.</td></tr>`;
        } else if (entriesToDisplay.length === 0 && total > 0) {
            // Caso especial para quando só o total é relevante, mas nenhuma categoria individual é > 0
            tableContentHTML = `<tr><td colspan="3" style="text-align: center; font-style: italic;">Nenhuma contagem individual para exibir.</td></tr>`;
        } else {
            entriesToDisplay.forEach(entry => {
                tableContentHTML += `
                    <tr>
                        <td>${escapeHTML(entry.categoria)}</td>
                        <td>${escapeHTML(entry.descricao)}</td>
                        <td>${entry.quantidade}</td>
                    </tr>
                `;
            });
        }

        let totalRowHtml = '';
        if (entriesToDisplay.length > 0 || total > 0) { // Garante que a linha do total aparece se houver dados ou total > 0
            totalRowHtml = `
                <tr class="total">
                    <td>Total</td>
                    <td>Total Geral</td>
                    <td>${total}</td>
                </tr>
            `;
        }
        return tableContentHTML + totalRowHtml;
    }

    // Gera o HTML completo para o relatório visual (usado para imagem)
    function generateReportVisualContentHtml(eventName, data, total, generationDate, filterZerosForImage) {
        const styles = getReportStylesForCanvas();
        const tableRowsHtml = generateReportTableContentHtml(data, total, filterZerosForImage);

        return `
            ${styles} 
            <div class="container" style="width:100%; max-width:100%; margin:0; padding:0; box-shadow:none; border-radius:0; background-color: white;"> 
                <header class="report-header">
                    <h1>Relatório de Contagem - Connect</h1>
                </header>
                <div class="report-output-container" style="padding: 20px 15px;">
                    <section class="table-section">
                        <h2>${escapeHTML(eventName)}</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Categoria</th>
                                    <th>Descrição</th>
                                    <th>Quantidade</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRowsHtml}
                            </tbody>
                        </table>
                    </section>
                </div>
                <footer class="report-footer">
                    <p>Sistema de Relatórios Connect | Gerado em ${escapeHTML(generationDate)}</p>
                </footer>
            </div>
        `;
    }
    
    // Retorna os estilos CSS específicos para a captura de imagem
    function getReportStylesForCanvas() {
        return getReportStyles(true);
    }

    // Retorna os estilos CSS específicos para o download de HTML
    function getReportStylesForHtmlDownload() {
        return getReportStyles(false);
    }
    
    // Função centralizada para definir estilos CSS, com adaptação para canvas/HTML
    function getReportStyles(isForCanvas = false) {
        // Ajustes de tamanho e espaçamento para otimização em imagem (canvas) vs. HTML completo
        const headerH1Size = isForCanvas ? '1.6em' : '1.8em';
        const tableSectionH2Size = isForCanvas ? '1.5em' : '1.4em'; 
        const tableSectionH2TextAlign = isForCanvas ? 'center' : 'left';
        const tableSectionH2MarginBottom = isForCanvas ? '20px' : '15px'; 

        const tableCellPadding = isForCanvas ? '10px 8px' : '12px 15px';
        const tableCellFontSize = isForCanvas ? '0.9em' : '0.95em';
        const reportOutputPadding = isForCanvas ? '20px 15px' : '25px 30px';
        const headerPadding = isForCanvas ? '20px 15px' : '25px 30px';
        const footerPadding = isForCanvas ? '15px 20px' : '20px 30px';
        const footerFontSize = isForCanvas ? '0.8em' : '0.85rem';


        return `
        <style>
            :root {
                --primary-color: #4a6fa5;
                --secondary-color: #6c757d;
                --light-color: #f8f9fa;
                --dark-color: #343a40;
                --border-color: #e0e6ed;
            }
            * { 
                box-sizing: border-box; 
                margin: 0;
                padding: 0;
            }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: white; /* Fundo branco para a imagem */
                color: var(--dark-color);
                line-height: 1.5; 
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            .container { 
                background-color: white;
                border-radius: 0; /* Remove bordas arredondadas para a imagem */
                box-shadow: none; /* Remove sombra para a imagem */
                overflow: hidden; 
            }
            header.report-header {
                background: linear-gradient(135deg, var(--primary-color), #5a8ac6);
                color: white;
                padding: ${headerPadding};
                text-align: center;
            }
            header.report-header h1 {
                margin: 0;
                font-size: ${headerH1Size}; 
                font-weight: 600;
            }
            .report-output-container {
                padding: ${reportOutputPadding}; 
            }
            .table-section h2 {
                color: var(--primary-color);
                font-size: ${tableSectionH2Size}; 
                font-weight: 600;
                text-align: ${tableSectionH2TextAlign};
                margin-top: 0;
                margin-bottom: ${tableSectionH2MarginBottom}; 
                border-bottom: 1px solid var(--border-color);
                padding-bottom: 10px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
            }
            th, td {
                padding: ${tableCellPadding}; 
                text-align: left;
                vertical-align: middle;
                font-size: ${tableCellFontSize}; 
            }
            thead th {
                background-color: var(--light-color);
                color: var(--primary-color);
                font-weight: 600;
                border-bottom: 2px solid var(--border-color);
            }
            thead th:last-child { text-align: center; }
            tbody td { border-bottom: 1px solid var(--border-color); }
            tbody tr:not(.total):last-of-type td { border-bottom: none; }
            tbody td:last-child { text-align: center; font-weight: 600; }
            tr.total td {
                background-color: var(--light-color);
                color: var(--primary-color);
                font-weight: bold;
                border-top: 2px solid var(--primary-color);
                border-bottom: none; 
            }
            footer.report-footer {
                background-color: var(--light-color);
                color: var(--secondary-color);
                text-align: center;
                padding: ${footerPadding};
                font-size: ${footerFontSize};
                border-top: 1px solid var(--border-color);
            }
        </style>
        `;
    }

    // Gera a string HTML completa para download
    function generateFullHtmlReportString(eventName, data, total, generationDate) {
        const styles = getReportStylesForHtmlDownload();
        const tableRowsHtml = generateReportTableContentHtml(data, total, false); // Não filtra zeros para HTML baixado

        return `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Relatório de Contagem - ${escapeHTML(eventName)}</title>
                ${styles}
            </head>
            <body>
                <div class="container" style="max-width: 800px; margin: 20px auto; box-shadow: 0 6px 12px rgba(0,0,0,0.1); border-radius: 8px;">
                    <header class="report-header">
                        <h1>Relatório de Contagem - Connect</h1>
                    </header>
                    <div class="report-output-container">
                        <section class="table-section">
                            <h2>${escapeHTML(eventName)}</h2>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Categoria</th>
                                        <th>Descrição</th>
                                        <th>Quantidade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tableRowsHtml}
                                </tbody>
                            </table>
                        </section>
                    </div>
                    <footer class="report-footer">
                        <p>Sistema de Relatórios Connect | Gerado em ${escapeHTML(generationDate)}</p>
                    </footer>
                </div>
            </body>
            </html>
        `;
    }

    // Inicia o download de um arquivo HTML
    function downloadHtmlReport(htmlContent, eventName, generationDate) {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        // Cria um nome de arquivo seguro
        const safeEventName = eventName.replace(/[^a-z0-9_-\s]/gi, '_').replace(/\s+/g, '_');
        const safeDate = generationDate.replace(/[\/:]/g, '-').replace(/\s/g, '_');
        a.download = `Relatorio_Connect_${safeEventName}_${safeDate}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }
    
    // Atualiza a data de geração na UI e a retorna
    function updateGenerationDateAndGetIt() {
        const today = new Date();
        const dateString = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeString = today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const fullDateTimeString = `${dateString} ${timeString}`;
        if (generationDateEl) {
            generationDateEl.textContent = fullDateTimeString;
        }
        return fullDateTimeString;
    }

    // Atualiza a data de geração na UI ao carregar a página
    function updateGenerationDate() {
        const today = new Date();
        const dateString = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeString = today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        if (generationDateEl) {
            generationDateEl.textContent = `${dateString} ${timeString}`;
        }
    }

    // Função para escapar HTML para evitar XSS e garantir a exibição correta
    function escapeHTML(str) {
        if (typeof str !== 'string') return String(str);
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }
});