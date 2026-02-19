import { collection, getDocs, query, where, orderBy, limit, type Firestore } from "firebase/firestore";

/**
 * Extrai o número sequencial de uma string de proposta usando regex robusto
 * @param numberStr - String no formato "PREFIX-LETTER-YYNNN-RX-CLIENTE"
 * @param yearShort - Ano com 2 dígitos (ex: "26")
 * @returns Número sequencial ou 0 se não encontrado
 */
function extractSequence(numberStr: string, yearShort: string): number {
  // Regex: captura YYNNN onde YY = yearShort e NNN = 3+ dígitos
  // Exemplo: "26042" -> captura "042"
  const regex = new RegExp(`\\b${yearShort}(\\d{3,})\\b`);
  const match = numberStr.match(regex);

  if (match && match[1]) {
    return parseInt(match[1], 10);
  }

  return 0;
}

/**
 * Gera número base no formato "SIGLA-AAXXX"
 * Exemplo: PVE-26001, PLE-27001
 * Nota: Letra identificadora (T/C/G) e cliente serão adicionados depois
 * @param db A instância do Firestore
 * @param type Tipo da proposta (SALES, SERVICE, RENTAL)
 */
export async function generateSmartNumber(
  db: Firestore,
  type: "SALES" | "SERVICE" | "RENTAL"
): Promise<string> {
  if (!db) {
    throw new Error("Firestore not initialized");
  }

  const prefixMap = {
    "SALES": "PVE",   // Proposta de Venda de Equipamento
    "SERVICE": "PTC", // Proposta Técnica de Calibração/Serviço
    "RENTAL": "PLE"   // Proposta de Locação de Equipamento
  };
  const prefix = prefixMap[type];

  const currentYear = new Date().getFullYear();
  const yearShort = currentYear.toString().slice(-2);

  const searchPrefix = `${prefix}-`;

  try {
    const q = query(
      collection(db, "quotes"),
      where("number", ">=", searchPrefix),
      where("number", "<=", searchPrefix + "\uf8ff"),
      orderBy("number", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(q);

    let nextSequence = 1;

    if (!snapshot.empty) {
      const lastNumber = snapshot.docs[0].data().number;
      const lastSequence = extractSequence(lastNumber, yearShort);

      if (lastSequence > 0) {
        nextSequence = lastSequence + 1;
      }
    }

    const sequenceString = nextSequence.toString().padStart(3, "0");
    const baseNumber = `${prefix}-${yearShort}${sequenceString}`;

    return baseNumber;

  } catch (error) {
    console.error(`Erro ao gerar número ${prefix}:`, error);
    // Fallback: usa timestamp para garantir unicidade
    const fallbackSeq = Date.now().toString().slice(-4);
    return `${prefix}-${yearShort}${fallbackSeq}`;
  }
}
