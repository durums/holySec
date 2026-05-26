// ─── HARDCODED EXAMPLE DATA ─────────────────────────────────────────────────

export const CLIENTS = [
  {
    id: 'c001',
    name: 'Sparkasse Rheinland',
    industry: 'Banking & Finance',
    status: 'Active',
    scopeType: 'Full Red Team',
    criticality: 'CRITICAL',
    nextTest: '2026-06-04',
    contact: { name: 'Dr. Markus Fenner', email: 'm.fenner@sparkasse-rl.de', phone: '+49 221 8801-0' },
    contract: { start: '2025-01-15', end: '2026-12-31', hours: 240, used: 167 },
    scope: {
      ipRanges: ['10.12.0.0/16', '10.13.4.0/24', '185.12.44.0/27'],
      domains: ['sparkasse-rheinland.de', 'online.sparkasse-rl.de', 'api.sparkasse-rl.de'],
      exclusions: ['SWIFT-Gateway 10.12.99.1', 'Core Banking 10.12.88.0/24 (read-only)'],
    },
    findings: ['f001', 'f002', 'f003', 'f004', 'f005'],
    engagements: ['e001', 'e002', 'e005'],
    reports: ['r001', 'r002'],
    openFindings: 3,
    lat: 50.9333, lng: 6.9500, city: 'Köln',
  },
  {
    id: 'c002',
    name: 'Uniklinik Bonn',
    industry: 'Healthcare',
    status: 'Active',
    scopeType: 'Network',
    criticality: 'HIGH',
    nextTest: '2026-07-14',
    contact: { name: 'Sandra Kruse', email: 's.kruse@uniklinik-bonn.de', phone: '+49 228 287-0' },
    contract: { start: '2025-03-01', end: '2026-08-31', hours: 120, used: 58 },
    scope: {
      ipRanges: ['172.16.10.0/24', '172.16.20.0/24', '192.168.100.0/22'],
      domains: ['uniklinik-bonn.de', 'patientenportal.ukb.de'],
      exclusions: ['MRT-Systeme 172.16.10.50-60', 'OP-Systeme 172.16.20.10-20'],
    },
    findings: ['f006', 'f007', 'f008'],
    engagements: ['e003'],
    reports: ['r003'],
    openFindings: 2,
    lat: 50.7374, lng: 7.0982, city: 'Bonn',
  },
  {
    id: 'c003',
    name: 'ShopNow GmbH',
    industry: 'E-Commerce',
    status: 'Pending',
    scopeType: 'Web',
    criticality: 'MEDIUM',
    nextTest: '2026-06-20',
    contact: { name: 'Tim Waldecker', email: 't.waldecker@shopnow.de', phone: '+49 30 55991234' },
    contract: { start: '2026-05-01', end: '2026-10-31', hours: 80, used: 0 },
    scope: {
      ipRanges: ['93.184.216.0/24'],
      domains: ['shopnow.de', 'checkout.shopnow.de', 'api.shopnow.de', 'admin.shopnow.de'],
      exclusions: ['Payment-Provider Stripe (extern)', 'CDN-Infra Cloudflare'],
    },
    findings: ['f009', 'f010'],
    engagements: ['e004'],
    reports: [],
    openFindings: 2,
    lat: 52.5200, lng: 13.4050, city: 'Berlin',
  },
  {
    id: 'c004',
    name: 'Bundesamt für Statistik',
    industry: 'Government',
    status: 'Completed',
    scopeType: 'Web',
    criticality: 'HIGH',
    nextTest: '2026-11-01',
    contact: { name: 'Rolf Baumgärtner', email: 'r.baumgaertner@destatis.de', phone: '+49 611 75-0' },
    contract: { start: '2025-09-01', end: '2026-03-31', hours: 160, used: 160 },
    scope: {
      ipRanges: ['194.95.45.0/24', '194.95.46.0/24'],
      domains: ['destatis-test.de', 'portal.destatis-test.de', 'api.destatis-test.de'],
      exclusions: ['Produktivsystem destatis.de (außer Scope)', 'BSI-Schnittstellen'],
    },
    findings: ['f011', 'f012', 'f013'],
    engagements: ['e006', 'e007'],
    reports: ['r004', 'r005'],
    openFindings: 1,
    lat: 50.0782, lng: 8.2397, city: 'Wiesbaden',
  },
  {
    id: 'c005',
    name: 'CloudStack SaaS AG',
    industry: 'SaaS / Cloud',
    status: 'Active',
    scopeType: 'Full Red Team',
    criticality: 'CRITICAL',
    nextTest: '2026-06-01',
    contact: { name: 'Priya Sharma', email: 'p.sharma@cloudstack.io', phone: '+49 89 44119900' },
    contract: { start: '2025-06-01', end: '2027-05-31', hours: 320, used: 201 },
    scope: {
      ipRanges: ['10.0.0.0/8', '172.31.0.0/16', 'AWS: eu-central-1'],
      domains: ['cloudstack.io', '*.cloudstack.io', 'api.cloudstack.io', 'app.cloudstack.io'],
      exclusions: ['Kundendaten-Buckets S3 (read-only-access erlaubt)', 'Billing-System extern'],
    },
    findings: ['f014', 'f015', 'f016', 'f017'],
    engagements: ['e008', 'e009'],
    reports: ['r006'],
    openFindings: 4,
    lat: 48.1351, lng: 11.5820, city: 'München',
  },
  {
    id: 'c006',
    name: 'Rheinmetall Automotive',
    industry: 'Industrial / OT',
    status: 'On Hold',
    scopeType: 'Network',
    criticality: 'HIGH',
    nextTest: '2026-09-15',
    contact: { name: 'Karl-Heinz Bröcker', email: 'kh.broecker@rheinmetall-auto.de', phone: '+49 211 9978-0' },
    contract: { start: '2026-02-01', end: '2026-12-31', hours: 200, used: 34 },
    scope: {
      ipRanges: ['10.100.0.0/16', '10.101.0.0/16', '10.200.0.0/20'],
      domains: ['rm-automotive-it.de', 'supplier.rm-automotive.de'],
      exclusions: ['OT/SCADA 10.100.50.0/24 (nur passiv!)', 'Produktionslinien PLC-Systeme'],
    },
    findings: ['f018', 'f019'],
    engagements: ['e010'],
    reports: [],
    openFindings: 2,
    lat: 51.2217, lng: 6.7762, city: 'Düsseldorf',
  },
]

