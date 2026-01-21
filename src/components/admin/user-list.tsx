"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase";
import { UserProfile } from "@/types/user";
import { roleLabels } from "@/lib/user-schema";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users } from "lucide-react";

export function UserList() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const usersQuery = query(
            collection(db, "users"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(
            usersQuery,
            (snapshot) => {
                const usersData = snapshot.docs.map((doc) => ({
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                    updatedAt: doc.data().updatedAt?.toDate(),
                })) as UserProfile[];

                setUsers(usersData);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching users:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                    Nenhum usuário cadastrado
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    Clique em "Novo Usuário" para adicionar o primeiro usuário.
                </p>
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Nome</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Função</TableHead>
                        <TableHead className="font-semibold">Permissões</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.uid}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell className="text-gray-600">{user.email}</TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        user.role === "admin"
                                            ? "default"
                                            : user.role === "manager"
                                                ? "secondary"
                                                : "outline"
                                    }
                                >
                                    {roleLabels[user.role]}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {user.permissions?.slice(0, 3).map((perm) => (
                                        <Badge key={perm} variant="outline" className="text-xs">
                                            {perm}
                                        </Badge>
                                    ))}
                                    {user.permissions?.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{user.permissions.length - 3}
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                {user.active ? (
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                        Ativo
                                    </Badge>
                                ) : (
                                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                                        Inativo
                                    </Badge>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
