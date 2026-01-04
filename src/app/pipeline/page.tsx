"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  orderBy 
} from "firebase/firestore";
import { initializeFirebase } from "@/firebase";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, FileText, Loader2 } from "lucide-react";
import type { Quote } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// --- DEFINIÇÃO DAS ETAPAS (COLUNAS) ---
const STAGES = {
  "PROPOSAL": { id: "PROPOSAL", title: "Proposta Enviada", color: "border-blue-500", bg: "bg-blue-50" },
  "NEGOTIATION": { id: "NEGOTIATION", title: "Negociação/Follow-up", color: "border-yellow-500", bg: "bg-yellow-50" },
  "FORMALIZATION": { id: "FORMALIZATION", title: "Formalização", color: "border-purple-500", bg: "bg-purple-50" },
  "WON": { id: "WON", title: "Negócio Ganho 🚀", color: "border-emerald-500", bg: "bg-emerald-50" },
  "LOST": { id: "LOST", title: "Negócio Perdido", color: "border-red-500", bg: "bg-red-50" }
};

type StageId = keyof typeof STAGES;

interface DealCard {
  id: string;
  customerName: string;
  finalPrice: number;
  stage: StageId;
  createdAt: number;
  number: string;
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<DealCard[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. CARREGAR DADOS DO FIREBASE
  useEffect(() => {
    setIsClient(true);
    
    const { db } = initializeFirebase();
    if (!db) {
        console.error("Firestore not initialized");
        setLoading(false);
        return;
    }

    const q = query(collection(db, "quotes"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data() as Omit<Quote, 'id'>;
        return {
          id: doc.id,
          customerName: d.customerData.tradeName,
          finalPrice: d.totals?.suggestedPrice || 0,
          stage: d.stage || "PROPOSAL",
          createdAt: d.createdAt,
          number: d.number || "PROP-000"
        };
      });
      setDeals(data);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching quotes: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. LÓGICA DE ARRASTAR E SOLTAR
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const newStage = destination.droppableId as StageId;

    const updatedDeals = deals.map(deal => 
      deal.id === draggableId ? { ...deal, stage: newStage } : deal
    );
    setDeals(updatedDeals);

    const { db } = initializeFirebase();
    if (!db) return;

    try {
      const updateData: Partial<Quote> = { stage: newStage };

      if (newStage === "WON") {
        updateData.status = "SOLD";
        updateData.procurementStatus = "OPEN";
      } else if (source.droppableId === "WON" && newStage !== "WON") {
        updateData.status = "DRAFT";
        updateData.procurementStatus = null;
      } else if (newStage === "LOST") {
        updateData.status = "ARCHIVED";
      }

      await updateDoc(doc(db, "quotes", draggableId), updateData as any);
      
    } catch (error) {
      console.error("Erro ao mover card:", error);
    }
  };

  if (!isClient || loading) {
    return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary"/> Carregando Pipeline...</div>;
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline de Vendas</h1>
        <p className="text-sm text-gray-500">Gerencie o fluxo comercial. Arraste para "Ganho" para iniciar a importação.</p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 h-full items-start">
          
          {Object.entries(STAGES).map(([stageId, stageInfo]) => {
            const stageDeals = deals.filter(d => d.stage === stageId);
            const totalValue = stageDeals.reduce((acc, curr) => acc + curr.finalPrice, 0);

            return (
              <div key={stageId} className="flex flex-col min-w-[300px] w-[300px] h-full bg-slate-100/50 rounded-xl border border-slate-200">
                <div className={`p-3 border-b-4 ${stageInfo.color} bg-white rounded-t-xl`}>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-sm text-gray-700">{stageInfo.title}</h3>
                    <Badge variant="secondary" className="text-xs">{stageDeals.length}</Badge>
                  </div>
                  <p className="text-xs font-mono text-gray-500 font-bold">
                    Total: {formatCurrency(totalValue, 'BRL')}
                  </p>
                </div>

                <Droppable droppableId={stageId}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 p-2 space-y-3 overflow-y-auto min-h-[150px] transition-colors ${
                        snapshot.isDraggingOver ? stageInfo.bg : ''
                      }`}
                    >
                      {stageDeals.map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing border-l-4 ${stageInfo.color} ${snapshot.isDragging ? 'rotate-2 scale-105' : ''}`}
                            >
                              <CardContent className="p-3 space-y-3">
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-bold text-gray-400">{deal.number}</span>
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(deal.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                
                                <h4 className="font-bold text-sm text-gray-800 line-clamp-2 leading-tight">
                                    {deal.customerName}
                                </h4>
                                
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1 text-emerald-700 font-bold text-sm bg-emerald-50 w-fit px-2 py-0.5 rounded">
                                        <DollarSign className="w-3 h-3" />
                                        {formatCurrency(deal.finalPrice, 'BRL')}
                                    </div>
                                    <Link href={`/quotes`}>
                                        <Button variant="outline" size="sm" className="h-7">
                                            <FileText className="w-3 h-3 mr-1.5"/>
                                            Ver Detalhes
                                        </Button>
                                    </Link>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}

        </div>
      </DragDropContext>
    </div>
  );
}