export const FINDINGS = [
  { id: 'f001', clientId: 'c001', engagementId: 'e001', discoveredBy: 'u001', title: 'Log4Shell RCE via Logging-Endpoint', cve: 'CVE-2021-44228', cvss: 10.0, severity: 'CRITICAL', category: 'RCE', status: 'Closed', date: '2025-02-10', description: 'Apache Log4j2 JNDI-Lookup im internen Audit-Service erlaubt Remote Code Execution.', remediation: 'Update Log4j2 auf ≥ 2.17.1, JNDI-Lookup deaktivieren.' },
  { id: 'f002', clientId: 'c001', engagementId: 'e002', discoveredBy: 'u001', title: 'HTTP/2 Rapid Reset DDoS Amplification', cve: 'CVE-2023-44487', cvss: 7.5, severity: 'HIGH', category: 'DoS', status: 'In Remediation', date: '2025-03-18', description: 'Nginx-Version anfällig für HTTP/2 Rapid Reset Attack — potenzieller Dienst-Ausfall.', remediation: 'Nginx ≥ 1.25.3 oder Patch einspielen, Rate-Limiting aktivieren.' },
  { id: 'f003', clientId: 'c001', engagementId: 'e002', discoveredBy: 'u002', title: 'Stored XSS im Kundenportal', cve: null, cvss: 6.1, severity: 'MEDIUM', category: 'XSS', status: 'Open', date: '2025-04-02', description: 'Feld "Verwendungszweck" im Online-Banking wird unsanitisiert gerendert — gespeichertes XSS möglich.', remediation: 'Content-Security-Policy verschärfen, Eingabe escapen.' },
  { id: 'f004', clientId: 'c001', engagementId: 'e002', discoveredBy: 'u002', title: 'Veraltetes TLS 1.0 auf Legacy-API', cve: null, cvss: 5.3, severity: 'MEDIUM', category: 'Crypto', status: 'Open', date: '2025-04-15', description: 'TLS 1.0 und 1.1 noch aktiv auf api-legacy.sparkasse-rl.de — BEAST/POODLE-Angriffe möglich.', remediation: 'TLS 1.0/1.1 deaktivieren, nur TLS 1.2+ mit starken Cipher-Suites.' },
  { id: 'f005', clientId: 'c001', engagementId: 'e001', discoveredBy: 'u001', title: 'Exposed Jenkins Build-Server', cve: 'CVE-2024-23897', cvss: 9.8, severity: 'CRITICAL', category: 'Exposure', status: 'Closed', date: '2025-05-01', description: 'Jenkins 2.441 ohne Auth öffentlich erreichbar — File-Read-Vulnerabilität ausnutzbar.', remediation: 'Jenkins hinter VPN, Auth erzwingen, Update auf ≥ 2.443.' },
  { id: 'f006', clientId: 'c002', engagementId: 'e003', discoveredBy: 'u002', title: 'SMBGhost auf Fileserver', cve: 'CVE-2020-0796', cvss: 10.0, severity: 'CRITICAL', category: 'RCE', status: 'Closed', date: '2025-04-20', description: 'SMBv3-Komprimierungsfehler auf zentralem Fileserver 172.16.20.5 — ungepatchtes Windows Server 2019.', remediation: 'KB4551762 einspielen, SMBv3-Komprimierung deaktivieren.' },
  { id: 'f007', clientId: 'c002', engagementId: 'e003', discoveredBy: 'u002', title: 'Default-Credentials auf DICOM-Server', cve: null, cvss: 8.1, severity: 'HIGH', category: 'Auth', status: 'Open', date: '2025-04-21', description: 'DICOM-Server mit admin:admin erreichbar — direkter Zugriff auf Bildmaterial möglich.', remediation: 'Passwort ändern, Netzwerksegmentierung, DICOM-Server nur intern.' },
  { id: 'f008', clientId: 'c002', engagementId: 'e003', discoveredBy: 'u002', title: 'Unverschlüsseltes HL7-Interface', cve: null, cvss: 6.5, severity: 'MEDIUM', category: 'Crypto', status: 'In Remediation', date: '2025-05-10', description: 'HL7-Nachrichten zwischen KIS und Labor werden im Klartext übertragen.', remediation: 'TLS-Wrapper für HL7-MLLP implementieren.' },
  { id: 'f009', clientId: 'c003', engagementId: 'e004', discoveredBy: 'u003', title: 'SQL-Injection im Produktfilter', cve: null, cvss: 9.1, severity: 'CRITICAL', category: 'SQLi', status: 'Open', date: '2026-05-12', description: 'GET-Parameter ?category= im Produktkatalog direkt in SQL-Query eingebettet — Blind SQLi bestätigt.', remediation: 'Prepared Statements, WAF-Regel, Input-Validierung.' },
  { id: 'f010', clientId: 'c003', engagementId: 'e004', discoveredBy: 'u003', title: 'IDOR im Order-Management', cve: null, cvss: 7.3, severity: 'HIGH', category: 'Auth', status: 'Open', date: '2026-05-14', description: 'Bestellungen anderer Nutzer über /api/orders/{id} ohne Autorisierungsprüfung abrufbar.', remediation: 'RBAC auf API-Ebene erzwingen, Order-IDs nicht vorhersehbar machen.' },
  { id: 'f011', clientId: 'c004', engagementId: 'e006', discoveredBy: 'u001', title: 'Apache Struts RCE', cve: 'CVE-2023-50164', cvss: 9.8, severity: 'CRITICAL', category: 'RCE', status: 'Closed', date: '2025-10-03', description: 'Struts 2.5.32 auf internem Formular-Backend anfällig für File-Upload-RCE.', remediation: 'Struts auf 2.5.33+ updaten, Upload-Verzeichnisse nicht ausführbar.' },
  { id: 'f012', clientId: 'c004', engagementId: 'e006', discoveredBy: 'u001', title: 'Fehlende HSTS-Header', cve: null, cvss: 4.3, severity: 'LOW', category: 'Config', status: 'Closed', date: '2025-10-10', description: 'HSTS nicht gesetzt — Downgrade-Angriffe auf TLS möglich.', remediation: 'Strict-Transport-Security Header mit includeSubDomains setzen.' },
  { id: 'f013', clientId: 'c004', engagementId: 'e007', discoveredBy: 'u002', title: 'Veraltete jQuery-Version mit XSS', cve: 'CVE-2019-11358', cvss: 6.1, severity: 'MEDIUM', category: 'XSS', status: 'Open', date: '2025-11-02', description: 'jQuery 1.8.3 im Frontend — prototype pollution und XSS möglich.', remediation: 'jQuery auf 3.7.1+ updaten oder auf natives JS migrieren.' },
  { id: 'f014', clientId: 'c005', engagementId: 'e008', discoveredBy: 'u001', title: 'Kubernetes RBAC Privilege Escalation', cve: 'CVE-2022-3294', cvss: 8.8, severity: 'HIGH', category: 'PrivEsc', status: 'In Remediation', date: '2025-07-20', description: 'Falsch konfigurierte ClusterRoleBindings erlauben SA-Eskalation zu cluster-admin.', remediation: 'RBAC-Audit, least-privilege ServiceAccounts, OPA Gatekeeper.' },
  { id: 'f015', clientId: 'c005', engagementId: 'e008', discoveredBy: 'u002', title: 'Container Escape via runc', cve: 'CVE-2024-21626', cvss: 8.6, severity: 'HIGH', category: 'Container', status: 'Open', date: '2025-08-05', description: 'runc 1.1.11 auf Worker-Nodes anfällig — Container-Escape in Host-Namespace möglich.', remediation: 'runc ≥ 1.1.12, keine privilegierten Container ohne Notwendigkeit.' },
  { id: 'f016', clientId: 'c005', engagementId: 'e008', discoveredBy: 'u002', title: 'S3-Bucket öffentlich lesbar', cve: null, cvss: 7.5, severity: 'HIGH', category: 'Exposure', status: 'Open', date: '2025-09-12', description: 'Bucket cloudstack-static-assets ohne ACL — Log-Dateien und Configs öffentlich.', remediation: 'S3 Block Public Access aktivieren, Bucket-Policy restriktiv setzen.' },
  { id: 'f017', clientId: 'c005', engagementId: 'e009', discoveredBy: 'u003', title: 'GraphQL Introspection in Produktion', cve: null, cvss: 5.3, severity: 'MEDIUM', category: 'Config', status: 'Open', date: '2025-10-01', description: 'GraphQL Introspection aktiviert — vollständiges Schema öffentlich abrufbar.', remediation: 'Introspection in Prod deaktivieren, Depth-Limiting aktivieren.' },
  { id: 'f018', clientId: 'c006', engagementId: 'e010', discoveredBy: 'u002', title: 'Modbus TCP ohne Authentifizierung', cve: null, cvss: 8.2, severity: 'HIGH', category: 'OT/ICS', status: 'Open', date: '2026-02-28', description: 'Modbus-Geräte im Segment 10.100.0.0/24 ohne Auth erreichbar — direkte Steuerung möglich.', remediation: 'Netzwerksegmentierung, Modbus-Proxy mit Auth vorschalten.' },
  { id: 'f019', clientId: 'c006', engagementId: 'e010', discoveredBy: 'u002', title: 'Passwort-Spray auf Active Directory', cve: null, cvss: 7.0, severity: 'HIGH', category: 'Auth', status: 'Open', date: '2026-03-02', description: 'AD-Lockout-Policy zu permissiv — 5 Versuche / 30min. Spray mit 3 Versuchen/Stunde erfolgreich.', remediation: 'Lockout auf 3 Versuche reduzieren, MFA für alle Accounts, LAPS.' },
]

