// services/parser.js

/**
 * Normaliza uma string de texto:
 * - Converte para minúsculas.
 * - Remove acentos.
 * - Substitui múltiplos espaços por um único espaço.
 * - Remove espaços no início e fim.
 * @param {string} text - O texto a ser normalizado.
 * @returns {string} O texto normalizado.
 */
function normalizeText(text) {
    if (typeof text !== 'string') return ''; // Garante que a entrada é uma string
    return text
        .toLowerCase()
        .normalize("NFD") // Normaliza para forma de decomposição para separar acentos
        .replace(/[\u0300-\u036f]/g, "") // Remove caracteres combinados (acentos)
        .replace(/\s+/g, " ") // Substitui múltiplos espaços por um único
        .trim(); // Remove espaços do início e fim
}

/**
 * Mapeamento padrão de palavras-chave para IDs dos inputs do formulário.
 * A ordem é importante: termos mais específicos devem vir antes de termos mais genéricos.
 * Os termos genéricos 'tias', 'tios', 'voluntarios' são propositalmente omitidos aqui
 * pois serão tratados com base no contexto na função parseRawData.
 */
const defaultKeywordMap = [
    { keywords: ['culto'], inputId: 'cultoPresentes' },
    { keywords: ['maes bebes', 'mae bebes', 'maes babies', 'mae babies'], inputId: 'babiesMaes' },
    { keywords: ['responsaveis bebes', 'voluntarios bebes', 'tios bebes', 'tias bebes'], inputId: 'babiesResponsaveis' },
    { keywords: ['bebes', 'babies', 'bebe'], inputId: 'babiesCriancas' },
    { keywords: ['maes kids', 'mae kids'], inputId: 'kidsMaes' },
    { keywords: ['tias kids', 'tio kids', 'voluntarios kids'], inputId: 'kidsTias' },
    { keywords: ['kids', 'criancas', 'crianca'], inputId: 'kidsCriancas' },
    { keywords: ['tios teens', 'tio teens', 'voluntarios teens'], inputId: 'teensTios' },
    { keywords: ['teens', 'adolescentes', 'teen'], inputId: 'teensAdolescentes' },
    // Mães genéricas (sem contexto kids/babies explícito) ainda são padrão para Kids
    { keywords: ['maes', 'mae'], inputId: 'kidsMaes' }
];

/**
 * Helper para obter o nome do grupo (categoria) a partir do inputId.
 * Usado para rastrear o contexto da última linha reconhecida.
 * @param {string} inputId - O ID do input (ex: 'kidsCriancas').
 * @returns {string|null} O nome do grupo (ex: 'Kids', 'Teens') ou null se não encontrado.
 */
const getGroupFromInputId = (inputId) => {
    if (inputId.startsWith('culto')) return 'Culto';
    if (inputId.startsWith('babies')) return 'Babies';
    if (inputId.startsWith('kids')) return 'Kids';
    if (inputId.startsWith('teens')) return 'Teens';
    return null;
};

/**
 * Carrega mapeamentos personalizados do localStorage e os combina com os mapeamentos padrão.
 * Prioriza mapeamentos personalizados e os mais específicos (frases mais longas).
 * @returns {Array<object>} Um array de objetos de mapeamento ordenados por prioridade.
 */
function getActiveKeywordMap() {
    let customMappings = [];
    try {
        const storedMappings = localStorage.getItem('customKeywordMappings');
        if (storedMappings) {
            customMappings = JSON.parse(storedMappings);
            // Valida a estrutura dos mapeamentos carregados
            customMappings = customMappings.filter(m => Array.isArray(m.keywords) && m.keywords.every(k => typeof k === 'string') && typeof m.inputId === 'string');
        }
    } catch (e) {
        console.error("Erro ao carregar customKeywordMappings do localStorage:", e);
        customMappings = []; // Resetar se houver erro ou corrupção
    }

    // Combina os mapeamentos personalizados (com prioridade) e os padrões
    // Mapeamentos personalizados vêm primeiro para que sejam correspondidos antes dos padrões
    let combinedMap = [...customMappings, ...defaultKeywordMap];

    // Remove duplicatas exatas de inputId + keyword para evitar processamento redundante
    const uniqueMap = [];
    const seen = new Set();
    for (const item of combinedMap) {
        // Cria uma chave única para cada combinação inputId + keyword normalizada
        const itemKey = item.inputId + '_' + item.keywords.map(k => normalizeText(k)).sort().join('|');
        if (!seen.has(itemKey)) {
            uniqueMap.push(item);
            seen.add(itemKey);
        }
    }
    combinedMap = uniqueMap;

    // Ordena por especificidade: frases mais longas (mais específicas) vêm primeiro.
    // Isso garante que "maes bebes" seja verificado antes de "maes".
    combinedMap.sort((a, b) => {
        const aLen = Math.max(...a.keywords.map(k => k.length));
        const bLen = Math.max(...b.keywords.map(k => k.length));
        return bLen - aLen; // Ordem decrescente
    });

    return combinedMap;
}

