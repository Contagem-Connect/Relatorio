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
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Mapeamento padrão de palavras-chave para IDs dos inputs do formulário.
 * A ordem é importante para priorizar termos mais específicos (ex: "maes bebes" antes de "maes").
 */
const defaultKeywordMap = [
    { keywords: ['culto'], inputId: 'cultoPresentes' },
    // Casos de Mães e Voluntários em Babies - prioridade para o contexto
    { keywords: ['maes bebes', 'mae bebes', 'maes babies', 'mae babies'], inputId: 'babiesMaes' },
    { keywords: ['responsaveis bebes', 'voluntarios bebes', 'tios bebes', 'tias bebes'], inputId: 'babiesResponsaveis' },
    // Criancas em Babies
    { keywords: ['bebes', 'babies', 'bebe'], inputId: 'babiesCriancas' },

    // Casos de Mães e Voluntários em Kids - prioridade para o contexto
    { keywords: ['maes kids', 'mae kids'], inputId: 'kidsMaes' },
    { keywords: ['tias kids', 'tio kids', 'voluntarios kids'], inputId: 'kidsTias' },
    // Criancas em Kids
    { keywords: ['kids', 'criancas', 'crianca'], inputId: 'kidsCriancas' },

    // Casos de Voluntários em Teens
    { keywords: ['tios teens', 'tio teens', 'voluntarios teens'], inputId: 'teensTios' },
    // Adolescentes em Teens
    { keywords: ['teens', 'adolescentes', 'teen'], inputId: 'teensAdolescentes' },

    // Termos genéricos que servem como fallback (ordem também importa aqui)
    { keywords: ['maes', 'mae'], inputId: 'kidsMaes' }, // Padrão para "mães" se nenhum contexto específico for encontrado
    { keywords: ['tias', 'tio', 'voluntarios', 'voluntario'], inputId: 'kidsTias' } // Padrão para "tios/tias/voluntários" se nenhum contexto específico for encontrado
];

/**
 * Carrega mapeamentos personalizados do localStorage, combina com os padrões
 * e retorna o mapeamento ativo, priorizando termos mais específicos/longos.
 * @returns {Array<object>} O mapeamento de palavras-chave combinado e ordenado.
 */
function getActiveKeywordMap() {
    let customMappings = [];
    try {
        const storedMappings = localStorage.getItem('customKeywordMappings');
        if (storedMappings) {
            customMappings = JSON.parse(storedMappings);
            // Validar que é um array de objetos com 'keywords' (array de strings) e 'inputId' (string)
            customMappings = customMappings.filter(m => 
                Array.isArray(m.keywords) && m.keywords.every(k => typeof k === 'string') && typeof m.inputId === 'string'
            );
        }
    } catch (e) {
        console.error("Erro ao carregar customKeywordMappings do localStorage:", e);
        customMappings = []; // Resetar se houver erro ou corrupção
    }

    // Cria um conjunto de IDs de palavras-chave padrão para evitar duplicatas exatas se um termo personalizado for adicionado
    const defaultKeywordSet = new Set(defaultKeywordMap.flatMap(m => m.keywords));
    
    // Combina os mapeamentos personalizados (com prioridade) e os padrões.
    // Garante que mapeamentos personalizados sobreponham ou complementem os padrões.
    // Filtra duplicatas de keywords padrão se elas já existirem em customMappings.
    let combinedMap = [...customMappings];
    defaultKeywordMap.forEach(defaultMap => {
        // Se a keyword padrão já existe em algum mapeamento personalizado para o mesmo inputId,
        // ou se a keyword já está em um mapeamento personalizado qualquer, não adiciona novamente.
        const isDefaultKeywordAlreadyCovered = customMappings.some(customMap => 
            customMap.inputId === defaultMap.inputId && defaultMap.keywords.some(k => customMap.keywords.includes(k))
        );
        if (!isDefaultKeywordAlreadyCovered) {
            combinedMap.push(defaultMap);
        }
    });

    // Ordena por especificidade: frases mais longas (mais específicas) vêm primeiro.
    combinedMap.sort((a, b) => {
        const aLen = Math.max(...a.keywords.map(k => k.length));
        const bLen = Math.max(...b.keywords.map(k => k.length));
        return bLen - aLen; // Ordem decrescente de comprimento de palavra-chave
    });

    return combinedMap;
}

/**
 * Salva um novo mapeamento personalizado no localStorage.
 * Atualiza um mapeamento existente se a keyword já for para o mesmo inputId,
 * caso contrário, adiciona como novo.
 * @param {object} newMapping - O novo mapeamento a ser salvo (ex: { keywords: ['minha palavra'], inputId: 'kidsCriancas' }).
 */
