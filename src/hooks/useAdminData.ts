import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ContractType = Database['public']['Tables']['contract_types']['Row'];
type ContractModule = Database['public']['Tables']['contract_modules']['Row'];
type GlobalVariable = Database['public']['Tables']['global_variables']['Row'];
type ContractComposition = Database['public']['Tables']['contract_compositions']['Row'];
type ContractTemplate = Database['public']['Tables']['contract_templates']['Row'];

type ContractTypeInsert = Database['public']['Tables']['contract_types']['Insert'];
type ContractModuleInsert = Database['public']['Tables']['contract_modules']['Insert'];
type GlobalVariableInsert = Database['public']['Tables']['global_variables']['Insert'];
type ContractCompositionInsert = Database['public']['Tables']['contract_compositions']['Insert'];
type ContractTemplateInsert = Database['public']['Tables']['contract_templates']['Insert'];

export function useAdminData() {
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [contractModules, setContractModules] = useState<ContractModule[]>([]);
  const [globalVariables, setGlobalVariables] = useState<GlobalVariable[]>([]);
  const [contractCompositions, setContractCompositions] = useState<ContractComposition[]>([]);
  const [contractTemplates, setContractTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [typesResult, modulesResult, variablesResult, compositionsResult, templatesResult] = await Promise.all([
        supabase.from('contract_types').select('*').order('name_de'),
        supabase.from('contract_modules').select('*').order('title_de'),
        supabase.from('global_variables').select('*').order('name_de'),
        supabase.from('contract_compositions').select('*').order('contract_type_key, sort_order'),
        supabase.from('contract_templates').select('*').order('name')
      ]);

      if (typesResult.error) throw typesResult.error;
      if (modulesResult.error) throw modulesResult.error;
      if (variablesResult.error) throw variablesResult.error;
      if (compositionsResult.error) throw compositionsResult.error;
      if (templatesResult.error) throw templatesResult.error;

      setContractTypes(typesResult.data || []);
      setContractModules(modulesResult.data || []);
      setGlobalVariables(variablesResult.data || []);
      setContractCompositions(compositionsResult.data || []);
      setContractTemplates(templatesResult.data || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Fehler',
        description: 'Daten konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Contract Types CRUD
  const createContractType = async (data: ContractTypeInsert) => {
    try {
      const { error } = await supabase
        .from('contract_types')
        .insert([data]);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Vertragstyp wurde erstellt.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error creating contract type:', error);
      toast({
        title: 'Fehler',
        description: 'Vertragstyp konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    }
  };

  const updateContractType = async (id: string, data: Partial<ContractType>) => {
    try {
      const { error } = await supabase
        .from('contract_types')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Vertragstyp wurde aktualisiert.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error updating contract type:', error);
      toast({
        title: 'Fehler',
        description: 'Vertragstyp konnte nicht aktualisiert werden.',
        variant: 'destructive'
      });
    }
  };

  const deleteContractType = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contract_types')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Vertragstyp wurde gelöscht.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting contract type:', error);
      toast({
        title: 'Fehler',
        description: 'Vertragstyp konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
    }
  };

  // Contract Modules CRUD
  const createContractModule = async (data: ContractModuleInsert) => {
    try {
      const { error } = await supabase
        .from('contract_modules')
        .insert([data]);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Modul wurde erstellt.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error creating contract module:', error);
      toast({
        title: 'Fehler',
        description: 'Modul konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    }
  };

  const updateContractModule = async (id: string, data: Partial<ContractModule>) => {
    try {
      const { error } = await supabase
        .from('contract_modules')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Modul wurde aktualisiert.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error updating contract module:', error);
      toast({
        title: 'Fehler',
        description: 'Modul konnte nicht aktualisiert werden.',
        variant: 'destructive'
      });
    }
  };

  const cloneContractModule = async (moduleId: string) => {
    try {
      // Get the original module
      const originalModule = contractModules.find(m => m.id === moduleId);
      if (!originalModule) throw new Error('Modul nicht gefunden');

      // Create clone data
      const cloneData: ContractModuleInsert = {
        key: `${originalModule.key}_copy`,
        title_de: `${originalModule.title_de} (Kopie)`,
        title_en: originalModule.title_en ? `${originalModule.title_en} (Copy)` : '',
        content_de: originalModule.content_de,
        content_en: originalModule.content_en || '',
        category: originalModule.category || 'general',
        is_active: originalModule.is_active,
        sort_order: originalModule.sort_order || 0,
        variables: originalModule.variables
      };

      const { error } = await supabase
        .from('contract_modules')
        .insert([cloneData]);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Modul wurde kopiert.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error cloning contract module:', error);
      toast({
        title: 'Fehler',
        description: 'Modul konnte nicht kopiert werden.',
        variant: 'destructive'
      });
    }
  };

  const deleteContractModule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contract_modules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Modul wurde gelöscht.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting contract module:', error);
      toast({
        title: 'Fehler',
        description: 'Modul konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
    }
  };

  // Global Variables CRUD
  const createGlobalVariable = async (data: GlobalVariableInsert) => {
    try {
      const { error } = await supabase
        .from('global_variables')
        .insert([data]);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Variable wurde erstellt.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error creating global variable:', error);
      toast({
        title: 'Fehler',
        description: 'Variable konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    }
  };

  const updateGlobalVariable = async (id: string, data: Partial<GlobalVariable>) => {
    try {
      const { error } = await supabase
        .from('global_variables')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Variable wurde aktualisiert.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error updating global variable:', error);
      toast({
        title: 'Fehler',
        description: 'Variable konnte nicht aktualisiert werden.',
        variant: 'destructive'
      });
    }
  };

  const deleteGlobalVariable = async (id: string) => {
    try {
      const { error } = await supabase
        .from('global_variables')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Erfolg',
        description: 'Variable wurde gelöscht.'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting global variable:', error);
      toast({
        title: 'Fehler',
        description: 'Variable konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  // One-off import for full AGB as a single module (DE/EN)
  const importAGBModule = async () => {
    try {
      const key = 'agb_shyftplan';
      const title_de = 'Allgemeine Geschäftsbedingungen (AGB)';
      const title_en = 'General Terms and Conditions (GTC)';
      const category = 'legal';

      const content_de = `<p><strong>ALLGEMEINE GESCHÄFTSBEDINGUNGEN FÜR DIE NUTZUNG VON SHYFTPLAN</strong></p>
<p><strong>1. GELTUNGSBEREICH UND BEGRIFFSBESTIMMUNGEN</strong></p>
<p>1.1. Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB") der shyftplan GmbH, Ritterstraße 26, 10969 Berlin, E-Mail: service@shyftplan.com, (nachfolgend „shyftplan") stellen die ausschließliche Grundlage für die Nutzung der auf der Internetplattform unter der Domain https://shyftplan.com (nachfolgend „Plattform, Portal oder Website") angebotenen Dienste dar, sofern nicht ausdrücklich abweichend angegeben.</p>
<p>1.2. Im Rahmen des Dienstleistungsvertrags erkennt der Kunde diese AGB als für das Rechtsverhältnis mit shyftplan allein maßgeblich an. Abweichende oder entgegenstehende allgemeine Geschäftsbedingungen der Kunden werden von shyftplan nicht anerkannt, sofern shyftplan diesen nicht ausdrücklich und schriftlich zugestimmt hat.</p>
<p>1.3. User bezeichnet im Rahmen dieser AGB einen Nutzeraccount, der in der Plattform hinterlegt ist. Es besteht die Möglichkeit, dass ein User einer natürlichen Person entspricht, dies ist jedoch nicht zwingend erforderlich. Ein User kann auch als Dummy-Account (ohne eigenen Login) im Portal hinterlegt sein.</p>
<p>1.4. Mitarbeiter bezeichnet im Rahmen dieser AGB einen User, welcher die Rechte (z.B. durch einen Administrator im User-Profil) des Mitarbeiters zugewiesen bekommen hat. Dies ermöglicht es unter anderem, dass die An- und Abwesenheiten des Users in der Plattform verplant werden können.</p>
<p>1.5. Manager bezeichnet im Rahmen dieser AGB einen User, welcher entsprechende Rechte (z.B. durch einen Administrator im User-Profil) des Managers zugewiesen bekommen hat. Jegliche Zuweisung von Manager-Rechten, dies umfasst das Planen von Mitarbeitern sowie Sichtrechte auf Schichtpläne, definieren einen User als Manager. Ein Manager kann zugleich Mitarbeiter und Manager sein.</p>
<p><strong>2. VERTRAGSSCHLUSS</strong></p>
<p>2.1. Ein Vertragsverhältnis mit Hauptleistungspflichten kommt durch Angebot und Annahme in Form eines schriftlichen Dienstleistungsvertrags (insb. E-Mail und schriftlich; Ziffer 2.2.) zustande, der auf diese AGB Bezug nimmt.</p>
<p>2.2. Im Rahmen des Vertragsschlusses in Textform richtet sich der Inhalt und Umfang des Vertrags nach den im Text vereinbarten Leistungen, die durch diese AGB präzisiert werden. Zudem können zu den AGB abweichende Vereinbarungen im Dienstleistungsvertrag getroffen werden. In Zweifelsfällen hat die Regelung des Dienstleistungsvertrages Vorrang.</p>
<p>2.3. Dienste im Sinne von Ziffer 3. dieser AGB werden von shyftplan ausschließlich für Unternehmer im Sinne von § 14 BGB angeboten. Der Kunde bestätigt mit dem Vertragsabschluss, dass er in Ausübung seiner gewerblichen oder selbständigen beruflichen Tätigkeit handelt und die shyftplan-Dienste hierfür verwendet. Handelt der Kunde als Stellvertreter einer anderen Person, versichert er, dass der Vertretene in Ausübung seiner gewerblichen oder selbstständigen beruflichen Tätigkeit vertreten wird und die shyftplan-Dienste hierfür verwendet.</p>
<p><strong>3. DIENSTE / LEISTUNGSUMFANG</strong></p>
<p>3.1. Die shyftplan-Dienste erleichtern die Arbeitsorganisation von Unternehmen sowie die Kommunikation zwischen Unternehmen und ihren Angestellten. Zum Angebot von shyftplan gehören derzeit folgende kostenpflichtige Dienste:</p>
<p>• Schichtplanung für Unternehmen und ihre Mitarbeiter bzw. freien Mitarbeiter (nachfolgend „Schichtplanung", Ziffer 3.2.1.)<br/>• Auswertung der Arbeitszeiten (nachfolgend „Auswertung", Ziffer 3.2.2.)<br/>• Zeitstempeluhr zur Aufzeichnung der Anwesenheitsstunden (nachfolgend „Zeitstempeluhr", Ziffer 3.2.3.)<br/>• Zeitkonto zur Erfassung variierender Arbeitszeiten (nachfolgend „Arbeitszeitkonto", Ziffer 3.2.4.)<br/>• Export der relevanten Lohndaten (nachfolgend „Lohnexport", Ziffer 3.2.5.)</p>
<p>3.2. Im Folgenden wird der jeweilige Leistungsumfang näher beschrieben.</p>
<p>3.2.1. Schichtplanung: Die Leistungen von shyftplan im Rahmen des Dienstes der Schichtplanung umfassen die Bereitstellung einer Plattform, die es dem Kunden ermöglicht, über die Eingabe von Daten folgende Funktionen auszuführen:<br/>• Anlegen von Schichten inkl. Start-, End- und Pausenzeiten,<br/>• manuelle Zeiterfassung der Schichten je Mitarbeiter,<br/>• Zuordnung von Mitarbeitern auf die angelegten Schichten,<br/>• Bewerbung der Mitarbeiter auf die vorgesehenen Schichten,<br/>• Bereitstellung von Druckansichten des Schichtplans,<br/>• Planung von Urlaubszeiten und Zeiten sonstiger Abwesenheit (z.B. Krankheit, Mutterschutz, Elternzeit) einschließlich der Möglichkeit Urlaubsanträge einzugeben und zu bearbeiten,<br/>• „Dashboard" zur internen offenen Kommunikation zwischen Mitarbeitern und Unternehmen.</p>
<p>3.2.2. Auswertung: Die über shyftplan verfügbaren Schichtdaten können mit der Funktion Auswertung auf der Plattform direkt ausgewertet werden. Die Leistung von shyftplan im Rahmen des Dienstes Auswertung umfasst die elektronische Bereitstellung verschiedener auf dem Portal vorhandener Daten, die sich auf einen Arbeitnehmer und einen Kalendermonat beziehen. In der Auswertung werden u.a. Arbeitszeitbeginn und -ende sowie Pausenzeiten dargestellt. Grundlage sind die Daten, die im Hinblick auf ein Unternehmen und dessen Angestellte auf dem Portal hinterlegt sind, insbesondere die Schichtpläne, aus welchen sich die geleisteten Arbeitszeiten des Arbeitnehmers ergeben. Sofern zusätzlich die Funktion Zeitstempeluhr vertraglich vereinbart wurde, können auch die sich daraus ergebenden tatsächlich geleisteten Ist-Arbeitszeiten erfasst werden. Es obliegt allein dem Kunden, die vorhandenen Daten vor einer weiteren Verwendung auf ihre inhaltliche Richtigkeit und Vollständigkeit zu überprüfen. Die Daten werden zusätzlich in einem Dateiformat (z.B. *.csv) zur Verfügung gestellt, um den Export aus dem Portal zu ermöglichen.</p>
<p>3.2.3. Zeitstempeluhr: Aus einem Manager-Account heraus kann auf der Plattform nach Aktivierung dieser Funktion eine digitale Stempeluhr gestartet werden. In dieser Stempeluhr kann sich jeder für diese Funktion freigeschaltete Mitarbeiter mit seiner ID einloggen. Daraufhin werden die Zeiten des Ein- und Austragens in die Erfassung der Schicht übernommen, um die tatsächlich geleistete Arbeitszeit möglichst präzise zu erfassen. Der Leistungsumfang im Rahmen des Dienstes Zeitstempeluhr je Mitarbeiter ist das Erfassen der Arbeitszeiten eines Mitarbeiters in einem Kalendermonat durch diese Funktion.</p>
<p>3.2.4. Arbeitszeitkonto: Die Dienstleistung Arbeitszeitkonto ermöglicht es, für seine Mitarbeiter elektronisch die geleisteten Arbeitszeiten zu erfassen und mit den vertraglich vereinbarten Arbeitszeiten abzugleichen. Der Leistungsumfang eines Arbeitszeitkontos für einen Mitarbeiter umfasst das Vorhalten einer elektronischen Übersicht auf dem Portal, welche die Differenz zwischen der vom Kunden zu hinterlegenden vertraglich vereinbarten Arbeitszeit (inkl. Urlaubs-, Krankheits- und Überstundenregelungen) und der tatsächlich geleisteten Arbeitszeit darstellt. Die Erfassung der tatsächlich geleisteten Arbeitszeiten erfolgt automatisiert über die Schichtplanung (Ziffer 3.2.1.) oder, sofern aktiviert, über die Zeitstempeluhr (Ziffer 3.2.3.). Die geleisteten Arbeitszeiten können manuell korrigiert werden.</p>
<p>3.2.5. Lohnexport: Die Funktion „Lohnexport" ermöglicht den Export der lohnabrechnungsrelevanten Daten eines oder mehrerer Mitarbeiter im CSV- Format. Die Datei muss selbst an die jeweiligen Formatanforderungen der verschiedenen Lohnprogramme angepasst werden. Im Rahmen des Lohnexports sind im Leistungsumfang der Funktion pro Mitarbeiter umfasst:<br/>• Stammdaten des Mitarbeiters<br/>• Stammdatenänderungen des Mitarbeiters im Vergleich zum vorhergehenden Abrechnungsmonat<br/>• Bruttolöhne des Mitarbeiters - Abrechnungstyp 1 (Prognose): Beim Abrechnungstyp 1 wird der Lohn an die Mitarbeiter auf Grundlage der Prognosewerte für den laufenden Monat bezahlt. Die Korrekturwerte werden automatisch in den nächsten Monat übertragen.<br/>• Bruttolöhne des Mitarbeiters - Abrechnungstyp 2 (Direkt): Beim Abrechnungstyp 2 wird der Lohn an die Mitarbeiter auf Grundlage der tatsächlich angefallenen Bruttolöhne zu Beginn des Folgemonats bezahlt.<br/>• Abwesenheiten<br/>• Abschlagszahlungen</p>
<p>3.3. shyftplan gibt keine Garantie oder sonstige Gewährleistung in Hinblick auf die ununterbrochene Verfügbarkeit, Erreichbarkeit und Funktionsfähigkeit der Plattform, insbesondere wenn die Ursache außerhalb der von shyftplan kontrollierbaren Sphäre liegt. shyftplan verpflichtet sich jedoch, seine zum Betrieb der Plattform dienenden technischen Einrichtungen im Rahmen marktüblicher technischer Standards funktionsfähig zu halten sowie im angemessenen wirtschaftlich vertretbaren Umfang dem Stand der Technik und dem Nutzungsverhalten seiner Kunden anzupassen. Bei der Vornahme hierzu erforderlicher Wartungsarbeiten hat der Kunde vorübergehende Einschränkungen in der Verfügbarkeit der Plattform hinzunehmen.</p>
<p><strong>4. LEISTUNGSERBRINGUNG, VERGÜTUNG UND FRISTEN</strong></p>
<p>4.1. Die Vergütung der Leistungserbringung durch shyftplan bemisst sich nach der Zahl der User auf dem Portal, für die auf Basis des Vertrags nach Ziffer 2. dieser AGB Dienstleistungen freigeschaltet werden. Hierbei werden Mitarbeiter und Manager stets separat betrachtet. Freischaltung bezeichnet einen technischen Vorgang, der es dem Kunden ermöglicht, mit einem oder mehreren Firmenkonten die vertraglich vereinbarten Dienstleistungen nach Ziffer 3. dieses Vertrags für alle seine User auf dem Portal in Anspruch zu nehmen. Die Freischaltung erfolgt automatisch und bedarf keiner weiteren Mitarbeit des Kunden. Dabei steht es dem Kunden frei, ob er die Leistungen in Anspruch nimmt und für welche User er in welchem Umfang von den freigeschalteten Möglichkeiten auf dem Portal Gebrauch macht. Im Gegenzug dazu wird die Vergütung shyftplans nicht dadurch gemindert, dass der Kunde nur einen Teil der Leistung oder keine Leistungen im Sinne von Ziffer 3. dieser AGB tatsächlich in Anspruch nimmt.</p>
<p>4.2. Das Vertragsverhältnis besteht grundsätzlich auf unbestimmte Zeit. Es kann eine Mindestvertragslaufzeit vorgesehen werden. Ist keine Mindestvertragslaufzeit vorgesehen, können beide Parteien das Vertragsverhältnis zum Ende eines Kalendermonats kündigen. Die Kündigung muss der jeweils anderen Partei spätestens eine Woche vor Ende des Kalendermonats in Textform zugegangen sein, mit dem das Vertragsverhältnis enden soll.</p>
<p>4.3. Ist eine Mindestlaufzeit im Vertrag vorgesehen, ist shyftplan verpflichtet, die vertraglich vereinbarten Dienstleistungen zu den vereinbarten Konditionen für die Dauer der Vertragslaufzeit freizuschalten. Ziffer 10.2 dieser AGB bleibt hiervon unberührt. Ein Vertragsverhältnis mit Mindestvertragslaufzeit kann von beiden Parteien erst zum Ende der Mindestvertragslaufzeit gekündigt werden. Die Kündigung muss der jeweils anderen Partei spätestens drei Monate vor Ende der Mindestvertragslaufzeit in Textform zugegangen sein, sofern nicht eine andere Frist Inhalt des Vertrags wurde. Andernfalls wird das Vertragsverhältnis zu denselben Konditionen fortgesetzt, wobei die vereinbarte Mindestvertragslaufzeit erneut beginnt (Ziffer 4.5. bleibt hiervon unberührt). Das Recht auf außerordentliche Kündigung aus wichtigem Grund bleibt stets für beide Parteien unberührt.</p>
<p>4.4. Im Vertrag kann vereinbart werden, dass eine bestimmte Vergütung unabhängig von der Anzahl an Mitarbeitern und Managern auf dem Portal mindestens zu zahlen ist („Basispreis"). Der monatlich zu entrichtende Basispreis enthält eine im Dienstleistungsvertrag definierte Anzahl an Mitarbeiter- und Manager-Lizenzen. Zusätzliche User werden gemäß der vertraglich vereinbarten Preise abgerechnet. Die Übertragung von nicht in Anspruch genommenen, jedoch berechneten Usern in einen anderen Rechnungsmonat ist nicht möglich.</p>
<p>4.5. Ist eine Mindestvertragslaufzeit vereinbart, gilt der monatlich zu entrichtende Basispreis für die gesamte Dauer der Mindestvertragslaufzeit. Im Falle einer automatischen Verlängerung der Mindestvertragslaufzeit gemäß Ziffer 4.3. dieser AGB wird der vertraglich vereinbarte Basispreis auch für die neue Mindestvertragslaufzeit beibehalten. Die Anzahl der in Rechnung gestellten Lizenzen für zusätzliche Mitarbeiter und Manager bleibt für die neue Mindestvertragslaufzeit ebenfalls bestehen. Abweichend davon kann der Kunde die Zahl der zusätzlichen User im Kalendermonat vor Ablauf der Kündigungsfrist durch schriftliche Bekanntgabe vor Ende der Kündigungsfrist per E-Mail an service@shyftplan.com reduzieren. Hierfür ist die Zahl der zusätzlichen User differenziert nach Mitarbeitern und Managern in der E-Mail für die neue Vertragslaufzeit festzulegen. Hierbei ist zu beachten, dass der Kunde selbst dafür Sorge zu tragen hat, dass bis zum Ende der vorigen Vertragslaufzeit auch die dem Firmenkonto zugeordneten User entsprechend auf die dann für die neue Mindestvertragslaufzeit maßgebliche Zahl  reduziert werden.</p>
<p>4.6. Nach Inkrafttreten einer Kündigung werden sämtliche gespeicherten Daten zu den betreffenden Firmenkonten gelöscht. Davon ausgeschlossen sind solche Daten, bei denen gesetzliche Vorschriften eine längere Aufbewahrung zwingend vorschreiben. Die Regelungen nach Ziffer 4. und 5. dieser AGB bleiben hiervon unberührt.</p>
<p><strong>5. ABRECHNUNG, FÄLLIGKEIT UND RECHNUNGSSTELLUNG</strong></p>
<p>5.1. Über die nach Ziffer 4. dieser AGB freigeschalteten, in Anspruch genommenen oder sonst abzurechnenden Dienstleistungen und das daraus resultierende Entgelt rechnet shyftplan unverzüglich nach Ende eines Kalendermonats ab. shyftplan erfasst dabei monatlich die gem. Ziffer 4. dieser AGB tatsächlich dem Kunden zugeordneten Mitarbeiter und Manager auf dem Portal und legt bei der Berechnung der Vergütung das vereinbarte Entgelt pro zugeordnetem User pro Firmenkonto zugrunde. Ein User gilt mit erstmaliger Zuordnung zu einem Firmenkonto in einem Kalendermonat für diesen Monat als zugeordnet. Ein Löschen des Users aus einem Firmenkonto wird erst zum Beginn des nächsten Kalendermonats berücksichtigt. Wird ein Mitarbeiter innerhalb eines Monats zu einem Manager umgestellt, gilt er für diesen Monat als Manager, ein Umstellen eines Managers auf einen Mitarbeiter wird zum Beginn des nächsten Kalendermonats berücksichtigt.</p>
<p>5.2. Der Rechnungsbetrag ist innerhalb von 14 Tagen nach Zugang der von shyftplan zu erstellenden Rechnung beim Kunden fällig und ohne Abzüge zu zahlen. Der Kunde kann shyftplan die Ermächtigung erteilen, fällige Beträge per Kreditkarte oder im Lastschriftverfahren von seinem Konto abzubuchen.</p>
<p>5.3. Einwendungen gegen die Rechnung kann der Kunde gegenüber shyftplan nur innerhalb einer Frist von zwei Wochen nach Zugang der Rechnung geltend machen. Für den Fall, dass die Leistungserbringung erst nach Zugang der Rechnung vollständig bewirkt wird, beginnt insoweit die Frist erst mit dem Ende der Leistungserbringung.</p>
<p>5.4. Abweichend von Ziffer 5.1. ist shyftplan berechtigt, schon zu Beginn der Vertragslaufzeit eine Vorauszahlung zu verlangen („Vorauszahlung"), sofern dies Inhalt des Vertrags geworden ist. Für die Berechnung der Vorauszahlung wird der vereinbarte Basispreis nebst bereits vereinbarten zusätzlichen Usern im Voraus für die gesamte Mindestvertragslaufzeit abgerechnet. Werden vom Kunden während der Mindestvertragslaufzeit über die im Basispreis inkludierten User und vereinbarten zusätzlichen User hinausgehend weitere Mitarbeiter und Manager dem Firmenkonto zugeordnet, ist für diese User ebenfalls eine Vorauszahlung in voller Höhe zu leisten. Die Höhe der Vorauszahlung ergibt sich aus der vertraglich vereinbarten Vergütung pro zusätzlichem User  für die gesamte verbleibende Vertragsdauer. shyftplan wird nach Ablauf des Monats, in dem zusätzliche User angefallen sind, die entsprechende Rechnung stellen (zur Klarstellung: Ziffer 5.1. Satz 3, 4 und 5 bleiben hiervon unberührt und finden weiterhin Anwendung). Reduziert sich während der Mindestvertragslaufzeit die tatsächliche Useranzahl des Kunden auf dem Portal, ist shyftplan nicht dazu verpflichtet, geleistete Vorauszahlungen oder Teile davon zu erstatten. Beginnt eine neue Mindestvertragslaufzeit, so wird der Vorauszahlung für die neue Mindestvertragslaufzeit der Basispreis und die zusätzlichen User nach Maßgabe von Ziffer 4.4. und Ziffer 4.5. zugrunde gelegt.</p>
<p>5.5. Das vertraglich vereinbarte Entgelt ist im Zweifelsfall exkl. Umsatzsteuer zu verstehen, sofern nicht anders angegeben.</p>
<p><strong>6. VERTRAGSÄNDERUNGEN</strong></p>
<p>6.1. Der Kunde willigt ein, dass sein Schweigen auf ein Vertragsänderungsangebot, unter Beachtung der nachgenannten Voraussetzungen, als Zustimmung gilt.</p>
<p>6.2. Vertragsänderungen kann shyftplan dem Kunden nur aus triftigem Grund anbieten. Widerspricht der Kunde den angebotenen Vertragsänderungen nicht innerhalb von sechs Wochen nach Erhalt, so gilt das Schweigen des Kunden ausnahmsweise als Zustimmung.</p>
<p>6.3. Triftige Gründe sind insbesondere offensichtliche redaktionelle Fehler in den AGB, Änderungen in der Gesetzgebung und/oder Rechtsprechung, neue technische Entwicklungen und Standards, Währungsumstellungen oder sonstige gleichwertige Gründe.</p>
<p>6.4. Gleiches gilt, wenn shyftplan einzelne Dienste ganz oder teilweise einstellt oder ändert.</p>
<p>6.5. shyftplan zeigt dem Kunden die angebotenen Änderungen in Textform (an seine angegebene E-Mailadresse) unter Nennung des Zeitpunkts des Wirksamwerdens an. shyftplan übermittelt dem Kunden die Änderungsanzeige mit angemessener Frist, d.h. wenigstens sechs Wochen vor Wirksamwerden der Änderungen. shyftplan belehrt den Kunden in seiner Änderungsanzeige über die Zustimmungswirkung seines Schweigens, den Grund der Änderung und die Folgen eines Widerspruchs.</p>
<p>6.6. Widerspricht der Kunde der angebotenen Änderung binnen der angemessenen Frist, wird der Vertrag mit den alten Geschäftsbedingungen fortgesetzt. In diesem Fall behält shyftplan sich ein Sonderkündigungsrecht vor.</p>
<p>6.7. Vorstehende Regelungen gelten analog für Änderungen des Auftragsverarbeitungsvertrages (vgl. Ziffer 8.2 dieser AGB).</p>
<p><strong>7. NUTZUNG VON SHYFTPLAN</strong></p>
<p>7.1. Der Kunde trägt die vollständige Verantwortung für die von ihm auf der Website eingegebenen Daten und sein Nutzungsverhalten.</p>
<p>7.2. Die Nutzung der Plattform ist im Rahmen des bestimmungsgemäßen Gebrauchs und des geltenden Rechts der Bundesrepublik Deutschland zulässig. Der Kunde hat sich danach jeglicher Rechtsverstöße oder jeglichen Missbrauchs zu enthalten, insbesondere untersagt sind die mißbräuchliche Nutzung mittels automatisierter Software (zum Beispiel Skripte) sowie das unbefugte Kopieren und die unbefugte Verwendung von auf der Website zugänglichen Informationen. Der Kunde kann über die shyftplan-API Daten abrufen, dies muss jedoch innerhalb eines angemessenen Umfangs erfolgen (maximal 50 Anfragen pro Minute pro Kunde, maximal 1.000 Anfragen pro Stunde pro Kunde). Bei Überschreitung dieses Umfangs behält sich shyftplan das Recht vor, die Anfragen nicht zu beantworten. Zulässige Nutzung: Die shyftplan-API ist für die Nutzung durch Entwickler vorgesehen, um Softwareanwendungen zu erstellen, die die Dienste von shyftplan verbessern oder ergänzen, sowie um neue Produkte und Dienste zu entwickeln, die nicht in direktem Wettbewerb mit shyftplan stehen. Kunden sind berechtigt, die shyftplan-API zu nutzen, um auf Daten, Inhalte und Funktionen, die über die API zur Verfügung gestellt werden, zuzugreifen und diese abzurufen. Hingegen sind die folgenden Nutzungen der shyftplan-API strengstens untersagt:<br/>a. Die Verwendung der API, um die Dienste von shyftplan zu replizieren oder mit ihnen zu konkurrieren, oder um ein Produkt zu entwickeln, das den Diensten im Wesentlichen ähnlich ist oder mit ihnen in direktem Wettbewerb steht.<br/>b. Die Nutzung der API in einer Weise, die die Dienste von shyftplan schädigt oder stört, oder die die Server, Netzwerke oder Systeme von shyftplan stört oder beschädigt.<br/>c. Die Nutzung der API zum Scrapen, Mining oder Sammeln von Daten oder Inhalten aus den Diensten von shyftplan in einer Weise, die über eine vernünftige und angemessene Nutzung hinausgeht, oder die gegen die Nutzungsbedingungen oder Datenschutzrichtlinien von shyftplan verstößt.<br/>d. Die Nutzung der API für ungesetzliche oder unethische Zwecke oder in einer Weise, die gegen geltende Gesetze, Vorschriften oder Branchenstandards verstößt.</p>
<p>7.3. Der Kunde hat seine Zugangsdaten zum Kundenkonto gegen die unbefugte Verwendung durch Dritte zu schützen. Er benachrichtigt shyftplan umgehend bei Anhaltspunkten für einen Missbrauch seines Kundenkontos.</p>
<p>7.4. shyftplan prüft die vom Kunden auf der Website eingegebenen Informationen inhaltlich nur, wenn diese Kenntnis oder einen auf Tatsachen begründeten Verdacht von konkreten rechtswidrigen Inhalten erlangt hat.</p>
<p>7.5. Informationen, mit denen der Kunde gegen geltendes Recht der Bundesrepublik Deutschland oder Rechte Dritter verstößt, darf shyftplan ohne vorherige Ankündigung bis zur Klärung des Sachverhalts sperren, dies gilt auch im begründeten Verdachtsfall. shyftplan behält sich darüber hinaus die zeitweise oder endgültige Sperrung des Kundens auf der Plattform vor. shyftplan wird den Kunden grundsätzlich vorher unter Fristsetzung abmahnen und zur Beseitigung des rechtswidrigen Zustandes auffordern.</p>
<p><strong>8. DATENSCHUTZ</strong></p>
<p>8.1. Der Kunde steht gegenüber shyftplan dafür ein, dass die durch ihn auf der Plattform mitgeteilten personenbezogenen Daten entsprechend der gesetzlichen Bestimmungen, insbesondere der Europäischen Datenschutzgrundverordnung (EU 2016/679) (DS-GVO) des Bundesdatenschutzgesetzes (BDSG) und des Telemediengesetzes (TMG), erhoben, verarbeitet und an shyftplan übermittelt wurden sowie zur Erfüllung der Vertragspflichten durch shyftplan in dem dafür erforderlichen Umfang an Dritte (insbesondere Steuerberater und Lohnbuchhalter) übermittelt werden dürfen, insbesondere dass etwaige Informationspflichten nach Art. 13, 14 DS-GVO durch den Kunden erfüllt wurden. Die übermittelten personenbezogenen Daten werden von shyftplan ausschließlich unter Beachtung der gesetzlichen Bestimmungen verarbeitet.</p>
<p>8.2. Sofern shyftplan bei der Erbringung der Dienste personenbezogene Daten im Auftrag des Kunden verarbeitet, verpflichten sich die Parteien zum Abschluss eines Auftragsverarbeitungsvertrags nach Art. 28 DS-GVO (siehe Vertrag im Firmenprofil). Der Auftragsverarbeitungsvertrag ist Gegenstand der Vertragsbeziehungen zwischen den Parteien.</p>
<p>8.3. Ergänzend gilt die shyftplan Datenschutzerklärung (https://shyftplan.com/privacy).</p>
<p><strong>9. HAFTUNG</strong></p>
<p>9.1. Ansprüche eines Kunden auf Schadensersatz sind ausgeschlossen. Hiervon ausgenommen sind Schadensersatzansprüche des Kundens aus der Verletzung des Lebens, des Körpers, der Gesundheit oder aus der Verletzung wesentlicher Vertragspflichten (Kardinalpflichten) sowie die Haftung für sonstige Schäden, die auf einer vorsätzlichen oder grob fahrlässigen Pflichtverletzung shyftplans, ihrer gesetzlichen Vertreter oder Erfüllungsgehilfen beruhen. Wesentliche Vertragspflichten sind solche, deren Erfüllung zur Erreichung des Ziels des Vertrags notwendig ist.</p>
<p>9.2. Bei der Verletzung wesentlicher Vertragspflichten haftet shyftplan nur für den vertragstypischen, vorhersehbaren Schaden, wenn dieser einfach fahrlässig verursacht wurde, es sei denn, es handelt sich um Schadensersatzansprüche des Kunden aus einer Verletzung des Lebens, des Körpers oder der Gesundheit.</p>
<p>9.3. Die Einschränkungen der Ziffern 9.1. und 9.2. gelten auch zugunsten der gesetzlichen Vertreter und Erfüllungsgehilfen shyftplans, wenn Ansprüche direkt gegen diese geltend gemacht werden.</p>
<p>9.4. Der Kunde stellt shyftplan von sämtlichen Ansprüchen Dritter frei, welche auf Verstöße des Kundens gegen Rechte Dritter oder gesetzliche Vorschriften zurückgehen, einschließlich angemessener Rechtsverteidigung. Dies gilt nur insoweit, wie shyftplan kein eigenes Verschulden trifft.</p>
<p><strong>10. AUFRECHNUNG UND ZURÜCKBEHALTUNGSRECHT</strong></p>
<p>10.1. Ein Aufrechnungsrecht besteht für den Kunden nur, wenn seine Gegenansprüche rechtskräftig festgestellt oder unbestritten sind.</p>
<p>10.2. shyftplan ist berechtigt, den Kunden von der Nutzung sämtlicher auf der Plattform angebotenen Dienste vorübergehend auszuschließen, solange dieser sich mit der Entgeltzahlung in Verzug befindet (Zurückbehaltungsrecht). Umgekehrt ist der Kunde zur Ausübung eines Zurückbehaltungsrechts nur insoweit befugt, als sein Gegenanspruch auf dem gleichen Vertragsverhältnis beruht.</p>
<p><strong>11. SCHLUSSBESTIMMUNGEN</strong></p>
<p>11.1. Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss der Bestimmungen des UN-Kaufrechts und des internationalen Privatrechts.</p>
<p>11.2. Ist der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich- rechtliches Sondervermögen, ist ausschließlicher Gerichtsstand der Sitz von shyftplan (derzeit Berlin).</p>
<p>11.3. Sollten einzelne Bestimmungen dieses Vertrags ganz oder teilweise unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. Die Parteien verpflichten sich im Falle einer unwirksamen Bestimmung, über eine wirksame und zumutbare Ersatzregelung zu verhandeln, die dem von den Vertragsparteien mit der unwirksamen Bestimmung verfolgten wirtschaftlichen Zweck möglichst nahekommt.</p>
<p>11.4. Soweit in diesen AGB lediglich die männliche Bezeichnung einer Person gewählt wurde, dient dies allein der Lesbarkeit.</p>`;

      const content_en = `<p><strong>GENERAL TERMS AND CONDITIONS FOR THE USE OF SHYFTPLAN</strong></p>
<p><strong>1. SCOPE AND DEFINITIONS</strong></p>
<p>1.1. These General Terms and Conditions (hereinafter referred to as "GTC") of shyftplan GmbH, Ritterstraße 26, 10969 Berlin, e-mail: service@shyftplan.com, (hereinafter referred to as "shyftplan") constitute the exclusive basis for the use of the services offered on the internet platform under the domain https://shyftplan.com (hereinafter referred to as "platform, portal or website"), unless explicitly stated otherwise.</p>
<p>1.2. Within the scope of the service contract the customer accepts these general terms and conditions as solely authoritative for the legal relationship with shyftplan. Deviating or conflicting general terms and conditions of the customer are not recognized by shyftplan, unless shyftplan has explicitly agreed to them in writing.</p>
<p>1.3. In the context of these GTC, User means a user account that is stored on the platform. It is possible that a user corresponds to a natural person, but this is not mandatory. A user can also be stored in the portal as a dummy account (without its own login).</p>
<p>1.4. In the context of these GTC, Employee means a User who has been assigned the rights (e.g. by an administrator in the User profile) of the Employee. Among other things, this enables the user's attendances and absences to be scheduled in the platform.</p>
<p>1.5. In the context of these GTC, Manager refers to a user who has been assigned the corresponding rights (e.g. by an administrator in the user profile) of the manager. Any assignment of manager rights, including the scheduling of employees and viewing rights to shift schedules, define a user as a manager. A manager can be an employee and a manager at the same time.</p>
<p><strong>2. CONCLUSION OF CONTRACT</strong></p>
<p>2.1. A contractual relationship with main service obligations is established by offer and acceptance in the form of a written service contract (esp. e-mail and in writing; clause 2.2.), which refers to these GTC.</p>
<p>2.2. Within the scope of the conclusion of the contract in text form, the content and scope of the contract shall be based on the services agreed in the text, which shall be specified by these GTC. In addition, agreements deviating from the GTC may be made in the service contract. In cases of doubt, the provision of the service contract shall take precedence.</p>
<p>2.3. Services in the sense of number 3. of these GTC are offered by shyftplan exclusively for entrepreneurs in the sense of § 14 BGB. The customer confirms with the conclusion of the contract that he acts in exercise of his commercial or independent professional activity and uses the shyftplan services for this purpose. If the customer acts as a representative of another person, he assures that the represented person is acting in the exercise of his commercial or independent professional activity and uses the shyftplan services for this purpose.</p>
<p><strong>3. SCOPE OF SERVICES</strong></p>
<p>3.1. The shyftplan services facilitate the work organization of companies as well as the communication between companies and their employees. The shyftplan offer currently includes the following paid services:</p>
<p>• Shift planning for companies and their employees or freelancers (hereinafter referred to as "shift planning", section 3.2.1.)<br/>• Evaluation of working times (hereinafter referred to as "Evaluation", section 3.2.2.)<br/>• Time stamp clock for recording the attendance hours (hereinafter "time stamp clock", clause 3.2.3.)<br/>• Time account for recording varying working times (hereinafter "working time account", section 3.2.4.)<br/>• Export of the relevant wage data (hereinafter "wage export", section 3.2.5.)</p>
<p>3.2. The respective scope of services is described in more detail below.</p>
<p>3.2.1. Shift Planning: The services of shyftplan within the service of shift planning include the provision of a platform that enables the customer to perform the following functions via the input of data:<br/>• Creation of shifts including start, end and break times,<br/>• manual time recording of shifts per employee,<br/>• assignment of employees to the created shifts,<br/>• application of employees to the designated shifts,<br/>• providing of print views of the shift schedule,<br/>• planning of vacation times and times of other absences (e.g. sickness, maternity leave, parental leave) including the possibility to enter and process vacation requests,<br/>• "Dashboard" for internal open communication between employees and the company.</p>
<p>3.2.2. Evaluation: The shift data available via shyftplan can be evaluated directly with the function Evaluation on the platform. The service of shyftplan within the service Evaluation includes the electronic provision of various data available on the portal, which refer to an employee and a calendar month. The evaluation shows, among other things, the start and end of working hours as well as break times. This is based on the data stored on the portal with regard to a company and its employees, in particular the shift schedules from which the employee's working hours are derived. If, in addition, the time stamp clock function has been contractually agreed, the actual working hours resulting from this can also be recorded. It is the sole responsibility of the customer to check the existing data for correctness and completeness of content before further use. The data is additionally provided in a file format (e.g. *.csv) to enable export from the portal.</p>
<p>3.2.3. Time stamp clock: A digital time stamp clock can be started from a manager account on the platform after activating this function. In this time stamp clock, every employee who has been activated for this function can log in with his ID. The times of clocking in and clocking out are then transferred to the recording of the shift in order to record the actual working time worked as precisely as possible. The scope of services within the Time stamp clock per employee service is the recording of an employee's working hours in a calendar month through this function.</p>
<p>3.2.4. Working time account: The Working Time Account service enables the Customer to electronically record the hours worked for its employees and to reconcile them with the contractually agreed working hours. The scope of services of a working time account for an employee includes the provision of an electronic overview on the portal, which shows the difference between the contractually agreed working time to be stored by the customer (incl. vacation, sickness and overtime regulations) and the working time actually worked. The recording of the working hours actually worked is automated via shift planning (section 3.2.1.) or, if activated, via the time stamp clock (section 3.2.3.). The hours worked can be corrected manually.</p>
<p>3.2.5. Wage export: The function "Wage export" allows the export of payroll relevant data of one or more employees in CSV- format. The file itself must be adapted to the respective format requirements of the various payroll programs. Within the scope of the wage export, the scope of services of the function includes per employee:<br/>• Master data of the employee<br/>• Changes in the employee's master data compared to the previous payroll month<br/>• Employee's gross wages - payroll type 1 (forecast): In payroll type 1, wages are paid to employees based on the forecast values for the current month. The correction values are automatically carried over to the next month.<br/>• Employee's gross wages - payroll type 2 (direct): In payroll type 2, wages are paid to employees based on actual gross wages incurred at the beginning of the following month.<br/>• Absences<br/>• Partial payments</p>
<p>3.3. shyftplan does not give any guarantee or other warranty with regard to the uninterrupted availability, accessibility and functionality of the platform, especially if the cause lies outside the sphere of control of shyftplan. However, shyftplan commits itself to keep its technical facilities serving for the operation of the platform functional within the scope of customary technical standards and to adapt them to the state of the art and the usage behavior of its customers to a reasonable economically justifiable extent. The customer has to accept temporary restrictions in the availability of the platform when carrying out necessary maintenance work.</p>
<p><strong>4. PERFORMANCE, REMUNERATION AND DEADLINES</strong></p>
<p>4.1. The remuneration of the service provision by shyftplan is calculated according to the number of users on the portal for whom services are activated on the basis of the contract according to section 2. of these GTC. Employees and managers are always considered separately. Activation refers to a technical process that enables the Customer to use the contractually agreed services pursuant to section 3 of this Agreement for all of its Users on the Portal with one or more company accounts. The activation takes place automatically and does not require any further cooperation of the Customer. The customer is free to decide whether to use the services and for which users he makes use of the activated options on the portal and to what extent. In return, shyftplan's remuneration is not reduced by the fact that the client only makes use of a part of the services or does not make use of any services in the sense of section 3. of these GTC.</p>
<p>4.2. The contractual relationship shall generally be for an indefinite period. A minimum contract term may be provided for. If no minimum contract term is stipulated, both parties may terminate the contractual relationship at the end of a calendar month. The notice of termination must be received by the other party in text form no later than one week before the end of the calendar month with which the contractual relationship is to end.</p>
<p>4.3. If a minimum term is provided for in the contract, shyftplan is obliged to activate the contractually agreed services at the agreed conditions for the duration of the contract term. Section 10.2 of these GTC remains unaffected. A contractual relationship with a minimum contract period can only be terminated by both parties at the end of the minimum contract period. The notice of termination must be received by the other party in text form no later than three months prior to the end of the minimum contract term, unless a different notice period is included in the contract. Otherwise, the contractual relationship shall be continued on the same terms and conditions, with the agreed minimum contract term starting anew (Section 4.5. shall remain unaffected). The right to extraordinary termination for good cause shall always remain unaffected for both parties.</p>
<p>4.4. It may be agreed in the Contract that a certain minimum remuneration is to be paid regardless of the number of Employees and Managers on the Portal ("Base Price"). The base price to be paid monthly includes a number of employee and manager licenses defined in the service agreement. Additional users will be charged according to the contractually agreed prices. The transfer of unused but charged users to another billing month is not possible.</p>
<p>4.5. If a minimum contract term has been agreed, the monthly base price to be paid shall apply for the entire duration of the minimum contract term. In the event of an automatic extension of the minimum contract term pursuant to section 4.3. of these GTC, the contractually agreed base price shall also be maintained for the new minimum contract term. The number of invoiced licenses for additional employees and managers shall also remain in effect for the new minimum contract term. Notwithstanding the above, the customer may reduce the number of additional users in the calendar month prior to the end of the notice period by notifying service@shyftplan.com in writing before the end of the notice period. For this purpose, the number of additional users differentiated by employees and managers must be specified in the e-mail for the new contract term. It should be noted that the customer must ensure that by the end of the previous contract term the users assigned to the company account are also reduced accordingly to the number then applicable for the new minimum contract term.</p>
<p>4.6. After a termination has come into effect, all stored data relating to the company accounts concerned will be deleted. Excluded from this is such data for which legal regulations mandate a longer retention period. The provisions of sections 4. and 5. of these GTC shall remain unaffected.</p>
<p><strong>5. BILLING, DUE DATE AND INVOICING</strong></p>
<p>5.1. shyftplan invoices the services activated, used or otherwise invoiced according to clause 4. of these GTC and the resulting fee immediately after the end of a calendar month. shyftplan records the employees and managers actually assigned to the customer on the portal according to clause 4. of these GTC on a monthly basis and bases the calculation of the fee on the agreed fee per assigned user per company account. A User shall be deemed to have been assigned to a company account for the first time in a calendar month. If a user is deleted from a company account, this will not be taken into account until the beginning of the next calendar month. If an employee is converted to a manager within a month, he is considered a manager for this month; a conversion of a manager to an employee is taken into account at the beginning of the next calendar month.</p>
<p>5.2. The invoice amount is due and payable without deductions within 14 days after receipt of the invoice to be issued by shyftplan by the customer. The client may authorize shyftplan to debit amounts due from his account by credit card or by direct debit.</p>
<p>5.3. Objections against the invoice can only be asserted by the customer against shyftplan within a period of two weeks after receipt of the invoice. In the event that the service provision is not fully effected until after receipt of the invoice, the time limit in this respect does not begin until the end of the service provision.</p>
<p>5.4. Deviating from clause 5.1. shyftplan is entitled to demand an advance payment already at the beginning of the contract period ("advance payment"), if this has become part of the contract. For the calculation of the advance payment the agreed base price plus already agreed additional users will be charged in advance for the whole minimum contract period. If, during the minimum contract term, the customer assigns additional employees and managers to the company account over and above the users included in the base price and the agreed additional users, an advance payment must also be made in full for these users. The amount of the advance payment results from the contractually agreed remuneration per additional User for the entire remaining term of the contract. shyftplan will issue the corresponding invoice after the end of the month in which additional Users have accrued (for clarification: clause 5.1. sentence 3, 4 and 5 remain unaffected and continue to apply). If the actual number of users of the customer on the portal is reduced during the minimum contract period, shyftplan is not obliged to refund advance payments or parts thereof. If a new minimum contract period starts, the advance payment for the new minimum contract period is based on the base price and the additional users according to clause 4.4. and clause 4.5.</p>
<p>5.5. In case of doubt, the contractually agreed remuneration is to be understood excluding value added tax, unless otherwise stated.</p>
<p><strong>6. CONTRACT AMENDMENTS</strong></p>
<p>6.1. The customer agrees that its silence in response to an offer to amend the contract, subject to the conditions set out below, shall be deemed to constitute consent.</p>
<p>6.2. Changes of the contract can only be offered by shyftplan to the customer for a valid reason. If the Customer does not object to the offered contract amendments within six weeks after receipt, the Customer's silence shall exceptionally be deemed as consent.</p>
<p>6.3. Valid reasons are in particular obvious editorial errors in the GTC, changes in legislation and/or jurisdiction, new technical developments and standards, currency conversions or other equivalent reasons.</p>
<p>6.4. The same applies if shyftplan discontinues or changes individual services in whole or in part.</p>
<p>6.5. shyftplan shall notify the customer of the offered changes in text form (to the customer's specified e-mail address), stating the effective date. shyftplan shall send the notice of change to the customer within a reasonable period of time, i.e. at least six weeks before the changes become effective. shyftplan shall inform the customer in the notice of change about the approval effect of his silence, the reason for the change and the consequences of an objection.</p>
<p>6.6. If the customer objects to the offered change within the reasonable period of time, the contract will be continued with the old terms and conditions. In this case shyftplan reserves a special right of termination.</p>
<p>6.7. The above provisions shall apply analogously to amendments to the order processing agreement (cf. section 8.2 of these GTC).</p>
<p><strong>7. USE OF SHYFTPLAN</strong></p>
<p>7.1. The customer bears full responsibility for the data he enters on the website and his usage behavior.</p>
<p>7.2. The use of the platform is permitted within the scope of the intended use and the applicable law of the Federal Republic of Germany. Thereafter, the Customer shall refrain from any violation of law or any misuse, in particular the misuse by means of automated software (for example scripts) as well as the unauthorized copying and the unauthorized use of information accessible on the Website are prohibited. The customer may retrieve data via the shyftplan API, but this must be done within a reasonable scope (maximum 50 requests per minute per customer, maximum 1,000 requests per hour per customer). If this scope is exceeded, shyftplan reserves the right not to answer the requests. Permitted Use: The shyftplan API is intended for use by developers to create software applications that enhance or complement shyftplan's services, and to develop new products and services that are not in direct competition with shyftplan. Customers are authorized to use the shyftplan API to access and retrieve data, content and functionality made available through the API. In contrast, the following uses of the shyftplan API are strictly prohibited:<br/>a. Using the API to replicate or compete with shyftplan's Services, or to develop a product that is substantially similar to or in direct competition with the Services.<br/>b. Using the API in a manner that harms or disrupts shyftplan's services, or disrupts or damages shyftplan's servers, networks or systems.<br/>c. Using the API to scrape, mine, or collect data or content from shyftplan's Services in a manner that exceeds reasonable and appropriate use, or in violation of shyftplan's Terms of Service or Privacy Policy.<br/>d. Using the API for any unlawful or unethical purpose or in a manner that violates any applicable law, regulation or industry standard.</p>
<p>7.3. The customer has to protect his access data to the customer account against unauthorized use by third parties. He notifies shyftplan immediately in case of indications for a misuse of his customer account.</p>
<p>7.4. shyftplan only checks the content of the information entered by the customer on the website if it has gained knowledge or a suspicion based on facts of concrete illegal content.</p>
<p>7.5. Information with which the customer violates the applicable law of the Federal Republic of Germany or the rights of third parties may be blocked by shyftplan without prior notice until the facts are clarified; this also applies in case of justified suspicion. shyftplan furthermore reserves the right to temporarily or permanently block the customer on the platform. shyftplan will always give the customer a warning beforehand, setting a deadline, and request the elimination of the illegal condition.</p>
<p><strong>8. DATA PROTECTION</strong></p>
<p>8.1. The Customer warrants to shyftplan that the personal data communicated by him on the platform have been collected, processed and transmitted to shyftplan in accordance with the legal provisions, in particular the European Data Protection Regulation (EU 2016/679) (GDPR) of the Federal Data Protection Act (BDSG) and the Telemedia Act (TMG), and may be transmitted by shyftplan to third parties (in particular tax consultants and payroll accountants) to the extent necessary for the fulfillment of the contractual obligations, in particular that any information obligations according to Art. 13, 14 GDPR have been fulfilled by the Customer. The transmitted personal data will be processed by shyftplan exclusively in compliance with the legal provisions.</p>
<p>8.2. If shyftplan processes personal data on behalf of the Customer when providing the Services, the Parties undertake to enter into a commissioned processing contract pursuant to Art. 28 GDPR (see contract in the company profile). The order processing contract is the subject of the contractual relationship between the parties.</p>
<p>8.3. In addition, the shyftplan privacy policy (https://shyftplan.com/privacy) applies.</p>
<p><strong>9. LIABILITY</strong></p>
<p>9.1. Claims of a customer for damages are excluded. Excluded from this are claims for damages of the customer from the injury of life, body, health or from the violation of essential contractual obligations (cardinal obligations) as well as the liability for other damages, which are based on an intentional or grossly negligent breach of duty of shyftplans, its legal representatives or vicarious agents. Essential contractual obligations are those whose fulfillment is necessary to achieve the goal of the contract.</p>
<p>9.2. In case of violation of essential contractual obligations shyftplan is only liable for the contract-typical, foreseeable damage, if this damage was caused by simple negligence, unless it concerns claims for damages of the customer due to injury of life, body or health.</p>
<p>9.3. The restrictions of clauses 9.1. and 9.2. shall also apply in favor of shyftplan's legal representatives and vicarious agents if claims are asserted directly against them.</p>
<p>9.4. The customer indemnifies shyftplan from all claims of third parties, which are based on violations of the customer against rights of third parties or legal regulations, including reasonable legal defense. This only applies insofar as shyftplan is not at fault.</p>
<p><strong>10. OFFSETTING AND RIGHT OF RETENTION</strong></p>
<p>10.1. The customer shall only have a right of set-off if its counterclaims have been legally established or are undisputed.</p>
<p>10.2. shyftplan is entitled to temporarily exclude the customer from the use of all services offered on the platform as long as the customer is in default of payment (right of retention). Conversely, the customer is only authorized to exercise a right of retention insofar as his counterclaim is based on the same contractual relationship.</p>
<p><strong>11. FINAL PROVISIONS</strong></p>
<p>11.1. The law of the Federal Republic of Germany shall apply to the exclusion of the provisions of the UN Convention on Contracts for the International Sale of Goods and international private law.</p>
<p>11.2. If the customer is a merchant, a legal entity under public law or a special fund under public law, the exclusive place of jurisdiction is the registered office of shyftplan (currently Berlin).</p>
<p>11.3. Should individual provisions of this contract be or become invalid in whole or in part, the validity of the remaining provisions shall remain unaffected. In the event of an invalid provision, the parties undertake to negotiate an effective and reasonable replacement provision which comes as close as possible to the economic purpose pursued by the contracting parties with the invalid provision.</p>
<p>11.4. Insofar as only the masculine designation of a person has been chosen in these GTC, this is solely for the sake of readability.</p>`;

      // Delete previously created partial AGB modules if present
      await supabase.from('contract_modules').delete().in('key', [
        'agb_scope_definitions',
        'agb_contract_conclusion',
        'agb_services_scope_1'
      ]);

      // Upsert the single AGB module
      const existing = contractModules.find(m => m.key === key);
      if (existing) {
        const { error } = await supabase
          .from('contract_modules')
          .update({
            title_de,
            title_en,
            content_de: content_de.trim(),
            content_en: content_en.trim(),
            category,
            is_active: true
          })
          .eq('key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contract_modules')
          .insert([{
            key,
            title_de,
            title_en,
            content_de: content_de.trim(),
            content_en: content_en.trim(),
            category,
            variables: JSON.stringify([]),
            sort_order: 0,
            is_active: true
          }]);
        if (error) throw error;
      }

      await fetchData();
      toast({
        title: 'Erfolg',
        description: 'AGB wurden als ein einzelnes Modul importiert.'
      });
    } catch (error) {
      console.error('Error importing AGB module:', error);
      toast({
        title: 'Fehler',
        description: 'AGB-Modul konnte nicht importiert werden.',
        variant: 'destructive'
      });
    }
  };

  return {
    // Data
    contractTypes,
    contractModules,
    globalVariables,
    contractCompositions,
    contractTemplates,
    loading,
    
    // Actions
    fetchData,
    
    // Contract Types
    createContractType,
    updateContractType,
    deleteContractType,
    
    // Contract Modules
    createContractModule,
    updateContractModule,
    cloneContractModule,
    deleteContractModule,
    
    // Global Variables
    createGlobalVariable,
    updateGlobalVariable,
    deleteGlobalVariable
  };
}