/**
 * Salva um novo mapeamento personalizado no localStorage.
 * Atualiza um mapeamento existente se a mesma palavra-chave já estiver associada ao mesmo campo,
 * ou adiciona um novo se for único.
 * @param {object} newMapping - O objeto de mapeamento a ser salvo (ex: { keywords: ['nova palavra'], inputId: 'kidsTias' }).
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
    
    const normalizedNewKeywords = newMapping.keywords.map(k => normalizeText(k));

    // Procura por um mapeamento existente para o mesmo inputId que já inclua alguma das novas keywords
    const existingMappingIndex = customMappings.findIndex(m => 
        m.inputId === newMapping.inputId && 
        m.keywords.some(existingKw => normalizedNewKeywords.includes(normalizeText(existingKw)))
    );

    if (existingMappingIndex > -1) {
        // Se a associação para o mesmo inputId e uma keyword já existe, adicione as novas keywords (sem duplicar)
        normalizedNewKeywords.forEach(newKw => {
            if (!customMappings[existingMappingIndex].keywords.includes(newKw)) {
                customMappings[existingMappingIndex].keywords.push(newKw);
            }
        });
    } else {
        // Caso contrário, adiciona o novo mapeamento
        customMappings.push({ keywords: normalizedNewKeywords, inputId: newMapping.inputId });
    }

    try {
        localStorage.setItem('customKeywordMappings', JSON.stringify(customMappings));
        console.log("Mapeamento personalizado salvo ou atualizado:", newMapping);
    } catch (e) {
        console.error("Erro ao salvar customKeywordMappings no localStorage:", e);
        alert("Erro ao salvar mapeamento personalizado. O armazenamento local pode estar cheio ou inacessível.");
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
    const activeKeywordMap = getActiveKeywordMap(); // Obtém o mapeamento ativo (padrão + personalizado)

    let lastIdentifiedGroup = null; // Variável para manter o contexto da última linha reconhecida (Kids, Teens, Babies)

    lines.forEach(line => {
        const originalLine = line.trim();
        const normalizedLine = normalizeText(originalLine);

        // Ignora linhas vazias, que contenham apenas "ok" ou timestamps do WhatsApp
        if (!normalizedLine || /^\s*ok\s*$/i.test(normalizedLine) || /^\[\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}\]/.test(originalLine)) {
            return;
        }

        let processed = false;
        let matchedQuantity = 0;
        let matchedInputId = null;
        let matchedKeywordFound = '';
        let currentLineGroup = null; // Grupo identificado para a linha atual (se houver)

        const numMatch = normalizedLine.match(/(\d+)/); // Busca o primeiro número na linha

        if (numMatch) {
            matchedQuantity = parseInt(numMatch[1], 10); // Extrai o número (confirmação da correção do bug do 20)

            // 1. Tentar encontrar palavras-chave específicas primeiro (incluindo as personalizadas)
            for (const mapping of activeKeywordMap) {
                for (const keyword of mapping.keywords) {
                    if (normalizedLine.includes(keyword)) {
                        matchedInputId = mapping.inputId;
                        matchedKeywordFound = keyword;
                        processed = true;
                        currentLineGroup = getGroupFromInputId(matchedInputId);
                        break; // Para na primeira palavra-chave encontrada para este mapeamento
                    }
                }
                if (processed) break; // Para na primeira entrada de mapeamento que deu match
            }

            // 2. Se não processado por palavras-chave específicas, tentar 'tias'/'tios'/'voluntarios' com contexto
            // (Note que 'tias', 'tios', 'voluntarios' genéricos não estão mais no defaultKeywordMap)
            if (!processed) {
                const isGenericTiaTerm = normalizedLine.includes('tias') || normalizedLine.includes('tia');
                const isGenericTioTerm = normalizedLine.includes('tios') || normalizedLine.includes('tio');
                const isGenericVoluntarioTerm = normalizedLine.includes('voluntarios') || normalizedLine.includes('voluntario');
                
                if (isGenericTiaTerm || isGenericTioTerm || isGenericVoluntarioTerm) {
                    if (lastIdentifiedGroup === 'Kids') {
                        matchedInputId = 'kidsTias';
                        matchedKeywordFound = isGenericTiaTerm ? 'tias (por contexto Kids)' : (isGenericTioTerm ? 'tios (por contexto Kids)' : 'voluntarios (por contexto Kids)');
                        processed = true;
                        currentLineGroup = 'Kids';
                    } else if (lastIdentifiedGroup === 'Teens') {
                        matchedInputId = 'teensTios';
                        matchedKeywordFound = isGenericTioTerm ? 'tios (por contexto Teens)' : (isGenericTiaTerm ? 'tias (por contexto Teens)' : 'voluntarios (por contexto Teens)');
                        processed = true;
                        currentLineGroup = 'Teens';
                    } else if (lastIdentifiedGroup === 'Babies') {
                        matchedInputId = 'babiesResponsaveis';
                        matchedKeywordFound = 'responsaveis (por contexto Babies)';
                        processed = true;
                        currentLineGroup = 'Babies';
                    } else {
                        // 3. Atribuição padrão para genéricos se nenhum contexto relevante for encontrado
                        if (isGenericTiaTerm) {
                            matchedInputId = 'kidsTias'; // Padrão para 'tias' (kids)
                            matchedKeywordFound = 'tias (padrao)';
                        } else if (isGenericTioTerm) {
                            matchedInputId = 'teensTios'; // Padrão para 'tios' (teens)
                            matchedKeywordFound = 'tios (padrao)';
                        } else if (isGenericVoluntarioTerm) {
                            matchedInputId = 'kidsTias'; // Padrão para 'voluntarios' (kids)
                            matchedKeywordFound = 'voluntarios (padrao)';
                        }
                        processed = true;
                        currentLineGroup = getGroupFromInputId(matchedInputId); // Obtém o grupo do padrão atribuído
                    }
                }
            }
            
            // 4. Fallback para 'Culto' (se não processado, linha curta e inclui 'culto' ou nenhum outro termo foi encontrado)
            if (!processed && normalizedLine.length <= 15 && (normalizedLine.includes('culto') || (!normalizedLine.includes('kids') && !normalizedLine.includes('teens') && !normalizedLine.includes('babies') && !normalizedLine.includes('maes') && !isGenericTiaTerm && !isGenericTioTerm && !isGenericVoluntarioTerm))) {
                matchedInputId = 'cultoPresentes';
                matchedKeywordFound = 'culto (padrao)';
                processed = true;
                currentLineGroup = 'Culto';
            }
        }

        // Registro final no log de feedback
        if (processed && matchedInputId !== null) {
            parsedData[matchedInputId] = (parsedData[matchedInputId] || 0) + matchedQuantity;
            feedbackLog.push({
                line: originalLine,
                status: 'success',
                message: `Encontrado: ${matchedQuantity} para "${matchedKeywordFound}" (ID: ${matchedInputId})`
            });
            // Atualiza o contexto apenas se a linha foi processada com sucesso
            if (currentLineGroup) {
                lastIdentifiedGroup = currentLineGroup;
            }
        } else {
            // Linha ignorada - para o feedback interativo de associação
            feedbackLog.push({
                line: originalLine,
                status: 'ignored',
                message: 'Não reconhecido. Clique em "Associar" para ensinar o sistema.'
            });
            // Não atualiza o lastIdentifiedGroup para linhas ignoradas
        }
    });

    return { parsedData, feedbackLog };
}

// Expondo funções para acesso global pelo script.js (se não estiver usando módulos ES6)
window.normalizeText = normalizeText;
window.saveCustomMapping = saveCustomMapping;
window.parseRawData = parseRawData; // Expor também o parseRawData para uso direto se necessário