export const ENGAGEMENTS = [
  { id: 'e001', clientId: 'c001', title: 'Initial Red Team Assessment', type: 'Full Red Team', start: '2025-02-01', end: '2025-03-15', status: 'Completed', phases: ['Recon', 'Scanning', 'Exploitation', 'Reporting'], lead: 'Leif Balthasar', assignedTo: ['u001'] },
  { id: 'e002', clientId: 'c001', title: 'Follow-up Network Pentest', type: 'Network', start: '2025-06-10', end: '2025-07-05', status: 'Completed', phases: ['Scanning', 'Exploitation', 'Reporting'], lead: 'Leif Balthasar', assignedTo: ['u001', 'u002'] },
  { id: 'e003', clientId: 'c002', title: 'Klinik-Netzwerk Segmentierungstest', type: 'Network', start: '2025-04-15', end: '2025-05-20', status: 'Completed', phases: ['Recon', 'Scanning', 'Exploitation', 'Reporting'], lead: 'Leif Balthasar', assignedTo: ['u001', 'u002'] },
  { id: 'e004', clientId: 'c003', title: 'E-Commerce Platform Web Assessment', type: 'Web', start: '2026-06-20', end: '2026-07-18', status: 'Planned', phases: ['Recon', 'Scanning', 'Exploitation', 'Reporting'], lead: 'Leif Balthasar', assignedTo: ['u003'] },
  { id: 'e005', clientId: 'c001', title: 'Q2 Continuous Assessment', type: 'Web', start: '2026-06-04', end: '2026-06-25', status: 'Planned', phases: ['Scanning', 'Exploitation', 'Reporting'], lead: 'Leif Balthasar', assignedTo: ['u001', 'u003'] },
  { id: 'e006', clientId: 'c004', title: 'Behörden-Portal Sicherheitsaudit', type: 'Web', start: '2025-09-15', end: '2025-11-30', status: 'Completed', phases: ['Recon', 'Scanning', 'Exploitation', 'Reporting'], lead: 'Leif Balthasar', assignedTo: ['u001'] },
  { id: 'e007', clientId: 'c004', title: 'Abschlussbewertung & Remediation Check', type: 'Web', start: '2026-01-10', end: '2026-02-28', status: 'Completed', phases: ['Scanning', 'Reporting'], lead: 'Leif Balthasar', assignedTo: ['u002'] },
  { id: 'e008', clientId: 'c005', title: 'Cloud Infrastructure Red Team', type: 'Full Red Team', start: '2025-07-01', end: '2025-09-30', status: 'Completed', phases: ['Recon', 'Scanning', 'Exploitation', 'Reporting'], lead: 'Leif Balthasar', assignedTo: ['u001', 'u002'] },
  { id: 'e009', clientId: 'c005', title: 'Kubernetes Cluster Deep-Dive', type: 'Network', start: '2026-06-01', end: '2026-06-28', status: 'Planned', phases: ['Recon', 'Scanning', 'Exploitation', 'Reporting'], lead: 'Leif Balthasar', assignedTo: ['u001', 'u002', 'u003'] },
  { id: 'e010', clientId: 'c006', title: 'OT-Netzwerk Risikoanalyse', type: 'Network', start: '2026-02-20', end: '2026-04-10', status: 'On Hold', phases: ['Recon', 'Scanning'], lead: 'Leif Balthasar', assignedTo: ['u002'] },
]

