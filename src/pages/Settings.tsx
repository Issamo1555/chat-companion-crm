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
import TemplateList from '@/components/settings/TemplateList';
import WhatsAppSettings from '@/components/settings/WhatsAppSettings';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { useRef, useState } from 'react';

const Settings = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportClients = async () => {
    try {
      setIsExporting(true);
      const clients = await api.getClients();

      const csvData = clients.map(c => ({
        'Nom': c.name,
        'Téléphone': c.phoneNumber,
        'Email': c.email || '',
        'Entreprise': c.company || '',
        'Statut': c.status,
        'Date Création': new Date(c.createdAt).toLocaleDateString('fr-FR'),
        'Agent Assigné': c.assignedAgent?.name || 'Non assigné'
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `clients_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Export des clients réussi');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export des clients');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportConversations = async () => {
    try {
      setIsExporting(true);
      const messages = await api.getConversationsExport();

      const csvData = messages.map((m: any) => ({
        'Client': m.clientName,
        'Téléphone': m.clientPhone,
        'Date': new Date(m.timestamp).toLocaleString('fr-FR'),
        'Direction': m.direction === 'inbound' ? 'Reçu' : 'Envoyé',
        'Contenu': m.content,
        'Statut': m.status
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `conversations_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Export des conversations réussi');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export des conversations');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          setIsImporting(true);
          const data = results.data as any[];
          let successCount = 0;
          let errorCount = 0;

          for (const row of data) {
            try {
              // Map French headers back to standard fields or use fallback
              const name = row['Nom'] || row['name'] || row['Name'];
              const phone = row['Téléphone'] || row['phone'] || row['phoneNumber'] || row['Phone'];
              const email = row['Email'] || row['email'];
              const company = row['Entreprise'] || row['company'] || row['Company'];

              if (!name || !phone) {
                console.warn('Skipping row due to missing name or phone:', row);
                errorCount++;
                continue;
              }

              // Create client (assuming api.createClient expects this payload)
              await api.createClient({
                name,
                phoneNumber: phone.toString(),
                email: email || '',
                company: company || '',
                status: 'nouveau'
              });
              successCount++;
            } catch (err) {
              console.error('Error importing row:', row, err);
              errorCount++;
            }
          }

          toast.success(`Import terminé : ${successCount} clients ajoutés, ${errorCount} erreurs.`);
        } catch (error) {
          console.error('Import process error:', error);
          toast.error('Erreur globale lors de l\'import');
        } finally {
          setIsImporting(false);
          // Reset file input
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        console.error('Papa Parse error:', error);
        toast.error('Erreur lors de la lecture du fichier CSV');
      }
    });
  };

  return (
    <>
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
            <TabsTrigger value="templates">Modèles</TabsTrigger>
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

          <TabsContent value="templates">
            <TemplateList />
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
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={handleExportClients}
                      disabled={isExporting}
                    >
                      <Download className="h-4 w-4" />
                      {isExporting ? 'Export en cours...' : 'Exporter clients (CSV)'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={handleExportConversations}
                      disabled={isExporting}
                    >
                      <Download className="h-4 w-4" />
                      {isExporting ? 'Export en cours...' : 'Exporter conversations'}
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
                      <p className="text-sm text-muted-foreground mb-4">
                        Sélectionnez un fichier CSV structuré (Nom, Téléphone, Email, Entreprise)
                      </p>

                      <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                      />

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                      >
                        {isImporting ? 'Importation...' : 'Parcourir les fichiers'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
};

export default Settings;
