import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, QrCode, LogOut, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { socketService } from '@/services/socket';
import { toast } from 'sonner';

interface WhatsAppStatus {
    isConnected: boolean;
    qrCode: string | null;
    phoneNumber: string | null;
}

export default function WhatsAppSettings() {
    const [status, setStatus] = useState<WhatsAppStatus>({
        isConnected: false,
        qrCode: null,
        phoneNumber: null,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch initial status
        fetchStatus();

        // Listen for WhatsApp events
        socketService.on('whatsapp:qr', (qr: string) => {
            console.log('📱 QR Code received');
            setStatus({ isConnected: false, qrCode: qr, phoneNumber: null });
            toast.info('Scannez le QR code avec WhatsApp');
        });

        socketService.on('whatsapp:connected', (data: any) => {
            console.log('✅ WhatsApp connected', data);
            setStatus({ isConnected: true, qrCode: null, phoneNumber: data?.phoneNumber || null });
            toast.success('WhatsApp connecté avec succès!');
        });

        socketService.on('whatsapp:disconnected', () => {
            console.log('❌ WhatsApp disconnected');
            setStatus({ isConnected: false, qrCode: null, phoneNumber: null });
            toast.error('WhatsApp déconnecté');
        });

        socketService.on('whatsapp:status', (statusData: WhatsAppStatus) => {
            console.log('📊 WhatsApp status:', statusData);
            setStatus(statusData);
            setIsLoading(false);
        });

        socketService.on('whatsapp:logout', () => {
            console.log('👋 WhatsApp logged out');
            setStatus({ isConnected: false, qrCode: null, phoneNumber: null });
            toast.info('WhatsApp déconnecté');
        });

        return () => {
            socketService.off('whatsapp:qr');
            socketService.off('whatsapp:connected');
            socketService.off('whatsapp:disconnected');
            socketService.off('whatsapp:status');
            socketService.off('whatsapp:logout');
        };
    }, []);

    const fetchStatus = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/whatsapp/status');
            const data = await response.json();
            setStatus(data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching WhatsApp status:', error);
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/whatsapp/logout', {
                method: 'POST',
            });

            if (response.ok) {
                toast.success('Déconnexion réussie');
            } else {
                toast.error('Erreur lors de la déconnexion');
            }
        } catch (error) {
            console.error('Error logging out:', error);
            toast.error('Erreur lors de la déconnexion');
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        <CardTitle>WhatsApp Business</CardTitle>
                    </div>
                    {isLoading ? (
                        <Badge variant="secondary">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Chargement...
                        </Badge>
                    ) : status.isConnected ? (
                        <Badge variant="default" className="bg-green-500">
                            <Wifi className="h-3 w-3 mr-1" />
                            Connecté
                        </Badge>
                    ) : (
                        <Badge variant="destructive">
                            <WifiOff className="h-3 w-3 mr-1" />
                            Déconnecté
                        </Badge>
                    )}
                </div>
                <CardDescription>
                    Gérez votre connexion WhatsApp Business
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : status.isConnected ? (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
                            <p className="text-sm text-green-800">
                                ✅ Votre compte WhatsApp est connecté et prêt à recevoir/envoyer des messages.
                            </p>
                            {status.phoneNumber && (
                                <div className="flex items-center gap-2 pt-2 border-t border-green-200">
                                    <span className="text-xs font-medium text-green-700">Numéro connecté:</span>
                                    <code className="text-sm font-mono bg-green-100 px-2 py-1 rounded text-green-900">
                                        +{status.phoneNumber}
                                    </code>
                                </div>
                            )}
                        </div>
                        <Button
                            variant="destructive"
                            onClick={handleLogout}
                            className="w-full"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Se déconnecter
                        </Button>
                    </div>
                ) : status.qrCode ? (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                            <div className="flex items-start gap-3">
                                <QrCode className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-blue-900">
                                        Scannez le QR code avec WhatsApp
                                    </p>
                                    <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                                        <li>Ouvrez WhatsApp sur votre téléphone</li>
                                        <li>Allez dans Paramètres → Appareils connectés</li>
                                        <li>Appuyez sur "Connecter un appareil"</li>
                                        <li>Scannez ce QR code</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center p-4 bg-white rounded-lg border">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(status.qrCode)}`}
                                alt="QR Code WhatsApp"
                                className="w-64 h-64"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                        <p className="text-sm text-yellow-800">
                            ⏳ En attente de connexion WhatsApp. Le QR code apparaîtra automatiquement.
                        </p>
                        <p className="text-xs text-yellow-700 mt-2">
                            Assurez-vous que le serveur backend est démarré.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
