import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ClipboardList } from 'lucide-react';
import { activityLogsService, ActivityLog, ActivityLogsFilters } from '@/services/activityLogs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ActivityLogs() {
    const [filters, setFilters] = useState<ActivityLogsFilters>({
        limit: 50,
        offset: 0,
    });

    const { data, isLoading, error } = useQuery({
        queryKey: ['activityLogs', filters],
        queryFn: () => activityLogsService.getActivityLogs(filters),
    });

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
    };

    const parseUserAgent = (ua?: string) => {
        if (!ua) return 'Inconnu';
        if (ua.includes('Chrome')) return '🌐 Chrome';
        if (ua.includes('Firefox')) return '🦊 Firefox';
        if (ua.includes('Safari')) return '🧭 Safari';
        if (ua.includes('Edge')) return '⚡ Edge';
        return '🖥️ Autre';
    };

    const calculateDuration = (log: ActivityLog) => {
        const start = new Date(log.createdAt);
        const end = log.loggedOutAt ? new Date(log.loggedOutAt) : new Date();
        const diffMs = end.getTime() - start.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return '<1min';
        if (diffMins < 60) return `${diffMins}min`;

        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h${mins > 0 ? mins + 'min' : ''}`;
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Logs d'Activité</h1>
                        <p className="text-muted-foreground mt-2">
                            Historique des connexions des utilisateurs
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ClipboardList className="h-5 w-5" />
                            <CardTitle>Sessions Utilisateurs</CardTitle>
                        </div>
                        <CardDescription>
                            {data?.total || 0} session(s) enregistrée(s)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="text-muted-foreground">Chargement...</div>
                            </div>
                        ) : error ? (
                            <div className="text-red-500 text-center py-8">
                                Erreur lors du chargement des logs
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Utilisateur</TableHead>
                                        <TableHead>Date/Heure</TableHead>
                                        <TableHead>Adresse IP</TableHead>
                                        <TableHead>Navigateur</TableHead>
                                        <TableHead>Durée</TableHead>
                                        <TableHead>Statut</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {log.user.avatar && (
                                                        <img
                                                            src={log.user.avatar}
                                                            alt={log.user.name}
                                                            className="h-8 w-8 rounded-full"
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="font-medium">{log.user.name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {log.user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{formatDate(log.createdAt)}</TableCell>
                                            <TableCell>
                                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                                    {log.ipAddress || 'N/A'}
                                                </code>
                                            </TableCell>
                                            <TableCell>{parseUserAgent(log.userAgent)}</TableCell>
                                            <TableCell>{calculateDuration(log)}</TableCell>
                                            <TableCell>
                                                {log.loggedOutAt ? (
                                                    <Badge variant="secondary">
                                                        ⭕ Déconnecté
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="default" className="bg-green-500">
                                                        ✅ Actif
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {data?.logs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                Aucune activité enregistrée
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
