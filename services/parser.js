// services/parser.js

/**
 * Função auxiliar para normalizar texto:
 * - Converte para minúsculas.
 * - Remove acentos (normalize("NFD") e replace(/[\u0300-\u036f]/g, "")).
 * - Substitui múltiplos espaços por um único espaço.
 * - Remove espaços no início e fim.
 * @param {string} text - O texto a ser normalizado.
 * @returns {string} O texto normalizado.
 */
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize("NFD") // Normaliza para forma decomposta (e.g., "á" para "a" + "´")
        .replace(/[\u0300-\u036f]/g, "") // Remove os caracteres combinados (acentos, trema, etc.)
        .replace(/\s+/g, " ") // Substitui múltiplos espaços por um único espaço
        .trim(); // Remove espaços em branco do início e fim
}

/**
 * Mapeamento dinâmico de palavras-chave para IDs dos inputs do formulário.
 * A ordem é crucial: frases mais específicas (maior número de palavras ou termos compostos)
 * devem vir antes de termos mais genéricos para garantir a correspondência correta
 * em casos ambíguos (ex: "maes bebes" antes de "maes").
 */
const dynamicKeywordMap = [
    // Ordem de especificidade (do mais específico para o mais genérico)
    // Culto principal - geralmente um termo único ou implicado
    { keywords: ['culto', 'presenca', 'presentes'], inputId: 'cultoPresentes' },

    // Casos de Mães e Voluntários em Babies - prioridade para o contexto
    { keywords: ['maes bebes', 'mae bebes', 'maes babies', 'mae babies'], inputId: 'babiesMaes' },
    { keywords: ['responsaveis bebes', 'voluntarios bebes', 'tios bebes', 'tias bebes', 'colaboradores bebes'], inputId: 'babiesResponsaveis' },
    // Crianças em Babies
    { keywords: ['bebes', 'babies', 'criancas bebes'], inputId: 'babiesCriancas' },

    // Casos de Mães e Voluntários em Kids - prioridade para o contexto
    { keywords: ['maes kids', 'mae kids'], inputId: 'kidsMaes' },
    { keywords: ['tias kids', 'tios kids', 'tio kids', 'tia kids', 'voluntarios kids', 'colaboradores kids'], inputId: 'kidsTias' },
    // Crianças em Kids
    { keywords: ['kids', 'criancas kids', 'criancas'], inputId: 'kidsCriancas' }, // "criancas" genérico, mas pode ser sobreescrito por Kids

    // Casos de Voluntários em Teens
    { keywords: ['tios teens', 'tio teens', 'tias teens', 'tia teens', 'voluntarios teens', 'colaboradores teens'], inputId: 'teensTios' },
    // Adolescentes em Teens
    { keywords: ['teens', 'adolescentes'], inputId: 'teensAdolescentes' },

    // Termos genéricos que servem como fallback (ordem também importa aqui)
    // Estes vêm por último para serem aplicados apenas se termos mais específicos não forem encontrados.
    { keywords: ['maes', 'mae'], inputId: 'kidsMaes' }, // Padrão para "mães" se nenhum contexto específico for encontrado
    { keywords: ['tias', 'tio', 'voluntarios', 'voluntario', 'colaboradores'], inputId: 'kidsTias' } // Padrão para "tios/tias/voluntários" se nenhum contexto específico for encontrado
];

// Opcional: Para garantir a ordem de especificidade, podemos ordenar a lista
// baseado no comprimento das frases-chave. Frases mais longas (mais específicas) vêm primeiro.
// Isso garante que "maes bebes" seja verificado antes de "maes".
dynamicKeywordMap.sort((a, b) => {
    const aMaxLen = Math.max(...a.keywords.map(k => k.length));
    const bMaxLen = Math.max(...b.keywords.map(k => k.length));
    return bMaxLen - aMaxLen; // Ordem decrescente de comprimento da maior palavra-chave
});

/**
 * Analisa uma string de texto bruto (copiada do WhatsApp) e extrai dados de contagem.
 * @param {string} rawText - O texto bruto a ser analisado.
 * @returns {{parsedData: object, feedbackLog: Array<object>}} - Um objeto contendo os dados analisados e um log de feedback.
 */
function parseRawData(rawText) {
    const parsedData = {};
    const feedbackLog = [];
    const lines = rawText.split('\n'); // Divide o texto bruto em linhas individuais

    lines.forEach(line => {
        const originalLine = line.trim(); // A linha original (com espaços removidos das pontas) para o log
        const normalizedLine = normalizeText(originalLine); // Versão normalizada para comparações

        // Ignora linhas que são vazias, apenas "ok", ou um timestamp do WhatsApp
        if (!normalizedLine || /^\s*ok\s*$/i.test(normalizedLine) || /^\[\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}\]/.test(originalLine)) {
            return; // Continua para a próxima linha sem adicionar ao log de feedback
        }

        let processed = false;
        let matchedQuantity = 0;
        let matchedInputId = null;
        let matchedKeywordFound = ''; // Armazena a palavra-chave que realmente deu match

        // Tenta encontrar um número na linha (regex mais simples para pegar apenas o número)
        const numMatch = normalizedLine.match(/(\d+)/);

        if (numMatch) {
            matchedQuantity = parseInt(numMatch[1], 10); // Converte a string numérica para inteiro

            // Itera sobre o mapeamento de palavras-chave, priorizando as mais específicas
            for (const mapping of dynamicKeywordMap) {
                for (const keyword of mapping.keywords) {
                    if (normalizedLine.includes(keyword)) {
                        matchedInputId = mapping.inputId;
                        matchedKeywordFound = keyword; // Salva o termo que deu match
                        processed = true;
                        break; // Sai do loop de keywords assim que encontrar uma
                    }
                }
                if (processed) break; // Sai do loop de mappings assim que encontrar um
            }

            // Fallback para "Culto Principal": Se um número foi encontrado mas nenhuma palavra-chave específica,
            // e a linha é relativamente curta, atribui ao culto principal.
            if (!processed && normalizedLine.length < 25 && matchedQuantity > 0) { // Limite de caracteres para evitar pegar textos longos aleatórios
                 matchedInputId = 'cultoPresentes';
                 matchedKeywordFound = 'culto (padrão)'; // Indica que foi um padrão
                 processed = true;
            }
        }

        // Registra o resultado no log de feedback
        if (processed && matchedInputId !== null) {
            // Soma a quantidade encontrada ao valor já existente para aquele inputId
            parsedData[matchedInputId] = (parsedData[matchedInputId] || 0) + matchedQuantity;
            feedbackLog.push({
                line: originalLine, // A linha original para mostrar ao usuário
                status: 'success',
                message: `Identificado: ${matchedQuantity} para "${matchedKeywordFound}"`
            });
        } else {
            // Se não foi processado, registra como ignorado
            feedbackLog.push({
                line: originalLine, // A linha original para mostrar ao usuário
                status: 'ignored',
                message: 'Linha ignorada: não foi possível identificar número ou categoria.'
            });
        }
    });

    return { parsedData, feedbackLog };
}