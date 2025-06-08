document.addEventListener('DOMContentLoaded', function() {
    const reportForm = document.getElementById('reportForm');
    // const reportOutputContainer = document.getElementById('reportOutputContainer'); // Não será mais usado para exibir diretamente, mas pode ser mantido se desejar
    const generationDateEl = document.getElementById('generationDate');

    // Verificações iniciais
    if (!reportForm) {
        console.error("Formulário com ID 'reportForm' não encontrado!");
        return;
    }
    if (!generationDateEl) {
        console.error("Elemento de data com ID 'generationDate' não encontrado!");
    } else {
        updateGenerationDate(); // Atualiza a data no rodapé da página principal ao carregar
    }

    reportForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Impede o envio padrão do formulário

        try {
            const eventNameInput = document.getElementById('eventName');
            if (!eventNameInput) {
                console.error("Campo 'eventName' não encontrado!");
                alert("Erro interno: campo 'eventName' não encontrado.");
                return;
            }
            const eventName = eventNameInput.value.trim();

            if (!eventName) {
                alert("Por favor, informe o Nome do Evento/Período.");
                eventNameInput.focus();
                return;
            }

            const dataEntries = [
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

            dataEntries.forEach(entryConfig => {
                const inputElement = document.getElementById(entryConfig.id);
                if (inputElement) {
                    const quantidade = parseInt(inputElement.value) || 0;
                    // Mesmo que a quantidade seja 0, vamos incluir para manter a estrutura da tabela,
                    // mas a lógica de exibição pode decidir não mostrar se todas as sub-quantidades de um grupo forem 0.
                    // Para o relatório baixado, é melhor incluir todas as entradas com seus valores (mesmo 0),
                    // ou apenas as com quantidade > 0 como estava antes. Vou manter a lógica de incluir apenas > 0
                    // para a tabela ficar mais enxuta, como no código original.
                    if (quantidade > 0) {
                        reportData.push({
                            categoria: entryConfig.categoria,
                            descricao: entryConfig.descricao,
                            quantidade: quantidade
                        });
                    }
                    totalGeral += quantidade; // O total geral considera todos, mesmo os que não entram na tabela individualmente se for 0
                } else {
                    console.warn(`Elemento de input com ID '${entryConfig.id}' não encontrado.`);
                }
            });
            
            // Atualiza a data de geração para o momento do clique
            const currentDateString = updateGenerationDateAndGetIt();

            const fullHtmlReport = generateFullHtmlReport(eventName, reportData, totalGeral, currentDateString);
            downloadHtmlReport(fullHtmlReport, eventName, currentDateString);

            // Se desejar, pode limpar o formulário ou dar um feedback
            // reportForm.reset();
            // alert('Relatório gerado e download iniciado!');

        } catch (error) {
            console.error("Erro ao gerar relatório:", error);
            alert("Ocorreu um erro ao gerar o relatório. Verifique o console para mais detalhes.");
        }
    });

    function generateFullHtmlReport(eventName, data, total, generationDate) {
        // Conteúdo do style.css será embutido aqui.
        // É importante que o style.css esteja completo e correto.
        const styles = `
        <style>
            :root {
                --primary-color: #4a6fa5; /* Azul principal */
                --secondary-color: #6c757d; /* Cinza secundário */
                --light-color: #f8f9fa;    /* Cinza muito claro/quase branco */
                --dark-color: #343a40;     /* Cinza escuro (texto principal) */
                --border-color: #e0e6ed;   /* Cinza claro para bordas finas */
                --danger-color: #dc3545;   /* Para erros ou alertas */
                --success-color: #28a745;  /* Para sucesso */
            }

            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f5f8fa;
                margin: 0;
                padding: 20px 0;
                color: var(--dark-color);
                line-height: 1.6;
            }

            .container {
                background-color: white;
                max-width: 800px;
                margin: 40px auto;
                border-radius: 10px;
                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
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
            
            /* .form-section e outros estilos do formulário não são necessários no HTML do relatório baixado */

            .report-output-container { /* Usado como wrapper para a tabela no arquivo baixado */
                padding: 25px 30px; 
            }

            .table-section h2 { /* Título do evento na tabela gerada */
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
                margin-bottom: 0; 
            }

            th, td {
                padding: 15px;
                text-align: left;
                vertical-align: middle;
            }

            thead th {
                background-color: var(--light-color);
                color: var(--primary-color);
                font-weight: 600;
                border-bottom: 2px solid var(--border-color);
            }

            thead th:last-child {
                text-align: center;
            }

            tbody td {
                border-bottom: 1px solid var(--border-color);
            }

            tbody tr:not(.total):last-of-type td {
                border-bottom: none; /* Remove borda da última linha de dados se não for a linha total */
            }
            
            /* Se a linha total for a única linha após o header, ela não deve ter last-of-type aplicado a ela */
            tbody tr.total ~ tr td { /* Se houver algo depois do total, não deveria acontecer neste layout */
                border-bottom: 1px solid var(--border-color);
            }
            tbody tr.total:last-of-type td { /* Garante que se o total for o último, não tem borda inferior */
                 border-bottom: none;
            }


            tbody td:last-child {
                text-align: center;
                font-weight: 600;
            }

            tr.total td {
                background-color: var(--light-color);
                color: var(--primary-color);
                font-weight: bold;
                border-top: 2px solid var(--primary-color);
                border-bottom: none; /* Linha total não tem borda inferior */
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

        let tableContentHTML = '';
        if (data.length === 0 && total === 0) { // Modificado para checar total também
            tableContentHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; font-style: italic;">Nenhuma contagem registrada para este evento.</td>
                </tr>
            `;
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

        // Adiciona linha total apenas se houver dados ou se o total geral for maior que zero
        // (caso todas as entradas fossem zero, mas ainda quiséssemos mostrar o total como zero)
        // No entanto, o total só será > 0 se houver pelo menos uma entrada com quantidade > 0
        // Então, a linha total só será adicionada se 'data.length > 0' ou se 'total > 0' (redundante com a lógica atual de popular 'data')
        let totalRowHtml = '';
        if (data.length > 0 || total > 0) { // Garante que a linha total apareça mesmo que apenas o culto principal seja preenchido e outras categorias não.
             totalRowHtml = `
                <tr class="total">
                    <td>Total</td>
                    <td>Total Geral</td>
                    <td>${total}</td>
                </tr>
            `;
        }


        const html = `
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
        return html;
    }

    function downloadHtmlReport(htmlContent, eventName, generationDate) {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        
        // Sanitiza o nome do evento para usar no nome do arquivo
        const safeEventName = eventName.replace(/[^a-z0-9_-\s]/gi, '_').replace(/\s+/g, '_');
        const safeDate = generationDate.replace(/\//g, '-');
        a.download = `Relatorio_Connect_${safeEventName}_${safeDate}.html`;
        
        document.body.appendChild(a); // Necessário para Firefox
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }
    
    function updateGenerationDateAndGetIt() {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
        const year = today.getFullYear();
        const dateString = `${day}/${month}/${year}`;
        if (generationDateEl) {
            generationDateEl.textContent = dateString;
        }
        return dateString;
    }

    // Função original para atualizar data no rodapé da página principal (chamada no DOMContentLoaded)
    function updateGenerationDate() {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        if (generationDateEl) {
            generationDateEl.textContent = `${day}/${month}/${year}`;
        }
    }

    function escapeHTML(str) {
        if (typeof str !== 'string') return String(str); // Converte para string se não for
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }
});