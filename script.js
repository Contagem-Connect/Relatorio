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
    const parseFeedbackLogEl = document.getElementById('parseFeedbackLog');

    // --- ELEMENTOS PARA RESUMO E ASSOCIAÇÃO ---
    const parseFeedbackSummaryEl = document.getElementById('parseFeedbackSummary');
    const associateTermModal = document.getElementById('associateTermModal');
    const closeAssociateModalBtn = document.getElementById('closeAssociateModalBtn');
    const originalLineToAssociateEl = document.getElementById('originalLineToAssociate');
    const associateKeywordInput = document.getElementById('associateKeyword');
    const associateFieldSelect = document.getElementById('associateField');
    const saveAssociationBtn = document.getElementById('saveAssociationBtn');

    let currentLineToAssociate = '';

    // Verifica parser
    if (typeof parseRawData === 'undefined' || typeof saveCustomMapping === 'undefined' || typeof normalizeText === 'undefined') {
        console.error("Funções do parser não encontradas. Verifique services/parser.js.");
        alert("Erro na inicialização: Funções essenciais do parser não carregadas.");
        return;
    }

    // MELHORIA UX: Carregar último nome de evento salvo
    const savedEventName = localStorage.getItem('lastEventName');
    if (savedEventName && eventNameInput) {
        eventNameInput.value = savedEventName;
    }

    updateGenerationDate();

    // --- CONTROLE DO MODAL DE DADOS BRUTOS ---
    processRawDataBtn.addEventListener('click', () => {
        rawDataModal.style.display = 'flex';
        rawDataInput.value = '';
        parseFeedbackLogEl.innerHTML = '';
        parseFeedbackSummaryEl.style.display = 'none';
        const today = new Date();
        if (today.getDay() === 0) {
            sundayTurnoSelector.style.display = 'block';
        } else {
            sundayTurnoSelector.style.display = 'none';
        }
    });

    const closeModal = () => {
        rawDataModal.style.display = 'none';
        rawDataInput.value = '';
        parseFeedbackLogEl.innerHTML = '';
        parseFeedbackSummaryEl.style.display = 'none';
    };
    closeModalBtn.addEventListener('click', closeModal);
    rawDataModal.addEventListener('click', (event) => {
        if (event.target === rawDataModal) closeModal();
    });

    // --- LÓGICA DE PREENCHIMENTO DO FORMULÁRIO E FEEDBACK ---
    fillFormBtn.addEventListener('click', () => {
        const rawText = rawDataInput.value;
        if (!rawText.trim()) {
            alert('Por favor, cole os dados no campo de texto.');
            return;
        }

        const { parsedData, feedbackLog } = parseRawData(rawText);

        parseFeedbackLogEl.innerHTML = '';
        let successCount = 0;
        let ignoredCount = 0;

        feedbackLog.forEach(log => {
            const p = document.createElement('p');
            p.textContent = `${log.line} -> ${log.message}`;
            p.className = log.status === 'success' ? 'log-success' : 'log-ignored';

            if (log.status === 'success') {
                successCount++;
            } else {
                ignoredCount++;
                const associateBtn = document.createElement('button');
                associateBtn.textContent = 'Associar';
                associateBtn.className = 'associate-btn';
                associateBtn.onclick = () => openAssociateModal(log.line);
                p.appendChild(associateBtn);
            }
            parseFeedbackLogEl.appendChild(p);
        });

        displayFeedbackSummary(successCount, ignoredCount);

        // Se o nome do evento estiver vazio, gera um automático, senão mantém o que o usuário já digitou/editou
        if(!eventNameInput.value.trim()){
            eventNameInput.value = generateEventTitle();
        }

        // Limpar inputs numéricos antes de preencher
        const numberInputs = document.querySelectorAll('form#reportForm input[type="number"]');
        numberInputs.forEach(input => input.value = 0);
        
        for (const inputId in parsedData) {
            const inputElement = document.getElementById(inputId);
            if (inputElement) {
                inputElement.value = parsedData[inputId];
            }
        }
        
        // MELHORIA UX: Atualizar subtotais após preenchimento automático
        calculateSubtotals();
        
        alert('Formulário analisado e preenchido! Verifique o log para detalhes.');
    });

    // --- FUNÇÃO PARA CALCULAR TOTAIS EM TEMPO REAL ---
    function calculateSubtotals() {
        const fieldsets = document.querySelectorAll('fieldset[data-group]');
        fieldsets.forEach(fieldset => {
            const inputs = fieldset.querySelectorAll('input[type="number"]');
            let subtotal = 0;
            inputs.forEach(input => {
                subtotal += parseInt(input.value) || 0;
            });
            
            const totalSpan = fieldset.querySelector('.group-total');
            if (totalSpan) {
                totalSpan.textContent = `(Total: ${subtotal})`;
            }
        });
    }

    // Adiciona listener para recalcular totais sempre que um número mudar
    const allNumberInputs = document.querySelectorAll('form#reportForm input[type="number"]');
    allNumberInputs.forEach(input => {
        input.addEventListener('input', calculateSubtotals);
    });

    // --- FUNÇÕES DE FEEDBACK ---
    function displayFeedbackSummary(success, ignored) {
        parseFeedbackSummaryEl.innerHTML = '';
        parseFeedbackSummaryEl.style.display = 'block';

        let icon = '';
        let message = '';
        let className = 'feedback-summary';

        if (ignored === 0 && success > 0) {
            icon = '✅';
            message = `Todas as ${success} linhas reconhecidas!`;
            className += ' success-summary';
        } else if (success > 0 && ignored > 0) {
            icon = '⚠️';
            message = `${success} reconhecidas, ${ignored} ignoradas.`;
            className += ' warning-summary';
        } else if (ignored > 0 && success === 0) {
            icon = '❌';
            message = `Nenhuma linha reconhecida. ${ignored} ignoradas.`;
            className += ' warning-summary'; 
        } else {
            parseFeedbackSummaryEl.style.display = 'none';
            return;
        }

        parseFeedbackSummaryEl.className = className;
        parseFeedbackSummaryEl.innerHTML = `<span class="icon">${icon}</span> ${message}`;
    }

    // --- MODAL DE ASSOCIAÇÃO ---
    function openAssociateModal(originalLine) {
        currentLineToAssociate = originalLine;
        originalLineToAssociateEl.textContent = originalLine;
        associateKeywordInput.value = '';
        associateFieldSelect.value = '';
        const wordsInLine = normalizeText(originalLine).split(' ').filter(word => word.length > 2);
        if (wordsInLine.length > 0) {
            associateKeywordInput.value = wordsInLine[0];
        }
        associateTermModal.style.display = 'flex';
    }

    function closeAssociateModal() {
        associateTermModal.style.display = 'none';
        currentLineToAssociate = '';
    }

    closeAssociateModalBtn.addEventListener('click', closeAssociateModal);
    associateTermModal.addEventListener('click', (event) => {
        if (event.target === associateTermModal) closeAssociateModal();
    });

    saveAssociationBtn.addEventListener('click', () => {
        const keyword = associateKeywordInput.value.trim();
        const inputId = associateFieldSelect.value;

        if (!keyword || !inputId) {
            alert('Preencha o termo e selecione o campo.');
            return;
        }

        if (typeof window.saveCustomMapping !== 'undefined' && typeof window.normalizeText !== 'undefined') {
            window.saveCustomMapping({ keywords: [window.normalizeText(keyword)], inputId: inputId });
            alert(`Termo "${keyword}" associado com sucesso!`);
            closeAssociateModal();
            fillFormBtn.click(); 
        } else {
            alert("Erro ao salvar mapeamento.");
        }
    });

    // --- GERAÇÃO DE RELATÓRIO ---
    function generateEventTitle() {
        const today = new Date();
        const dateString = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const dayOfWeek = today.getDay(); 
        const weekDays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
        
        if (dayOfWeek === 3) return `Culto de Quarta-feira - ${dateString}`;
        if (dayOfWeek === 0) {
            const selectedTurno = document.querySelector('input[name="turno"]:checked').value;
            return `Culto do dia ${dateString} (${weekDays[dayOfWeek]} - ${selectedTurno})`;
        }
        return `Culto do dia ${dateString} (${weekDays[dayOfWeek]})`;
    }

    function getFormData() {
        const eventName = eventNameInput.value.trim();
        if (!eventName) {
            alert("Por favor, informe o Nome do Evento/Período.");
            eventNameInput.focus();
            return null;
        }

        // MELHORIA UX: Salvar nome do evento
        localStorage.setItem('lastEventName', eventName);

        // CONFIGURAÇÃO DOS DADOS - INCLUI LITTLES
        const dataEntriesConfig = [
            { grupo: 'Culto', categoria: 'Culto', descricao: 'Presentes', id: 'cultoPresentes' },
            { grupo: 'Sala Babies', categoria: 'Babies', descricao: 'Bebês', id: 'babiesCriancas' },
            { grupo: 'Sala Babies', categoria: 'Babies', descricao: 'Mães', id: 'babiesMaes' },
            { grupo: 'Sala Babies', categoria: 'Babies', descricao: 'Tio(a) / Voluntário(a)', id: 'babiesResponsaveis' },
            
            // NOVO: LITTLES
            { grupo: 'Sala Littles', categoria: 'Littles', descricao: 'Crianças', id: 'littlesCriancas' },
            { grupo: 'Sala Littles', categoria: 'Littles', descricao: 'Mães', id: 'littlesMaes' },
            { grupo: 'Sala Littles', categoria: 'Littles', descricao: 'Tio(a) / Voluntário(a)', id: 'littlesTios' },
            
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
                const quantidade = parseInt(inputElement.value) || 0;
                reportData.push({
                    categoria: entryConfig.categoria,
                    descricao: entryConfig.descricao,
                    quantidade: quantidade
                });
                totalGeral += quantidade;
            }
        });
        return { eventName, reportData, totalGeral };
    }

    reportForm.addEventListener('submit', function(event) {
        event.preventDefault();
        handleGenerateHtmlReport();
    });
    
    function handleGenerateHtmlReport() {
        try {
            const formData = getFormData();
            if (!formData) return;

            const { eventName, reportData, totalGeral } = formData;
            const currentDateString = updateGenerationDateAndGetIt();
            const fullHtmlReport = generateFullHtmlReportString(eventName, reportData, totalGeral, currentDateString);
            downloadHtmlReport(fullHtmlReport, eventName, currentDateString);
        } catch (error) {
            console.error("Erro ao gerar HTML:", error);
            alert("Erro ao gerar relatório HTML.");
        }
    }

    generateAndShareImageBtn.addEventListener('click', async function() {
        try {
            const formData = getFormData();
            if (!formData) return;

            const { eventName, reportData, totalGeral } = formData;
            const currentDateString = updateGenerationDateAndGetIt();

            const reportContentHtml = generateReportVisualContentHtml(eventName, reportData, totalGeral, currentDateString, true);
            hiddenReportForCanvasEl.innerHTML = reportContentHtml;
            
            const elementToCapture = hiddenReportForCanvasEl.querySelector('.container');
            
            this.textContent = 'Gerando imagem...';
            this.disabled = true;

            const canvas = await html2canvas(elementToCapture, { 
                useCORS: true,
                scale: 1.5,
                logging: false,
                onclone: (clonedDoc) => {
                    const styleSheet = clonedDoc.createElement("style");
                    styleSheet.innerHTML = getReportStylesForCanvas();
                    clonedDoc.head.appendChild(styleSheet);
                }
            });

            canvas.toBlob(async function(blob) {
                if (!blob) {
                    alert('Erro ao gerar imagem.');
                    return;
                }
                const safeEventName = eventName.replace(/[^a-z0-9_-\s]/gi, '_').replace(/\s+/g, '_');
                const safeDate = currentDateString.replace(/[\/:]/g, '-').replace(/\s/g, '_');
                const fileName = `Relatorio_Connect_${safeEventName}_${safeDate}.png`;
                
                const filesArray = [new File([blob], fileName, { type: 'image/png' })];
                const shareData = {
                    title: `Relatório: ${eventName}`,
                    text: `Relatório de contagem - Connect\nEvento: ${eventName}\nGerado em: ${currentDateString}`,
                    files: filesArray,
                };

                if (navigator.share && navigator.canShare && navigator.canShare({ files: filesArray })) {
                    try {
                        await navigator.share(shareData);
                    } catch (err) {
                        if (err.name !== 'AbortError') downloadImage(blob, fileName);
                    }
                } else {
                    downloadImage(blob, fileName);
                }
                
                generateAndShareImageBtn.textContent = 'Gerar e Compartilhar Imagem (WhatsApp)';
                generateAndShareImageBtn.disabled = false;
                hiddenReportForCanvasEl.innerHTML = '';

            }, 'image/png', 0.95);

        } catch (error) {
            console.error("Erro imagem:", error);
            alert("Erro ao gerar imagem.");
            generateAndShareImageBtn.textContent = 'Gerar e Compartilhar Imagem (WhatsApp)';
            generateAndShareImageBtn.disabled = false;
        }
    });

    function downloadImage(blob, fileName) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    function generateReportTableContentHtml(data, total, filterZeros = false) {
        let tableContentHTML = '';
        let entriesToDisplay = data;
        if (filterZeros) entriesToDisplay = data.filter(entry => entry.quantidade > 0);

        if (entriesToDisplay.length === 0 && total === 0) {
            tableContentHTML = `<tr><td colspan="3" style="text-align: center; font-style: italic;">Nenhuma contagem registrada.</td></tr>`;
        } else if (entriesToDisplay.length === 0 && total > 0) {
            tableContentHTML = `<tr><td colspan="3" style="text-align: center; font-style: italic;">Nenhuma contagem individual para exibir.</td></tr>`;
        } else {
            entriesToDisplay.forEach(entry => {
                tableContentHTML += `
                    <tr>
                        <td>${escapeHTML(entry.categoria)}</td>
                        <td>${escapeHTML(entry.descricao)}</td>
                        <td>${entry.quantidade}</td>
                    </tr>`;
            });
        }

        let totalRowHtml = '';
        if (entriesToDisplay.length > 0 || total > 0) {
            totalRowHtml = `<tr class="total"><td>Total</td><td>Total Geral</td><td>${total}</td></tr>`;
        }
        return tableContentHTML + totalRowHtml;
    }

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
                            <thead><tr><th>Categoria</th><th>Descrição</th><th>Quantidade</th></tr></thead>
                            <tbody>${tableRowsHtml}</tbody>
                        </table>
                    </section>
                </div>
                <footer class="report-footer">
                    <p>Sistema de Relatórios Connect | Gerado em ${escapeHTML(generationDate)}</p>
                </footer>
            </div>
        `;
    }
    
    function getReportStylesForCanvas() { return getReportStyles(true); }
    function getReportStylesForHtmlDownload() { return getReportStyles(false); }
    
    function getReportStyles(isForCanvas = false) {
        const headerH1Size = isForCanvas ? '1.6em' : '1.8em';
        const tableSectionH2Size = isForCanvas ? '1.5em' : '1.4em'; 
        const tableSectionH2TextAlign = isForCanvas ? 'center' : 'left';
        
        return `
        <style>
            :root { --primary-color: #4a6fa5; --secondary-color: #6c757d; --light-color: #f8f9fa; --dark-color: #343a40; --border-color: #e0e6ed; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: white; color: var(--dark-color); line-height: 1.5; }
            .container { background-color: white; border-radius: 0; box-shadow: none; overflow: hidden; }
            header.report-header { background: linear-gradient(135deg, var(--primary-color), #5a8ac6); color: white; padding: 25px 30px; text-align: center; }
            header.report-header h1 { margin: 0; font-size: ${headerH1Size}; font-weight: 600; }
            .report-output-container { padding: 25px 30px; }
            .table-section h2 { color: var(--primary-color); font-size: ${tableSectionH2Size}; font-weight: 600; text-align: ${tableSectionH2TextAlign}; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 12px 15px; text-align: left; vertical-align: middle; }
            thead th { background-color: var(--light-color); color: var(--primary-color); font-weight: 600; border-bottom: 2px solid var(--border-color); }
            thead th:last-child { text-align: center; }
            tbody td { border-bottom: 1px solid var(--border-color); }
            tbody td:last-child { text-align: center; font-weight: 600; }
            tr.total td { background-color: var(--light-color); color: var(--primary-color); font-weight: bold; border-top: 2px solid var(--primary-color); }
            footer.report-footer { background-color: var(--light-color); color: var(--secondary-color); text-align: center; padding: 20px; font-size: 0.85rem; border-top: 1px solid var(--border-color); }
        </style>
        `;
    }

    function generateFullHtmlReportString(eventName, data, total, generationDate) {
        const styles = getReportStylesForHtmlDownload();
        const tableRowsHtml = generateReportTableContentHtml(data, total, false);

        return `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Relatório - ${escapeHTML(eventName)}</title>
                ${styles}
            </head>
            <body>
                <div class="container" style="max-width: 800px; margin: 20px auto; box-shadow: 0 6px 12px rgba(0,0,0,0.1); border-radius: 8px;">
                    <header class="report-header"><h1>Relatório de Contagem - Connect</h1></header>
                    <div class="report-output-container">
                        <section class="table-section">
                            <h2>${escapeHTML(eventName)}</h2>
                            <table><thead><tr><th>Categoria</th><th>Descrição</th><th>Quantidade</th></tr></thead><tbody>${tableRowsHtml}</tbody></table>
                        </section>
                    </div>
                    <footer class="report-footer"><p>Sistema de Relatórios Connect | Gerado em ${escapeHTML(generationDate)}</p></footer>
                </div>
            </body>
            </html>
        `;
    }

    function downloadHtmlReport(htmlContent, eventName, generationDate) {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        const safeEventName = eventName.replace(/[^a-z0-9_-\s]/gi, '_').replace(/\s+/g, '_');
        const safeDate = generationDate.replace(/[\/:]/g, '-').replace(/\s/g, '_');
        a.download = `Relatorio_Connect_${safeEventName}_${safeDate}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }
    
    function updateGenerationDateAndGetIt() {
        const today = new Date();
        const str = `${today.toLocaleDateString('pt-BR')} ${today.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
        if (generationDateEl) generationDateEl.textContent = str;
        return str;
    }

    function updateGenerationDate() {
        updateGenerationDateAndGetIt();
    }

    function escapeHTML(str) {
        if (typeof str !== 'string') return String(str);
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }
});