#!/usr/bin/env python3
"""Generiert die HolySec Produktdokumentation als PDF."""

from pathlib import Path
from weasyprint import HTML, CSS

BASE = Path(__file__).parent
OUTPUT = BASE / "HolySec_Dokumentation.pdf"

# ── Inhalt ───────────────────────────────────────────────────────────────────

html_doc = """<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>HolySec – Pentest Management Platform</title>
</head>
<body>

<!-- ══════════════════════════════════════════════════════ TITELSEITE -->
<div class="title-page">
  <div class="title-badge">SECURITY OPERATIONS</div>
  <div class="title-logo">
    <span class="logo-shield">&#9650;</span>
  </div>
  <h1 class="title-main">HolySec</h1>
  <p class="title-sub">Pentest Management Platform</p>
  <p class="title-desc">
    Die professionelle Plattform für Penetration-Testing-Teams —<br>
    Clients, Schwachstellen, Engagements und Reports in einem System.
  </p>
  <div class="title-divider"></div>
  <div class="title-meta">
    <div class="meta-row"><span class="meta-label">Version</span><span class="meta-val">1.0</span></div>
    <div class="meta-row"><span class="meta-label">Erstellt von</span><span class="meta-val">Leif Balthasar — Founder &amp; Senior Pentester</span></div>
    <div class="meta-row"><span class="meta-label">Stand</span><span class="meta-val">Mai 2026</span></div>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════ INHALTSVERZEICHNIS -->
<div class="toc-page">
  <div class="toc-header">Inhaltsverzeichnis</div>
  <table class="toc-table">
    <tr><td class="toc-num">1</td><td class="toc-title">Was ist HolySec?</td><td class="toc-dots"></td><td class="toc-pg">3</td></tr>
    <tr class="toc-sub"><td></td><td>Warum HolySec?</td><td></td><td></td></tr>
    <tr class="toc-sub"><td></td><td>Für wen ist es gemacht?</td><td></td><td></td></tr>
    <tr><td class="toc-num">2</td><td class="toc-title">Einstieg &amp; Anmeldung</td><td class="toc-dots"></td><td class="toc-pg">4</td></tr>
    <tr class="toc-sub"><td></td><td>Login &amp; Rollen</td><td></td><td></td></tr>
    <tr class="toc-sub"><td></td><td>Oberfläche im Überblick</td><td></td><td></td></tr>
    <tr><td class="toc-num">3</td><td class="toc-title">Dashboard</td><td class="toc-dots"></td><td class="toc-pg">5</td></tr>
    <tr class="toc-sub"><td></td><td>KPI-Kacheln</td><td></td><td></td></tr>
    <tr class="toc-sub"><td></td><td>Charts &amp; Visualisierungen</td><td></td><td></td></tr>
    <tr><td class="toc-num">4</td><td class="toc-title">Client-Verwaltung</td><td class="toc-dots"></td><td class="toc-pg">6</td></tr>
    <tr class="toc-sub"><td></td><td>Client Radar</td><td></td><td></td></tr>
    <tr class="toc-sub"><td></td><td>Client Manager</td><td></td><td></td></tr>
    <tr class="toc-sub"><td></td><td>Client Map</td><td></td><td></td></tr>
    <tr><td class="toc-num">5</td><td class="toc-title">Schwachstellen (Findings)</td><td class="toc-dots"></td><td class="toc-pg">8</td></tr>
    <tr class="toc-sub"><td></td><td>CVSS &amp; Schweregrade</td><td></td><td></td></tr>
    <tr class="toc-sub"><td></td><td>Workflow: Open → Remediation → Closed</td><td></td><td></td></tr>
    <tr><td class="toc-num">6</td><td class="toc-title">Engagements &amp; Projekte</td><td class="toc-dots"></td><td class="toc-pg">9</td></tr>
    <tr class="toc-sub"><td></td><td>Engagement-Typen</td><td></td><td></td></tr>
    <tr class="toc-sub"><td></td><td>Gantt-Zeitstrahl</td><td></td><td></td></tr>
    <tr class="toc-sub"><td></td><td>Team-Zuweisung</td><td></td><td></td></tr>
    <tr><td class="toc-num">7</td><td class="toc-title">Reports</td><td class="toc-dots"></td><td class="toc-pg">10</td></tr>
    <tr class="toc-sub"><td></td><td>Report-Typen</td><td></td><td></td></tr>
    <tr class="toc-sub"><td></td><td>Status-Workflow</td><td></td><td></td></tr>
    <tr><td class="toc-num">8</td><td class="toc-title">Team &amp; Benutzerverwaltung</td><td class="toc-dots"></td><td class="toc-pg">11</td></tr>
    <tr><td class="toc-num">9</td><td class="toc-title">Audit Log</td><td class="toc-dots"></td><td class="toc-pg">12</td></tr>
    <tr><td class="toc-num">10</td><td class="toc-title">Einstellungen</td><td class="toc-dots"></td><td class="toc-pg">12</td></tr>
    <tr><td class="toc-num">11</td><td class="toc-title">Technische Architektur</td><td class="toc-dots"></td><td class="toc-pg">13</td></tr>
    <tr><td class="toc-num">12</td><td class="toc-title">Schnellstart-Anleitung</td><td class="toc-dots"></td><td class="toc-pg">14</td></tr>
  </table>
</div>

<!-- ══════════════════════════════════════════════════════ KAPITEL 1 -->
<div class="chapter">
  <div class="chapter-number">Kapitel 1</div>
  <h1>Was ist HolySec?</h1>

  <div class="intro-box">
    <p><strong>HolySec</strong> ist eine webbasierte Pentest-Management-Plattform, die speziell für professionelle Penetration-Testing-Teams entwickelt wurde. Sie bündelt alle Informationen rund um Clients, Schwachstellen, Projekte und Berichte in einer einzigen, übersichtlichen Oberfläche — und schafft damit die operative Grundlage für strukturierte, nachvollziehbare und skalierbare Sicherheitstests.</p>
  </div>

  <h2>Warum HolySec?</h2>
  <p>Pentesting-Teams arbeiten heute oft mit einem Flickenteppich aus Tabellenkalkulationen, Ticketsystemen und losen Dokumenten. Das kostet Zeit, erzeugt Fehler und macht es schwer, den Überblick zu behalten. HolySec löst dieses Problem mit einem klaren, zentralen System:</p>

  <div class="feature-grid">
    <div class="feature-card">
      <div class="feature-icon cyan">&#128202;</div>
      <div class="feature-content">
        <div class="feature-title">Zentrales Dashboard</div>
        <div class="feature-desc">Alle KPIs auf einen Blick — aktive Clients, offene Kritikalitäten, geplante Tests.</div>
      </div>
    </div>
    <div class="feature-card">
      <div class="feature-icon orange">&#128203;</div>
      <div class="feature-content">
        <div class="feature-title">Strukturierte Findings</div>
        <div class="feature-desc">CVSS-bewertete Schwachstellen mit CVE-Referenzen, Statusverfolgung und Remediation-Workflow.</div>
      </div>
    </div>
    <div class="feature-card">
      <div class="feature-icon purple">&#128197;</div>
      <div class="feature-content">
        <div class="feature-title">Projekt-Management</div>
        <div class="feature-desc">Engagements mit Gantt-Zeitstrahl, Team-Zuweisung und Phasen-Tracking.</div>
      </div>
    </div>
    <div class="feature-card">
      <div class="feature-icon green">&#128196;</div>
      <div class="feature-content">
        <div class="feature-title">Report-Registry</div>
        <div class="feature-desc">Technical Reports, Executive Summaries und Remediation Plans — alle an einem Ort.</div>
      </div>
    </div>
    <div class="feature-card">
      <div class="feature-icon blue">&#128204;</div>
      <div class="feature-content">
        <div class="feature-title">Client-Karte</div>
        <div class="feature-desc">Interaktive Geo-Karte aller Kunden mit Status und Engagement-Infos.</div>
      </div>
    </div>
    <div class="feature-card">
      <div class="feature-icon red">&#128274;</div>
      <div class="feature-content">
        <div class="feature-title">Audit Log</div>
        <div class="feature-desc">Vollständiges Aktivitätsprotokoll für Compliance und Nachvollziehbarkeit.</div>
      </div>
    </div>
  </div>

  <h2>Für wen ist HolySec gemacht?</h2>

  <table>
    <thead>
      <tr><th>Zielgruppe</th><th>Nutzen</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>Pentest-Teams</strong></td><td>Zentraler Arbeitsplatz für alle Projekte, Findings und Reports ohne Zettelwirtschaft</td></tr>
      <tr><td><strong>Senior Pentester</strong></td><td>Übersicht über Teamauslastung, Projektphasen und kritische Schwachstellen</td></tr>
      <tr><td><strong>Administratoren</strong></td><td>Vollzugriff inkl. Benutzerverwaltung, Audit Log und Systemkonfiguration</td></tr>
      <tr><td><strong>Security-Boutiquen</strong></td><td>Professionelles Tool, das mit dem Team wächst — ohne teure Enterprise-Lizenzen</td></tr>
    </tbody>
  </table>
</div>

<!-- ══════════════════════════════════════════════════════ KAPITEL 2 -->
<div class="chapter">
  <div class="chapter-number">Kapitel 2</div>
  <h1>Einstieg &amp; Anmeldung</h1>

  <h2>Login &amp; Rollen</h2>
  <p>HolySec verwendet ein rollenbasiertes Zugriffsmodell. Beim Start öffnet sich ein Cyber-Login-Bildschirm. Geben Sie Ihre E-Mail-Adresse und Ihr Passwort ein — danach landen Sie direkt auf dem Dashboard.</p>

  <div class="callout info">
    <div class="callout-icon">&#9432;</div>
    <div class="callout-text">
      <strong>Erststart:</strong> Beim ersten Start des Systems werden die konfigurierten Standardnutzer automatisch geladen. Der Administrator richtet weitere Accounts über die Team-Verwaltung ein.
    </div>
  </div>

  <p>HolySec kennt drei Rollen mit unterschiedlichen Zugriffsrechten:</p>

  <table>
    <thead>
      <tr><th>Rolle</th><th>Sichtbare Bereiche</th><th>Besonderheiten</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge cyan">Admin</span></td>
        <td>Alle Bereiche inkl. Audit Log &amp; Eng. Groups</td>
        <td>Vollzugriff, Benutzerverwaltung, Systemeinstellungen</td>
      </tr>
      <tr>
        <td><span class="badge orange">Senior Pentester</span></td>
        <td>Dashboard, Clients, Assessments, Team, Eng. Groups</td>
        <td>Kann Engagements gruppieren, sieht eigene + zugewiesene Projekte</td>
      </tr>
      <tr>
        <td><span class="badge purple">Pentester</span></td>
        <td>Dashboard, eigene Clients &amp; Engagements, Reports</td>
        <td>Eingeschränkte Sicht — nur zugewiesene Projekte sichtbar</td>
      </tr>
    </tbody>
  </table>

  <h2>Oberfläche im Überblick</h2>
  <p>Nach dem Login sehen Sie zwei Hauptbereiche:</p>

  <div class="layout-diagram">
    <div class="layout-sidebar">
      <div class="layout-label">Navigationsleiste (links)</div>
      <div class="layout-items">
        <div class="layout-item active">&#9632; Dashboard</div>
        <div class="layout-item">&#9650; Clients</div>
        <div class="layout-item indent">&#8227; Client Radar</div>
        <div class="layout-item indent">&#8227; Client Manager</div>
        <div class="layout-item indent">&#8227; Client Map</div>
        <div class="layout-item">&#9650; Assessments</div>
        <div class="layout-item indent">&#8227; Findings</div>
        <div class="layout-item indent">&#8227; Engagements</div>
        <div class="layout-item indent">&#8227; Reports</div>
        <div class="layout-item">&#9632; Team</div>
        <div class="layout-item">&#9632; Audit Log</div>
        <div class="layout-item">&#9632; Einstellungen</div>
      </div>
    </div>
    <div class="layout-main">
      <div class="layout-label">Hauptbereich (rechts)</div>
      <div class="layout-content-demo">
        <div class="demo-header">Dashboard — Liveübersicht</div>
        <div class="demo-kpis">
          <div class="demo-kpi cyan">6<br><small>Aktive Clients</small></div>
          <div class="demo-kpi red">3<br><small>Kritische Findings</small></div>
          <div class="demo-kpi yellow">12<br><small>Offene Schwachstellen</small></div>
          <div class="demo-kpi blue">4<br><small>Geplante Tests</small></div>
        </div>
      </div>
    </div>
  </div>

  <p>Die Navigationsliste auf der linken Seite lässt sich mit dem Pfeilbutton ein- und ausklappen, um mehr Platz für den Arbeitsbereich zu gewinnen. Ein Klick auf einen Menüpunkt lädt den jeweiligen Bereich sofort — ohne Seitenneuladen.</p>
</div>

<!-- ══════════════════════════════════════════════════════ KAPITEL 3 -->
<div class="chapter">
  <div class="chapter-number">Kapitel 3</div>
  <h1>Dashboard</h1>

  <p>Das Dashboard ist Ihre Schaltzentrale. Es gibt auf einen Blick Auskunft über den aktuellen Sicherheitsstatus Ihrer gesamten Client-Basis und zeigt wichtige Trends in Form von Diagrammen.</p>

  <h2>KPI-Kacheln</h2>
  <p>Die vier Kennzahlen oben auf dem Dashboard sind Ihre wichtigsten Echtzeitindikatoren:</p>

  <table>
    <thead>
      <tr><th>Kachel</th><th>Was sie zeigt</th><th>Handlungsbedarf</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Aktive Clients</strong></td>
        <td>Anzahl Clients mit Status "Active" — laufende Verträge und aktive Engagements</td>
        <td>Keine — Überblicksinformation</td>
      </tr>
      <tr>
        <td><strong>Offene Kritikalitäten</strong></td>
        <td>CVSS ≥ 9.0 Findings mit Status "Open" quer über alle Clients</td>
        <td><span class="text-red">Sofortige Maßnahmen erforderlich</span></td>
      </tr>
      <tr>
        <td><strong>Offene Findings</strong></td>
        <td>Alle Schwachstellen mit Status "Open" — alle Schweregrade</td>
        <td>Regelmäßig prüfen und priorisieren</td>
      </tr>
      <tr>
        <td><strong>Geplante Tests</strong></td>
        <td>Engagements mit Status "Planned" — noch nicht gestartete Pentests</td>
        <td>Ressourcen frühzeitig einplanen</td>
      </tr>
    </tbody>
  </table>

  <div class="callout tip">
    <div class="callout-icon">&#128161;</div>
    <div class="callout-text">
      <strong>Tipp:</strong> Jede Kachel hat ein kleines Info-Symbol (i). Fahren Sie mit der Maus darüber, um eine detaillierte Erklärung der Kennzahl zu erhalten — ideal für neue Teammitglieder.
    </div>
  </div>

  <h2>Charts &amp; Visualisierungen</h2>
  <p>Unterhalb der KPI-Kacheln befinden sich drei interaktive Diagramme:</p>

  <div class="chart-desc-grid">
    <div class="chart-desc-item">
      <div class="chart-desc-title">&#128200; Engagements pro Monat</div>
      <p>Balkendiagramm der abgeschlossenen und geplanten Projekte über die letzten 12 Monate. Ideal für Kapazitätsplanung und saisonale Auslastungsanalyse.</p>
    </div>
    <div class="chart-desc-item">
      <div class="chart-desc-title">&#128308; Findings nach Schweregrad</div>
      <p>Kreisdiagramm der Schwachstellenverteilung (CRITICAL / HIGH / MEDIUM / LOW). Zeigt auf einen Blick, ob Ihr Team hauptsächlich mit hochkritischen oder mittelschweren Befunden konfrontiert ist.</p>
    </div>
    <div class="chart-desc-item">
      <div class="chart-desc-title">&#128202; CVSS-Score-Verteilung</div>
      <p>Häufigkeitsverteilung aller CVSS-Scores in Intervallen (0–10). Hilft zu erkennen, ob sich Schwachstellen im oberen oder unteren Scoring-Bereich konzentrieren.</p>
    </div>
  </div>

  <p>Am unteren Ende des Dashboards finden Sie die <strong>Neuesten kritischen Findings</strong> — sortiert nach Datum, mit aktuellem Behebungsstatus. So verpassen Sie keine frischen CRITICAL-Befunde.</p>
</div>

<!-- ══════════════════════════════════════════════════════ KAPITEL 4 -->
<div class="chapter">
  <div class="chapter-number">Kapitel 4</div>
  <h1>Client-Verwaltung</h1>

  <p>Die Client-Verwaltung ist das Herzstück von HolySec. Hier verwalten Sie alle Kundenbeziehungen, sehen deren Sicherheitsstatus und planen die nächsten Schritte.</p>

  <h2>Client Radar</h2>
  <p>Der Client Radar bietet eine schnelle Statusübersicht aller Kunden, gefiltert nach wichtigen Dimensionen:</p>

  <table>
    <thead>
      <tr><th>Filter-Kachel</th><th>Bedeutung</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge cyan">Active</span></td>
        <td>Laufender Vertrag, Engagements aktiv oder aktiv geplant</td>
      </tr>
      <tr>
        <td><span class="badge gray">On Hold</span></td>
        <td>Pentest-Prozess vorübergehend pausiert (z.B. Freeze-Phase beim Kunden)</td>
      </tr>
      <tr>
        <td><span class="badge red">Critical</span></td>
        <td>CVSS ≥ 9.0 Findings offen — höchste Handlungspriorität</td>
      </tr>
      <tr>
        <td><span class="badge yellow">Due Soon</span></td>
        <td>Nächster Pentest in ≤ 30 Tagen — Vorbereitung &amp; Ressourcenplanung erforderlich</td>
      </tr>
    </tbody>
  </table>

  <p>Jede Client-Karte im Radar zeigt: Name, Branche, Status, Scope-Typ, Kritikalität, nächsten Testtermin sowie die Anzahl offener Findings. Ein Klick auf die Karte öffnet das vollständige Client-Profil.</p>

  <h2>Client Manager</h2>
  <p>Der Client Manager ist die vollständige Verwaltungsansicht aller Kunden. Pro Client sehen Sie:</p>

  <div class="info-cards">
    <div class="info-card">
      <div class="info-card-head">Kontakt &amp; Vertrag</div>
      <ul>
        <li>Name, E-Mail, Telefon des Ansprechpartners</li>
        <li>Vertragslaufzeit (Start- und Enddatum)</li>
        <li>Budgetstunden (verbraucht / gesamt)</li>
        <li>Restlaufzeit in Tagen</li>
      </ul>
    </div>
    <div class="info-card">
      <div class="info-card-head">Scope-Definition</div>
      <ul>
        <li>IP-Bereiche &amp; Subnetze</li>
        <li>Domains &amp; Subdomains</li>
        <li>Explizite Ausschlüsse (Out-of-Scope)</li>
        <li>Scope-Typ (Web, Network, Full Red Team, Social Engineering)</li>
      </ul>
    </div>
    <div class="info-card">
      <div class="info-card-head">Sicherheitsstatus</div>
      <ul>
        <li>Offene Findings (nach Schweregrad)</li>
        <li>Behobene Findings</li>
        <li>Verknüpfte Engagements</li>
        <li>Report-Bestand (TR / ES / RP)</li>
      </ul>
    </div>
  </div>

  <div class="callout warning">
    <div class="callout-icon">&#9888;</div>
    <div class="callout-text">
      <strong>Budget-Warnung:</strong> Sobald mehr als 85% der Vertragsstunden verbraucht sind, wird das Budgetfeld rot markiert. Das ist das Signal, eine Vertragsverlängerung mit dem Kunden zu besprechen.
    </div>
  </div>

  <h2>Client Map</h2>
  <p>Die Client Map zeigt alle Kunden als Marker auf einer interaktiven Karte (basierend auf OpenStreetMap via Leaflet). Jeder Marker ist nach Kritikalität eingefärbt:</p>

  <table>
    <thead>
      <tr><th>Farbe</th><th>Kritikalität</th><th>Bedeutung</th></tr>
    </thead>
    <tbody>
      <tr><td><span class="dot red"></span> Rot</td><td>CRITICAL</td><td>CVSS ≥ 9.0 Findings offen — sofortiger Handlungsbedarf</td></tr>
      <tr><td><span class="dot orange"></span> Orange</td><td>HIGH</td><td>CVSS 7.0–8.9 — erhöhte Aufmerksamkeit erforderlich</td></tr>
      <tr><td><span class="dot yellow"></span> Gelb</td><td>MEDIUM</td><td>CVSS 4.0–6.9 — im regulären Remediation-Prozess</td></tr>
      <tr><td><span class="dot green"></span> Grün</td><td>LOW</td><td>CVSS &lt; 4.0 — kein unmittelbarer Handlungsbedarf</td></tr>
    </tbody>
  </table>

  <p>Ein Klick auf einen Marker öffnet ein Popup mit Client-Name, Stadt, Status und der Anzahl offener Findings. Die Karte lässt sich zoomen, verschieben und vollständig mit der Maus bedienen.</p>
</div>

<!-- ══════════════════════════════════════════════════════ KAPITEL 5 -->
<div class="chapter">
  <div class="chapter-number">Kapitel 5</div>
  <h1>Schwachstellen (Findings)</h1>

  <p>Die Findings-Datenbank erfasst alle im Rahmen von Engagements entdeckten Schwachstellen. Sie ist das zentrale Wissensspeicher Ihrer Sicherheitsarbeit.</p>

  <h2>CVSS &amp; Schweregrade</h2>
  <p>Jedes Finding wird nach dem <strong>Common Vulnerability Scoring System (CVSS)</strong> bewertet. Der Score reicht von 0.0 bis 10.0 und wird in vier Schweregrade eingeteilt:</p>

  <table>
    <thead>
      <tr><th>Schweregrad</th><th>CVSS-Bereich</th><th>Beispiele</th><th>Reaktionszeit</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge red">CRITICAL</span></td>
        <td>9.0 – 10.0</td>
        <td>RCE, Log4Shell, SQL Injection, unauthentifizierter Admin-Zugriff</td>
        <td><strong>Sofort</strong> (0–24h)</td>
      </tr>
      <tr>
        <td><span class="badge orange">HIGH</span></td>
        <td>7.0 – 8.9</td>
        <td>Privilege Escalation, SSRF, schwache Authentifizierung</td>
        <td><strong>Kurzfristig</strong> (1–7 Tage)</td>
      </tr>
      <tr>
        <td><span class="badge yellow">MEDIUM</span></td>
        <td>4.0 – 6.9</td>
        <td>XSS, veraltete TLS-Versionen, fehlende Security Headers</td>
        <td><strong>Mittelfristig</strong> (7–30 Tage)</td>
      </tr>
      <tr>
        <td><span class="badge green">LOW</span></td>
        <td>0.0 – 3.9</td>
        <td>Informationsoffenlegung, fehlende HSTS-Header</td>
        <td><strong>Langfristig</strong> (nächster Patch-Zyklus)</td>
      </tr>
    </tbody>
  </table>

  <h2>Workflow: Open → In Remediation → Closed</h2>
  <p>Jedes Finding durchläuft einen klar definierten Lifecycle:</p>

  <div class="workflow">
    <div class="workflow-step red">
      <div class="workflow-num">1</div>
      <div class="workflow-content">
        <div class="workflow-title">Open</div>
        <div class="workflow-desc">Schwachstelle entdeckt und dokumentiert — noch keine Gegenmaßnahme ergriffen</div>
      </div>
    </div>
    <div class="workflow-arrow">&#8594;</div>
    <div class="workflow-step yellow">
      <div class="workflow-num">2</div>
      <div class="workflow-content">
        <div class="workflow-title">In Remediation</div>
        <div class="workflow-desc">Kunde arbeitet an der Behebung — Patch oder Workaround in Umsetzung</div>
      </div>
    </div>
    <div class="workflow-arrow">&#8594;</div>
    <div class="workflow-step green">
      <div class="workflow-num">3</div>
      <div class="workflow-content">
        <div class="workflow-title">Closed</div>
        <div class="workflow-desc">Schwachstelle erfolgreich behoben und vom Pentester verifiziert</div>
      </div>
    </div>
  </div>

  <p>Den Status wechseln Sie durch einen einfachen Klick auf den Status-Badge in der Findings-Liste — das System protokolliert die Änderung automatisch im Audit Log.</p>

  <div class="callout tip">
    <div class="callout-icon">&#128161;</div>
    <div class="callout-text">
      <strong>CVE-Referenzen:</strong> Wenn ein Finding auf eine bekannte CVE-Nummer zurückgeht, ist diese direkt verlinkt. So können Sie schnell auf die offiziellen Sicherheitshinweise des Herstellers zugreifen.
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════ KAPITEL 6 -->
<div class="chapter">
  <div class="chapter-number">Kapitel 6</div>
  <h1>Engagements &amp; Projekte</h1>

  <p>Engagements sind die geplanten und laufenden Pentest-Projekte. HolySec verwaltet jeden Auftrag mit Zeitraum, Team, Phasen und aktuellem Status.</p>

  <h2>Engagement-Typen</h2>
  <table>
    <thead>
      <tr><th>Typ</th><th>Scope</th><th>Typische Dauer</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge blue">Web</span></td>
        <td>Webanwendungen, APIs, Login-Systeme, Admin-Panels</td>
        <td>1–4 Wochen</td>
      </tr>
      <tr>
        <td><span class="badge purple">Network</span></td>
        <td>Interne Netzwerke, IP-Bereiche, Server-Infrastruktur</td>
        <td>2–6 Wochen</td>
      </tr>
      <tr>
        <td><span class="badge orange">Social Engineering</span></td>
        <td>Phishing, Vishing, physischer Zugang</td>
        <td>1–3 Wochen</td>
      </tr>
      <tr>
        <td><span class="badge red">Full Red Team</span></td>
        <td>Vollständiger Angriff inkl. Phishing, Netzwerk, Eskalation, Exfiltration</td>
        <td>4–12 Wochen</td>
      </tr>
    </tbody>
  </table>

  <h2>Gantt-Zeitstrahl</h2>
  <p>Der Gantt-View zeigt alle Engagements als horizontale Balken auf einem Zeitstrahl. Die Farbe entspricht dem Status:</p>
  <ul>
    <li><span class="dot cyan"></span> <strong>Cyan — Planned:</strong> Noch nicht gestartet, aber terminiert</li>
    <li><span class="dot green"></span> <strong>Grün — Completed:</strong> Erfolgreich abgeschlossen</li>
    <li><span class="dot gray"></span> <strong>Grau — On Hold:</strong> Vorübergehend pausiert</li>
  </ul>
  <p>Der Gantt-Zeitstrahl ist besonders hilfreich für die Ressourcenplanung: Überschneidungen mehrerer Engagements sind sofort sichtbar.</p>

  <h2>Team-Zuweisung</h2>
  <p>Über den Zuweisungs-Button (Pfeil-Icon) in der Engagement-Liste können Teammitglieder einem Projekt zugewiesen werden. Nicht-Admin-Nutzer sehen nach dem Login nur die Engagements, denen sie zugewiesen sind — so bleibt die Übersicht klar und datenschutzkonform.</p>

  <h2>Engagement-Phasen</h2>
  <p>Jedes Engagement durchläuft standardisierte Phasen, die den professionellen Pentest-Prozess abbilden:</p>

  <div class="phases">
    <div class="phase">
      <div class="phase-icon">&#128269;</div>
      <div class="phase-name">Recon</div>
      <div class="phase-desc">Passivе und aktive Informationssammlung über Ziel und Infrastruktur</div>
    </div>
    <div class="phase-sep">&#8594;</div>
    <div class="phase">
      <div class="phase-icon">&#128268;</div>
      <div class="phase-name">Scanning</div>
      <div class="phase-desc">Aktives Port-Scanning, Service-Enumeration, Vulnerability-Scanning</div>
    </div>
    <div class="phase-sep">&#8594;</div>
    <div class="phase">
      <div class="phase-icon">&#9876;</div>
      <div class="phase-name">Exploitation</div>
      <div class="phase-desc">Ausnutzung identifizierter Schwachstellen, Privilege Escalation</div>
    </div>
    <div class="phase-sep">&#8594;</div>
    <div class="phase">
      <div class="phase-icon">&#128196;</div>
      <div class="phase-name">Reporting</div>
      <div class="phase-desc">Dokumentation der Ergebnisse, Erstellung des Abschlussberichts</div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════ KAPITEL 7 -->
<div class="chapter">
  <div class="chapter-number">Kapitel 7</div>
  <h1>Reports</h1>

  <p>Die Report-Registry verwaltet alle erstellten Berichte geordnet nach Client und Engagement. Sie ist der zentrale Archiv für Ihre gesamte Berichtsdokumentation.</p>

  <h2>Report-Typen</h2>

  <div class="report-types">
    <div class="report-type">
      <div class="report-type-badge tr">TR</div>
      <div class="report-type-content">
        <div class="report-type-title">Technical Report</div>
        <div class="report-type-desc">
          Der vollständige technische Bericht für das IT-Team des Kunden. Enthält alle Findings mit CVSS-Scores, Proof-of-Concept-Beschreibungen, Screenshоts und detaillierten Remediationsempfehlungen. Richtet sich an Sicherheitsverantwortliche und Entwickler.
        </div>
      </div>
    </div>
    <div class="report-type">
      <div class="report-type-badge es">ES</div>
      <div class="report-type-content">
        <div class="report-type-title">Executive Summary</div>
        <div class="report-type-desc">
          Die Kurzfassung für das Management. Konzentriert sich auf Risikobewertung, Geschäftsauswirkungen und strategische Handlungsempfehlungen — ohne technische Details. Geeignet für Vorstände, Geschäftsführer und CISOs.
        </div>
      </div>
    </div>
    <div class="report-type">
      <div class="report-type-badge rp">RP</div>
      <div class="report-type-content">
        <div class="report-type-title">Remediation Plan</div>
        <div class="report-type-desc">
          Der strukturierte Maßnahmenplan nach Abschluss eines Engagements. Priorisiert alle Findings nach Dringlichkeit, schlägt konkrete Schritte vor und dient als Checkliste für den Verifikations-Pentest.
        </div>
      </div>
    </div>
  </div>

  <h2>Status-Workflow</h2>
  <p>Reports durchlaufen ebenfalls einen klar definierten Status-Workflow. Der Status lässt sich per Klick in der Report-Liste weiterschalten:</p>

  <div class="workflow">
    <div class="workflow-step yellow">
      <div class="workflow-num">1</div>
      <div class="workflow-content">
        <div class="workflow-title">Draft</div>
        <div class="workflow-desc">Bericht in Erstellung — noch nicht an den Kunden übergeben</div>
      </div>
    </div>
    <div class="workflow-arrow">&#8594;</div>
    <div class="workflow-step cyan">
      <div class="workflow-num">2</div>
      <div class="workflow-content">
        <div class="workflow-title">Delivered</div>
        <div class="workflow-desc">Bericht dem Kunden zugestellt — Feedback-Phase läuft</div>
      </div>
    </div>
    <div class="workflow-arrow">&#8594;</div>
    <div class="workflow-step green">
      <div class="workflow-num">3</div>
      <div class="workflow-content">
        <div class="workflow-title">Final</div>
        <div class="workflow-desc">Abgeschlossener, freigegebener Bericht — archiviert</div>
      </div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════ KAPITEL 8 -->
<div class="chapter">
  <div class="chapter-number">Kapitel 8</div>
  <h1>Team &amp; Benutzerverwaltung</h1>

  <p>Im Team-Bereich sehen und verwalten Administratoren alle Mitglieder des Pentest-Teams. Hier werden Profile, Rollen und Fähigkeiten gepflegt.</p>

  <p>Jedes Teammitglied-Profil enthält:</p>
  <ul>
    <li><strong>Name &amp; Avatar</strong> — mit farbiger Initialen-Kachel</li>
    <li><strong>Rolle</strong> — Admin, Senior Pentester oder Pentester</li>
    <li><strong>Berufsbezeichnung</strong> — z.B. "Web Security Analyst"</li>
    <li><strong>Skills</strong> — z.B. Web, Network, OT/ICS, Cloud, Social Engineering</li>
    <li><strong>Status</strong> — Active oder inaktiv</li>
    <li><strong>E-Mail-Adresse</strong> — für Systemkommunikation</li>
  </ul>

  <h2>Neue Benutzer anlegen</h2>
  <p>Über den "+ Mitglied"-Button (Admin-Rolle erforderlich) können neue Teammitglieder mit ihren Zugangsdaten und der entsprechenden Rolle angelegt werden. Das System unterstützt unbegrenzt viele Nutzer.</p>

  <div class="callout info">
    <div class="callout-icon">&#9432;</div>
    <div class="callout-text">
      <strong>Rollenkonzept:</strong> Die Rollenzuweisung steuert, welche Navigationsbereiche sichtbar sind und auf welche Daten zugegriffen werden kann. Eine nachträgliche Rollenänderung ist jederzeit möglich.
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════ KAPITEL 9 -->
<div class="chapter">
  <div class="chapter-number">Kapitel 9</div>
  <h1>Audit Log</h1>

  <p>Das Audit Log ist ausschließlich für Administratoren sichtbar und bietet ein vollständiges, unveränderliches Aktivitätsprotokoll aller Nutzeraktionen im System.</p>

  <p>Folgende Ereignisse werden protokolliert:</p>

  <table>
    <thead>
      <tr><th>Ereignistyp</th><th>Beispiel</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>Anmeldungen</strong></td><td>Login/Logout mit IP-Adresse, Zeitstempel und Nutzername</td></tr>
      <tr><td><strong>Datenänderungen</strong></td><td>Statuswechsel von Findings, Anlegen/Löschen von Clients</td></tr>
      <tr><td><strong>Engagement-Aktionen</strong></td><td>Team-Zuweisung, Statusänderungen bei Projekten</td></tr>
      <tr><td><strong>Report-Aktionen</strong></td><td>Download, Statuswechsel (Draft → Delivered → Final)</td></tr>
      <tr><td><strong>Benutzerverwaltung</strong></td><td>Anlegen, Bearbeiten oder Deaktivieren von Accounts</td></tr>
    </tbody>
  </table>

  <div class="callout info">
    <div class="callout-icon">&#9432;</div>
    <div class="callout-text">
      <strong>Compliance-Relevanz:</strong> Das Audit Log ist essenziell für Nachweispflichten in regulierten Branchen (z.B. Finanz, Gesundheit, öffentlicher Sektor). Es dokumentiert lückenlos, wer wann was im System getan hat.
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════ KAPITEL 10 -->
<div class="chapter">
  <div class="chapter-number">Kapitel 10</div>
  <h1>Einstellungen</h1>

  <p>Im Einstellungsbereich können Nutzer ihr persönliches Erlebnis und Systemverhalten anpassen. Die Einstellungen sind in zwei Kategorien unterteilt:</p>

  <h2>Darstellung</h2>
  <table>
    <thead>
      <tr><th>Einstellung</th><th>Optionen</th><th>Beschreibung</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Erscheinungsbild</strong></td>
        <td>Dark Mode / Light Mode</td>
        <td>Schaltet die gesamte Oberfläche zwischen dem Cyber-Dark-Theme und einem hellen, kontrastreichen Layout um</td>
      </tr>
      <tr>
        <td><strong>Sprache</strong></td>
        <td>Deutsch / English</td>
        <td>Setzt alle Navigationsbeschriftungen, Tooltips und Systemtexte in die gewählte Sprache — ohne Seitenneuladen</td>
      </tr>
    </tbody>
  </table>

  <h2>Konto</h2>
  <p>Im Kontobereich der Einstellungen können Nutzer ihr eigenes Passwort ändern. Administratoren haben zusätzlich Zugriff auf die Benutzerverwaltung und können Systempasswörter zurücksetzen.</p>
</div>

<!-- ══════════════════════════════════════════════════════ KAPITEL 11 -->
<div class="chapter">
  <div class="chapter-number">Kapitel 11</div>
  <h1>Technische Architektur</h1>

  <p>HolySec ist so gebaut, dass es einfach zu betreiben ist — kein komplexes Setup, keine externe Cloud-Abhängigkeit. Alles läuft lokal auf Ihrer Infrastruktur.</p>

  <table>
    <thead>
      <tr><th>Komponente</th><th>Technologie</th><th>Funktion</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Frontend</strong></td>
        <td>React + Vite + Tailwind CSS</td>
        <td>Single-Page-Application — reaktive UI ohne Seitenneuladen</td>
      </tr>
      <tr>
        <td><strong>Charts</strong></td>
        <td>Recharts</td>
        <td>Interaktive Diagramme (Balken, Kreis, Linien)</td>
      </tr>
      <tr>
        <td><strong>Karte</strong></td>
        <td>Leaflet + OpenStreetMap</td>
        <td>Interaktive Client-Weltkarte ohne externe API-Kosten</td>
      </tr>
      <tr>
        <td><strong>Backend</strong></td>
        <td>Node.js + Express</td>
        <td>Leichtgewichtiger REST-API-Server</td>
      </tr>
      <tr>
        <td><strong>Datenbank</strong></td>
        <td>SQLite (better-sqlite3)</td>
        <td>Dateibasierte Datenbank — kein separater DB-Server notwendig</td>
      </tr>
      <tr>
        <td><strong>Schriftart</strong></td>
        <td>JetBrains Mono</td>
        <td>Professionelle Monospace-Schrift im Cyber-Stil</td>
      </tr>
    </tbody>
  </table>

  <h2>Datenpersistenz</h2>
  <p>Alle Daten werden über eine einfache Key-Value-API im Backend gespeichert. Die SQLite-Datei <code>holysec.db</code> enthält den gesamten Systemzustand und kann einfach gesichert werden:</p>

  <div class="code-block">
    <div class="code-header">Backup der Datenbank</div>
    <pre># Einfaches Backup — einmalig oder als Cronjob
cp /pfad/zu/holySec/backend/holysec.db /backup/holysec_$(date +%Y%m%d).db</pre>
  </div>

  <h2>Deployment</h2>
  <p>HolySec kann auf jedem Linux-System mit Node.js gestartet werden. Das mitgelieferte Start-Skript übernimmt Build und Start in einem Schritt:</p>

  <div class="code-block">
    <div class="code-header">Start des Systems</div>
    <pre># Erstmaliger Start (Build + Server)
cd holySec
bash start.sh

# Das System ist danach erreichbar unter:
# http://localhost:5173/holySec/
# http://&lt;IP-Adresse&gt;:5173/holySec/  (Netzwerkzugriff)</pre>
  </div>

  <div class="callout tip">
    <div class="callout-icon">&#128161;</div>
    <div class="callout-text">
      <strong>Netzwerkzugriff:</strong> Der Server bindet auf <code>0.0.0.0</code> — das bedeutet, das System ist für alle Geräte im selben Netzwerk erreichbar. Für produktiven Einsatz empfiehlt sich ein Reverse-Proxy (z.B. Nginx) mit HTTPS und Firewall-Regeln.
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════ KAPITEL 12 -->
<div class="chapter">
  <div class="chapter-number">Kapitel 12</div>
  <h1>Schnellstart-Anleitung</h1>

  <p>Mit diesen Schritten sind Sie in wenigen Minuten produktiv:</p>

  <div class="quickstart">
    <div class="qs-step">
      <div class="qs-num">1</div>
      <div class="qs-content">
        <div class="qs-title">System starten</div>
        <div class="qs-desc">Führen Sie <code>bash start.sh</code> im HolySec-Verzeichnis aus. Der Server startet automatisch und zeigt die Netzwerk-URL an.</div>
      </div>
    </div>
    <div class="qs-step">
      <div class="qs-num">2</div>
      <div class="qs-content">
        <div class="qs-title">Anmelden</div>
        <div class="qs-desc">Öffnen Sie die angezeigte URL im Browser. Melden Sie sich mit Ihren Zugangsdaten an. Als Admin haben Sie sofort vollen Zugriff.</div>
      </div>
    </div>
    <div class="qs-step">
      <div class="qs-num">3</div>
      <div class="qs-content">
        <div class="qs-title">Team einrichten</div>
        <div class="qs-desc">Navigieren Sie zu <strong>Team</strong> und legen Sie alle Teammitglieder mit ihren Rollen und Fähigkeiten an.</div>
      </div>
    </div>
    <div class="qs-step">
      <div class="qs-num">4</div>
      <div class="qs-content">
        <div class="qs-title">Ersten Client anlegen</div>
        <div class="qs-desc">Öffnen Sie den <strong>Client Manager</strong> und tragen Sie Ihren ersten Kunden ein — mit Kontaktdaten, Vertragsinfos und Scope-Definition.</div>
      </div>
    </div>
    <div class="qs-step">
      <div class="qs-num">5</div>
      <div class="qs-content">
        <div class="qs-title">Engagement erstellen</div>
        <div class="qs-desc">Gehen Sie zu <strong>Engagements</strong> und legen Sie das erste Pentest-Projekt an — mit Zeitraum, Typ und Team-Zuweisung.</div>
      </div>
    </div>
    <div class="qs-step">
      <div class="qs-num">6</div>
      <div class="qs-content">
        <div class="qs-title">Findings dokumentieren</div>
        <div class="qs-desc">Erfassen Sie Schwachstellen über den <strong>Findings</strong>-Bereich mit CVSS-Score, CVE-Referenz und Remediationsempfehlung.</div>
      </div>
    </div>
    <div class="qs-step">
      <div class="qs-num">7</div>
      <div class="qs-content">
        <div class="qs-title">Report verwalten</div>
        <div class="qs-desc">Erstellen Sie nach Abschluss einen Eintrag in der <strong>Report-Registry</strong> und tracken Sie den Status (Draft → Delivered → Final).</div>
      </div>
    </div>
    <div class="qs-step">
      <div class="qs-num">8</div>
      <div class="qs-content">
        <div class="qs-title">Dashboard beobachten</div>
        <div class="qs-desc">Das <strong>Dashboard</strong> aktualisiert sich automatisch. Alle KPIs und Charts spiegeln den aktuellen Systemzustand wider.</div>
      </div>
    </div>
  </div>

  <div class="final-box">
    <div class="final-logo">&#9650;</div>
    <div class="final-title">HolySec</div>
    <div class="final-sub">Pentest Management Platform</div>
    <div class="final-tagline">Strukturiert testen. Klar dokumentieren. Sicher wachsen.</div>
    <div class="final-credit">Entwickelt von Leif Balthasar — Founder &amp; Senior Pentester</div>
  </div>
</div>

</body>
</html>"""

