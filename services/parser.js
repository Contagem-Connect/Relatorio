// services/parser.js

// Função auxiliar para normalizar texto
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

// Mapeamento padrão de palavras-chave
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
    { keywords: ['maes', 'mae'], inputId: 'kidsMaes' } // Fallback para "mães"
];

// Helper para obter o nome do grupo a partir do inputId (usado para rastrear o contexto)
const getGroupFromInputId = (inputId) => {
    if (inputId.startsWith('culto')) return 'Culto';
    if (inputId.startsWith('babies')) return 'Babies';
    if (inputId.startsWith('kids')) return 'Kids';
    if (inputId.startsWith('teens')) return 'Teens';
    return null;
};

// Função para carregar e combinar mapeamentos
function getActiveKeywordMap() {
    let customMappings = [];
    try {
        const storedMappings = localStorage.getItem('customKeywordMappings');
        if (storedMappings) {
            customMappings = JSON.parse(storedMappings);
            // Validar que é um array de objetos com 'keywords' e 'inputId'
            customMappings = customMappings.filter(m => Array.isArray(m.keywords) && typeof m.inputId === 'string');
        }
    } catch (e) {
        console.error("Erro ao carregar customKeywordMappings do localStorage:", e);
        customMappings = []; // Resetar se houver erro
    }

    // Combina os mapeamentos personalizados (com prioridade) e os padrões
    let combinedMap = [...customMappings, ...defaultKeywordMap];

    // Ordena por especificidade: frases mais longas (mais específicas) vêm primeiro.
    combinedMap.sort((a, b) => {
        const aLen = Math.max(...a.keywords.map(k => k.length));
        const bLen = Math.max(...b.keywords.map(k => k.length));
        return bLen - aLen;
    });

    return combinedMap;
}

// Função para salvar mapeamentos personalizados
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

    // Evita duplicatas exatas para a mesma keyword no mesmo inputId
    const existingIndex = customMappings.findIndex(m =>
        m.inputId === newMapping.inputId &&
        m.keywords.some(k => newMapping.keywords.includes(k))
    );

    if (existingIndex > -1) {
        // Se a associação já existe, podemos atualizá-la ou ignorar, por simplicidade vamos adicionar a nova keyword se for diferente
        newMapping.keywords.forEach(newKw => {
            if (!customMappings[existingIndex].keywords.includes(newKw)) {
                customMappings[existingIndex].keywords.push(newKw);
            }
        });
    } else {
        customMappings.push(newMapping);
    }

    try {
        localStorage.setItem('customKeywordMappings', JSON.stringify(customMappings));
        console.log("Mapeamento personalizado salvo:", newMapping);
    } catch (e) {
        console.error("Erro ao salvar customKeywordMappings no localStorage:", e);
    }
}

function parseRawData(rawText) {
    const parsedData = {};
    const feedbackLog = [];
    const lines = rawText.split('\n');
    const activeKeywordMap = getActiveKeywordMap();

    let lastIdentifiedGroup = null; // Variável para manter o contexto da última linha reconhecida

    lines.forEach(line => {
        const originalLine = line.trim();
        const normalizedLine = normalizeText(originalLine);

        if (!normalizedLine || /^\s*ok\s*$/i.test(normalizedLine) || /^\[\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}\]/.test(originalLine)) {
            return;
        }

        let processed = false;
        let matchedQuantity = 0;
        let matchedInputId = null;
        let matchedKeywordFound = '';
        let currentLineGroup = null; // Grupo identificado para a linha atual

        const numMatch = normalizedLine.match(/(\d+)/); // Busca o primeiro número na linha

        if (numMatch) {
            matchedQuantity = parseInt(numMatch[1], 10); // Confirma que o número exato é extraído

            // 1. Tentar encontrar palavras-chave específicas primeiro (incluindo as personalizadas)
            for (const mapping of activeKeywordMap) {
                for (const keyword of mapping.keywords) {
                    if (normalizedLine.includes(keyword)) {
                        matchedInputId = mapping.inputId;
                        matchedKeywordFound = keyword;
                        processed = true;
                        currentLineGroup = getGroupFromInputId(matchedInputId);
                        break;
                    }
                }
                if (processed) break;
            }

            // 2. Se não processado por palavras-chave específicas, tentar 'tias'/'tios'/'voluntarios' com contexto
            if (!processed) {
                const isGenericTia = normalizedLine.includes('tias') || normalizedLine.includes('tia');
                const isGenericTio = normalizedLine.includes('tios') || normalizedLine.includes('tio');
                const isGenericVoluntario = normalizedLine.includes('voluntarios') || normalizedLine.includes('voluntario');

                if (isGenericTia || isGenericTio || isGenericVoluntario) {
                    if (lastIdentifiedGroup === 'Kids') {
                        matchedInputId = 'kidsTias';
                        matchedKeywordFound = isGenericTia ? 'tias (por contexto Kids)' : (isGenericTio ? 'tios (por contexto Kids)' : 'voluntarios (por contexto Kids)');
                        processed = true;
                        currentLineGroup = 'Kids';
                    } else if (lastIdentifiedGroup === 'Teens') {
                        matchedInputId = 'teensTios';
                        matchedKeywordFound = isGenericTio ? 'tios (por contexto Teens)' : (isGenericTia ? 'tias (por contexto Teens)' : 'voluntarios (por contexto Teens)');
                        processed = true;
                        currentLineGroup = 'Teens';
                    } else if (lastIdentifiedGroup === 'Babies') {
                        matchedInputId = 'babiesResponsaveis';
                        matchedKeywordFound = 'responsaveis (por contexto Babies)';
                        processed = true;
                        currentLineGroup = 'Babies';
                    } else {
                        // 3. Atribuição padrão para genéricos se nenhum contexto relevante for encontrado
                        if (isGenericTia) {
                            matchedInputId = 'kidsTias'; // Padrão para 'tias' (kids)
                            matchedKeywordFound = 'tias (padrao)';
                        } else if (isGenericTio) {
                            matchedInputId = 'teensTios'; // Padrão para 'tios' (teens)
                            matchedKeywordFound = 'tios (padrao)';
                        } else if (isGenericVoluntario) {
                            matchedInputId = 'kidsTias'; // Padrão para 'voluntarios' (kids)
                            matchedKeywordFound = 'voluntarios (padrao)';
                        }
                        processed = true;
                        currentLineGroup = getGroupFromInputId(matchedInputId);
                    }
                }
            }

            // 4. Fallback para 'Culto' (se não processado e linha curta com "culto")
            if (!processed && normalizedLine.length <= 15 && normalizedLine.includes('culto')) {
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

// Expondo as funções no escopo global (IMPORTANTE!)
window.saveCustomMapping = saveCustomMapping;
window.normalizeText = normalizeText;
