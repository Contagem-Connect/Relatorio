document.addEventListener('DOMContentLoaded', function() {
    const reportForm = document.getElementById('reportForm');
    const reportOutput = document.getElementById('reportOutput');
    const generationDateEl = document.getElementById('generationDate');

    reportForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Impede o envio padrão do formulário

        const eventName = document.getElementById('eventName').value.trim();
        
        const dataEntries = [
            { categoria: 'Culto', descricao: 'Presentes', quantidade: parseInt(document.getElementById('cultoPresentes').value) || 0 },
            { categoria: 'Kids', descricao: 'Crianças', quantidade: parseInt(document.getElementById('kidsCriancas').value) || 0 },
            { categoria: 'Kids', descricao: 'Tias', quantidade: parseInt(document.getElementById('kidsTias').value) || 0 },
            { categoria: 'Teens', descricao: 'Adolescentes', quantidade: parseInt(document.getElementById('teensAdolescentes').value) || 0 },
            { categoria: 'Teens', descricao: 'Tio', quantidade: parseInt(document.getElementById('teensTios').value) || 0 }
        ];

        // Filtra entradas com quantidade 0, a menos que seja a única entrada (para não gerar tabela vazia se tudo for 0)
        const activeEntries = dataEntries.filter(entry => entry.quantidade > 0);
        
        if (!eventName) {
            alert("Por favor, informe o nome do evento/período.");
            return;
        }

        // Se não houver entradas ativas e 'cultoPresentes' for 0, pode exibir uma mensagem ou tabela vazia controlada
        // Por ora, vamos gerar a tabela mesmo que todas as quantidades sejam 0, o total será 0.

        generateReportTable(eventName, activeEntries.length > 0 ? activeEntries : dataEntries); // Se tudo for 0, mostra as categorias com 0
        updateGenerationDate();
        reportOutput.classList.add('has-content'); // Adiciona classe para padding se necessário
    });

    function generateReportTable(eventName, entries) {
        let totalGeral = 0;
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

        entries.forEach(entry => {
            // Adicionamos a linha mesmo que a quantidade seja 0,
            // pois a solicitação implicava ver a estrutura, mesmo que vazia.
            // Se for para omitir linhas com 0, adicionar: if (entry.quantidade > 0) { ... }
             if (entry.quantidade > 0) { // APENAS MOSTRA LINHAS COM VALOR > 0
                tableHTML += `
                    <tr>
                        <td>${escapeHTML(entry.categoria)}</td>
                        <td>${escapeHTML(entry.descricao)}</td>
                        <td>${entry.quantidade}</td>
                    </tr>
                `;
                totalGeral += entry.quantidade;
            }
        });
        
        // Se nenhuma entrada tiver quantidade > 0, o loop acima não adicionará nada.
        // Para garantir que a tabela seja gerada mesmo com tudo 0, podemos mostrar todas as categorias com 0.
        // Ou, se activeEntries estava vazio, podemos ter uma mensagem "Nenhuma contagem registrada".
        // A lógica atual (passando dataEntries se activeEntries for vazio) não é ideal para este caso.
        // Vamos ajustar: se NENHUMA entrada tiver valor, mostramos mensagem ou tabela vazia.
        // Por ora, a lógica atual do forEach já filtra.

        if (activeEntries.length === 0 && dataEntries.some(e => e.quantidade === 0)) {
             // Se todas as entradas preenchidas forem 0, ou todas as entradas forem 0
             // Podemos exibir todas as categorias com 0 ou uma mensagem.
             // Para o comportamento de mostrar linhas com 0, o filtro no `entries.forEach` deve ser removido
             // e o `totalGeral` calculado com base em todas as `dataEntries`.
             // Vamos manter o filtro para mostrar apenas o que foi preenchido com valor > 0.
             // Se nenhuma linha for adicionada (totalGeral continua 0 e activeEntries.length === 0),
             // podemos adicionar uma linha de "Nenhum registro".
        }


        tableHTML += `
                    <tr class="total">
                        <td>Total</td>
                        <td>Total Geral</td>
                        <td>${totalGeral}</td>
                    </tr>
                </tbody>
            </table>
        </section>
        `;

        reportOutput.innerHTML = tableHTML;
    }
    
    function updateGenerationDate() {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
        const year = today.getFullYear();
        generationDateEl.textContent = `${day}/${month}/${year}`;
    }

    // Função auxiliar para escapar HTML e prevenir XSS
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // Inicializa a data no rodapé
    updateGenerationDate();
});