function saveCustomMapping(newMapping) {
    let customMappings = [];
    try {
        const storedMappings = localStorage.getItem('customKeywordMappings');
        if (storedMappings) {
            customMappings = JSON.parse(storedMappings);
        }
    } catch (e) {
        console.error("Erro ao carregar customKeywordMappings para salvar:", e);
    }
    
    // Normalize a nova palavra-chave antes de salvar
    const normalizedNewKeywords = newMapping.keywords.map(k => normalizeText(k));
    const newMappingToSave = { keywords: normalizedNewKeywords, inputId: newMapping.inputId };

    // Verifica se já existe um mapeamento para o mesmo inputId que já contem alguma das novas keywords
    const existingMappingIndex = customMappings.findIndex(m => 
        m.inputId === newMappingToSave.inputId && 
        m.keywords.some(k => newMappingToSave.keywords.includes(k))
    );

    if (existingMappingIndex > -1) {
        // Se já existe um mapeamento para o mesmo inputId e mesma keyword, apenas garante que a nova keyword esteja lá
        newMappingToSave.keywords.forEach(newKw => {
            if (!customMappings[existingMappingIndex].keywords.includes(newKw)) {
                customMappings[existingMappingIndex].keywords.push(newKw);
            }
        });
    } else {
        // Adiciona como um novo mapeamento
        customMappings.push(newMappingToSave);
    }

    try {
        localStorage.setItem('customKeywordMappings', JSON.stringify(customMappings));
        console.log("Mapeamento personalizado salvo:", newMappingToSave);
    } catch (e) {
        console.error("Erro ao salvar customKeywordMappings no localStorage:", e);
    }
}


/**
 * Analisa uma string de texto bruto (copiada do WhatsApp) e extrai dados de contagem.
 * @param {string} rawText - O texto bruto a ser analisado.
 * @returns {{parsedData: object, feedbackLog: Array<object>}} - Um objeto contendo os dados analisados e um log de feedback.
 */
function parseRawData(rawText) {
    const parsedData = {};
    const feedbackLog = [];
    const lines = rawText.split('\n');
    const activeKeywordMap = getActiveKeywordMap(); // Obtém o mapeamento ativo (incluindo personalizados)

    lines.forEach(line => {
        const originalLine = line.trim(); // Mantém a linha original para feedback
        const normalizedLine = normalizeText(originalLine); // Normaliza para comparação

        // Ignora linhas vazias, que contenham apenas "ok" ou timestamps do WhatsApp
        if (!normalizedLine || /^\s*ok\s*$/i.test(normalizedLine) || /^\[\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}\]/.test(originalLine)) {
            return;
        }

        let processed = false;
        let matchedQuantity = 0;
        let matchedInputId = null;
        let matchedKeywordFound = '';

        // Tenta encontrar o primeiro número na linha.
        const numMatch = normalizedLine.match(/(\d+)/);

        if (numMatch) {
            // Converte a string numérica para inteiro. O "10" garante base decimal.
            // Este é o ponto crucial para a correção da quantidade.
            matchedQuantity = parseInt(numMatch[1], 10); 
            
            // Itera sobre o mapeamento de palavras-chave (já ordenado por especificidade).
            for (const mapping of activeKeywordMap) {
                for (const keyword of mapping.keywords) {
                    // Verifica se a linha normalizada inclui a palavra-chave
                    if (normalizedLine.includes(keyword)) {
                        matchedInputId = mapping.inputId;
                        matchedKeywordFound = keyword; // Salva o termo que deu match
                        processed = true;
                        break; // Terminou de procurar palavras-chave para este mapeamento
                    }
                }
                if (processed) break; // Terminou de procurar mapeamentos para esta linha
            }

            // Fallback: Se um número foi encontrado mas nenhuma palavra-chave específica,
            // e a linha é curta, assume-se que é "Culto Principal".
            if (!processed && normalizedLine.length <= 15) { // Limite de 15 caracteres para evitar pegar textos longos aleatórios
                 matchedInputId = 'cultoPresentes';
                 matchedKeywordFound = 'culto (padrão)';
                 processed = true;
            }
        }

        // Registra o resultado no log de feedback.
        if (processed && matchedInputId !== null) {
            parsedData[matchedInputId] = (parsedData[matchedInputId] || 0) + matchedQuantity;
            feedbackLog.push({
                line: originalLine, // Usa a linha original para exibir no feedback
                status: 'success',
                message: `Encontrado: ${matchedQuantity} para "${matchedKeywordFound}" (ID: ${matchedInputId})`
            });
        } else {
            feedbackLog.push({
                line: originalLine, // Usa a linha original para exibir no feedback
                status: 'ignored',
                message: 'Não reconhecido. Clique em "Associar" para ensinar o sistema.'
            });
        }
    });

    return { parsedData, feedbackLog };
}

// Expondo a função saveCustomMapping globalmente para que script.js possa usá-la.
// Em um ambiente de módulos (ES6 modules), isso seria feito com 'export'.
window.saveCustomMapping = saveCustomMapping;
window.normalizeText = normalizeText; // Expor normalizeText para ser usada no modal de associação
