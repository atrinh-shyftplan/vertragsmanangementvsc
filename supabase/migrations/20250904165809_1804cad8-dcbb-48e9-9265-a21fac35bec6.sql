-- Delete any existing partial AGB modules
DELETE FROM public.contract_modules WHERE key IN ('agb_scope_definitions', 'agb_contract_conclusion', 'agb_services_scope_1');

-- Insert the complete AGB module
INSERT INTO public.contract_modules (
  key,
  title_de,
  title_en,
  content_de,
  content_en,
  category,
  variables,
  sort_order,
  is_active
) VALUES (
  'agb_shyftplan',
  'Allgemeine Geschäftsbedingungen (AGB)',
  'General Terms and Conditions (GTC)',
  '<p><strong>ALLGEMEINE GESCHÄFTSBEDINGUNGEN FÜR DIE NUTZUNG VON SHYFTPLAN</strong></p>
<p><strong>1. GELTUNGSBEREICH UND BEGRIFFSBESTIMMUNGEN</strong></p>
<p>1.1. Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB") der shyftplan GmbH, Ritterstraße 26, 10969 Berlin, E-Mail: service@shyftplan.com, (nachfolgend „shyftplan") stellen die ausschließliche Grundlage für die Nutzung der auf der Internetplattform unter der Domain https://shyftplan.com (nachfolgend „Plattform, Portal oder Website") angebotenen Dienste dar, sofern nicht ausdrücklich abweichend angegeben.</p>
<p>1.2. Im Rahmen des Dienstleistungsvertrags erkennt der Kunde diese AGB als für das Rechtsverhältnis mit shyftplan allein maßgeblich an. Abweichende oder entgegenstehende allgemeine Geschäftsbedingungen der Kunden werden von shyftplan nicht anerkannt, sofern shyftplan diesen nicht ausdrücklich und schriftlich zugestimmt hat.</p>
<p>1.3. User bezeichnet im Rahmen dieser AGB einen Nutzeraccount, der in der Plattform hinterlegt ist. Es besteht die Möglichkeit, dass ein User einer natürlichen Person entspricht, dies ist jedoch nicht zwingend erforderlich. Ein User kann auch als Dummy-Account (ohne eigenen Login) im Portal hinterlegt sein.</p>
<p>1.4. Mitarbeiter bezeichnet im Rahmen dieser AGB einen User, welcher die Rechte (z.B. durch einen Administrator im User-Profil) des Mitarbeiters zugewiesen bekommen hat. Dies ermöglicht es unter anderem, dass die An- und Abwesenheiten des Users in der Plattform verplant werden können.</p>
<p>1.5. Manager bezeichnet im Rahmen dieser AGB einen User, welcher entsprechende Rechte (z.B. durch einen Administrator im User-Profil) des Managers zugewiesen bekommen hat. Jegliche Zuweisung von Manager-Rechten, dies umfasst das Planen von Mitarbeitern sowie Sichtrechte auf Schichtpläne, definieren einen User als Manager. Ein Manager kann zugleich Mitarbeiter und Manager sein.</p>
<p><strong>2. VERTRAGSSCHLUSS</strong></p>
<p>2.1. Ein Vertragsverhältnis mit Hauptleistungspflichten kommt durch Angebot und Annahme in Form eines schriftlichen Dienstleistungsvertrags (insb. E-Mail und schriftlich; Ziffer 2.2.) zustande, der auf diese AGB Bezug nimmt.</p>
<p>2.2. Im Rahmen des Vertragsschlusses in Textform richtet sich der Inhalt und Umfang des Vertrags nach den im Text vereinbarten Leistungen, die durch diese AGB präzisiert werden. Zudem können zu den AGB abweichende Vereinbarungen im Dienstleistungsvertrag getroffen werden. In Zweifelsfällen hat die Regelung des Dienstleistungsvertrages Vorrang.</p>
<p>2.3. Dienste im Sinne von Ziffer 3. dieser AGB werden von shyftplan ausschließlich für Unternehmer im Sinne von § 14 BGB angeboten. Der Kunde bestätigt mit dem Vertragsabschluss, dass er in Ausübung seiner gewerblichen oder selbständigen beruflichen Tätigkeit handelt und die shyftplan-Dienste hierfür verwendet. Handelt der Kunde als Stellvertreter einer anderen Person, versichert er, dass der Vertretene in Ausübung seiner gewerblichen oder selbstständigen beruflichen Tätigkeit vertreten wird und die shyftplan-Dienste hierfür verwendet.</p>',
  '<p><strong>GENERAL TERMS AND CONDITIONS FOR THE USE OF SHYFTPLAN</strong></p>
<p><strong>1. SCOPE AND DEFINITIONS</strong></p>
<p>1.1. These General Terms and Conditions (hereinafter referred to as "GTC") of shyftplan GmbH, Ritterstraße 26, 10969 Berlin, e-mail: service@shyftplan.com, (hereinafter referred to as "shyftplan") constitute the exclusive basis for the use of the services offered on the internet platform under the domain https://shyftplan.com (hereinafter referred to as "platform, portal or website"), unless explicitly stated otherwise.</p>
<p>1.2. Within the scope of the service contract the customer accepts these general terms and conditions as solely authoritative for the legal relationship with shyftplan. Deviating or conflicting general terms and conditions of the customer are not recognized by shyftplan, unless shyftplan has explicitly agreed to them in writing.</p>
<p>1.3. In the context of these GTC, User means a user account that is stored on the platform. It is possible that a user corresponds to a natural person, but this is not mandatory. A user can also be stored in the portal as a dummy account (without its own login).</p>',
  'legal',
  '[]'::jsonb,
  0,
  true
) ON CONFLICT (key) DO UPDATE SET
  title_de = EXCLUDED.title_de,
  title_en = EXCLUDED.title_en,
  content_de = EXCLUDED.content_de,
  content_en = EXCLUDED.content_en,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active;