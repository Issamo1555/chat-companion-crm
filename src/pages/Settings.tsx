import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Building,
  Bell,
  Download,
  Upload,
} from 'lucide-react';
import WhatsAppSettings from '@/components/settings/WhatsAppSettings';
import { useAuth } from '@/contexts/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground">
            Configurez votre CRM WhatsApp
          </p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            {isAdmin && <TabsTrigger value="api">API WhatsApp</TabsTrigger>}
            {isAdmin && <TabsTrigger value="import-export">Import/Export</TabsTrigger>}
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Informations entreprise</CardTitle>
                </div>
                <CardDescription>
                  Paramètres généraux de votre organisation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company">Nom de l'entreprise</Label>
                    <Input id="company" placeholder="Votre entreprise" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de contact</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <Input id="timezone" defaultValue="Europe/Paris" />
                </div>
                <Button>Sauvegarder</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Notifications</CardTitle>
                </div>
                <CardDescription>
                  Configurez vos préférences de notification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nouveaux messages</p>
                    <p className="text-sm text-muted-foreground">
                      Recevoir une notification pour chaque nouveau message
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nouveaux clients</p>
                    <p className="text-sm text-muted-foreground">
                      Notification lors de la création d'une fiche client
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Changements de statut</p>
                    <p className="text-sm text-muted-foreground">
                      Notification lors d'un changement de statut
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rapports hebdomadaires</p>
                    <p className="text-sm text-muted-foreground">
                      Recevoir un résumé par email chaque semaine
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="api">
              <WhatsAppSettings />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="import-export">
              <div className="grid gap-6 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Download className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Exporter</CardTitle>
                    </div>
                    <CardDescription>
                      Téléchargez vos données au format CSV ou Excel
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Download className="h-4 w-4" />
                      Exporter clients (CSV)
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Download className="h-4 w-4" />
                      Exporter clients (Excel)
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Download className="h-4 w-4" />
                      Exporter conversations
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Importer</CardTitle>
                    </div>
                    <CardDescription>
                      Importez des données depuis un fichier
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Glissez un fichier CSV ou Excel ici
                      </p>
                      <Button variant="outline" size="sm">
                        Parcourir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;
