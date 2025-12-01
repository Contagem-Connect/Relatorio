// services/parser.js

/**
 * Normaliza uma string de texto.
 */
function normalizeText(text) {
    if (typeof text !== 'string') return '';
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Mapeamento padrão. Ordem importa (específico -> genérico).
 */
const defaultKeywordMap = [
    { keywords: ['culto'], inputId: 'cultoPresentes' },
    
    // Babies
    { keywords: ['maes bebes', 'mae bebes', 'maes babies', 'mae babies'], inputId: 'babiesMaes' },
    { keywords: ['responsaveis bebes', 'voluntarios bebes', 'tios bebes', 'tias bebes'], inputId: 'babiesResponsaveis' },
    { keywords: ['bebes', 'babies', 'bebe', 'babys', 'babi'], inputId: 'babiesCriancas' },
    
    // NOVO: Littles
    { keywords: ['maes littles', 'mae littles', 'maes little'], inputId: 'littlesMaes' },
    { keywords: ['tias littles', 'tio littles', 'voluntarios littles', 'tios littles'], inputId: 'littlesTios' },
    { keywords: ['littles', 'little', 'lites', 'litles', 'litel'], inputId: 'littlesCriancas' },
    
    // Kids
    { keywords: ['maes kids', 'mae kids'], inputId: 'kidsMaes' },
    { keywords: ['tias kids', 'tio kids', 'voluntarios kids'], inputId: 'kidsTias' },
    { keywords: ['kids', 'criancas', 'crianca'], inputId: 'kidsCriancas' },
    
    // Teens
    { keywords: ['tios teens', 'tio teens', 'voluntarios teens'], inputId: 'teensTios' },
    { keywords: ['teens', 'adolescentes', 'teen'], inputId: 'teensAdolescentes' }
];

/**
 * Helper para contexto
 */
const getGroupFromInputId = (inputId) => {
    if (inputId.startsWith('culto')) return 'Culto';
    if (inputId.startsWith('babies')) return 'Babies';
    if (inputId.startsWith('littles')) return 'Littles'; // NOVO
    if (inputId.startsWith('kids')) return 'Kids';
    if (inputId.startsWith('teens')) return 'Teens';
    return null;
};

function getActiveKeywordMap() {
    let customMappings = [];
    try {
        const storedMappings = localStorage.getItem('customKeywordMappings');
        if (storedMappings) {
            customMappings = JSON.parse(storedMappings);
            customMappings = customMappings.filter(m => Array.isArray(m.keywords) && m.keywords.every(k => typeof k === 'string') && typeof m.inputId === 'string');
        }
    } catch (e) {
        console.error("Erro ao carregar mapeamentos:", e);
        customMappings = [];
    }

    let combinedMap = [...customMappings, ...defaultKeywordMap];

    // Remove duplicatas
    const uniqueMap = [];
    const seen = new Set();
    for (const item of combinedMap) {
        const itemKey = item.inputId + '_' + item.keywords.map(k => normalizeText(k)).sort().join('|');
        if (!seen.has(itemKey)) {
            uniqueMap.push(item);
            seen.add(itemKey);
        }
    }
    
    // Ordena por tamanho da keyword (maior primeiro) para match mais específico
    uniqueMap.sort((a, b) => {
        const aLen = Math.max(...a.keywords.map(k => k.length));
        const bLen = Math.max(...b.keywords.map(k => k.length));
        return bLen - aLen;
    });

    return uniqueMap;
}

function saveCustomMapping(newMapping) {
    let customMappings = [];
    try {
        const storedMappings = localStorage.getItem('customKeywordMappings');
        if (storedMappings) customMappings = JSON.parse(storedMappings);
    } catch (e) {}
    
    const normalizedNewKeywords = newMapping.keywords.map(k => normalizeText(k));
    const existingIndex = customMappings.findIndex(m => m.inputId === newMapping.inputId); // Simplificação para agrupar por inputId

    if (existingIndex > -1) {
        normalizedNewKeywords.forEach(newKw => {
            if (!customMappings[existingIndex].keywords.includes(newKw)) {
                customMappings[existingIndex].keywords.push(newKw);
            }
        });
    } else {
        customMappings.push({ keywords: normalizedNewKeywords, inputId: newMapping.inputId });
    }

    try {
        localStorage.setItem('customKeywordMappings', JSON.stringify(customMappings));
        console.log("Mapeamento salvo.");
    } catch (e) {
        alert("Erro no localStorage.");
    }
}

function parseRawData(rawText) {
    const parsedData = {};
    const feedbackLog = [];
    const lines = rawText.split('\n');
    const activeKeywordMap = getActiveKeywordMap();

    let lastIdentifiedGroup = null;

    lines.forEach(line => {
        let originalLine = line.trim();
        if (!originalLine) return;

        const whatsappMetadataRegex = /^\[[^\]]+\]\s[^:]+:\s*/;
        let cleanLine = originalLine.replace(whatsappMetadataRegex, '');
        
        if (!cleanLine.trim() || /^\s*ok\s*$/i.test(cleanLine)) return;

        cleanLine = cleanLine.replace(/(\d+)([a-zA-Záéíóúâêîôûãõç]+)/g, '$1 $2');
        const normalizedLine = normalizeText(cleanLine);
        
        let processed = false;
        let matchedQuantity = 0;
        let matchedInputId = null;
        let matchedKeywordFound = '';
        let currentLineGroup = null;

        const numMatch = normalizedLine.match(/(\d+)/);

        if (numMatch) {
            matchedQuantity = parseInt(numMatch[0], 10);

            // 1. Match direto
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

            // 2. Lógica de Contexto (Tios/Voluntários)
            if (!processed) {
                const isGenericVol = normalizedLine.includes('tias') || normalizedLine.includes('tia') || normalizedLine.includes('tios') || normalizedLine.includes('tio') || normalizedLine.includes('voluntarios');
                
                if (isGenericVol) {
                    if (lastIdentifiedGroup === 'Littles') { // NOVO CONTEXTO
                        matchedInputId = 'littlesTios';
                        matchedKeywordFound = 'voluntários (contexto Littles)';
                    } else if (lastIdentifiedGroup === 'Kids') {
                        matchedInputId = 'kidsTias';
                        matchedKeywordFound = 'voluntários (contexto Kids)';
                    } else if (lastIdentifiedGroup === 'Teens') {
                        matchedInputId = 'teensTios';
                        matchedKeywordFound = 'voluntários (contexto Teens)';
                    } else if (lastIdentifiedGroup === 'Babies') {
                        matchedInputId = 'babiesResponsaveis';
                        matchedKeywordFound = 'voluntários (contexto Babies)';
                    } else {
                        matchedInputId = 'kidsTias'; // Fallback
                        matchedKeywordFound = 'voluntários (padrão)';
                    }
                    processed = true;
                    if(matchedInputId) currentLineGroup = getGroupFromInputId(matchedInputId);
                }
            }

            // 3. Lógica de Contexto (Mães)
            if (!processed) {
                const isGenericMae = normalizedLine.includes('maes') || normalizedLine.includes('mae');
                if (isGenericMae) {
                    if (lastIdentifiedGroup === 'Babies') {
                        matchedInputId = 'babiesMaes';
                        matchedKeywordFound = 'mães (contexto Babies)';
                    } else if (lastIdentifiedGroup === 'Littles') { // NOVO CONTEXTO
                        matchedInputId = 'littlesMaes';
                        matchedKeywordFound = 'mães (contexto Littles)';
                    } else {
                        matchedInputId = 'kidsMaes'; // Fallback Padrão
                        matchedKeywordFound = 'mães (padrão)';
                    }
                    processed = true;
                    if(matchedInputId) currentLineGroup = getGroupFromInputId(matchedInputId);
                }
            }
        }
        
        if (processed && matchedInputId !== null) {
            parsedData[matchedInputId] = (parsedData[matchedInputId] || 0) + matchedQuantity;
            feedbackLog.push({
                line: originalLine,
                status: 'success',
                message: `Encontrado: ${matchedQuantity} para "${matchedKeywordFound}"`
            });
            if (currentLineGroup) lastIdentifiedGroup = currentLineGroup;
        } else {
            feedbackLog.push({
                line: originalLine,
                status: 'ignored',
                message: 'Não reconhecido. Clique em "Associar".'
            });
        }
    });

    return { parsedData, feedbackLog };
}

window.normalizeText = normalizeText;
window.saveCustomMapping = saveCustomMapping;
window.parseRawData = parseRawData;