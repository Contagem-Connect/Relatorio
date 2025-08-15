// services/parser.js

/**
 * Analisa uma string de texto bruto (copiada do WhatsApp) e extrai dados de contagem.
 * @param {string} rawText - O texto bruto a ser analisado.
 * @returns {{parsedData: object, feedbackLog: Array<object>}} - Um objeto contendo os dados analisados e um log de feedback.
 */
function parseRawData(rawText) {
    // Mapeamento de palavras-chave para IDs dos inputs do formulário
    const keywordMap = {
        'culto': 'cultoPresentes',
        'kids': 'kidsCriancas',
        'crianças': 'kidsCriancas',
        'tias': 'kidsTias',
        'tia': 'kidsTias',
        'mãe': { id: 'kidsMaes', category: 'Kids' }, // Especificando para evitar conflito
        'mães': { id: 'kidsMaes', category: 'Kids' },
        'teens': 'teensAdolescentes',
        'tees': 'teensAdolescentes',
        'tios': 'teensTios',
        'tio': 'teensTios',
        'bebês': 'babiesCriancas',
        'bebes': 'babiesCriancas',
        'babies': 'babiesCriancas'
        // Mães em 'babies' precisa ser tratado com contexto, o padrão é 'kids'
    };

    const parsedData = {};
    const feedbackLog = [];
    const lines = rawText.split('\n');

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('[') || /^\s*ok\s*$/i.test(trimmedLine)) {
            return; // Ignora linhas vazias, de data do WhatsApp ou que contenham apenas "ok"
        }

        const lowerLine = trimmedLine.toLowerCase();
        const match = lowerLine.match(/(\d+)/); // Encontra o primeiro número na linha

        let processed = false;
        if (match) {
            const quantity = parseInt(match[0], 10);
            
            for (const keyword in keywordMap) {
                if (lowerLine.includes(keyword)) {
                    let target = keywordMap[keyword];
                    let inputId;

                    // Lógica para desambiguação de "mãe/mães"
                    if (typeof target === 'object') {
                        // Atualmente, a única ambiguidade é 'mães'. No futuro, pode expandir.
                        // Assumimos que, se não houver contexto de 'babies', 'mães' se refere a 'kids'.
                        inputId = target.id;
                    } else {
                        inputId = target;
                    }
                    
                    parsedData[inputId] = (parsedData[inputId] || 0) + quantity;
                    processed = true;
                    feedbackLog.push({
                        line: trimmedLine,
                        status: 'success',
                        message: `Encontrado: ${quantity} para "${keyword}"`
                    });
                    break; // Para na primeira palavra-chave encontrada
                }
            }
        }

        if (!processed) {
            feedbackLog.push({
                line: trimmedLine,
                status: 'ignored',
                message: 'Linha ignorada (nenhum número ou palavra-chave reconhecida)'
            });
        }
    });

    return { parsedData, feedbackLog };
}