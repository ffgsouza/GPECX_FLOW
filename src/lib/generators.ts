import { collection, getDocs, query, where, orderBy, limit, type Firestore } from "firebase/firestore";

/**
 * Gera números inteligentes no formato "SIGLA-AAXXX-R0-Cliente"
 * Exemplo: PVE-26001-R0-ClienteNome, PLE-27001-R0-ClienteNome
 * @param db A instância do Firestore
 * @param type Tipo da proposta (SALES, SERVICE, RENTAL)
 * @param customerName Nome do cliente (opcional, será sanitizado)
 */
export async function generateSmartNumber(
  db: Firestore,
  type: "SALES" | "SERVICE" | "RENTAL",
  customerName?: string
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

  const searchPrefix = `${prefix}-${yearShort}`;

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
      const lastNumber = snapshot.docs[0].data().number; // Ex: "PVE-26042-R0-Cliente"
      // Extract just the sequence number part
      const parts = lastNumber.split('-');
      if (parts.length >= 2) {
        const sequencePart = parts[1]; // "26042"
        const cleanSequence = sequencePart.replace(yearShort, "").trim();
        const lastSeqInt = parseInt(cleanSequence);

        if (!isNaN(lastSeqInt)) {
          nextSequence = lastSeqInt + 1;
        }
      }
    }

    const sequenceString = nextSequence.toString().padStart(3, "0");
    let baseNumber = `${searchPrefix}${sequenceString}`;

    // Append customer name if provided
    if (customerName) {
      // Sanitize customer name: remove special chars, keep spaces, limit length
      const sanitized = customerName
        .trim()
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters but KEEP spaces
        .substring(0, 30); // Limit to 30 chars

      if (sanitized) {
        baseNumber += `-${sanitized}`;
      }
    }

    return baseNumber;

  } catch (error) {
    console.error(`Erro ao gerar número ${prefix}:`, error);
    return `${prefix}-${yearShort}-${Date.now().toString().slice(-4)}`;
  }
}
