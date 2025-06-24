document.addEventListener('DOMContentLoaded', function() {
    const reportForm = document.getElementById('reportForm');
    const generationDateEl = document.getElementById('generationDate');
    const eventNameInput = document.getElementById('eventName');

    const generateHtmlReportBtn = document.getElementById('generateHtmlReport');
    const generateAndShareImageBtn = document.getElementById('generateAndShareImage');
    const hiddenReportForCanvasEl = document.getElementById('hiddenReportForCanvas');

    if (!reportForm || !eventNameInput || !generateHtmlReportBtn || !generateAndShareImageBtn || !hiddenReportForCanvasEl || !generationDateEl) {
        console.error("Um ou mais elementos essenciais do DOM não foram encontrados! Verifique os IDs no HTML.");
        if (!reportForm) console.error("Elemento 'reportForm' não encontrado.");
        if (!eventNameInput) console.error("Elemento 'eventNameInput' (ID: eventName) não encontrado.");
        if (!generateHtmlReportBtn) console.error("Elemento 'generateHtmlReportBtn' não encontrado.");
        if (!generateAndShareImageBtn) console.error("Elemento 'generateAndShareImageBtn' não encontrado.");
        if (!hiddenReportForCanvasEl) console.error("Elemento 'hiddenReportForCanvasEl' não encontrado.");
        if (!generationDateEl) console.error("Elemento 'generationDateEl' não encontrado.");
        alert("Erro na inicialização da página. Alguns elementos HTML necessários não foram encontrados. Verifique o console para mais detalhes.");
        return;
    }

    updateGenerationDate();

    function getFormData() {
        const eventName = eventNameInput.value.trim();
        if (!eventName) {
            alert("Por favor, informe o Nome do Evento/Período.");
            eventNameInput.focus();
            return null;
        }

        const dataEntriesConfig = [
            { grupo: 'Culto', categoria: 'Culto', descricao: 'Presentes', id: 'cultoPresentes' },
            { grupo: 'Sala Babies', categoria: 'Babies', descricao: 'Bebês', id: 'babiesCriancas' },
            { grupo: 'Sala Babies', categoria: 'Babies', descricao: 'Mães', id: 'babiesMaes' },
            { grupo: 'Sala Babies', categoria: 'Babies', descricao: 'Pais/Responsáveis', id: 'babiesResponsaveis' },
            { grupo: 'Kids', categoria: 'Kids', descricao: 'Crianças', id: 'kidsCriancas' },
            { grupo: 'Kids', categoria: 'Kids', descricao: 'Mães', id: 'kidsMaes' },
            { grupo: 'Kids', categoria: 'Kids', descricao: 'Tias/Voluntários', id: 'kidsTias' },
            { grupo: 'Teens', categoria: 'Teens', descricao: 'Adolescentes', id: 'teensAdolescentes' },
            { grupo: 'Teens', categoria: 'Teens', descricao: 'Tio/Voluntário', id: 'teensTios' }
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
            } else {
                console.warn(`Elemento de input com ID '${entryConfig.id}' não encontrado.`);
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
            // Para o relatório HTML, continuamos mostrando todas as linhas, inclusive as zeradas.
            const fullHtmlReport = generateFullHtmlReportString(eventName, reportData, totalGeral, currentDateString);
            downloadHtmlReport(fullHtmlReport, eventName, currentDateString);
        } catch (error) {
            console.error("Erro ao gerar relatório HTML:", error);
            alert("Ocorreu um erro ao gerar o relatório HTML. Verifique o console.");
        }
    }

    generateAndShareImageBtn.addEventListener('click', async function() {
        try {
            const formData = getFormData();
            if (!formData) return;

            const { eventName, reportData, totalGeral } = formData;
            const currentDateString = updateGenerationDateAndGetIt();

            // Para a imagem, filtramos para mostrar apenas entradas com quantidade > 0.
            const reportContentHtml = generateReportVisualContentHtml(eventName, reportData, totalGeral, currentDateString, true); // true para filtrar zerados
            hiddenReportForCanvasEl.innerHTML = reportContentHtml;
            
            const elementToCapture = hiddenReportForCanvasEl.querySelector('.container');
            if (!elementToCapture) {
                console.error("Elemento '.container' dentro de '#hiddenReportForCanvas' não encontrado para captura.");
                alert("Erro ao preparar conteúdo para imagem: container interno não encontrado.");
                return;
            }
            
            this.textContent = 'Gerando imagem...';
            this.disabled = true;

            const canvas = await html2canvas(elementToCapture, { 
                useCORS: true,
                scale: 1.5,
                logging: false, // Pode ser true para debug
                onclone: (clonedDoc) => {
                    const styleSheet = clonedDoc.createElement("style");
                    styleSheet.innerHTML = getReportStylesForCanvas();
                    clonedDoc.head.appendChild(styleSheet);
                }
            });

            canvas.toBlob(async function(blob) {
                if (!blob) {
                    alert('Erro ao gerar imagem (blob nulo).');
                    generateAndShareImageBtn.textContent = 'Gerar e Compartilhar Imagem (WhatsApp)';
                    generateAndShareImageBtn.disabled = false;
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
                        console.log('Relatório compartilhado com sucesso!');
                    } catch (err) {
                        console.error('Erro ao compartilhar:', err);
                        if (err.name !== 'AbortError') {
                           alert(`Erro ao compartilhar: ${err.message}. Você pode tentar baixar a imagem.`);
                           downloadImage(blob, fileName);
                        }
                    }
                } else {
                    alert('Seu navegador não suporta compartilhamento direto de imagens. A imagem será baixada para compartilhamento manual.');
                    downloadImage(blob, fileName);
                }
                
                generateAndShareImageBtn.textContent = 'Gerar e Compartilhar Imagem (WhatsApp)';
                generateAndShareImageBtn.disabled = false;
                hiddenReportForCanvasEl.innerHTML = '';

            }, 'image/png', 0.95);

        } catch (error) {
            console.error("Erro ao gerar/compartilhar imagem:", error);
            alert("Ocorreu um erro ao gerar ou compartilhar a imagem. Verifique o console.");
            generateAndShareImageBtn.textContent = 'Gerar e Compartilhar Imagem (WhatsApp)';
            generateAndShareImageBtn.disabled = false;
            hiddenReportForCanvasEl.innerHTML = '';
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

    // `filterZeros` é um novo parâmetro booleano.
    // Se true, filtra entradas com quantidade 0. Usado para a imagem.
    // Se false (ou omitido), mostra todas as entradas. Usado para o HTML.
    function generateReportTableContentHtml(data, total, filterZeros = false) {
        let tableContentHTML = '';
        let entriesToDisplay = data;

        if (filterZeros) {
            entriesToDisplay = data.filter(entry => entry.quantidade > 0);
        }

        if (entriesToDisplay.length === 0 && total === 0) {
            tableContentHTML = `<tr><td colspan="3" style="text-align: center; font-style: italic;">Nenhuma contagem registrada.</td></tr>`;
        } else if (entriesToDisplay.length === 0 && total > 0) {
            tableContentHTML = `<tr><td colspan="3" style="text-align: center; font-style: italic;">Nenhuma contagem individual para exibir (valores zerados ocultos). Total: ${total}</td></tr>`;
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
        // Mostra a linha de total se houver entradas visíveis (após filtro) ou se o total geral for maior que zero.
        if (entriesToDisplay.length > 0 || total > 0) {
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

    function generateReportVisualContentHtml(eventName, data, total, generationDate, filterZerosForImage) {
        const styles = getReportStylesForCanvas();
        const tableRowsHtml = generateReportTableContentHtml(data, total, filterZerosForImage);

        return `
            ${styles} 
            <div class="container" style="width:100%; max-width:100%; margin:0; padding:0; box-shadow:none; border-radius:0; background-color: white;"> 
                <header class="report-header">
                    <h1>Relatório de Contagem - Connect</h1>
                </header>
                <div class="report-output-container" style="padding: 25px 30px;">
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
    
    function getReportStylesForCanvas() {
        return getReportStyles();
    }
    
    function getReportStyles() {
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
                background-color: white; 
                color: var(--dark-color);
                line-height: 1.6;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            .container { 
                background-color: white;
                border-radius: 0; 
                box-shadow: none; 
                overflow: hidden; 
            }
            header.report-header {
                background: linear-gradient(135deg, var(--primary-color), #5a8ac6);
                color: white;
                padding: 25px 30px;
                text-align: center;
            }
            header.report-header h1 {
                margin: 0;
                font-size: 1.8em; 
                font-weight: 600;
            }
            .report-output-container {
                padding: 25px 30px; 
            }
            .table-section h2 {
                color: var(--primary-color);
                font-size: 1.4em; 
                margin-top: 0;
                margin-bottom: 20px;
                border-bottom: 1px solid var(--border-color);
                padding-bottom: 10px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
            }
            th, td {
                padding: 12px 15px; 
                text-align: left;
                vertical-align: middle;
                font-size: 0.95em; 
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
                padding: 20px 30px;
                font-size: 0.85rem;
                border-top: 1px solid var(--border-color);
            }
        </style>
        `;
    }

    function generateFullHtmlReportString(eventName, data, total, generationDate) {
        const styles = getReportStyles();
        // Para o relatório HTML, não filtramos as linhas zeradas.
        const tableRowsHtml = generateReportTableContentHtml(data, total, false);

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
        const dateString = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeString = today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const fullDateTimeString = `${dateString} ${timeString}`;
        if (generationDateEl) {
            generationDateEl.textContent = fullDateTimeString;
        }
        return fullDateTimeString;
    }

    function updateGenerationDate() {
        const today = new Date();
        const dateString = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeString = today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        if (generationDateEl) {
            generationDateEl.textContent = `${dateString} ${timeString}`;
        }
    }

    function escapeHTML(str) {
        if (typeof str !== 'string') return String(str);
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }
});