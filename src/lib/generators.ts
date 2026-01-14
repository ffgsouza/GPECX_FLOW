import { collection, getDocs, query, where, orderBy, limit, type Firestore } from "firebase/firestore";

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
      // Extrai número do formato: PLE-T-26042-R0-CLIENTE ou PLE-26042-R0-CLIENTE
      const parts = lastNumber.split('-');

      // Encontra a parte numérica (pode ter letra no meio: PLE-T-26001 ou PLE-26001)
      let sequencePart = '';
      for (let i = 1; i < parts.length; i++) {
        // Pega primeira parte que começa com ano
        if (parts[i].startsWith(yearShort) && parts[i].length >= 5) {
          sequencePart = parts[i];
          break;
        }
      }

      if (sequencePart) {
        const cleanSequence = sequencePart.replace(yearShort, "").trim();
        const lastSeqInt = parseInt(cleanSequence);

        if (!isNaN(lastSeqInt)) {
          nextSequence = lastSeqInt + 1;
        }
      }
    }

    const sequenceString = nextSequence.toString().padStart(3, "0");
    const baseNumber = `${prefix}-${yearShort}${sequenceString}`;

    return baseNumber;

  } catch (error) {
    console.error(`Erro ao gerar número ${prefix}:`, error);
    return `${prefix}-${yearShort}-${Date.now().toString().slice(-4)}`;
  }
}
