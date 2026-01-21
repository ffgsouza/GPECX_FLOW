"use client";

import { useEffect, useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
  where
} from "firebase/firestore";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, FileText, Loader2 } from "lucide-react";
import type { Quote } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAppContext } from "@/context/app-context";
import { useWorkspace } from "@/context/workspace-context";
import {
  getPipelineForWorkspace,
  getActiveStages,
  getWorkspaceCardColor,
  type PipelineStage,
  type PipelineStageId
} from "@/lib/pipelines";

interface DealCard {
  id: string;
  customerName: string;
  finalPrice: number;
  stage: PipelineStageId;
  createdAt: number;
  number: string;
  workspaceId?: string;
  quoteType?: string;
}

export default function PipelinePage() {
  const { db } = useAppContext();
  const { activeWorkspaceId, currentWorkspace } = useWorkspace();

  const [deals, setDeals] = useState<DealCard[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);

  // Obter configuração do pipeline para o workspace atual
  const pipelineConfig = useMemo(() =>
    getPipelineForWorkspace(activeWorkspaceId),
    [activeWorkspaceId]
  );

  const activeStages = useMemo(() =>
    getActiveStages(activeWorkspaceId),
    [activeWorkspaceId]
  );

  // Obter estágios finais (WON/LOST)
  const finalStages = useMemo(() =>
    pipelineConfig.stages.filter(s => s.isFinal),
    [pipelineConfig]
  );

  // Todos os estágios para renderização
  const allStages = useMemo(() =>
    [...activeStages, ...finalStages],
    [activeStages, finalStages]
  );

  // 1. CARREGAR DADOS DO FIREBASE (FILTRADO POR WORKSPACE)
  useEffect(() => {
    setIsClient(true);

    if (!db) {
      setLoading(false);
      return;
    }

    // Query filtrada por workspaceId
    const q = query(
      collection(db, "quotes"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Filtrar apenas propostas GERAIS (docMode === 'COMPLETE' ou undefined/null para antigas)
      // E que pertencem ao workspace atual
      // Propostas legadas (sem workspaceId) só aparecem no EXS (padrão histórico)
      const filteredDocs = snapshot.docs.filter(doc => {
        const d = doc.data() as Quote;
        const isGeneral = !d.proposalData?.docMode || d.proposalData?.docMode === 'COMPLETE';
        const matchesWorkspace = d.workspaceId === activeWorkspaceId ||
          (!d.workspaceId && activeWorkspaceId === 'EXS');
        return isGeneral && matchesWorkspace;
      });

      const data = filteredDocs.map(doc => {
        const d = doc.data() as Omit<Quote, 'id'>;

        // Mapear estágio antigo para novo, se necessário
        let stage = d.stage || "PROPOSAL";

        // Mapeamento de estágios legados para o novo sistema
        const legacyStageMap: Record<string, PipelineStageId> = {
          'ELABORATED': 'LEAD',
          'PROPOSAL': activeWorkspaceId === 'ISPCS' ? 'PROPOSAL_SENT' : 'PROPOSAL',
          'NEGOTIATION': activeWorkspaceId === 'ISPCS' ? 'ENROLLMENT' : 'NEGOTIATION',
          'FORMALIZATION': activeWorkspaceId === 'ISPCS' ? 'PAYMENT_PENDING' : 'CONTRACT',
        };

        if (legacyStageMap[stage]) {
          stage = legacyStageMap[stage];
        }

        return {
          id: doc.id,
          customerName: d.customerData?.tradeName || "Cliente Excluído",
          finalPrice: d.totals?.suggestedPrice || 0,
          stage: stage as PipelineStageId,
          createdAt: d.createdAt,
          number: d.number || "PROP-000",
          workspaceId: d.workspaceId,
          quoteType: d.type
        };
      });
      setDeals(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching quotes: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, activeWorkspaceId]);

  // 2. LÓGICA DE ARRASTAR E SOLTAR
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const newStage = destination.droppableId as PipelineStageId;

    const updatedDeals = deals.map(deal =>
      deal.id === draggableId ? { ...deal, stage: newStage } : deal
    );
    setDeals(updatedDeals);

    if (!db) return;

    try {
      const updateData: Partial<Quote> = {
        stage: newStage,
        workspaceId: activeWorkspaceId // Garantir que o workspaceId está definido
      };

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
    return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /> Carregando Pipeline...</div>;
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      {/* Header com identificação do Pipeline */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: currentWorkspace.color }}
          />
          <h1 className="text-2xl font-bold text-gray-900">
            {pipelineConfig.name}
          </h1>
          <Badge
            variant="outline"
            className="ml-2"
            style={{ borderColor: currentWorkspace.color, color: currentWorkspace.color }}
          >
            {currentWorkspace.shortName}
          </Badge>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {pipelineConfig.description}
        </p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 h-full items-start">

          {allStages.map((stage) => {
            const stageDeals = deals.filter(d => d.stage === stage.id);
            const totalValue = stageDeals.reduce((acc, curr) => acc + curr.finalPrice, 0);
            const StageIcon = stage.icon;

            return (
              <div
                key={stage.id}
                className={`flex flex-col min-w-[300px] w-[300px] h-full rounded-xl border ${stage.isFinal
                  ? stage.isPositive
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-red-50/50 border-red-200'
                  : 'bg-slate-100/50 border-slate-200'
                  }`}
              >
                {/* Header da Coluna */}
                <div className={`p-3 border-b-4 border-${stage.color}-500 bg-white rounded-t-xl`}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <StageIcon className={`w-4 h-4 ${stage.textColor}`} />
                      <h3 className="font-bold text-sm text-gray-700">{stage.label}</h3>
                    </div>
                    <Badge variant="secondary" className="text-xs">{stageDeals.length}</Badge>
                  </div>
                  <p className="text-xs font-mono text-gray-500 font-bold">
                    Total: {formatCurrency(totalValue, 'BRL')}
                  </p>
                </div>

                {/* Área de Drop */}
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 p-2 space-y-3 overflow-y-auto min-h-[150px] transition-colors ${snapshot.isDraggingOver ? stage.bgColor : ''
                        }`}
                    >
                      {stageDeals.map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing border-l-4 ${getWorkspaceCardColor(activeWorkspaceId)
                                } ${snapshot.isDragging ? 'rotate-2 scale-105' : ''}`}
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
                                      <FileText className="w-3 h-3 mr-1.5" />
                                      Ver
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
