import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Instagram, Facebook, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MetaSettings() {
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        // This is a mockup of saving settings
        setTimeout(() => {
            setIsSaving(false);
            toast.success('Paramètres Meta enregistrés (Note: nécessite un redémarrage du serveur si les variables d\'environnement ont changé)');
        }, 1000);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Instagram className="h-5 w-5 text-pink-600" />
                        <CardTitle>Instagram & Messenger</CardTitle>
                    </div>
                    <CardDescription>
                        Configurez votre intégration Meta pour recevoir des messages Instagram et Messenger
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                        <div className="flex gap-3">
                            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-800 space-y-2">
                                <p className="font-semibold">Comment ça marche ?</p>
                                <p>
                                    L'intégration utilise l'API Meta Graph. Vous devez configurer une application sur le
                                    <a href="https://developers.facebook.com" target="_blank" className="font-bold underline ml-1">portail développeur Meta</a>.
                                </p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Créez une application de type "Business"</li>
                                    <li>Ajoutez les produits "Messenger" et "Instagram Graph API"</li>
                                    <li>Configurez le Webhook sur : <code className="bg-blue-100 px-1 rounded">https://votre-domaine.com/api/webhooks/meta</code></li>
                                    <li>Utilisez le token de vérification défini dans votre fichier .env</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="meta_token">Page Access Token</Label>
                            <Input
                                id="meta_token"
                                type="password"
                                placeholder="EAA..."
                                defaultValue="••••••••••••••••••••••••••••"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Token d'accès permanent pour votre page Facebook/Instagram
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="meta_verify">Verify Token (Webhook)</Label>
                            <Input
                                id="meta_verify"
                                placeholder="Votre_Token_Secret"
                                defaultValue="smart_crm_verify_token"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Ce token doit correspondre à celui saisi dans le portail Meta Developers
                            </p>
                        </div>
                    </div>

                    <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
                        {isSaving ? 'Enregistrement...' : 'Enregistrer la configuration'}
                    </Button>
                </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Instagram className="h-4 w-4" /> Instagram Direct
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-green-600 text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3" /> Prêt à recevoir des messages
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Facebook className="h-4 w-4" /> Facebook Messenger
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-green-600 text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3" /> Prêt à recevoir des messages
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
