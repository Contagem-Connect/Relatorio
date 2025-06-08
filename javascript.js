document.addEventListener('DOMContentLoaded', function() {
    const reportForm = document.getElementById('reportForm');
    const reportOutputContainer = document.getElementById('reportOutputContainer'); // ID atualizado
    const generationDateEl = document.getElementById('generationDate');

    // Verificações iniciais para garantir que os elementos essenciais existem
    if (!reportForm) {
        console.error("Formulário com ID 'reportForm' não encontrado!");
        return;
    }
    if (!reportOutputContainer) {
        console.error("Container de saída com ID 'reportOutputContainer' não encontrado!");
        return;
    }
    if (!generationDateEl) {
        console.error("Elemento de data com ID 'generationDate' não encontrado!");
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
                // Ordem de exibição na tabela
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
                    if (quantidade > 0) { // Apenas inclui na tabela se a quantidade for maior que 0
                        reportData.push({
                            categoria: entryConfig.categoria,
                            descricao: entryConfig.descricao,
                            quantidade: quantidade
                        });
                        totalGeral += quantidade;
                    }
                } else {
                    console.warn(`Elemento de input com ID '${entryConfig.id}' não encontrado.`);
                }
            });

            generateReportTable(eventName, reportData, totalGeral);
            if (generationDateEl) updateGenerationDate();
            reportOutputContainer.classList.add('has-content');

        } catch (error) {
            console.error("Erro ao gerar relatório:", error);
            alert("Ocorreu um erro ao gerar o relatório. Verifique o console para mais detalhes.");
        }
    });

    function generateReportTable(eventName, data, total) {
        let tableHTML = `
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
        `;

        if (data.length === 0) {
            tableHTML += `
                <tr>
                    <td colspan="3" style="text-align: center; font-style: italic;">Nenhuma contagem registrada para este evento.</td>
                </tr>
            `;
        } else {
            data.forEach(entry => {
                tableHTML += `
                    <tr>
                        <td>${escapeHTML(entry.categoria)}</td>
                        <td>${escapeHTML(entry.descricao)}</td>
                        <td>${entry.quantidade}</td>
                    </tr>
                `;
            });
        }

        tableHTML += `
                    <tr class="total">
                        <td>Total</td>
                        <td>Total Geral</td>
                        <td>${total}</td>
                    </tr>
                </tbody>
            </table>
        </section>
        `;

        reportOutputContainer.innerHTML = tableHTML; // Isso garante que é HTML renderizável
    }

    function updateGenerationDate() {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
        const year = today.getFullYear();
        generationDateEl.textContent = `${day}/${month}/${year}`;
    }

    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // Inicializa a data no rodapé (se o elemento existir)
    if (generationDateEl) {
        updateGenerationDate();
    } else {
        console.warn("Elemento 'generationDate' não encontrado para atualização inicial da data.")
    }
});
