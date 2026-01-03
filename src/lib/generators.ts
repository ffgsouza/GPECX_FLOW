import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { initializeFirebase } from "@/firebase";

/**
 * Gera números inteligentes no formato "SIGLA AAXXX"
 * Exemplo: PVE 26001, PTC 26002, PLE 27001
 * * @param type Tipo da proposta (SALES, SERVICE, RENTAL)
 */
export async function generateSmartNumber(type: "SALES" | "SERVICE" | "RENTAL"): Promise<string> {
  const { db } = initializeFirebase();
  if (!db) {
    throw new Error("Firestore not initialized");
  }
  // 1. Define a Sigla
  const prefixMap = {
    "SALES": "PVE",   // Proposta de Venda de Equipamento
    "SERVICE": "PTC", // Proposta Técnica de Calibração/Serviço
    "RENTAL": "PLE"   // Proposta de Locação de Equipamento
  };
  const prefix = prefixMap[type];

  // 2. Pega o Ano Atual Dinamicamente (26, 27, 28...)
  const currentYear = new Date().getFullYear();
  const yearShort = currentYear.toString().slice(-2); 
  
  // O prefixo completo de busca (ex: "PVE 26")
  const searchPrefix = `${prefix} ${yearShort}`;

  try {
    // 3. Busca a última proposta DESTE TIPO e DESTE ANO
    const q = query(
      collection(db, "quotes"),
      where("number", ">=", searchPrefix),
      where("number", "<=", searchPrefix + "\uf8ff"), // Garante que só busca o ano atual
      orderBy("number", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(q);

    let nextSequence = 1;

    if (!snapshot.empty) {
      // Se já existe proposta neste ano, pega a última
      const lastNumber = snapshot.docs[0].data().number; // Ex: "PVE 26042"
      
      // Remove o prefixo ("PVE 26") e sobra só o sequencial ("042")
      // Nota: Usamos replace para garantir limpeza exata
      const cleanSequence = lastNumber.replace(searchPrefix, "").trim(); 
      const lastSeqInt = parseInt(cleanSequence);
      
      if (!isNaN(lastSeqInt)) {
        nextSequence = lastSeqInt + 1;
      }
    }

    // 4. Formata com 3 dígitos (001, 002... 010... 100)
    const sequenceString = nextSequence.toString().padStart(3, "0");

    // Resultado Final: "PVE 26001"
    return `${searchPrefix}${sequenceString}`;

  } catch (error) {
    console.error(`Erro ao gerar número ${prefix}:`, error);
    // Fallback de segurança (apenas se o banco falhar, para não travar a venda)
    return `${prefix} ${yearShort}-${Date.now().toString().slice(-4)}`; 
  }
}