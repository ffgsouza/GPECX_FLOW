"use client";

import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { UserList } from "@/components/admin/user-list";
import { Users } from "lucide-react";
import { useState } from "react";

export default function UsersManagementPage() {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleUserCreated = () => {
        // Trigger refresh - the UserList component already listens to real-time updates
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Users className="h-8 w-8 text-primary" />
                        Gerenciamento de Usuários
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Gerencie usuários, funções e permissões de acesso ao sistema.
                    </p>
                </div>
                <CreateUserDialog onUserCreated={handleUserCreated} />
            </div>

            {/* Divider */}
            <div className="border-b border-gray-200" />

            {/* User List */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Usuários Cadastrados</h2>
                <UserList key={refreshKey} />
            </div>
        </div>
    );
}
