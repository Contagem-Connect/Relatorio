document.addEventListener('DOMContentLoaded', function() {
    const reportForm = document.getElementById('reportForm');
    const generationDateEl = document.getElementById('generationDate');
    const eventNameInput = document.getElementById('eventName'); // Definido no escopo superior

    // Botões
    const generateHtmlReportBtn = document.getElementById('generateHtmlReport');
    const generateAndShareImageBtn = document.getElementById('generateAndShareImage');
    
    // Div oculta para renderizar para canvas
    const hiddenReportForCanvasEl = document.getElementById('hiddenReportForCanvas');

    if (!reportForm || !eventNameInput || !generateHtmlReportBtn || !generateAndShareImageBtn || !hiddenReportForCanvasEl) {
        console.error("Um ou mais elementos essenciais do formulário não foram encontrados!");
        alert("Erro na inicialização da página. Alguns elementos não foram encontrados.")
        return;
    }

    if (generationDateEl) {
        updateGenerationDate();
    }

    // --- FUNÇÕES AUXILIARES DE COLETA E VALIDAÇÃO ---
    function getFormData() {
        const eventName = eventNameInput.value.trim();
        if (!eventName) {
            alert("Por favor, informe o Nome do Evento/Período.");
            eventNameInput.focus();
            return null; // Indica falha
        }

        const dataEntriesConfig = [
            { grupo: 'Culto', categoria: 'Culto', descricao: 'Presentes', id: 'cultoPresentes' },
            { grupo: 'Sala Babies', categoria: 'Babies', descricao: 'Bebês', id: 'babiesCriancas' },
            { grupo: 'Sala Babies', categoria: 'Babies', descricao: 'Pais/Responsáveis', id: 'babiesResponsaveis' },
            { grupo: 'Kids', categoria: 'Kids', descricao: 'Crianças', id: 'kidsCriancas' },
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
                // Incluir mesmo se for 0 para consistência na estrutura, mas apenas > 0 para o array reportData
                if (quantidade > 0) {
                     reportData.push({
                        categoria: entryConfig.categoria,
                        descricao: entryConfig.descricao,
                        quantidade: quantidade
                    });
                }
                totalGeral += quantidade;
            } else {
                console.warn(`Elemento de input com ID '${entryConfig.id}' não encontrado.`);
            }
        });
        return { eventName, reportData, totalGeral };
    }

    // --- LÓGICA PARA GERAR RELATÓRIO HTML (DOWNLOAD) ---
    reportForm.addEventListener('submit', function(event) { // Este listener é para o botão de submit (HTML)
        event.preventDefault();
        handleGenerateHtmlReport();
    });
    
    // Mantive o listener no botão e não no form submit para o botão de imagem.
    // Se o botão HTML ainda for type="submit", precisamos disso.
    // Se ambos fossem type="button", poderíamos ter listeners separados em cada botão.
    // Alterei o botão HTML para ter um ID e não ser o submit padrão do form para evitar confusão.
    // O event listener do form é acionado pelo type="submit".
    // Para simplificar, o primeiro botão continua type="submit" e aciona o form.
    // O segundo botão é type="button" e terá seu próprio listener.

    function handleGenerateHtmlReport() {
        try {
            const formData = getFormData();
            if (!formData) return; // Validação falhou

            const { eventName, reportData, totalGeral } = formData;
            const currentDateString = updateGenerationDateAndGetIt();
            const fullHtmlReport = generateFullHtmlReportString(eventName, reportData, totalGeral, currentDateString);
            downloadHtmlReport(fullHtmlReport, eventName, currentDateString);
            // alert('Relatório HTML gerado e download iniciado!');
        } catch (error) {
            console.error("Erro ao gerar relatório HTML:", error);
            alert("Ocorreu um erro ao gerar o relatório HTML. Verifique o console.");
        }
    }


    // --- LÓGICA PARA GERAR E COMPARTILHAR IMAGEM ---
    generateAndShareImageBtn.addEventListener('click', async function() {
        try {
            const formData = getFormData();
            if (!formData) return; // Validação falhou

            const { eventName, reportData, totalGeral } = formData;
            const currentDateString = updateGenerationDateAndGetIt();

            // 1. Gerar o HTML do conteúdo do relatório para o canvas
            // Usamos a mesma estrutura interna do relatório HTML, mas sem o doctype/head/body completo
            const reportContentHtml = generateReportVisualContentHtml(eventName, reportData, totalGeral, currentDateString);
            hiddenReportForCanvasEl.innerHTML = reportContentHtml;
            
            // É crucial que o elemento #hiddenReportForCanvas tenha os estilos aplicados.
            // O ideal é que generateReportVisualContentHtml já inclua um <style> tag escopado ou que
            // os estilos sejam globais o suficiente. O style.css principal já é global.
            // Para garantir que `html2canvas` pegue os estilos corretamente, especialmente os de variáveis CSS,
            // vamos capturar o elemento .container dentro do div oculto.

            const elementToCapture = hiddenReportForCanvasEl.querySelector('.container');
            if (!elementToCapture) {
                alert("Erro ao preparar conteúdo para imagem.");
                return;
            }
            
            // Adicionar um feedback visual
            this.textContent = 'Gerando imagem...';
            this.disabled = true;

            // 2. Usar html2canvas
            const canvas = await html2canvas(elementToCapture, { 
                useCORS: true, // Se houver imagens externas
                scale: 1.5 // Aumenta a resolução da imagem, melhora a qualidade
            });

            // 3. Converter canvas para Blob (melhor para API de Compartilhamento)
            canvas.toBlob(async function(blob) {
                if (!blob) {
                    alert('Erro ao gerar imagem (blob nulo).');
                    generateAndShareImageBtn.textContent = 'Gerar e Compartilhar Imagem (WhatsApp)';
                    generateAndShareImageBtn.disabled = false;
                    return;
                }
                const safeEventName = eventName.replace(/[^a-z0-9_-\s]/gi, '_').replace(/\s+/g, '_');
                const safeDate = currentDateString.replace(/\//g, '-');
                const fileName = `Relatorio_Connect_${safeEventName}_${safeDate}.png`;
                
                const filesArray = [new File([blob], fileName, { type: 'image/png' })];
                const shareData = {
                    title: `Relatório: ${eventName}`,
                    text: `Relatório de contagem - Connect\nEvento: ${eventName}\nGerado em: ${currentDateString}`,
                    files: filesArray,
                };

                // 4. Tentar compartilhar via Web Share API
                if (navigator.share && navigator.canShare && navigator.canShare({ files: filesArray })) {
                    try {
                        await navigator.share(shareData);
                        console.log('Relatório compartilhado com sucesso!');
                        // alert('Relatório compartilhado!'); // Opcional
                    } catch (err) {
                        console.error('Erro ao compartilhar:', err);
                        if (err.name !== 'AbortError') { // AbortError é quando o usuário cancela o compartilhamento
                           alert(`Erro ao compartilhar: ${err.message}. Você pode tentar baixar a imagem.`);
                           // Fallback para download se o compartilhamento falhar por outro motivo
                           downloadImage(blob, fileName);
                        }
                    }
                } else {
                    // Fallback se Web Share API não estiver disponível ou não puder compartilhar arquivos
                    alert('Seu navegador não suporta compartilhamento direto de imagens. A imagem será baixada para compartilhamento manual.');
                    downloadImage(blob, fileName);
                }
                
                generateAndShareImageBtn.textContent = 'Gerar e Compartilhar Imagem (WhatsApp)';
                generateAndShareImageBtn.disabled = false;
                hiddenReportForCanvasEl.innerHTML = ''; // Limpar o div oculto

            }, 'image/png', 0.95); // Formato e qualidade

        } catch (error) {
            console.error("Erro ao gerar/compartilhar imagem:", error);
            alert("Ocorreu um erro ao gerar ou compartilhar a imagem.");
            generateAndShareImageBtn.textContent = 'Gerar e Compartilhar Imagem (WhatsApp)';
            generateAndShareImageBtn.disabled = false;
            hiddenReportForCanvasEl.innerHTML = ''; // Limpar o div oculto
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

    // --- FUNÇÕES DE GERAÇÃO DE CONTEÚDO HTML ---

    // Esta função gera APENAS o conteúdo visual do relatório, para ser usado por html2canvas
    function generateReportVisualContentHtml(eventName, data, total, generationDate) {
        // Pega os mesmos estilos do relatório HTML completo
        const styles = getReportStyles(); // Reutiliza os estilos

        let tableContentHTML = '';
        if (data.length === 0 && total === 0) {
            tableContentHTML = `<tr><td colspan="3" style="text-align: center; font-style: italic;">Nenhuma contagem registrada.</td></tr>`;
        } else {
            data.forEach(entry => {
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
        if (data.length > 0 || total > 0) {
            totalRowHtml = `
                <tr class="total">
                    <td>Total</td>
                    <td>Total Geral</td>
                    <td>${total}</td>
                </tr>
            `;
        }

        // Retorna a estrutura que será renderizada dentro do #hiddenReportForCanvasEl
        // Inclui o <style> para que html2canvas o processe corretamente.
        return `
            ${styles} 
            <div class="container" style="margin:0; box-shadow:none; border-radius:0;"> 
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
                                ${tableContentHTML}
                                ${totalRowHtml}
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
    
    // Função que retorna a string dos estilos CSS para o relatório (para HTML e para Canvas)
    function getReportStyles() {
        // Estes são os mesmos estilos que estavam em generateFullHtmlReportString
        // É importante mantê-los sincronizados com style.css se quiser consistência total,
        // ou referenciar o style.css dinamicamente (mais complexo para embutir)
        return `
        <style>
            :root {
                --primary-color: #4a6fa5;
                --secondary-color: #6c757d;
                --light-color: #f8f9fa;
                --dark-color: #343a40;
                --border-color: #e0e6ed;
            }
            /* Reset básico para o elemento que será capturado, se necessário */
            * { box-sizing: border-box; }

            body { /* Estilo para o contexto do relatório, não a página principal */
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f5f8fa; /* Fundo que aparecerá na imagem se houver margens */
                margin: 0;
                padding: 0; /* Removido padding do body para a captura */
                color: var(--dark-color);
                line-height: 1.6;
                -webkit-font-smoothing: antialiased; /* Melhora renderização de fontes no canvas */
                -moz-osx-font-smoothing: grayscale;
            }

            .container {
                background-color: white;
                /* max-width: 800px; A largura é controlada pelo div#hiddenReportForCanvas */
                /* margin: 40px auto; Removido para html2canvas */
                border-radius: 10px; /* Mantido se desejado na imagem */
                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08); /* Mantido */
                overflow: hidden; /* Mantido */
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
                padding: 12px 15px; /* Ligeiramente menor para caber bem */
                text-align: left;
                vertical-align: middle;
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

    // Renomeada a função original para clareza
    function generateFullHtmlReportString(eventName, data, total, generationDate) {
        const styles = getReportStyles(); // Usa a função centralizada de estilos
        let tableContentHTML = '';
        if (data.length === 0 && total === 0) {
            tableContentHTML = `<tr><td colspan="3" style="text-align: center; font-style: italic;">Nenhuma contagem registrada.</td></tr>`;
        } else {
            data.forEach(entry => {
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
        if (data.length > 0 || total > 0) {
             totalRowHtml = `
                <tr class="total">
                    <td>Total</td>
                    <td>Total Geral</td>
                    <td>${total}</td>
                </tr>
            `;
        }

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
                <div class="container">
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
                                    ${tableContentHTML}
                                    ${totalRowHtml}
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
        const safeDate = generationDate.replace(/\//g, '-');
        a.download = `Relatorio_Connect_${safeEventName}_${safeDate}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }
    
    function updateGenerationDateAndGetIt() {
        const today = new Date();
        const dateString = today.toLocaleDateString('pt-BR'); // Formato DD/MM/YYYY
        if (generationDateEl) {
            generationDateEl.textContent = dateString;
        }
        return dateString;
    }

    function updateGenerationDate() { // Apenas atualiza, não retorna
        const today = new Date();
        if (generationDateEl) {
            generationDateEl.textContent = today.toLocaleDateString('pt-BR');
        }
    }

    function escapeHTML(str) {
        if (typeof str !== 'string') return String(str);
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }
});