export const REPORTS = [
  { id: 'r001', clientId: 'c001', title: 'Red Team Assessment Report Q1/2025', date: '2025-03-20', type: 'Technical Report', status: 'Delivered', engagementId: 'e001' },
  { id: 'r002', clientId: 'c001', title: 'Executive Summary — Sparkasse Rheinland 2025', date: '2025-03-22', type: 'Executive Summary', status: 'Delivered', engagementId: 'e001' },
  { id: 'r003', clientId: 'c002', title: 'Klinik Netzwerk Pentest Report', date: '2025-05-25', type: 'Technical Report', status: 'Delivered', engagementId: 'e003' },
  { id: 'r004', clientId: 'c004', title: 'Behördenportal Sicherheitsaudit — Finalbericht', date: '2025-12-05', type: 'Technical Report', status: 'Delivered', engagementId: 'e006' },
  { id: 'r005', clientId: 'c004', title: 'Remediation Verification Report', date: '2026-02-28', type: 'Remediation Plan', status: 'Delivered', engagementId: 'e007' },
  { id: 'r006', clientId: 'c005', title: 'Cloud Red Team — Draft Report', date: '2025-10-10', type: 'Technical Report', status: 'Draft', engagementId: 'e008' },
]

export const MONTHLY_ENGAGEMENTS = [
  { month: 'Sep', count: 1 }, { month: 'Oct', count: 2 }, { month: 'Nov', count: 1 },
  { month: 'Dec', count: 0 }, { month: 'Jan', count: 1 }, { month: 'Feb', count: 2 },
  { month: 'Mar', count: 1 }, { month: 'Apr', count: 2 }, { month: 'Mai', count: 3 },
  { month: 'Jun', count: 4 }, { month: 'Jul', count: 2 }, { month: 'Aug', count: 1 },
]