# ── CSS ───────────────────────────────────────────────────────────────────────

css = CSS(string="""
@page {
  size: A4;
  margin: 2.2cm 2.6cm 2.6cm 2.6cm;
  @bottom-left {
    content: "HolySec — Pentest Management Platform";
    font-family: "JetBrains Mono", monospace;
    font-size: 7.5pt;
    color: #475569;
  }
  @bottom-right {
    content: counter(page);
    font-family: "JetBrains Mono", monospace;
    font-size: 7.5pt;
    color: #475569;
  }
  @bottom-center {
    content: "";
    border-top: 1px solid #1e293b;
    width: 100%;
  }
}

@page :first {
  margin: 0;
  @bottom-left   { content: none; }
  @bottom-right  { content: none; }
  @bottom-center { content: none; }
}

* { box-sizing: border-box; }

body {
  font-family: "Inter", "Segoe UI", Arial, sans-serif;
  font-size: 10.5pt;
  line-height: 1.8;
  color: #e2e8f0;
  background: #0a0a0a;
  margin: 0;
  padding: 0;
}

/* ══════════════════ TITLE PAGE ══════════════════ */
.title-page {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(160deg, #0a0a0a 0%, #0f172a 40%, #06303a 100%);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3cm 2cm;
  page-break-after: always;
}

.title-badge {
  font-family: "JetBrains Mono", monospace;
  font-size: 7pt;
  letter-spacing: 4px;
  color: #06b6d4;
  border: 1px solid #06b6d4;
  border-radius: 2px;
  padding: 3px 10px;
  margin-bottom: 1.2cm;
  text-transform: uppercase;
}

.title-logo {
  font-size: 60pt;
  margin-bottom: 0.3cm;
  color: #06b6d4;
  text-shadow: 0 0 40px rgba(6,182,212,0.6);
}

.logo-shield {
  color: #06b6d4;
}

.title-main {
  font-size: 52pt;
  font-weight: 700;
  margin: 0 0 0.2cm;
  letter-spacing: 6px;
  color: #f8fafc;
  text-shadow: 0 0 30px rgba(6,182,212,0.3);
}

.title-sub {
  font-size: 13pt;
  color: #06b6d4;
  margin: 0 0 0.8cm;
  font-family: "JetBrains Mono", monospace;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.title-desc {
  font-size: 11pt;
  color: #94a3b8;
  max-width: 13cm;
  line-height: 1.9;
  margin: 0 auto 1cm;
}

.title-divider {
  width: 8cm;
  height: 1px;
  background: linear-gradient(90deg, transparent, #06b6d4, transparent);
  margin: 0.8cm auto;
}

.title-meta {
  margin-top: 0.5cm;
}

.meta-row {
  display: flex;
  justify-content: center;
  gap: 0.5cm;
  margin: 0.15cm 0;
  font-size: 9pt;
}

.meta-label {
  color: #64748b;
  font-family: "JetBrains Mono", monospace;
  min-width: 3cm;
  text-align: right;
}

.meta-val {
  color: #cbd5e1;
  text-align: left;
}

/* ══════════════════ TOC PAGE ══════════════════ */
.toc-page {
  page-break-after: always;
  background: #0f172a;
  min-height: 100vh;
  padding: 2cm 2.5cm;
  color: #e2e8f0;
}

.toc-header {
  font-size: 22pt;
  font-weight: 700;
  color: #f8fafc;
  border-bottom: 2px solid #06b6d4;
  padding-bottom: 0.3cm;
  margin-bottom: 0.8cm;
  font-family: "JetBrains Mono", monospace;
  letter-spacing: 1px;
}

.toc-table {
  width: 100%;
  border-collapse: collapse;
}

.toc-table tr { border: none; background: transparent; }
.toc-table tr:nth-child(even) { background: transparent; }

.toc-num {
  font-family: "JetBrains Mono", monospace;
  font-size: 10pt;
  color: #06b6d4;
  font-weight: 700;
  width: 0.7cm;
  padding: 0.18cm 0.3cm 0.18cm 0;
  vertical-align: middle;
}

.toc-title {
  font-size: 11pt;
  color: #e2e8f0;
  font-weight: 600;
  padding: 0.18cm 0.3cm;
  vertical-align: middle;
  border-bottom: 1px dotted #1e293b;
}

.toc-dots {
  flex: 1;
}

.toc-pg {
  font-family: "JetBrains Mono", monospace;
  font-size: 9pt;
  color: #64748b;
  padding: 0.18cm 0 0.18cm 0.3cm;
  text-align: right;
  vertical-align: middle;
}

.toc-sub td {
  font-size: 9pt;
  color: #64748b;
  padding: 0.08cm 0.3cm 0.08cm 1.2cm;
  border: none;
  background: transparent;
}

/* ══════════════════ CHAPTER ══════════════════ */
.chapter {
  background: #0a0a0a;
  color: #e2e8f0;
  padding: 0;
}

.chapter-number {
  font-family: "JetBrains Mono", monospace;
  font-size: 8pt;
  color: #06b6d4;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 0.1cm;
  margin-top: 0.3cm;
}

h1 {
  font-size: 20pt;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 0.6cm;
  padding-bottom: 0.25cm;
  border-bottom: 2px solid #06b6d4;
  page-break-before: always;
  page-break-after: avoid;
}

h1:first-of-type { page-break-before: always; }

h2 {
  font-size: 13pt;
  font-weight: 700;
  color: #06b6d4;
  margin: 0.7cm 0 0.3cm;
  padding: 0.2cm 0.5cm;
  border-left: 3px solid #06b6d4;
  background: rgba(6,182,212,0.06);
  page-break-after: avoid;
}

h3 {
  font-size: 11pt;
  font-weight: 600;
  color: #cbd5e1;
  margin: 0.5cm 0 0.2cm;
}

p {
  margin: 0.25cm 0;
  color: #cbd5e1;
  line-height: 1.85;
}

/* ══════════════════ TABLES ══════════════════ */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.4cm 0;
  font-size: 9.5pt;
  page-break-inside: avoid;
}

thead tr {
  background: #0f172a;
  border-bottom: 2px solid #06b6d4;
}

th {
  padding: 0.22cm 0.35cm;
  text-align: left;
  font-weight: 700;
  color: #06b6d4;
  font-family: "JetBrains Mono", monospace;
  font-size: 8.5pt;
  letter-spacing: 0.5px;
}

td {
  padding: 0.2cm 0.35cm;
  border-bottom: 1px solid #1e293b;
  color: #cbd5e1;
  vertical-align: top;
}

tbody tr:nth-child(even) { background: rgba(15,23,42,0.5); }

/* ══════════════════ LISTS ══════════════════ */
ul, ol {
  padding-left: 1.2cm;
  margin: 0.2cm 0;
  color: #cbd5e1;
}

li { margin: 0.1cm 0; line-height: 1.75; }

/* ══════════════════ BADGES ══════════════════ */
.badge {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 3px;
  font-size: 8pt;
  font-family: "JetBrains Mono", monospace;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.badge.cyan   { background: rgba(6,182,212,0.15);  color: #06b6d4;  border: 1px solid rgba(6,182,212,0.4); }
.badge.orange { background: rgba(251,146,60,0.15); color: #fb923c;  border: 1px solid rgba(251,146,60,0.4); }
.badge.purple { background: rgba(192,132,252,0.15);color: #c084fc;  border: 1px solid rgba(192,132,252,0.4); }
.badge.red    { background: rgba(248,113,113,0.15);color: #f87171;  border: 1px solid rgba(248,113,113,0.4); }
.badge.yellow { background: rgba(234,179,8,0.15);  color: #eab308;  border: 1px solid rgba(234,179,8,0.4); }
.badge.green  { background: rgba(74,222,128,0.15); color: #4ade80;  border: 1px solid rgba(74,222,128,0.4); }
.badge.blue   { background: rgba(96,165,250,0.15); color: #60a5fa;  border: 1px solid rgba(96,165,250,0.4); }
.badge.gray   { background: rgba(148,163,184,0.15);color: #94a3b8;  border: 1px solid rgba(148,163,184,0.4); }

/* ══════════════════ DOTS ══════════════════ */
.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 3px;
}
.dot.red    { background: #f87171; }
.dot.orange { background: #fb923c; }
.dot.yellow { background: #eab308; }
.dot.green  { background: #4ade80; }
.dot.cyan   { background: #06b6d4; }
.dot.gray   { background: #94a3b8; }

/* ══════════════════ CALLOUTS ══════════════════ */
.callout {
  display: flex;
  gap: 0.4cm;
  padding: 0.4cm 0.5cm;
  border-radius: 6px;
  margin: 0.4cm 0;
  page-break-inside: avoid;
}

.callout.info    { background: rgba(6,182,212,0.08);  border-left: 3px solid #06b6d4; }
.callout.tip     { background: rgba(74,222,128,0.08); border-left: 3px solid #4ade80; }
.callout.warning { background: rgba(234,179,8,0.08);  border-left: 3px solid #eab308; }

.callout-icon {
  font-size: 14pt;
  min-width: 0.6cm;
  line-height: 1.5;
}

.callout-text {
  font-size: 9.5pt;
  color: #94a3b8;
  line-height: 1.7;
}

.callout-text strong { color: #e2e8f0; }

/* ══════════════════ INTRO BOX ══════════════════ */
.intro-box {
  background: rgba(6,182,212,0.06);
  border: 1px solid rgba(6,182,212,0.2);
  border-radius: 8px;
  padding: 0.5cm 0.7cm;
  margin: 0.4cm 0 0.6cm;
}

.intro-box p {
  margin: 0;
  font-size: 11pt;
  line-height: 1.9;
  color: #cbd5e1;
}

/* ══════════════════ FEATURE GRID ══════════════════ */
.feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.3cm;
  margin: 0.4cm 0;
}

.feature-card {
  display: flex;
  gap: 0.3cm;
  padding: 0.35cm 0.4cm;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 6px;
  page-break-inside: avoid;
}

.feature-icon {
  font-size: 16pt;
  min-width: 0.6cm;
  text-align: center;
}

.feature-icon.cyan   { color: #06b6d4; }
.feature-icon.orange { color: #fb923c; }
.feature-icon.purple { color: #c084fc; }
.feature-icon.green  { color: #4ade80; }
.feature-icon.blue   { color: #60a5fa; }
.feature-icon.red    { color: #f87171; }

.feature-title {
  font-size: 9.5pt;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 0.05cm;
}

.feature-desc {
  font-size: 8.5pt;
  color: #64748b;
  line-height: 1.6;
}

/* ══════════════════ LAYOUT DIAGRAM ══════════════════ */
.layout-diagram {
  display: flex;
  gap: 0.3cm;
  margin: 0.4cm 0;
  font-size: 8.5pt;
}

.layout-sidebar {
  width: 4cm;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 6px;
  padding: 0.3cm;
  flex-shrink: 0;
}

.layout-main {
  flex: 1;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 6px;
  padding: 0.3cm;
}

.layout-label {
  font-size: 7.5pt;
  color: #06b6d4;
  font-family: "JetBrains Mono", monospace;
  margin-bottom: 0.2cm;
  letter-spacing: 0.5px;
}

.layout-item {
  padding: 0.05cm 0.2cm;
  color: #64748b;
  border-radius: 3px;
}

.layout-item.active {
  background: rgba(6,182,212,0.1);
  color: #06b6d4;
}

.layout-item.indent {
  padding-left: 0.5cm;
  font-size: 8pt;
}

.layout-content-demo {
  height: 3cm;
}

.demo-header {
  font-size: 9pt;
  color: #e2e8f0;
  font-weight: 600;
  margin-bottom: 0.25cm;
}

.demo-kpis {
  display: flex;
  gap: 0.2cm;
}

.demo-kpi {
  flex: 1;
  background: #1e293b;
  border-radius: 4px;
  padding: 0.2cm;
  text-align: center;
  font-family: "JetBrains Mono", monospace;
  font-size: 14pt;
  font-weight: 700;
  line-height: 1.3;
}

.demo-kpi small { font-size: 6pt; display: block; font-weight: 400; }
.demo-kpi.cyan   { color: #06b6d4; border: 1px solid rgba(6,182,212,0.3); }
.demo-kpi.red    { color: #f87171; border: 1px solid rgba(248,113,113,0.3); }
.demo-kpi.yellow { color: #eab308; border: 1px solid rgba(234,179,8,0.3); }
.demo-kpi.blue   { color: #60a5fa; border: 1px solid rgba(96,165,250,0.3); }

/* ══════════════════ CHART DESC ══════════════════ */
.chart-desc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.3cm;
  margin: 0.4cm 0;
}

.chart-desc-item {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 6px;
  padding: 0.35cm 0.4cm;
}

.chart-desc-title {
  font-size: 9pt;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 0.15cm;
}

.chart-desc-item p {
  font-size: 8.5pt;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

/* ══════════════════ INFO CARDS ══════════════════ */
.info-cards {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.3cm;
  margin: 0.4cm 0;
}

.info-card {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 6px;
  padding: 0.35cm 0.4cm;
}

.info-card-head {
  font-size: 9pt;
  font-weight: 700;
  color: #06b6d4;
  margin-bottom: 0.15cm;
  font-family: "JetBrains Mono", monospace;
}

.info-card ul {
  padding-left: 0.8cm;
  margin: 0;
}

.info-card li {
  font-size: 8.5pt;
  color: #64748b;
  line-height: 1.6;
}

/* ══════════════════ WORKFLOW ══════════════════ */
.workflow {
  display: flex;
  align-items: center;
  gap: 0.2cm;
  margin: 0.4cm 0;
  page-break-inside: avoid;
}

.workflow-step {
  flex: 1;
  display: flex;
  gap: 0.25cm;
  padding: 0.35cm 0.4cm;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 6px;
}

.workflow-step.red    { border-top: 2px solid #f87171; }
.workflow-step.yellow { border-top: 2px solid #eab308; }
.workflow-step.green  { border-top: 2px solid #4ade80; }
.workflow-step.cyan   { border-top: 2px solid #06b6d4; }

.workflow-num {
  font-family: "JetBrains Mono", monospace;
  font-size: 14pt;
  font-weight: 700;
  color: #1e293b;
  background: #334155;
  width: 0.6cm;
  height: 0.6cm;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9pt;
  flex-shrink: 0;
}

.workflow-title {
  font-size: 9pt;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 0.05cm;
}

.workflow-desc {
  font-size: 8pt;
  color: #64748b;
  line-height: 1.5;
}

.workflow-arrow {
  font-size: 14pt;
  color: #334155;
  flex-shrink: 0;
}

/* ══════════════════ PHASES ══════════════════ */
.phases {
  display: flex;
  align-items: center;
  gap: 0.15cm;
  margin: 0.4cm 0;
}

.phase {
  flex: 1;
  text-align: center;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 6px;
  padding: 0.3cm 0.2cm;
}

.phase-icon { font-size: 14pt; margin-bottom: 0.1cm; }

.phase-name {
  font-size: 8.5pt;
  font-weight: 700;
  color: #06b6d4;
  font-family: "JetBrains Mono", monospace;
  margin-bottom: 0.1cm;
}

.phase-desc {
  font-size: 7.5pt;
  color: #64748b;
  line-height: 1.5;
}

.phase-sep {
  font-size: 12pt;
  color: #334155;
  flex-shrink: 0;
}

/* ══════════════════ REPORT TYPES ══════════════════ */
.report-types {
  display: flex;
  flex-direction: column;
  gap: 0.25cm;
  margin: 0.4cm 0;
}

.report-type {
  display: flex;
  gap: 0.4cm;
  padding: 0.4cm 0.5cm;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 6px;
  page-break-inside: avoid;
}

.report-type-badge {
  width: 0.8cm;
  height: 0.8cm;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "JetBrains Mono", monospace;
  font-size: 8pt;
  font-weight: 700;
  flex-shrink: 0;
}

.report-type-badge.tr { background: rgba(6,182,212,0.2);  color: #06b6d4; }
.report-type-badge.es { background: rgba(192,132,252,0.2); color: #c084fc; }
.report-type-badge.rp { background: rgba(74,222,128,0.2);  color: #4ade80; }

.report-type-title {
  font-size: 10pt;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 0.1cm;
}

.report-type-desc {
  font-size: 9pt;
  color: #64748b;
  line-height: 1.65;
}

/* ══════════════════ CODE BLOCK ══════════════════ */
.code-block {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 6px;
  margin: 0.4cm 0;
  overflow: hidden;
  page-break-inside: avoid;
}

.code-header {
  background: #1e293b;
  padding: 0.15cm 0.4cm;
  font-size: 8pt;
  color: #64748b;
  font-family: "JetBrains Mono", monospace;
  border-bottom: 1px solid #334155;
}

.code-block pre {
  margin: 0;
  padding: 0.35cm 0.45cm;
  font-family: "JetBrains Mono", monospace;
  font-size: 8.5pt;
  color: #a5f3fc;
  line-height: 1.75;
  white-space: pre-wrap;
}

code {
  font-family: "JetBrains Mono", monospace;
  font-size: 8.5pt;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 3px;
  padding: 1px 4px;
  color: #a5f3fc;
}

/* ══════════════════ QUICKSTART ══════════════════ */
.quickstart {
  display: flex;
  flex-direction: column;
  gap: 0.2cm;
  margin: 0.4cm 0;
}

.qs-step {
  display: flex;
  gap: 0.4cm;
  align-items: flex-start;
  padding: 0.3cm 0.4cm;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 6px;
  page-break-inside: avoid;
}

.qs-num {
  width: 0.65cm;
  height: 0.65cm;
  border-radius: 50%;
  background: rgba(6,182,212,0.2);
  border: 1px solid rgba(6,182,212,0.5);
  color: #06b6d4;
  font-family: "JetBrains Mono", monospace;
  font-size: 9pt;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 0.05cm;
}

.qs-title {
  font-size: 10pt;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 0.05cm;
}

.qs-desc {
  font-size: 9pt;
  color: #64748b;
  line-height: 1.65;
}

/* ══════════════════ FINAL BOX ══════════════════ */
.final-box {
  background: linear-gradient(135deg, #0f172a, #06303a);
  border: 1px solid rgba(6,182,212,0.3);
  border-radius: 10px;
  padding: 0.8cm;
  text-align: center;
  margin-top: 0.8cm;
  page-break-inside: avoid;
}

.final-logo {
  font-size: 28pt;
  color: #06b6d4;
  margin-bottom: 0.1cm;
}

.final-title {
  font-size: 20pt;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: 4px;
  font-family: "JetBrains Mono", monospace;
}

.final-sub {
  font-size: 9pt;
  color: #06b6d4;
  font-family: "JetBrains Mono", monospace;
  letter-spacing: 2px;
  margin: 0.1cm 0 0.3cm;
  text-transform: uppercase;
}

.final-tagline {
  font-size: 11pt;
  color: #94a3b8;
  font-style: italic;
  margin: 0.2cm 0 0.1cm;
}

.final-credit {
  font-size: 8pt;
  color: #475569;
  font-family: "JetBrains Mono", monospace;
}

/* ══════════════════ TEXT COLORS ══════════════════ */
.text-red { color: #f87171; }
.text-cyan { color: #06b6d4; }
""")

# ── Generierung ───────────────────────────────────────────────────────────────

print("HTML aufbereiten...")
html_obj = HTML(string=html_doc, base_url=str(BASE))

print("PDF rendern (kann einen Moment dauern)...")
html_obj.write_pdf(
    target=str(OUTPUT),
    stylesheets=[css],
    presentational_hints=True,
)

print(f"PDF gespeichert: {OUTPUT}")

try:
    import pypdf
    reader = pypdf.PdfReader(str(OUTPUT))
    print(f"Seiten: {len(reader.pages)}")
except Exception:
    pass
