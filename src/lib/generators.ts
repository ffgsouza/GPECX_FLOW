import { collection, getDocs, query, where, orderBy, limit, type Firestore } from "firebase/firestore";

/**
 * Gera números inteligentes no formato "SIGLA-AAXXX"
 * Exemplo: PVE-26001, PTC-26002, PLE-27001
 * @param db A instância do Firestore
 * @param type Tipo da proposta (SALES, SERVICE, RENTAL)
 */
export async function generateSmartNumber(db: Firestore, type: "SALES" | "SERVICE" | "RENTAL"): Promise<string> {
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
      const lastNumber = snapshot.docs[0].data().number; // Ex: "PVE-26042-R0"
      const baseNumber = lastNumber.split('-R')[0]; // "PVE-26042"
      
      const cleanSequence = baseNumber.replace(searchPrefix, "").trim(); 
      const lastSeqInt = parseInt(cleanSequence);
      
      if (!isNaN(lastSeqInt)) {
        nextSequence = lastSeqInt + 1;
      }
    }

    const sequenceString = nextSequence.toString().padStart(3, "0");

    return `${searchPrefix}${sequenceString}`;

  } catch (error) {
    console.error(`Erro ao gerar número ${prefix}:`, error);
    return `${prefix}-${yearShort}-${Date.now().toString().slice(-4)}`; 
  }
}
