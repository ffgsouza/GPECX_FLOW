"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useWorkspace } from "./workspace-context";

const WELCOME_SEEN_KEY = "gpecx-workspace-welcome-seen";

interface WorkspaceWelcomeContextType {
    showWelcome: boolean;
    dismissWelcome: () => void;
    resetWelcome: (workspaceId: string) => void;
    isNavigationBlocked: boolean;
}

const WorkspaceWelcomeContext = createContext<WorkspaceWelcomeContextType | null>(null);

export function WorkspaceWelcomeProvider({ children }: { children: ReactNode }) {
    const { activeWorkspaceId } = useWorkspace();
    const [showWelcome, setShowWelcome] = useState(false);

    // Verificar se já viu a tela de boas-vindas para este workspace
    useEffect(() => {
        const seenWorkspaces = JSON.parse(localStorage.getItem(WELCOME_SEEN_KEY) || "{}");
        if (!seenWorkspaces[activeWorkspaceId]) {
            setShowWelcome(true);
        } else {
            setShowWelcome(false);
        }
    }, [activeWorkspaceId]);

    const dismissWelcome = useCallback(() => {
        // Marcar como visto
        const seenWorkspaces = JSON.parse(localStorage.getItem(WELCOME_SEEN_KEY) || "{}");
        seenWorkspaces[activeWorkspaceId] = true;
        localStorage.setItem(WELCOME_SEEN_KEY, JSON.stringify(seenWorkspaces));
        setShowWelcome(false);
    }, [activeWorkspaceId]);

    const resetWelcome = useCallback((workspaceId: string) => {
        const seenWorkspaces = JSON.parse(localStorage.getItem(WELCOME_SEEN_KEY) || "{}");
        delete seenWorkspaces[workspaceId];
        localStorage.setItem(WELCOME_SEEN_KEY, JSON.stringify(seenWorkspaces));
        // Se for o workspace atual, mostrar novamente
        if (workspaceId === activeWorkspaceId) {
            setShowWelcome(true);
        }
    }, [activeWorkspaceId]);

    return (
        <WorkspaceWelcomeContext.Provider
            value={{
                showWelcome,
                dismissWelcome,
                resetWelcome,
                isNavigationBlocked: showWelcome
            }}
        >
            {children}
        </WorkspaceWelcomeContext.Provider>
    );
}

export function useWorkspaceWelcome() {
    const context = useContext(WorkspaceWelcomeContext);
    if (!context) {
        throw new Error("useWorkspaceWelcome must be used within WorkspaceWelcomeProvider");
    }
    return context;
}

/**
 * Força exibição da tela de boas-vindas (usado ao trocar workspace)
 */
export function resetWorkspaceWelcomeStorage(workspaceId: string) {
    const seenWorkspaces = JSON.parse(localStorage.getItem(WELCOME_SEEN_KEY) || "{}");
    delete seenWorkspaces[workspaceId];
    localStorage.setItem(WELCOME_SEEN_KEY, JSON.stringify(seenWorkspaces));
}

/**
 * Reseta todas as boas-vindas (debug)
 */
export function resetAllWorkspaceWelcomes() {
    localStorage.removeItem(WELCOME_SEEN_KEY);
}