export const CVSS_DISTRIBUTION = [
  { range: '0-2', count: 0 }, { range: '2-4', count: 1 }, { range: '4-6', count: 3 },
  { range: '6-7', count: 4 }, { range: '7-8', count: 5 }, { range: '8-9', count: 3 },
  { range: '9-10', count: 4 },
]

export const SEVERITY_DIST = [
  { name: 'CRITICAL', value: 5, color: '#ef4444' },
  { name: 'HIGH', value: 7, color: '#f97316' },
  { name: 'MEDIUM', value: 5, color: '#eab308' },
  { name: 'LOW', value: 2, color: '#22c55e' },
]

export const TEAM_MEMBERS = [
  { id: 'u001', name: 'Leif Balthasar', email: 'leif@holysec.de', role: 'Admin', title: 'Founder & Senior Pentester', skills: ['Red Team', 'Web', 'Cloud', 'OT/ICS'], status: 'Active', initials: 'LB', color: 'cyan' },
  { id: 'u002', name: 'Max Richter', email: 'max@holysec.de', role: 'Senior Pentester', title: 'Senior Penetration Tester', skills: ['Network', 'OT/ICS', 'Web'], status: 'Active', initials: 'MR', color: 'orange' },
  { id: 'u003', name: 'Lisa Köhler', email: 'lisa@holysec.de', role: 'Pentester', title: 'Web Security Analyst', skills: ['Web', 'Social Engineering', 'OSINT'], status: 'Active', initials: 'LK', color: 'purple' },
]

export const USERS_AUTH = []

