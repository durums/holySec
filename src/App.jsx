import React, { useState, useReducer, useCallback, useEffect, useRef, useMemo } from 'react'
import { jsPDF } from 'jspdf'
import {
  LayoutDashboard, Users, ShieldAlert, Calendar, FileText,
  Settings, ChevronLeft, ChevronRight, X, Filter, Download,
  AlertTriangle, CheckCircle2, Clock, Pause, TrendingUp,
  Building2, Activity, Target, Globe, Network, UserCheck,
  Sword, Shield, Eye, Star, Zap, Lock, Info, ChevronDown,
  ChevronUp, ExternalLink, Plus, Search, Bell, Menu, Crown,
  Users2, UserPlus, LogOut, Trash2, KeyRound, Edit3, StopCircle, PlayCircle, Timer, ClipboardList, Layers, Moon, Sun, Map
} from 'lucide-react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import {
  CLIENTS, FINDINGS, ENGAGEMENTS, REPORTS,
  MONTHLY_ENGAGEMENTS, CVSS_DISTRIBUTION, SEVERITY_DIST,
  TEAM_MEMBERS as INITIAL_TEAM, USERS_AUTH
} from './data.js'
import {
  apiLogin, apiLogout, apiMe,
  apiGetUsers, apiCreateUser, apiUpdateUser, apiUpdatePassword, apiDeleteUser,
  apiGetClients, apiCreateClient, apiUpdateClient, apiDeleteClient,
  apiGetFindings, apiCreateFinding, apiUpdateFinding, apiDeleteFinding,
  apiGetEngagements, apiCreateEngagement, apiUpdateEngagement, apiDeleteEngagement,
  apiGetReports, apiCreateReport, apiUpdateReport, apiDeleteReport,
  apiGetTimeEntries, apiCreateTimeEntry, apiDeleteTimeEntry,
  apiGetEngGroups, apiCreateEngGroup, apiUpdateEngGroup, apiDeleteEngGroup,
  apiGetAuditLogs, apiCreateAuditLog,
} from './api.js'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const NAV_GROUPS = [
  { id: 'dashboard', label: 'Dashboard',      icon: LayoutDashboard, standalone: true },
  {
    id: 'clients', label: 'Clients', icon: Building2,
    items: [
      { id: 'client-radar',   label: 'Client Radar',   icon: Activity },
      { id: 'client-manager', label: 'Client Manager', icon: Building2 },
      { id: 'map',            label: 'Client Map',     icon: Map },
    ],
  },
  {
    id: 'assessments', label: 'Assessments', icon: Target,
    items: [
      { id: 'findings',    label: 'Findings',    icon: ShieldAlert },
      { id: 'engagements', label: 'Engagements', icon: Calendar },
      { id: 'eng-groups',  label: 'Eng. Groups', icon: Layers, roles: ['Admin', 'Senior Pentester'] },
      { id: 'reports',     label: 'Reports',     icon: FileText },
    ],
  },
  { id: 'team',     label: 'Team',          icon: Users2,       standalone: true, roles: ['Senior Pentester', 'Pentester', 'Junior Pentester'] },
  {
    id: 'intern', label: 'Intern', icon: Shield, roles: ['Admin'],
    items: [
      { id: 'team',            label: 'Team',             icon: Users2        },
      { id: 'user-management', label: 'Nutzerverwaltung', icon: UserPlus      },
      { id: 'time-tracking',   label: 'Zeiterfassung',    icon: Timer         },
      { id: 'audit',           label: 'Aktivitätslog',    icon: ClipboardList },
    ],
  },
  { id: 'about',    label: 'About HolySec', icon: Crown,        standalone: true },
]

const GROUP_COLORS = {
  cyan:   { dot: 'bg-cyan-400',   ring: 'ring-cyan-400',   text: 'text-cyan-400',   hex: '#22d3ee' },
  orange: { dot: 'bg-orange-400', ring: 'ring-orange-400', text: 'text-orange-400', hex: '#fb923c' },
  purple: { dot: 'bg-purple-400', ring: 'ring-purple-400', text: 'text-purple-400', hex: '#c084fc' },
  green:  { dot: 'bg-green-400',  ring: 'ring-green-400',  text: 'text-green-400',  hex: '#4ade80' },
  blue:   { dot: 'bg-blue-400',   ring: 'ring-blue-400',   text: 'text-blue-400',   hex: '#60a5fa' },
  pink:   { dot: 'bg-pink-400',   ring: 'ring-pink-400',   text: 'text-pink-400',   hex: '#f472b6' },
  red:    { dot: 'bg-red-400',    ring: 'ring-red-400',    text: 'text-red-400',    hex: '#f87171' },
}

const STATUS_CONFIG = {
  Active:     { color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/30', dot: 'bg-cyan-400', pulse: true },
  Pending:    { color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30', dot: 'bg-yellow-400', pulse: false },
  Completed:  { color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30', dot: 'bg-green-400', pulse: false },
  'On Hold':  { color: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/30', dot: 'bg-slate-400', pulse: false },
  Planned:    { color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30', dot: 'bg-blue-400', pulse: true },
  Draft:      { color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30', dot: 'bg-yellow-400', pulse: false },
  Delivered:  { color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30', dot: 'bg-green-400', pulse: false },
  Final:      { color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/30', dot: 'bg-cyan-400', pulse: false },
  Open:            { color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30', dot: 'bg-red-400', pulse: true },
  'In Remediation':{ color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30', dot: 'bg-yellow-400', pulse: false },
  Closed:          { color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30', dot: 'bg-green-400', pulse: false },
}

const SEVERITY_COLORS = {
  CRITICAL: { text: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30', bar: 'bg-red-500' },
  HIGH:     { text: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30', bar: 'bg-orange-500' },
  MEDIUM:   { text: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30', bar: 'bg-yellow-500' },
  LOW:      { text: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30', bar: 'bg-green-500' },
}

const SCOPE_ICONS = {
  'Web': Globe,
  'Network': Network,
  'Social Engineering': UserCheck,
  'Full Red Team': Sword,
}

const NAV_LABELS = {
  en: {
    dashboard: 'Dashboard', clients: 'Clients', 'client-radar': 'Client Radar',
    'client-manager': 'Client Manager', map: 'Client Map', assessments: 'Assessments',
    findings: 'Findings', engagements: 'Engagements', 'eng-groups': 'Eng. Groups',
    reports: 'Reports', team: 'Team', intern: 'Internal', 'user-management': 'User Management',
    'time-tracking': 'Time Tracking', audit: 'Audit Log', about: 'About HolySec',
  },
  de: {
    dashboard: 'Dashboard', clients: 'Clients', 'client-radar': 'Client-Radar',
    'client-manager': 'Client-Verwaltung', map: 'Client-Karte', assessments: 'Tests',
    findings: 'Schwachstellen', engagements: 'Projekte', 'eng-groups': 'Gruppen',
    reports: 'Berichte', team: 'Team', intern: 'Intern', 'user-management': 'Nutzerverwaltung',
    'time-tracking': 'Zeiterfassung', audit: 'Aktivitätslog', about: 'Über HolySec',
  },
}

const TIPS = {
  de: {
    activeClients:      "Anzahl der Clients mit Status 'Active' — laufende Verträge und aktive Engagements.",
    openCriticals:      "CVSS ≥ 9.0 Findings mit Status 'Open' über alle Clients — erfordern sofortige Maßnahmen.",
    openFindings:       "Alle Vulnerabilities mit Status 'Open' über alle Clients und Engagements hinweg.",
    plannedTests:       "Engagements mit Status 'Planned' — noch nicht gestartete Pentests im aktuellen Quartal.",
    engPerMonth:        "Anzahl abgeschlossener und geplanter Engagements pro Monat über die letzten 12 Monate.",
    findingsBySev:      "Verteilung aller Findings nach Schweregrad (CRITICAL, HIGH, MEDIUM, LOW) über alle Clients.",
    cvssDistrib:        "Häufigkeitsverteilung der CVSS-Scores aller Findings. Zeigt wo sich die Schwachstellen im Scoring-Spektrum konzentrieren.",
    recentCritical:     "Die neuesten Findings mit Schweregrad CRITICAL (CVSS ≥ 9.0) — sortiert nach Datum, mit aktuellem Behebungsstatus.",
    clientOverview:     "Alle verwalteten Clients mit Status, Kritikalität und nächstem Testtermin. Klicken für Detailansicht.",
    clientList:         "Verwaltungsübersicht aller Clients. Zeigt Kontaktinfos, Vertragsstatus, offene Findings, Engagements und den Report-Bestand nach Typ (TR = Technical Report, ES = Executive Summary, RP = Remediation Plan).",
    clientOpenFindings: "Alle Findings mit Status 'Open' für diesen Client — inkl. kritischer Befunde die sofortige Maßnahmen erfordern.",
    clientClosed:       "Findings die erfolgreich behoben und verifiziert wurden.",
    clientBudget:       "Verbleibende Vertragsstunden. Bei > 85% Verbrauch wird der Wert rot — Nachverhandlung empfohlen.",
    clientContractEnd:  "Verbleibende Tage bis Vertragsende. Unter 30 Tagen wird eine Verlängerung empfohlen.",
    vulnDB:             "Alle erfassten Schwachstellen aus aktiven und abgeschlossenen Engagements. Zeigt CVSS-Score, Schweregrad, CVE-Referenz und aktuellen Behebungsstatus. Klicke auf einen Eintrag zum Aufklappen oder um den Status weiterzuschalten.",
    engTimeline:        "Zeitliche Darstellung aller Engagements als Gantt-Diagramm. Zeigt Laufzeit und Status auf einen Blick — hilfreich für Ressourcenplanung und Terminüberschneidungen.",
    engList:            "Liste aller Pentest-Engagements mit Status, Zeitraum und zugewiesenen Operatoren. Über das Zuweisungs-Menü (→) können Mitarbeiter einem Engagement zugeteilt werden.",
    radarActive:        "Clients mit Status 'Active' — laufender Vertrag, Engagements werden aktuell durchgeführt oder sind aktiv geplant.",
    radarOnHold:        "Clients mit Status 'On Hold' — der Pentest-Prozess ist vorübergehend pausiert, z.B. wegen laufender Patches, Freeze-Phasen oder Kundenwunsch.",
    radarCritical:      "Clients mit Kritikalitätsstufe 'CRITICAL' (CVSS ≥ 9.0 Findings offen oder sehr hohe Angriffsexponierung) — höchste Handlungspriorität.",
    radarDue:           "Clients, bei denen der nächste geplante Pentest in 30 Tagen oder weniger stattfindet — zur rechtzeitigen Vorbereitung und Ressourcenplanung.",
    reportRegistry:     "Alle erstellten Reports nach Client und Engagement. Typen: Technical Report (detaillierter Befundbericht), Executive Summary (Kurzfassung für Management), Remediation Plan (Maßnahmenplan). Status per Klick weiterschalten: Draft → Delivered → Final.",
    auditLog:           "Vollständiges Aktivitätsprotokoll aller Benutzeraktionen. Zeigt Login-Zeiten, IP-Adressen, Datenänderungen und Downloads in Echtzeit.",
  },
  en: {
    activeClients:      "Number of clients with status 'Active' — ongoing contracts and active engagements.",
    openCriticals:      "CVSS ≥ 9.0 findings with status 'Open' across all clients — require immediate action.",
    openFindings:       "All vulnerabilities with status 'Open' across all clients and engagements.",
    plannedTests:       "Engagements with status 'Planned' — pentests not yet started in the current quarter.",
    engPerMonth:        "Number of completed and planned engagements per month over the last 12 months.",
    findingsBySev:      "Distribution of all findings by severity (CRITICAL, HIGH, MEDIUM, LOW) across all clients.",
    cvssDistrib:        "Frequency distribution of CVSS scores for all findings. Shows where vulnerabilities cluster in the scoring spectrum.",
    recentCritical:     "Latest findings with severity CRITICAL (CVSS ≥ 9.0) — sorted by date, with current remediation status.",
    clientOverview:     "All managed clients with status, criticality, and next test date. Click for detail view.",
    clientList:         "Management overview of all clients. Shows contact info, contract status, open findings, engagements, and report inventory by type (TR = Technical Report, ES = Executive Summary, RP = Remediation Plan).",
    clientOpenFindings: "All findings with status 'Open' for this client — including critical findings requiring immediate action.",
    clientClosed:       "Findings that have been successfully remediated and verified.",
    clientBudget:       "Remaining contract hours. Above 85% utilization the value turns red — renegotiation recommended.",
    clientContractEnd:  "Days remaining until contract end. Under 30 days, an extension is recommended.",
    vulnDB:             "All recorded vulnerabilities from active and completed engagements. Shows CVSS score, severity, CVE reference, and current remediation status. Click an entry to expand or cycle its status.",
    engTimeline:        "Timeline view of all engagements as a Gantt chart. Shows duration and status at a glance — useful for resource planning and scheduling conflicts.",
    engList:            "List of all pentest engagements with status, timeframe, and assigned operators. Use the assignment menu (→) to assign team members to an engagement.",
    radarActive:        "Clients with status 'Active' — active contract, engagements currently being executed or actively planned.",
    radarOnHold:        "Clients with status 'On Hold' — the pentest process is temporarily paused, e.g. due to ongoing patches, freeze phases, or client request.",
    radarCritical:      "Clients with criticality level 'CRITICAL' (CVSS ≥ 9.0 findings open or very high attack exposure) — highest action priority.",
    radarDue:           "Clients whose next scheduled pentest is in 30 days or less — for timely preparation and resource planning.",
    reportRegistry:     "All created reports by client and engagement. Types: Technical Report (detailed finding report), Executive Summary (management brief), Remediation Plan (action plan). Click status to cycle: Draft → Delivered → Final.",
    auditLog:           "Complete activity log of all user actions. Shows login times, IP addresses, data changes, and downloads in real time.",
  },
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function formatDuration(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function formatDurationShort(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function daysUntil(dateStr) {
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000)
  return diff
}

function fmtDate(dateStr, lang) {
  if (!dateStr) return '—'
  if (lang !== 'de') return dateStr
  const [y, m, d] = dateStr.split('-')
  if (!y || !m || !d) return dateStr
  return `${d}.${m}.${y}`
}

function getMyScope(currentUser, assignments, allClients = [], allEngagements = [], allFindings = []) {
  if (!currentUser || currentUser.role === 'Admin') {
    return { clients: allClients, findings: allFindings, engagements: allEngagements }
  }
  const engagements = allEngagements.filter(e => (assignments[e.id] || []).includes(currentUser.id))
  const clientIds = new Set(engagements.map(e => e.clientId))
  return {
    clients:  allClients.filter(c => clientIds.has(c.id)),
    findings: allFindings.filter(f => clientIds.has(f.clientId)),
    engagements,
  }
}

const StatusBadge = React.memo(function StatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Pending']
  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded border font-mono font-medium ${pad} ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
      {status}
    </span>
  )
})

const SeverityBadge = React.memo(function SeverityBadge({ severity }) {
  const cfg = SEVERITY_COLORS[severity] || SEVERITY_COLORS.LOW
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono font-bold ${cfg.bg} ${cfg.text}`}>
      {severity}
    </span>
  )
})

function CvssBar({ score }) {
  const pct = (score / 10) * 100
  const color = score >= 9 ? 'bg-red-500' : score >= 7 ? 'bg-orange-500' : score >= 4 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-mono font-bold w-8 text-right ${score >= 9 ? 'text-red-400' : score >= 7 ? 'text-orange-400' : score >= 4 ? 'text-yellow-400' : 'text-green-400'}`}>
        {score.toFixed(1)}
      </span>
    </div>
  )
}

function InfoTooltip({ text }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-flex items-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <Info size={11} className="text-slate-500 hover:text-slate-300 cursor-help transition-colors" />
      {show && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-[10px] font-mono text-slate-400 leading-relaxed z-[100] shadow-2xl pointer-events-none whitespace-normal">
          {text}
        </div>
      )}
    </div>
  )
}

const MEMBER_COLOR_MAP = {
  cyan:   { bg: 'bg-cyan-500',   text: 'text-cyan-400',   ring: 'ring-cyan-500/30' },
  orange: { bg: 'bg-orange-500', text: 'text-orange-400', ring: 'ring-orange-500/30' },
  purple: { bg: 'bg-purple-500', text: 'text-purple-400', ring: 'ring-purple-500/30' },
  green:  { bg: 'bg-green-500',  text: 'text-green-400',  ring: 'ring-green-500/30' },
  blue:   { bg: 'bg-blue-500',   text: 'text-blue-400',   ring: 'ring-blue-500/30' },
  pink:   { bg: 'bg-pink-500',   text: 'text-pink-400',   ring: 'ring-pink-500/30' },
  red:    { bg: 'bg-red-500',    text: 'text-red-400',    ring: 'ring-red-500/30' },
}
const MEMBER_COLORS_LIST = ['cyan', 'orange', 'purple', 'green', 'blue', 'pink', 'red']

// ─── PDF GENERATOR ────────────────────────────────────────────────────────────

function generateReportPDF(report, client, allFindings = []) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, H = 297

  // Background
  doc.setFillColor(10, 10, 10)
  doc.rect(0, 0, W, H, 'F')

  // Header band
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, W, 48, 'F')
  doc.setFillColor(6, 182, 212)
  doc.rect(0, 0, 4, 48, 'F')

  // HOLYSEC wordmark
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text('HOLY', 14, 22)
  doc.setTextColor(6, 182, 212)
  doc.text('SEC', 38, 22)

  // Tagline
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text('Blessed by Offense, Built for Defense.', 14, 28)

  // CONFIDENTIAL pill
  doc.setFillColor(220, 38, 38)
  doc.rect(W - 52, 8, 40, 11, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(255, 255, 255)
  doc.text('CONFIDENTIAL', W - 32, 14.8, { align: 'center' })

  // Report title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(226, 232, 240)
  const titleLines = doc.splitTextToSize(report.title, W - 28)
  doc.text(titleLines, 14, 39)

  // Separator
  doc.setDrawColor(30, 41, 59)
  doc.setLineWidth(0.3)
  doc.line(0, 48, W, 48)

  // Metadata block
  let y = 60
  const meta = [
    ['Classification', 'CONFIDENTIAL', true],
    ['Client',         client?.name || '—', false],
    ['Author',         'Leif Balthasar  //  HolySec', false],
    ['Date',           report.date, false],
    ['Type',           report.type, false],
    ['Status',         report.status, false],
  ]
  doc.setFontSize(8)
  meta.forEach(([label, value, red]) => {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(label + ':', 14, y)
    doc.setFont('helvetica', red ? 'bold' : 'normal')
    doc.setTextColor(red ? 220 : 226, red ? 38 : 232, red ? 38 : 240)
    doc.text(value, 62, y)
    y += 7
  })

  // Section helper
  const sectionHeader = (title, yPos) => {
    doc.setFillColor(15, 23, 42)
    doc.rect(14, yPos, W - 28, 8, 'F')
    doc.setFillColor(6, 182, 212)
    doc.rect(14, yPos, 3, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(226, 232, 240)
    doc.text(title, 20, yPos + 5.2)
    return yPos + 13
  }

  // Methodology
  y += 4
  y = sectionHeader('SCOPE & METHODOLOGY', y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  const meth = 'Assessment conducted per PTES and OWASP Testing Guide v4.2. Phases: Reconnaissance, Scanning & Enumeration, Exploitation, Post-Exploitation, Reporting. All activities performed within agreed scope and timeframe.'
  const methLines = doc.splitTextToSize(meth, W - 28)
  doc.text(methLines, 14, y)
  y += methLines.length * 4.8 + 8

  // Scope block
  if (client?.scope) {
    y = sectionHeader('TARGET SCOPE', y)
    doc.setFont('courier', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(6, 182, 212)
    const allTargets = [
      ...(client.scope.ipRanges || []),
      ...(client.scope.domains || []).slice(0, 6),
    ]
    allTargets.forEach(t => {
      if (y > 250) return
      doc.text('  ' + t, 14, y)
      y += 4.5
    })
    if (client.scope.exclusions?.length) {
      doc.setTextColor(234, 179, 8)
      client.scope.exclusions.forEach(ex => {
        if (y > 255) return
        doc.text('  [EXCLUDE]  ' + ex, 14, y)
        y += 4.5
      })
    }
    y += 6
  }

  // Findings table
  const clientFindings = allFindings.filter(f => f.clientId === client?.id)
  if (clientFindings.length > 0 && y < 240) {
    y = sectionHeader('FINDINGS SUMMARY', y)

    // Table header row
    doc.setFillColor(20, 30, 48)
    doc.rect(14, y, W - 28, 7, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(100, 116, 139)
    doc.text('SEV', 16, y + 4.5)
    doc.text('FINDING', 38, y + 4.5)
    doc.text('CVSS', 148, y + 4.5)
    doc.text('STATUS', 165, y + 4.5)
    y += 8

    const sevColor = { CRITICAL: [220, 38, 38], HIGH: [249, 115, 22], MEDIUM: [234, 179, 8], LOW: [34, 197, 94] }
    clientFindings.slice(0, 10).forEach((f, i) => {
      if (y > 268) return
      const [r, g, b] = sevColor[f.severity] || [148, 163, 184]
      if (i % 2 === 0) { doc.setFillColor(15, 23, 42); doc.rect(14, y - 1, W - 28, 7, 'F') }

      doc.setFillColor(r, g, b)
      doc.rect(14, y + 0.5, 20, 5, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(5.5)
      doc.setTextColor(0, 0, 0)
      doc.text(f.severity, 24, y + 3.8, { align: 'center' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(226, 232, 240)
      const title = f.title.length > 48 ? f.title.slice(0, 48) + '…' : f.title
      doc.text(title, 38, y + 4)

      doc.setTextColor(r, g, b)
      doc.setFont('helvetica', 'bold')
      doc.text(f.cvss.toFixed(1), 152, y + 4)

      doc.setTextColor(100, 116, 139)
      doc.setFont('helvetica', 'normal')
      doc.text(f.status, 165, y + 4)
      y += 7
    })
  }

  // Footer
  doc.setDrawColor(30, 41, 59)
  doc.setLineWidth(0.3)
  doc.line(14, H - 16, W - 14, H - 16)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(6)
  doc.setTextColor(71, 85, 105)
  doc.text(`CONFIDENTIAL — solely for ${client?.name || 'authorized recipients'}. Unauthorized disclosure prohibited.`, 14, H - 11)
  doc.text('HolySec  ·  leif@holysec.de', W - 14, H - 11, { align: 'right' })

  const safeName = (client?.name || 'Client').replace(/\s+/g, '_')
  const safeType = report.type.replace(/\s+/g, '_')
  doc.save(`HolySec_${safeType}_${safeName}_${report.date}.pdf`)
}

function MemberAvatar({ member, size = 'sm' }) {
  const colorKey = member.color || MEMBER_COLORS_LIST[parseInt(member.id?.replace(/\D/g, '') || '0') % MEMBER_COLORS_LIST.length]
  const cfg = MEMBER_COLOR_MAP[colorKey] || MEMBER_COLOR_MAP.cyan
  const sz = size === 'sm' ? 'w-6 h-6 text-[9px]' : size === 'md' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  return (
    <div className={`${sz} rounded-full ${cfg.bg} flex items-center justify-center font-mono font-black text-black shrink-0 select-none`} title={member.name}>
      {member.initials}
    </div>
  )
}

const Panel = React.memo(function Panel({ children, className = '', onClick }) {
  return (
    <div className={`bg-[#0f172a] border border-[#1e293b] rounded-lg ${className} ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      {children}
    </div>
  )
})

const PanelHeader = React.memo(function PanelHeader({ title, subtitle, children, info }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e293b]">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-mono font-semibold text-slate-100 tracking-wider uppercase">{title}</h2>
          {info && <InfoTooltip text={info} />}
        </div>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
})

const KpiCard = React.memo(function KpiCard({ label, value, sub, icon: Icon, accent = false, danger = false, info, onClick, active }) {
  const isHighlighted = accent || active
  const isDanger = danger && value > 0
  return (
    <Panel
      className={`p-5 transition-all duration-200 ${isDanger ? 'border-red-500/50 bg-red-500/8 hover:border-red-500/70' : 'hover:border-cyan-500/40 ' + (isHighlighted ? 'border-cyan-500/40 bg-cyan-500/5' : '')}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-mono uppercase tracking-widest ${isDanger ? 'text-red-400' : 'text-slate-500'}`}>{label}</span>
          {info && <InfoTooltip text={info} />}
        </div>
        <div className={`p-1.5 rounded ${isDanger ? 'bg-red-500/20' : isHighlighted ? 'bg-cyan-500/20' : 'bg-slate-800'}`}>
          <Icon size={14} className={`${isDanger ? 'text-red-400 animate-pulse' : isHighlighted ? 'text-cyan-400' : 'text-slate-400'}`} />
        </div>
      </div>
      <div className={`text-3xl font-mono font-bold mb-1 ${isDanger ? 'text-red-400' : isHighlighted ? 'text-cyan-400 text-glow' : 'text-slate-100'}`}>{value}</div>
      {sub && <div className={`text-xs font-mono ${isDanger ? 'text-red-400/60' : 'text-slate-500'}`}>{sub}</div>}
    </Panel>
  )
})

// ─── LOGIN ────────────────────────────────────────────────────────────────────

function NetworkCanvas({ darkMode = true }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, frame = 0

    const C = darkMode
      ? { r: 6, g: 182, b: 212, nodeAlpha: [0.20, 0.55], glowAlpha: 0.22, lineMax: 0.10, labelAlpha: [0.30, 0.20], pulseAlpha: 0.8 }
      : { r: 2,  g: 100, b: 180, nodeAlpha: [0.50, 0.80], glowAlpha: 0.55, lineMax: 0.35, labelAlpha: [0.55, 0.30], pulseAlpha: 1.0 }
    const rgb = `${C.r},${C.g},${C.b}`

    const GLOW = 18
    const gc = new OffscreenCanvas(GLOW * 2, GLOW * 2)
    const gctx = gc.getContext('2d')
    const gr = gctx.createRadialGradient(GLOW, GLOW, 0, GLOW, GLOW, GLOW)
    gr.addColorStop(0, `rgba(${rgb},${C.glowAlpha})`)
    gr.addColorStop(1, `rgba(${rgb},0)`)
    gctx.fillStyle = gr
    gctx.beginPath(); gctx.arc(GLOW, GLOW, GLOW, 0, Math.PI * 2); gctx.fill()
    const glowBitmap = gc.transferToImageBitmap()

    const LABELS = ['10.0.0.1', '192.168.1.1', 'CVE-2024', 'SSH:22', 'RDP:3389', '443/tcp', 'SMB:445', '0x4f5c']
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)
    resize()

    const count = Math.min(38, Math.floor(canvas.width * canvas.height / 18000))
    const nodes = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: i < 8 ? 2.2 : 1.3,
      label: i < 8 ? LABELS[i] : null,
      t: Math.random() * Math.PI * 2,
    }))
    const pulses = []

    const MAX = 125, MAX2 = MAX * MAX
    // Verbindungen in Alpha-Buckets bündeln → statt ~800 einzelne stroke()-Calls nur ~8
    const BUCKETS = 8
    const buckets = Array.from({ length: BUCKETS }, () => [])
    const alphaStrs = Array.from({ length: BUCKETS }, (_, b) =>
      `rgba(${rgb},${((b + 1) / BUCKETS * C.lineMax).toFixed(3)})`
    )

    const draw = () => {
      animId = requestAnimationFrame(draw)
      frame++
      if (frame % 2 !== 0) return  // 30fps cap

      const w = canvas.width, h = canvas.height
      ctx.clearRect(0, 0, w, h)

      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy; n.t += 0.012
        if (n.x < 0) { n.x = 0; n.vx = Math.abs(n.vx) } else if (n.x > w) { n.x = w; n.vx = -Math.abs(n.vx) }
        if (n.y < 0) { n.y = 0; n.vy = Math.abs(n.vy) } else if (n.y > h) { n.y = h; n.vy = -Math.abs(n.vy) }
      })

      if (frame % 100 === 0 && pulses.length < 7) {
        for (let a = 0; a < 20; a++) {
          const i = Math.floor(Math.random() * count), j = Math.floor(Math.random() * count)
          if (i === j) continue
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y
          if (dx*dx + dy*dy < MAX2) { pulses.push({ from: i, to: j, t: 0 }); break }
        }
      }

      // Verbindungen: kein sqrt, Buckets für Batch-Draw
      buckets.forEach(b => { b.length = 0 })
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y
          const d2 = dx*dx + dy*dy
          if (d2 < MAX2) {
            const b = Math.min(BUCKETS - 1, (BUCKETS * (1 - d2 / MAX2)) | 0)
            buckets[b].push(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y)
          }
        }
      }
      ctx.lineWidth = 0.5
      for (let b = 0; b < BUCKETS; b++) {
        if (!buckets[b].length) continue
        ctx.strokeStyle = alphaStrs[b]
        ctx.beginPath()
        for (let k = 0; k < buckets[b].length; k += 4) {
          ctx.moveTo(buckets[b][k], buckets[b][k+1])
          ctx.lineTo(buckets[b][k+2], buckets[b][k+3])
        }
        ctx.stroke()
      }

      // Pulses
      for (let p = pulses.length - 1; p >= 0; p--) {
        pulses[p].t += 0.025
        if (pulses[p].t >= 1) { pulses.splice(p, 1); continue }
        const { from, to, t } = pulses[p]
        const n1 = nodes[from], n2 = nodes[to]
        if ((n1.x-n2.x)**2 + (n1.y-n2.y)**2 > MAX2) { pulses.splice(p, 1); continue }
        ctx.fillStyle = `rgba(${rgb},${Math.sin(t * Math.PI) * C.pulseAlpha})`
        ctx.beginPath()
        ctx.arc(n1.x + (n2.x - n1.x) * t, n1.y + (n2.y - n1.y) * t, 2, 0, Math.PI * 2)
        ctx.fill()
      }

      // Knoten: Glow via pre-gerendertem Bitmap (drawImage statt createRadialGradient)
      nodes.forEach(n => {
        const pulse = 0.5 + 0.5 * Math.sin(n.t)
        if (n.r > 1.5) {
          ctx.globalAlpha = 0.12 + pulse * 0.10
          ctx.drawImage(glowBitmap, n.x - GLOW, n.y - GLOW)
          ctx.globalAlpha = 1
        }
        ctx.fillStyle = `rgba(${rgb},${(C.nodeAlpha[0] + pulse * C.nodeAlpha[1]).toFixed(2)})`
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill()
        if (n.label) {
          ctx.fillStyle = `rgba(${rgb},${(C.labelAlpha[0] + pulse * C.labelAlpha[1]).toFixed(2)})`
          ctx.font = '7px monospace'
          ctx.fillText(n.label, n.x + n.r + 4, n.y + 3)
        }
      })
    }

    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [darkMode])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

function LoginPage({ onLogin, darkMode, onToggleDark, usersAuth = USERS_AUTH }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [bootLines, setBootLines] = useState([])
  const [formReady, setFormReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const msgs = [
      '> HOLYSEC OPS PLATFORM v1.0 — STARTING...',
      '> SECURE CHANNEL ESTABLISHED [AES-256-GCM]',
      '> THREAT INTELLIGENCE MODULE LOADED',
      '> AUTHENTICATION REQUIRED.',
    ]
    const timers = msgs.map((msg, i) =>
      setTimeout(() => {
        if (cancelled) return
        setBootLines(prev => [...prev, msg])
        if (i === msgs.length - 1) setTimeout(() => { if (!cancelled) setFormReady(true) }, 250)
      }, 300 + i * 380)
    )
    return () => { cancelled = true; timers.forEach(clearTimeout) }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const memberId = await apiLogin(email, password)
      onLogin(memberId)
    } catch (err) {
      setError(err.message || 'Login fehlgeschlagen.')
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
      {/* Dark/Light toggle */}
      <button
        onClick={onToggleDark}
        className="absolute top-4 right-4 z-20 p-2 rounded-lg border border-[#1e293b] bg-[#0f172a]/80 backdrop-blur-sm text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
        title={darkMode ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
      >
        {darkMode ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* Network canvas background */}
      <NetworkCanvas darkMode={darkMode} />

      {/* Radial glow center */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 55% 45% at 50% 50%, rgba(6,182,212,0.05) 0%, transparent 70%)' }} />

      {/* Corner vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 35%, rgba(0,0,0,0.75) 100%)' }} />

      <div className="relative w-full max-w-sm px-4 z-10">
        {/* Logo */}
        <div className="text-center mb-5">
          <div className="icon-ring inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mb-4 relative overflow-hidden">
            <Crown size={28} className="text-cyan-400 relative z-10" />
            <div className="absolute inset-0 animate-pulse bg-cyan-500/5" />
            <div className="icon-ring-glow" />
          </div>
          <h1 className="cyber-glitch text-2xl font-mono font-black text-slate-100 tracking-[0.3em]">
            HOLY<span className="text-cyan-400">SEC</span>
          </h1>
          <p className="text-[10px] font-mono text-slate-600 mt-1 tracking-widest">BLESSED BY OFFENSE · BUILT FOR DEFENSE</p>
        </div>

        {/* Boot sequence */}
        <div className="mb-5 min-h-[68px] space-y-1">
          {bootLines.map((line, i) => (
            <div key={i} className="boot-line flex items-center gap-2">
              <span className={`text-[10px] font-mono ${i === bootLines.length - 1 && !formReady ? 'text-cyan-400' : 'text-slate-700'}`}>
                {line}
              </span>
              {i === bootLines.length - 1 && !formReady && (
                <span className="inline-block w-1.5 h-3 bg-cyan-400 animate-pulse" />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={formReady ? {} : { opacity: 0, pointerEvents: 'none' }}
          className={formReady ? 'form-in' : ''}>
          {/* Corner brackets */}
          <div className="absolute pointer-events-none" style={{ inset: '-4px' }}>
            <div className="corner absolute top-0 left-0 border-t-2 border-l-2 border-cyan-500/70 rounded-tl" />
            <div className="corner absolute top-0 right-0 border-t-2 border-r-2 border-cyan-500/70 rounded-tr" style={{ animationDelay: '0.1s' }} />
            <div className="corner absolute bottom-0 left-0 border-b-2 border-l-2 border-cyan-500/70 rounded-bl" style={{ animationDelay: '0.2s' }} />
            <div className="corner absolute bottom-0 right-0 border-b-2 border-r-2 border-cyan-500/70 rounded-br" style={{ animationDelay: '0.3s' }} />
          </div>

          <div className="neon-card bg-[#0f172a] border border-cyan-500/15 rounded-2xl p-7 relative overflow-hidden">
            <div className="neon-card-glow" />
            {/* Scan beam */}
            <div className="scan-beam" />

            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.25em]">
                Operator Authentication
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider block mb-1.5">E-Mail</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="user@holysec.de"
                  className="w-full bg-[#0a0a0a] border border-[#1e293b] rounded-lg px-4 py-2.5 text-sm font-mono text-slate-200 placeholder-slate-700 focus:outline-none focus:border-cyan-500/60 transition-all"
                  style={{ transition: 'border-color 0.2s, box-shadow 0.2s' }}
                  onFocus={e => e.target.style.boxShadow = '0 0 14px rgba(6,182,212,0.18)'}
                  onBlur={e => e.target.style.boxShadow = 'none'} />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider block mb-1.5">Passwort</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••••••"
                  className="w-full bg-[#0a0a0a] border border-[#1e293b] rounded-lg px-4 py-2.5 text-sm font-mono text-slate-200 placeholder-slate-700 focus:outline-none focus:border-cyan-500/60 transition-all"
                  style={{ transition: 'border-color 0.2s, box-shadow 0.2s' }}
                  onFocus={e => e.target.style.boxShadow = '0 0 14px rgba(6,182,212,0.18)'}
                  onBlur={e => e.target.style.boxShadow = 'none'} />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs font-mono text-red-400 bg-red-400/8 border border-red-400/20 rounded-lg px-3 py-2">
                  <AlertTriangle size={12} /> {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-mono font-bold text-sm tracking-widest transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                style={{ boxShadow: '0 0 20px rgba(6,182,212,0.3)' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 32px rgba(6,182,212,0.55)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(6,182,212,0.3)'}>
                {loading
                  ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  : <><KeyRound size={14} /> EINLOGGEN</>
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function Sidebar({ active, onNav, collapsed, onToggle, currentUser, onLogout, uiLang = 'en', mobileOpen = false, onMobileClose, onSettingsOpen, darkMode = true }) {
  const activeGroup = NAV_GROUPS.find(g => !g.standalone && g.items?.some(i => i.id === active))

  const [openGroups, setOpenGroups] = useState(() => {
    const initial = new Set(['clients', 'assessments'])
    if (activeGroup) initial.add(activeGroup.id)
    return initial
  })

  useEffect(() => {
    if (activeGroup) setOpenGroups(prev => new Set([...prev, activeGroup.id]))
  }, [active])

  const toggleGroup = (groupId) => {
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const renderItem = (item) => {
    if (item.roles && !item.roles.includes(currentUser?.role)) return null
    const isActive = active === item.id
    const Icon = item.icon
    const label = NAV_LABELS[uiLang]?.[item.id] || item.label
    return (
      <button
        key={item.id}
        onClick={() => { onNav(item.id); onMobileClose?.() }}
        title={collapsed ? label : undefined}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-all duration-150 group
          ${isActive
            ? 'bg-cyan-500/10 text-slate-300 border-l-2 border-l-cyan-400 border-t border-r border-b border-t-cyan-500/10 border-r-cyan-500/10 border-b-cyan-500/10'
            : darkMode
              ? 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent'
          }`}
      >
        <Icon size={16} className={`shrink-0 ${isActive ? 'text-cyan-400' : darkMode ? 'text-slate-500 group-hover:text-slate-300' : 'text-gray-500 group-hover:text-gray-800'}`} />
        {!collapsed && <span className="text-xs font-mono font-medium tracking-wide truncate">{label}</span>}
        {!collapsed && isActive && <div className="ml-auto w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />}
      </button>
    )
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onMobileClose} />
      )}
    <aside className={`
      flex flex-col border-r transition-all duration-300 shrink-0
      ${darkMode ? 'bg-[#0a0a0a] border-[#1e293b]' : 'bg-white border-gray-200'}
      ${collapsed ? 'w-16' : 'w-56'}
      fixed lg:relative inset-y-0 left-0 z-50
      ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className={`flex items-center justify-between px-4 py-5 border-b ${darkMode ? 'border-[#1e293b]' : 'border-gray-200'}`}>
        {!collapsed && (
          <div>
            <div className="text-xs font-mono font-bold text-cyan-400 tracking-[0.2em] text-glow">HOLYSEC</div>
            <div className={`text-[10px] font-mono tracking-[0.15em] ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>// Leif Balthasar</div>
          </div>
        )}
        <button onClick={onToggle} className={`p-1 rounded hover:text-cyan-400 transition-colors ml-auto ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        {NAV_GROUPS.map(group => {
          if (group.roles && !group.roles.includes(currentUser?.role)) return null

          if (group.standalone) return renderItem(group)

          const visibleItems = group.items.filter(i => !i.roles || i.roles.includes(currentUser?.role))
          if (visibleItems.length === 0) return null

          if (collapsed) return visibleItems.map(renderItem)

          const isGroupActive = visibleItems.some(i => i.id === active)
          const isOpen = openGroups.has(group.id)
          const GroupIcon = group.icon

          return (
            <div key={group.id} className="mt-2">
              <button
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded transition-all duration-150
                  ${isGroupActive ? 'text-cyan-400/80' : darkMode ? 'text-slate-600 hover:text-slate-400' : 'text-gray-600 hover:text-gray-800'}`}
              >
                <GroupIcon size={15} className="shrink-0" />
                <span className="text-xs font-mono font-bold uppercase tracking-widest flex-1 text-left">
                  {NAV_LABELS[uiLang]?.[group.id] || group.label}
                </span>
                {isOpen
                  ? <ChevronUp size={10} className="shrink-0 opacity-60" />
                  : <ChevronDown size={10} className="shrink-0 opacity-60" />
                }
              </button>

              {isOpen && (
                <div className={`ml-2 mt-0.5 mb-1 pl-2.5 border-l space-y-0.5 ${darkMode ? 'border-[#1e293b]' : 'border-gray-200'}`}>
                  {visibleItems.map(renderItem)}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className={`px-3 py-3 border-t ${darkMode ? 'border-[#1e293b]' : 'border-gray-200'}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <button onClick={onSettingsOpen} title="Einstellungen"
              className={`w-full flex justify-center p-2 rounded hover:text-cyan-400 hover:bg-cyan-500/10 transition-all ${darkMode ? 'text-slate-600' : 'text-gray-500'}`}>
              <Settings size={14} />
            </button>
            <button onClick={onLogout} title="Logout"
              className={`w-full flex justify-center p-2 rounded hover:text-red-400 hover:bg-red-400/10 transition-all ${darkMode ? 'text-slate-700' : 'text-gray-500'}`}>
              <LogOut size={14} />
            </button>
          </div>
        ) : currentUser ? (
          <div className="space-y-1">
            <button
              onClick={onSettingsOpen}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded transition-all group ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-gray-100'}`}
              title="Einstellungen öffnen"
            >
              <MemberAvatar member={currentUser} size="md" />
              <div className="flex-1 min-w-0 text-left">
                <div className={`text-xs font-mono truncate transition-colors ${darkMode ? 'text-slate-300 group-hover:text-slate-100' : 'text-gray-700 group-hover:text-gray-900'}`}>{currentUser.name}</div>
                <div className={`text-[10px] font-mono ${darkMode ? 'text-slate-600' : 'text-gray-400'}`}>{currentUser.role}</div>
              </div>
              <Settings size={12} className={`shrink-0 transition-colors group-hover:text-cyan-400 ${darkMode ? 'text-slate-700' : 'text-gray-400'}`} />
            </button>
            <button onClick={onLogout}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded hover:text-red-400 hover:bg-red-400/10 transition-all text-[10px] font-mono ${darkMode ? 'text-slate-700' : 'text-gray-500'}`}>
              <LogOut size={11} /> Abmelden
            </button>
          </div>
        ) : null}
      </div>
    </aside>
    </>
  )
}

// ─── TOPBAR ──────────────────────────────────────────────────────────────────

function TopBar({ title, subtitle, currentUser, assignments, clients: allClients = [], engagements: allEngagements = [], findings: allFindings = [], activeTimer, onClockIn, onClockOut, userPresence, onPresenceChange, darkMode, onToggleDark, reminders = [], onMobileMenuToggle }) {
  const [showNotifs, setShowNotifs] = useState(false)
  const [showPresence, setShowPresence] = useState(false)
  const [readNotifs, setReadNotifs] = useState(() => {
    try {
      const key = `holysec_read_notifs_${currentUser?.id || 'guest'}`
      return new Set(JSON.parse(localStorage.getItem(key) || '[]'))
    } catch { return new Set() }
  })
  const [elapsed, setElapsed] = useState(0)
  const { clients: scopeClients, findings: scopeFindings, engagements: scopeEngagements } = useMemo(
    () => getMyScope(currentUser, assignments, allClients, allEngagements, allFindings),
    [currentUser, assignments, allClients, allEngagements, allFindings]
  )

  const isTimerMine = activeTimer?.userId === currentUser?.id
  useEffect(() => {
    if (!isTimerMine) { setElapsed(0); return }
    setElapsed(Math.floor((Date.now() - activeTimer.start) / 1000))
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - activeTimer.start) / 1000)), 1000)
    return () => clearInterval(id)
  }, [isTimerMine, activeTimer])

  const allNotifItems = useMemo(() => [
    ...reminders.filter(r => r.toUserIds.includes(currentUser?.id)).map(r => ({
      id: `rem-${r.id}`,
      Icon: Bell,
      color: 'text-orange-400',
      bg: 'bg-orange-500/5 border-orange-500/10',
      label: `Erinnerung von ${r.fromName}`,
      body: r.findingTitle,
      sub: r.message || null,
    })),
    ...scopeFindings.filter(f => f.severity === 'CRITICAL' && f.status === 'Open').slice(0, 3).map(f => {
      const client = scopeClients.find(c => c.id === f.clientId)
      return { id: f.id, Icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/5 border-red-500/10', label: 'Critical Finding offen', body: f.title, sub: client?.name }
    }),
    ...scopeClients.filter(c => { const d = daysUntil(c.nextTest); return d >= 0 && d <= 14 }).slice(0, 2).map(c => {
      const d = daysUntil(c.nextTest)
      return { id: `t-${c.id}`, Icon: Calendar, color: 'text-yellow-400', bg: 'bg-yellow-500/5 border-yellow-500/10', label: `Test in ${d === 0 ? 'HEUTE' : d + 'd'}`, body: c.name, sub: c.industry }
    }),
    ...scopeEngagements.filter(e => e.status === 'Active').slice(0, 2).map(e => {
      const client = scopeClients.find(c => c.id === e.clientId)
      return { id: `e-${e.id}`, Icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/5 border-cyan-500/10', label: 'Aktives Engagement', body: e.title, sub: client?.name }
    }),
  ], [reminders, currentUser?.id, scopeFindings, scopeClients, scopeEngagements])
  const notifItems = useMemo(() => allNotifItems.filter(n => !readNotifs.has(n.id)), [allNotifItems, readNotifs])
  const lsKey = `holysec_read_notifs_${currentUser?.id || 'guest'}`
  const markRead = (id) => setReadNotifs(prev => {
    const next = new Set([...prev, id])
    localStorage.setItem(lsKey, JSON.stringify([...next]))
    return next
  })
  const markAllRead = () => {
    const next = new Set(allNotifItems.map(n => n.id))
    localStorage.setItem(lsKey, JSON.stringify([...next]))
    setReadNotifs(next)
  }

  const presenceCfg = {
    online: { dot: 'bg-green-400', text: 'text-green-400', label: 'ONLINE', ping: true },
    away:   { dot: 'bg-yellow-400', text: 'text-yellow-400', label: 'ABWESEND', ping: false },
  }
  const pCfg = presenceCfg[userPresence] || presenceCfg.online

  return (
    <header className="flex items-center justify-between px-3 lg:px-6 py-3 lg:py-4 border-b border-[#1e293b] bg-[#0a0a0a] shrink-0 relative z-20">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMobileMenuToggle} className="lg:hidden p-1.5 rounded text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition-colors shrink-0">
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="text-sm font-mono font-bold text-slate-100 tracking-widest uppercase truncate">{title}</h1>
          {subtitle && <p className="text-xs font-mono text-slate-600 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 lg:gap-3 shrink-0">
        {/* Dark/Light toggle */}
        <button onClick={onToggleDark}
          className="p-2 rounded text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition-all"
          title={darkMode ? 'Light Mode' : 'Dark Mode'}>
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          {notifItems.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center z-10 pointer-events-none">
              <span className="text-[8px] font-mono font-bold text-white leading-none">{notifItems.length}</span>
            </span>
          )}
          <button
            onClick={() => setShowNotifs(v => !v)}
            className={`p-2 rounded transition-all ${showNotifs ? 'text-cyan-400 bg-slate-800' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'}`}>
            <Bell size={15} />
          </button>

          {showNotifs && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
              <div className="absolute right-0 top-11 w-72 sm:w-80 bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e293b]">
                  <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-widest">Benachrichtigungen</span>
                  {notifItems.length > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-mono text-slate-500 hover:text-cyan-400 transition-colors">
                      Alle gelesen
                    </button>
                  )}
                </div>
                <div className="divide-y divide-[#1e293b] max-h-80 overflow-y-auto">
                  {notifItems.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs font-mono text-slate-600">Keine neuen Benachrichtigungen</div>
                  ) : notifItems.map(n => (
                    <div key={n.id} className={`px-4 py-3 flex items-start gap-3 border ${n.bg} hover:bg-slate-800/20 transition-colors`}>
                      <n.Icon size={13} className={`mt-0.5 shrink-0 ${n.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-[10px] font-mono font-bold uppercase tracking-wider mb-0.5 ${n.color}`}>{n.label}</div>
                        <div className="text-xs font-mono text-slate-300 truncate">{n.body}</div>
                        {n.sub && <div className="text-[10px] font-mono text-slate-600">{n.sub}</div>}
                      </div>
                      <button onClick={() => markRead(n.id)}
                        className="shrink-0 p-1 rounded text-slate-700 hover:text-slate-400 transition-colors" title="Als gelesen markieren">
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Clock in/out */}
        {isTimerMine ? (
          <div className="flex items-center gap-2 px-2 lg:px-3 py-1.5 bg-green-500/5 border border-green-500/25 rounded">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs font-mono text-green-400 tabular-nums w-16 hidden sm:inline">{formatDuration(elapsed)}</span>
            <button onClick={onClockOut}
              className="flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-red-400 transition-colors sm:border-l sm:border-green-500/20 sm:pl-2 sm:ml-1">
              <StopCircle size={11} /><span className="hidden sm:inline"> STOP</span>
            </button>
          </div>
        ) : (
          <button onClick={onClockIn}
            className="flex items-center gap-1.5 px-2 lg:px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded text-xs font-mono text-green-400 hover:bg-green-500/20 hover:border-green-500/50 transition-all">
            <PlayCircle size={13} /><span className="hidden sm:inline"> Einstempeln</span>
          </button>
        )}

        {/* Presence */}
        <div className="relative hidden sm:block">
          <button onClick={() => setShowPresence(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#0f172a] border border-[#1e293b] hover:border-slate-600 rounded transition-all">
            <div className={`relative w-2 h-2 rounded-full ${pCfg.dot}`}>
              {pCfg.ping && <div className={`absolute inset-0 rounded-full ${pCfg.dot} animate-ping opacity-60`} />}
            </div>
            <span className={`text-xs font-mono ${pCfg.text}`}>{pCfg.label}</span>
            <ChevronDown size={10} className="text-slate-600" />
          </button>
          {showPresence && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPresence(false)} />
              <div className="absolute right-0 top-10 w-40 bg-[#0f172a] border border-[#1e293b] rounded-lg shadow-xl z-50 overflow-hidden">
                {Object.entries(presenceCfg).map(([key, cfg]) => (
                  <button key={key} onClick={() => { onPresenceChange(key); setShowPresence(false) }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-mono hover:bg-slate-800/50 transition-colors ${userPresence === key ? cfg.text : 'text-slate-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                    {userPresence === key && <CheckCircle2 size={10} className="ml-auto" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

function DashboardBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded px-3 py-2 text-xs font-mono">
      <p className="text-slate-400">{label}</p>
      <p className="text-cyan-400">{payload[0].value} Engagements</p>
    </div>
  )
}

function DashboardPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded px-3 py-2 text-xs font-mono">
      <p style={{ color: payload[0].payload.color }}>{payload[0].name}: {payload[0].value}</p>
    </div>
  )
}

function Dashboard({ onClientClick, clients: allClients = [], currentUser, assignments = {}, findings: allFindingsProp = [], engagements: allEngProp = [], onNav, tipsLang = 'de' }) {
  const { clients: scopedClients } = useMemo(
    () => getMyScope(currentUser, assignments, allClients, allEngProp, allFindingsProp),
    [currentUser, assignments, allClients, allEngProp, allFindingsProp]
  )
  const activeClients      = useMemo(() => scopedClients.filter(c => c.status === 'Active').length, [scopedClients])
  const openCriticals      = useMemo(() => allFindingsProp.filter(f => f.severity === 'CRITICAL' && f.status === 'Open').length, [allFindingsProp])
  const totalOpen          = useMemo(() => allFindingsProp.filter(f => f.status === 'Open').length, [allFindingsProp])
  const plannedEngagements = useMemo(() => allEngProp.filter(e => e.status === 'Planned').length, [allEngProp])

  return (
    <div className="p-3 lg:p-6 space-y-4 lg:space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label="Active Clients" value={activeClients} sub={`${scopedClients.length} total`} icon={Users} accent info={TIPS[tipsLang].activeClients} onClick={() => onNav?.('client-radar')} />
        <KpiCard label="Open Criticals" value={openCriticals} sub="Require immediate action" icon={AlertTriangle} danger info={TIPS[tipsLang].openCriticals} onClick={() => onNav?.('findings', { severity: 'CRITICAL', status: 'Open' })} />
        <KpiCard label="Open Findings" value={totalOpen} sub={`${allFindingsProp.length} total tracked`} icon={ShieldAlert} info={TIPS[tipsLang].openFindings} onClick={() => onNav?.('findings', { status: 'Open' })} />
        <KpiCard label="Planned Tests" value={plannedEngagements} sub="This quarter" icon={Calendar} info={TIPS[tipsLang].plannedTests} onClick={() => onNav?.('engagements', { status: 'Planned' })} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="col-span-1 lg:col-span-2">
          <PanelHeader title="Engagements / Month" subtitle="Last 12 months" info={TIPS[tipsLang].engPerMonth} />
          <div className="p-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_ENGAGEMENTS} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <Tooltip content={<DashboardBarTooltip />} cursor={{ fill: 'rgba(6,182,212,0.05)' }} />
                <Bar dataKey="count" fill="#06b6d4" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Findings by Severity" info={TIPS[tipsLang].findingsBySev} />
          <div className="p-4 h-52 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie data={SEVERITY_DIST} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {SEVERITY_DIST.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<DashboardPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-3 mt-1">
              {SEVERITY_DIST.map(s => (
                <div key={s.name} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[10px] font-mono text-slate-500">{s.name.slice(0,4)}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* CVSS Distribution + Recent Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <PanelHeader title="CVSS Score Distribution" info={TIPS[tipsLang].cvssDistrib} />
          <div className="p-4 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={CVSS_DISTRIBUTION}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6, fontFamily: 'monospace', fontSize: 11 }} />
                <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Recent Critical Findings" info={TIPS[tipsLang].recentCritical} />
          <div className="divide-y divide-[#1e293b]">
            {allFindingsProp.filter(f => f.severity === 'CRITICAL').sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 4).map(f => {
              const client = allClients.find(c => c.id === f.clientId)
              return (
                <div key={f.id} className="px-4 py-3 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-slate-200 truncate">{f.title}</p>
                      <p className="text-[10px] font-mono text-slate-600 mt-0.5">{client?.name}</p>
                    </div>
                    <StatusBadge status={f.status} />
                  </div>
                  <CvssBar score={f.cvss} />
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

    </div>
  )
}

// ─── CLIENT MODAL ────────────────────────────────────────────────────────────

function ClientModal({ client, onSave, onClose }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState(client ? { ...client, contact: { ...client.contact }, contract: { ...client.contract } } : {
    id: `c${Date.now()}`,
    name: '', industry: '', status: 'Active', scopeType: 'Web', criticality: 'MEDIUM',
    nextTest: today,
    contact: { name: '', email: '', phone: '' },
    contract: { start: today, end: '', hours: 80, used: 0 },
    scope: { ipRanges: [], domains: [], exclusions: [] },
    findings: [], engagements: [], reports: [], openFindings: 0,
  })

  const [locationQuery,   setLocationQuery]   = useState('')
  const [locationResults, setLocationResults] = useState([])
  const [locationLoading, setLocationLoading] = useState(false)
  const locationDebounce = useRef(null)

  useEffect(() => {
    const q = locationQuery.trim()
    if (q.length < 2) { setLocationResults([]); return }
    clearTimeout(locationDebounce.current)
    locationDebounce.current = setTimeout(async () => {
      setLocationLoading(true)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`, {
          headers: { 'Accept-Language': 'de' }
        })
        const data = await res.json()
        setLocationResults(data)
      } catch { setLocationResults([]) }
      finally { setLocationLoading(false) }
    }, 400)
  }, [locationQuery])

  const pickLocation = (result) => {
    const city = result.address?.city || result.address?.town || result.address?.village || result.address?.municipality || result.address?.county || ''
    setForm(f => ({ ...f, city, lat: parseFloat(parseFloat(result.lat).toFixed(4)), lng: parseFloat(parseFloat(result.lon).toFixed(4)) }))
    setLocationQuery('')
    setLocationResults([])
  }

  const iCls = "w-full bg-[#0a0a0a] border border-[#1e293b] rounded px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-700 focus:outline-none focus:border-cyan-500/50 transition-colors"
  const sCls = "w-full bg-[#0a0a0a] border border-[#1e293b] rounded px-3 py-2 text-xs font-mono text-slate-400 focus:outline-none focus:border-cyan-500/50 transition-colors"
  const lCls = "text-[10px] font-mono text-slate-600 uppercase tracking-wider block mb-1"

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setC = (k, v) => setForm(f => ({ ...f, contact: { ...f.contact, [k]: v } }))
  const setK = (k, v) => setForm(f => ({ ...f, contract: { ...f.contract, [k]: v } }))

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b]">
          <h2 className="text-sm font-mono font-bold text-slate-100 tracking-wider">
            {client ? 'CLIENT BEARBEITEN' : 'NEUER CLIENT'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all"><X size={14} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form); onClose() }} className="p-3 lg:p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lCls}>Name</label><input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Firmenname" className={iCls} /></div>
            <div><label className={lCls}>Branche</label><input value={form.industry} onChange={e => set('industry', e.target.value)} required placeholder="z.B. Healthcare" className={iCls} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={lCls}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={sCls}>
                {['Active','Pending','Completed','On Hold'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={lCls}>Scope-Typ</label>
              <select value={form.scopeType} onChange={e => set('scopeType', e.target.value)} className={sCls}>
                {['Web','Network','Social Engineering','Full Red Team'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={lCls}>Kritikalität</label>
              <select value={form.criticality} onChange={e => set('criticality', e.target.value)} className={sCls}>
                {['CRITICAL','HIGH','MEDIUM','LOW'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div><label className={lCls}>Nächster Test</label><input type="date" value={form.nextTest} onChange={e => set('nextTest', e.target.value)} className={iCls} /></div>
          <div>
            <div className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest mb-3 border-b border-[#1e293b] pb-1">Standort (für Client Map)</div>
            <div className="relative">
              <label className={lCls}>Adresse oder Firmenname suchen</label>
              <div className="relative">
                <input
                  value={locationQuery}
                  onChange={e => setLocationQuery(e.target.value)}
                  placeholder="z.B. Sparkasse Köln oder Hauptstraße 1, Berlin..."
                  className={iCls}
                />
                {locationLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-600 animate-pulse">suche…</div>
                )}
              </div>
              {locationResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-[#0f172a] border border-[#1e293b] rounded-lg shadow-2xl overflow-hidden">
                  {locationResults.map((r, i) => (
                    <button key={i} type="button" onClick={() => pickLocation(r)}
                      className="w-full text-left px-3 py-2.5 text-[10px] font-mono text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-300 border-b border-[#1e293b] last:border-0 transition-colors truncate">
                      {r.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {form.lat && form.lng ? (
              <div className="flex items-center justify-between mt-2 px-3 py-2 bg-green-500/5 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-green-400">✓ {form.city || 'Standort gesetzt'}</span>
                  <span className="text-[9px] font-mono text-slate-600">{form.lat}, {form.lng}</span>
                </div>
                <button type="button" onClick={() => setForm(f => ({ ...f, city: '', lat: null, lng: null }))}
                  className="text-[9px] font-mono text-slate-600 hover:text-red-400 transition-colors">entfernen</button>
              </div>
            ) : (
              <div className="text-[9px] font-mono text-slate-700 mt-1.5">Ohne Standort erscheint der Client nicht auf der Map.</div>
            )}
          </div>
          <div>
            <div className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest mb-3 border-b border-[#1e293b] pb-1">Ansprechpartner</div>
            <div className="space-y-3">
              <div><label className={lCls}>Name</label><input value={form.contact.name} onChange={e => setC('name', e.target.value)} placeholder="Vorname Nachname" className={iCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lCls}>E-Mail</label><input type="email" value={form.contact.email} onChange={e => setC('email', e.target.value)} placeholder="name@firma.de" className={iCls} /></div>
                <div><label className={lCls}>Telefon</label><input value={form.contact.phone} onChange={e => setC('phone', e.target.value)} placeholder="+49 ..." className={iCls} /></div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest mb-3 border-b border-[#1e293b] pb-1">Vertrag</div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={lCls}>Start</label><input type="date" value={form.contract.start} onChange={e => setK('start', e.target.value)} className={iCls} /></div>
              <div><label className={lCls}>Ende</label><input type="date" value={form.contract.end} onChange={e => setK('end', e.target.value)} className={iCls} /></div>
              <div><label className={lCls}>Stunden gesamt</label><input type="number" min="1" value={form.contract.hours} onChange={e => setK('hours', parseInt(e.target.value) || 0)} className={iCls} /></div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border border-[#1e293b] text-xs font-mono text-slate-400 hover:text-slate-200 transition-all">Abbrechen</button>
            <button type="submit" className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold tracking-wider transition-all">
              {client ? 'SPEICHERN' : 'HINZUFÜGEN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── CLIENT LIST ─────────────────────────────────────────────────────────────

function ClientList({ clients: allClients = [], engagements: allEngagements = [], reports: allReports = [], onClientClick, currentUser, assignments, onAdd, onEdit, onDelete, defaultStatus = 'All', tipsLang = 'de' }) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState(defaultStatus)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const isAdmin = currentUser?.role === 'Admin'
  const { clients: scopeClients } = useMemo(
    () => getMyScope(currentUser, assignments, allClients),
    [currentUser, assignments, allClients]
  )

  const filtered = useMemo(() => scopeClients.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q) ||
      (c.contact?.name || '').toLowerCase().includes(q)
    const matchStatus = filterStatus === 'All' || c.status === filterStatus
    return matchSearch && matchStatus
  }), [scopeClients, search, filterStatus])

  const CLIENT_STATUS_CYCLE = { Active: 'On Hold', 'On Hold': 'Completed', Completed: 'Pending', Pending: 'Active' }
  const cycleClientStatus = (client) => {
    onEdit({ ...client, status: CLIENT_STATUS_CYCLE[client.status] || 'Active' })
  }

  const handleSave = (client) => {
    if (editingClient) onEdit(client)
    else onAdd(client)
    setEditingClient(null)
    setShowModal(false)
  }

  return (
    <div className="p-3 lg:p-6 space-y-4">
      <div className="flex items-center gap-3 justify-between flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Name, Branche, Ansprechpartner..."
              className="bg-[#0f172a] border border-[#1e293b] rounded px-3 py-2 pl-8 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 w-68" />
          </div>
          {['All', 'Active', 'Pending', 'Completed', 'On Hold'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${filterStatus === s ? 'border-slate-500/50 bg-slate-700/40 text-slate-300' : 'border-[#1e293b] text-slate-500 hover:text-slate-300'}`}>
              {s}
            </button>
          ))}
        </div>
        {isAdmin && (
          <button onClick={() => { setEditingClient(null); setShowModal(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs font-mono text-cyan-400 hover:bg-cyan-500/20 transition-all">
            <Plus size={13} /> Neuer Client
          </button>
        )}
      </div>

      <Panel>
        <PanelHeader
          title="Client Management"
          subtitle={`${filtered.length} von ${scopeClients.length} Clients`}
          info={TIPS[tipsLang].clientList}
        />
        <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-[#1e293b]">
              {['Client', 'Branche', 'Ansprechpartner', 'E-Mail', 'Vertrag', 'Findings', 'Engs', 'Reports', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] text-slate-600 uppercase tracking-wider font-normal whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {filtered.map(client => {
              const pct = Math.round((client.contract.used / client.contract.hours) * 100)
              const clientReports = allReports.filter(r => r.clientId === client.id)
              const trCount  = clientReports.filter(r => r.type === 'Technical Report').length
              const esCount  = clientReports.filter(r => r.type === 'Executive Summary').length
              const rpCount  = clientReports.filter(r => r.type === 'Remediation Plan').length
              const clientEngs = allEngagements.filter(e => e.clientId === client.id).length
              const openFindings = client.openFindings ?? 0
              return (
                <tr key={client.id} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button onClick={() => onClientClick(client.id)} className="text-left hover:text-cyan-300 transition-colors">
                      <div className="font-semibold text-slate-100">{client.name}</div>
                      <div className="text-slate-600 text-[10px]">{client.id}</div>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{client.industry}</td>
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{client.contact?.name || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {client.contact?.email
                      ? <a href={`mailto:${client.contact.email}`} onClick={e => e.stopPropagation()} className="text-cyan-400 text-[10px] hover:text-cyan-300 hover:underline transition-colors">{client.contact.email}</a>
                      : <span className="text-slate-700 text-[10px]">—</span>}
                  </td>
                  <td className="px-4 py-3 w-36">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct > 80 ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className={`text-[10px] w-8 shrink-0 text-right ${pct > 80 ? 'text-red-400' : 'text-slate-500'}`}>{pct}%</span>
                    </div>
                    <div className="text-[9px] text-slate-700 mt-0.5 whitespace-nowrap">{client.contract.used}h / {client.contract.hours}h</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-xs font-mono font-bold ${openFindings > 0 ? 'text-red-400' : 'text-slate-600'}`}>{openFindings}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs font-mono text-slate-400">{clientEngs}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <span className="text-[9px] font-mono text-slate-500 bg-slate-800 border border-[#1e293b] rounded px-1.5 py-0.5" title="Technical Reports">TR <span className="text-slate-300 font-bold">{trCount}</span></span>
                      <span className="text-[9px] font-mono text-slate-500 bg-slate-800 border border-[#1e293b] rounded px-1.5 py-0.5" title="Executive Summaries">ES <span className="text-slate-300 font-bold">{esCount}</span></span>
                      <span className="text-[9px] font-mono text-slate-500 bg-slate-800 border border-[#1e293b] rounded px-1.5 py-0.5" title="Remediation Plans">RP <span className="text-slate-300 font-bold">{rpCount}</span></span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {isAdmin
                      ? <button onClick={e => { e.stopPropagation(); cycleClientStatus(client) }} title={`→ ${CLIENT_STATUS_CYCLE[client.status]}`} className="hover:opacity-70 transition-opacity cursor-pointer"><StatusBadge status={client.status} /></button>
                      : <StatusBadge status={client.status} />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {isAdmin && (
                        <>
                          <button onClick={() => { setEditingClient(client); setShowModal(true) }}
                            className="p-1.5 rounded border border-[#1e293b] text-slate-500 hover:text-cyan-400 hover:border-cyan-500/40 transition-all" title="Bearbeiten">
                            <Edit3 size={11} />
                          </button>
                          <button onClick={() => setConfirmDelete(client)}
                            className="p-1.5 rounded border border-[#1e293b] text-slate-500 hover:text-red-400 hover:border-red-500/40 transition-all" title="Löschen">
                            <Trash2 size={11} />
                          </button>
                        </>
                      )}
                      <button onClick={() => onClientClick(client.id)}
                        className="p-1.5 rounded border border-[#1e293b] text-slate-500 hover:text-slate-300 transition-all" title="Details">
                        <ChevronRight size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-10 text-center text-xs font-mono text-slate-600">Keine Clients gefunden.</div>
        )}
      </Panel>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-6">
          <div className="bg-[#0f172a] border border-red-500/30 rounded-xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-500/10"><Trash2 size={16} className="text-red-400" /></div>
              <h3 className="text-sm font-mono font-bold text-slate-100">Client löschen?</h3>
            </div>
            <p className="text-xs font-mono text-slate-400 mb-5">
              <span className="text-slate-200 font-semibold">{confirmDelete.name}</span> wird unwiderruflich entfernt.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded border border-[#1e293b] text-xs font-mono text-slate-400 hover:text-slate-200 transition-all">
                Abbrechen
              </button>
              <button onClick={() => { onDelete(confirmDelete.id); setConfirmDelete(null) }}
                className="flex-1 py-2 rounded bg-red-500/20 border border-red-500/30 text-xs font-mono font-bold text-red-400 hover:bg-red-500/30 transition-all">
                LÖSCHEN
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <ClientModal client={editingClient} onSave={handleSave} onClose={() => { setShowModal(false); setEditingClient(null) }} />
      )}
    </div>
  )
}

// ─── CLIENT MINI MAP ─────────────────────────────────────────────────────────

function ClientMiniMap({ lat, lng, darkMode = true }) {
  const mapDivRef = useRef(null)
  const mapRef    = useRef(null)
  const [geo, setGeo] = useState(null)

  useEffect(() => {
    if (!lat || !lng) return
    let cancelled = false
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
      headers: { 'Accept-Language': 'de' }
    })
      .then(r => r.json())
      .then(d => { if (!cancelled) setGeo(d.address || null) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [lat, lng])

  useEffect(() => {
    if (!mapDivRef.current || !lat || !lng) return
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }

    const map = L.map(mapDivRef.current, {
      center: [lat, lng],
      zoom: 13,
      zoomControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: false,
    })
    mapRef.current = map
    mapDivRef.current.style.background = '#1a1a2e'

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18, updateWhenZooming: false,
    }).addTo(map)

    const icon = L.divIcon({
      className: '',
      html: '<div style="width:14px;height:14px;background:#22d3ee;border:2.5px solid white;border-radius:50%;box-shadow:0 0 10px rgba(34,211,238,0.7)"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    })
    L.marker([lat, lng], { icon }).addTo(map)

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [lat, lng, darkMode])

  if (!lat || !lng) return null

  const road    = geo?.road || geo?.pedestrian || geo?.footway || null
  const postcode = geo?.postcode || null
  const city    = geo?.city || geo?.town || geo?.village || geo?.municipality || null
  const state   = geo?.state || null
  const country = geo?.country || null

  const Field = ({ label, value }) => value ? (
    <div className="min-w-0">
      <div className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-xs font-mono text-slate-200 truncate">{value}</div>
    </div>
  ) : null

  return (
    <Panel className="overflow-hidden">
      <div className="flex">
        <div ref={mapDivRef} className="w-48 h-48 shrink-0" />
        <div className={`flex-1 px-5 py-4 border-l flex flex-col justify-center gap-2 ${darkMode ? 'border-[#1e293b]' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Map size={13} className="text-cyan-400 shrink-0" />
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Standort</span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <Field label="Land"       value={country}  />
            <Field label="Bundesland" value={state}    />
            <Field label="Stadt"      value={city}     />
            <Field label="PLZ"        value={postcode} />
            <Field label="Straße"     value={road}     />
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-0.5">Koordinaten</div>
              <div className="text-xs font-mono text-cyan-400 tabular-nums">{lat.toFixed(4)}° N · {lng.toFixed(4)}° E</div>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  )
}

// ─── CLIENT DETAIL ────────────────────────────────────────────────────────────

function ClientDetail({ clientId, onBack, clients: allClients = [], findings: allFindings = [], engagements: allEngagements = [], reports: allReports = [], tipsLang = 'de', uiLang = 'en', onNav, darkMode = true }) {
  const [tab, setTab] = useState('overview')
  const client = allClients.find(c => c.id === clientId)
  if (!client) return null

  const findings    = allFindings.filter(f => f.clientId === client.id)
  const engagements = allEngagements.filter(e => e.clientId === client.id)
  const reports     = allReports.filter(r => r.clientId === client.id)
  const contract     = client.contract || {}
  const hoursPercent = contract.hours ? Math.round((contract.used / contract.hours) * 100) : 0
  const ScopeIcon = SCOPE_ICONS[client.scopeType || client.scope_type] || Globe

  return (
    <div className="p-3 lg:p-6 space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors">
        <ChevronLeft size={14} /> Back to Clients
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <ScopeIcon size={18} className="text-cyan-400" />
            <h1 className="text-xl font-mono font-bold text-slate-100">{client.name}</h1>
            <StatusBadge status={client.status} size="md" />
          </div>
          <p className="text-sm font-mono text-slate-500">{client.industry} · {client.id}</p>
        </div>
        <SeverityBadge severity={client.criticality} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#1e293b] pb-0">
        {['overview', 'findings', 'engagements', 'reports'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-mono capitalize border-b-2 transition-all ${tab === t ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (() => {
        const openF = findings.filter(f => f.status === 'Open').length
        const closedF = findings.filter(f => f.status === 'Closed').length
        const remainHours = (contract.hours || 0) - (contract.used || 0)
        const daysLeft = daysUntil(contract.end)
        const criticalOpen = findings.filter(f => f.severity === 'CRITICAL' && f.status === 'Open').length
        return (
          <div className="space-y-4">
            {/* Quick KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard label="Open Findings" value={openF} sub="Aktuell offen" icon={ShieldAlert} danger={criticalOpen > 0} info={TIPS[tipsLang].clientOpenFindings} onClick={() => onNav?.('findings', { clientId: client.id, status: 'Open' })} />
              <KpiCard label="Closed" value={closedF} sub="Behoben" icon={CheckCircle2} accent={closedF > 0} info={TIPS[tipsLang].clientClosed} onClick={() => onNav?.('findings', { clientId: client.id, status: 'Closed' })} />
              <KpiCard label="Restbudget" value={`${remainHours}h`} sub={`von ${contract.hours || 0}h gesamt`} icon={Clock} danger={hoursPercent > 85} info={TIPS[tipsLang].clientBudget} />
              <KpiCard label="Vertrag endet" value={!contract.end ? '—' : daysLeft <= 0 ? 'ABGELAUFEN' : `${daysLeft}d`} sub={contract.end || '—'} icon={Calendar} danger={daysLeft <= 30 && daysLeft >= 0} info={TIPS[tipsLang].clientContractEnd} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Contact */}
              <Panel className="p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <h3 className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Ansprechpartner</h3>
                  <InfoTooltip text="Primärer Ansprechpartner beim Kunden für alle Pentest-relevanten Abstimmungen und Report-Übergaben." />
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div><span className="text-slate-600">Name</span><div className="text-slate-200">{client.contact.name}</div></div>
                  <div><span className="text-slate-600">E-Mail</span>
                    <a href={`mailto:${client.contact.email}`} className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors block">{client.contact.email}</a>
                  </div>
                  <div><span className="text-slate-600">Telefon</span>
                    <a href={`tel:${client.contact.phone}`} className="text-slate-300 hover:text-cyan-400 hover:underline transition-colors block">{client.contact.phone}</a>
                  </div>
                </div>
              </Panel>

              {/* Contract */}
              <Panel className="p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <h3 className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Vertrag</h3>
                  <InfoTooltip text="Vertragslaufzeit und Stundenbudget. Das Budget zeigt gebuchte vs. verbrauchte Stunden — Überschreitungen müssen separat abgerechnet werden." />
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between"><span className="text-slate-600">Start</span><span className="text-slate-300">{fmtDate(contract.start, uiLang)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Ende</span><span className={daysLeft <= 30 ? 'text-red-400' : 'text-slate-300'}>{fmtDate(contract.end, uiLang)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Stunden</span><span className="text-slate-300">{contract.used || 0}h / {contract.hours || 0}h</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Verbleibend</span><span className={remainHours < 20 ? 'text-red-400 font-semibold' : 'text-cyan-400'}>{remainHours}h</span></div>
                  <div className="mt-2">
                    <div className="flex justify-between mb-1 text-[10px]">
                      <span className="text-slate-600">Auslastung</span>
                      <span className={hoursPercent > 80 ? 'text-red-400' : 'text-cyan-400'}>{hoursPercent}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full">
                      <div className={`h-full rounded-full ${hoursPercent > 80 ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${hoursPercent}%` }} />
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Scope */}
              <Panel className="p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <h3 className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Scope</h3>
                  <InfoTooltip text="Technischer Testumfang: IP-Ranges (CIDR-Notation), Domains und Systeme die aktiv getestet werden dürfen. Nur innerhalb dieses Scopes ist Testing erlaubt." />
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <div className="text-slate-600 mb-1 flex items-center gap-1">IP Ranges <InfoTooltip text="IPv4/IPv6 Netzwerkbereiche in CIDR-Notation die aktiv penetrationgetestet werden dürfen." /></div>
                    {client.scope.ipRanges.map(ip => (
                      <div key={ip} className="text-cyan-400 bg-cyan-500/5 rounded px-2 py-0.5 mb-0.5">{ip}</div>
                    ))}
                  </div>
                  <div>
                    <div className="text-slate-600 mb-1 flex items-center gap-1">Domains <InfoTooltip text="Domains und Subdomains die im Scope sind. Wildcard-Einträge (*.domain) umfassen alle Subdomains." /></div>
                    {client.scope.domains.slice(0, 3).map(d => (
                      <div key={d} className="text-slate-300 truncate">{d}</div>
                    ))}
                    {client.scope.domains.length > 3 && <div className="text-slate-600">+{client.scope.domains.length - 3} more</div>}
                  </div>
                </div>
              </Panel>

              {/* Exclusions */}
              <Panel className="p-4 col-span-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <h3 className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Ausschlüsse (Out-of-Scope)</h3>
                  <InfoTooltip text="Systeme und Bereiche die explizit NICHT getestet werden dürfen — meist produktionskritische Komponenten oder externe Drittanbieter-Systeme. Verstöße müssen sofort gemeldet werden." />
                </div>
                <div className="flex flex-wrap gap-2">
                  {client.scope.exclusions.map(ex => (
                    <span key={ex} className="text-xs font-mono text-yellow-400 bg-yellow-400/5 border border-yellow-400/20 rounded px-2 py-1">⚠ {ex}</span>
                  ))}
                </div>
              </Panel>
            </div>

            <ClientMiniMap lat={client.lat} lng={client.lng} darkMode={darkMode} />
          </div>
        )
      })()}

      {tab === 'findings' && (
        <Panel>
          <PanelHeader title="Findings" subtitle={`${findings.length} total`}>
            {onNav && (
              <button onClick={() => onNav('findings', { clientId: client.id })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono text-cyan-400 hover:bg-cyan-500/20 transition-all">
                <ExternalLink size={11} /> Alle im Tracker
              </button>
            )}
          </PanelHeader>
          <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono min-w-[480px]">
            <thead>
              <tr className="border-b border-[#1e293b]">
                {['Title', 'CVE', 'CVSS', 'Category', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] text-slate-600 uppercase tracking-wider font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {findings.map(f => (
                <tr key={f.id}
                  onClick={() => onNav?.('findings', { clientId: client.id, findingId: f.id })}
                  className={`transition-colors ${onNav ? 'cursor-pointer hover:bg-cyan-500/5' : 'hover:bg-slate-800/30'}`}>
                  <td className="px-4 py-3">
                    <div className="text-slate-200 font-medium">{f.title}</div>
                    <div className="text-slate-600 text-[10px] mt-0.5">{f.description.slice(0, 60)}…</div>
                  </td>
                  <td className="px-4 py-3">{f.cve ? <span className="text-cyan-400">{f.cve}</span> : <span className="text-slate-700">—</span>}</td>
                  <td className="px-4 py-3 w-32"><CvssBar score={f.cvss} /></td>
                  <td className="px-4 py-3 text-slate-400">{f.category}</td>
                  <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                  <td className="px-4 py-3 text-slate-500">{f.date}</td>
                  <td className="px-4 py-3">
                    {onNav && <ChevronRight size={13} className="text-slate-700 group-hover:text-cyan-400" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Panel>
      )}

      {tab === 'engagements' && (
        <div className="space-y-3">
          {onNav && engagements.length > 0 && (
            <div className="flex justify-end">
              <button onClick={() => onNav('engagements', { clientId: client.id })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono text-cyan-400 hover:bg-cyan-500/20 transition-all">
                <ExternalLink size={11} /> Alle im Planner
              </button>
            </div>
          )}
          {engagements.map(eng => (
            <Panel key={eng.id} className={`p-4 ${onNav ? 'cursor-pointer hover:border-cyan-500/30 transition-colors' : ''}`}
              onClick={() => onNav?.('engagements', { clientId: client.id, engagementId: eng.id })}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-mono font-semibold text-slate-100">{eng.title}</h3>
                  <p className="text-xs font-mono text-slate-500">{fmtDate(eng.start, uiLang)} → {fmtDate(eng.end, uiLang)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={eng.status} />
                  {onNav && <ChevronRight size={14} className="text-slate-600" />}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {['Recon', 'Scanning', 'Exploitation', 'Reporting'].map(phase => {
                  const active = eng.phases.includes(phase)
                  const colors = { Recon: 'bg-blue-500', Scanning: 'bg-cyan-500', Exploitation: 'bg-red-500', Reporting: 'bg-green-500' }
                  return (
                    <div key={phase} className={`flex-1 h-1 rounded-full ${active ? colors[phase] : 'bg-slate-800'}`} />
                  )
                })}
              </div>
              <div className="flex gap-3 mt-2">
                {['Recon', 'Scanning', 'Exploitation', 'Reporting'].map(phase => {
                  const active = eng.phases.includes(phase)
                  return (
                    <span key={phase} className={`text-[9px] font-mono flex-1 text-center ${active ? 'text-slate-400' : 'text-slate-700'}`}>{phase}</span>
                  )
                })}
              </div>
            </Panel>
          ))}
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0
            ? <Panel className="p-8 text-center"><p className="text-sm font-mono text-slate-600">No reports available yet.</p></Panel>
            : reports.map(rep => (
              <Panel key={rep.id} className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-mono text-slate-100">{rep.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-mono text-slate-600">{rep.date}</span>
                    <span className="text-xs font-mono text-slate-500">{rep.type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={rep.status} />
                  <button className="p-1.5 rounded border border-[#1e293b] text-slate-500 hover:text-cyan-400 hover:border-cyan-500/40 transition-all">
                    <ExternalLink size={12} />
                  </button>
                </div>
              </Panel>
            ))
          }
        </div>
      )}
    </div>
  )
}

// ─── FINDINGS TRACKER ────────────────────────────────────────────────────────

const FINDING_CATEGORIES = ['RCE', 'XSS', 'SQLi', 'Auth', 'Crypto', 'Config', 'Exposure', 'DoS', 'PrivEsc', 'Container', 'OT/ICS', 'Other']

function cvssToSeverity(score) {
  const n = parseFloat(score)
  if (n >= 9) return 'CRITICAL'
  if (n >= 7) return 'HIGH'
  if (n >= 4) return 'MEDIUM'
  return 'LOW'
}

function NewFindingModal({ clients = [], currentUser, onSave, onClose, editFinding = null }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState(editFinding ? {
    title: editFinding.title,
    cve: editFinding.cve || '',
    cvss: String(editFinding.cvss),
    severity: editFinding.severity,
    category: editFinding.category || 'Auth',
    clientId: editFinding.clientId,
    status: editFinding.status,
    date: editFinding.date,
    description: editFinding.description || '',
    remediation: editFinding.remediation || '',
  } : {
    title: '',
    cve: '',
    cvss: '',
    severity: 'HIGH',
    category: 'Auth',
    clientId: clients[0]?.id || '',
    status: 'Open',
    date: today,
    description: '',
    remediation: '',
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleCvssChange = (v) => {
    const n = parseFloat(v)
    set('cvss', v)
    if (!isNaN(n) && n >= 0 && n <= 10) set('severity', cvssToSeverity(n))
  }

  const canSubmit = form.title.trim() && form.clientId && form.cvss !== '' && !isNaN(parseFloat(form.cvss))

  const handleSubmit = () => {
    if (!canSubmit) return
    onSave({
      id: editFinding ? editFinding.id : `f_${Date.now()}`,
      clientId: form.clientId,
      title: form.title.trim(),
      cve: form.cve.trim() || null,
      cvss: parseFloat(form.cvss),
      severity: form.severity,
      category: form.category,
      status: form.status,
      date: form.date,
      description: form.description.trim(),
      remediation: form.remediation.trim(),
    })
    onClose()
  }

  const sevColors = { CRITICAL: 'border-red-500/60 bg-red-500/10 text-red-400', HIGH: 'border-orange-500/60 bg-orange-500/10 text-orange-400', MEDIUM: 'border-yellow-500/60 bg-yellow-500/10 text-yellow-400', LOW: 'border-green-500/60 bg-green-500/10 text-green-400' }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 w-full max-w-lg space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono font-semibold text-slate-100 flex items-center gap-2">
            <ShieldAlert size={14} className="text-red-400" /> {editFinding ? 'Finding bearbeiten' : 'Neues Finding'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors"><X size={16} /></button>
        </div>

        {/* Title */}
        <div>
          <label className="block text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-wider">Titel *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
            placeholder="z.B. SQL-Injection im Login-Formular" />
        </div>

        {/* Client + Category */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-wider">Client *</label>
            <select value={form.clientId} onChange={e => set('clientId', e.target.value)}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors">
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-wider">Kategorie</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors">
              {FINDING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* CVSS + CVE */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-wider">CVSS Score *</label>
            <input type="number" min="0" max="10" step="0.1" value={form.cvss} onChange={e => handleCvssChange(e.target.value)}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
              placeholder="0.0 – 10.0" />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-wider">CVE (optional)</label>
            <input value={form.cve} onChange={e => set('cve', e.target.value)}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
              placeholder="CVE-2024-XXXXX" />
          </div>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-wider">Schweregrad</label>
          <div className="flex gap-2">
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
              <button key={s} onClick={() => set('severity', s)}
                className={`flex-1 py-1.5 rounded border text-[10px] font-mono font-bold transition-all ${form.severity === s ? sevColors[s] : 'border-[#1e293b] text-slate-600 hover:text-slate-400'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Status + Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-wider">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors">
              {['Open', 'In Remediation', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-wider">Datum</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors" />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-wider">Beschreibung</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
            className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
            placeholder="Technische Beschreibung der Schwachstelle..." />
        </div>

        {/* Remediation */}
        <div>
          <label className="block text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-wider">Remediation</label>
          <textarea value={form.remediation} onChange={e => set('remediation', e.target.value)} rows={2}
            className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
            placeholder="Empfohlene Gegenmaßnahme..." />
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-[#1e293b] text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors">
            Abbrechen
          </button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="flex-1 py-2 rounded-lg border border-red-500/40 bg-red-500/10 text-xs font-mono text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            {editFinding ? 'Speichern' : 'Finding erfassen'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── REMINDER MODAL ──────────────────────────────────────────────────────────

function ReminderModal({ finding, engagement, teamMembers, currentUser, onSend, onClose }) {
  const available = teamMembers.filter(m => m.id !== currentUser?.id)
  const engTeam   = engagement ? available.filter(m => (engagement.assignedTo || []).includes(m.id)) : []

  const [selectedIds, setSelectedIds] = useState(engTeam.map(m => m.id))
  const [message,     setMessage]     = useState('')

  const toggle = (id) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono font-semibold text-slate-100 flex items-center gap-2">
            <Bell size={14} className="text-orange-400" /> Erinnerung senden
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors"><X size={16} /></button>
        </div>

        {/* Finding-Kurzinfo */}
        <div className="bg-slate-900/60 border border-[#1e293b] rounded-lg px-3 py-2.5 space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Finding</div>
          <div className="text-xs font-mono text-slate-200 font-medium leading-snug">{finding.title}</div>
          <div className="flex items-center gap-2">
            <SeverityBadge severity={finding.severity} />
            {engagement && <span className="text-[10px] font-mono text-slate-500 truncate">{engagement.title}</span>}
          </div>
        </div>

        {/* Empfänger */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Empfänger</span>
            <div className="ml-auto flex gap-1.5">
              {engTeam.length > 0 && (
                <button onClick={() => setSelectedIds(engTeam.map(m => m.id))}
                  className="text-[10px] font-mono text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded hover:bg-cyan-500/10 transition-colors">
                  Engagement-Team
                </button>
              )}
              <button
                onClick={() => setSelectedIds(selectedIds.length === available.length ? [] : available.map(m => m.id))}
                className="text-[10px] font-mono text-slate-500 border border-[#1e293b] px-2 py-0.5 rounded hover:text-slate-300 transition-colors">
                {selectedIds.length === available.length ? 'Alle abwählen' : 'Alle wählen'}
              </button>
            </div>
          </div>

          <div className="space-y-1 max-h-44 overflow-y-auto">
            {available.map(m => {
              const checked = selectedIds.includes(m.id)
              return (
                <label key={m.id}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded cursor-pointer transition-colors border ${checked ? 'bg-cyan-500/8 border-cyan-500/20' : 'border-transparent hover:bg-slate-800/40'}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(m.id)} className="accent-cyan-500 shrink-0" />
                  <MemberAvatar member={m} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono text-slate-200">{m.name}</div>
                    <div className="text-[10px] font-mono text-slate-600">{m.role}</div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* Optionale Nachricht */}
        <div>
          <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-wider">Nachricht (optional)</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2}
            placeholder="z.B. Bitte Remediation bis Freitag abschließen."
            className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none transition-colors" />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2 border border-[#1e293b] rounded text-xs font-mono text-slate-400 hover:text-slate-200 transition-all">
            Abbrechen
          </button>
          <button onClick={() => { if (!selectedIds.length) return; onSend({ toUserIds: selectedIds, fromUserId: currentUser?.id, fromName: currentUser?.name, findingId: finding.id, findingTitle: finding.title, findingSeverity: finding.severity, message: message.trim() }); onClose() }}
            disabled={selectedIds.length === 0}
            className="flex-1 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 rounded text-xs font-mono font-bold text-black transition-all flex items-center justify-center gap-1.5">
            <Bell size={12} /> Senden {selectedIds.length > 0 && `(${selectedIds.length})`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── FINDINGS TRACKER ────────────────────────────────────────────────────────

function FindingsTracker({ currentUser, assignments, findings: allFindingsProp = [], onAddFinding, onEditFinding, onDeleteFinding, clients: allClientsProp = [], teamMembers = [], engagements = [], onSendReminder, defaultSeverity = 'All', defaultStatus = 'All', defaultClientId = 'All', defaultFindingId = null, tipsLang = 'de' }) {
  const { findings: scopeFindings, clients: scopeClients } = useMemo(
    () => getMyScope(currentUser, assignments, allClientsProp, engagements, allFindingsProp),
    [currentUser, assignments, allClientsProp, engagements, allFindingsProp]
  )
  const [severityFilter, setSeverityFilter] = useState(defaultSeverity)
  const [statusFilter, setStatusFilter] = useState(defaultStatus)
  const [clientFilter, setClientFilter] = useState(defaultClientId)
  const [search, setSearch] = useState('')
  const [findings, setFindings] = useState(scopeFindings)
  const [expandedId, setExpandedId] = useState(defaultFindingId)
  const [noteInputId, setNoteInputId] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [editFinding, setEditFinding] = useState(null)
  const [remindFinding, setRemindFinding] = useState(null)
  const canRemind = currentUser?.role === 'Admin' || currentUser?.role === 'Senior Pentester'

  useEffect(() => { setFindings(scopeFindings) }, [allFindingsProp])

  const filtered = useMemo(() => findings.filter(f => {
    return (
      (severityFilter === 'All' || f.severity === severityFilter) &&
      (statusFilter === 'All' || f.status === statusFilter) &&
      (clientFilter === 'All' || f.clientId === clientFilter) &&
      (f.title.toLowerCase().includes(search.toLowerCase()) || (f.cve || '').includes(search))
    )
  }), [findings, severityFilter, statusFilter, clientFilter, search])

  const cycleStatus = (id) => {
    const cycle = { 'Open': 'In Remediation', 'In Remediation': 'Closed', 'Closed': 'Open' }
    setFindings(prev => prev.map(f => {
      if (f.id !== id) return f
      const updated = { ...f, status: cycle[f.status] || f.status }
      onEditFinding?.(updated)
      return updated
    }))
  }

  return (
    <div className="p-3 lg:p-6 space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search CVE / title..."
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded px-3 py-2 pl-8 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50" />
          </div>
          <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}
            className="bg-[#0f172a] border border-[#1e293b] rounded px-2 py-1.5 text-xs font-mono text-slate-400 focus:outline-none focus:border-cyan-500/50">
            <option value="All">All Clients</option>
            {scopeClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            <Filter size={12} className="text-slate-600" />
            {['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
              <button key={s} onClick={() => setSeverityFilter(s)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono border transition-all ${severityFilter === s ? 'border-slate-500/50 bg-slate-700/40 text-slate-300' : 'border-[#1e293b] text-slate-500 hover:text-slate-300'}`}>
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {['All', 'Open', 'In Remediation', 'Closed'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono border transition-all ${statusFilter === s ? 'border-slate-500/50 bg-slate-700/40 text-slate-300' : 'border-[#1e293b] text-slate-500 hover:text-slate-300'}`}>
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-[#0f172a] border border-[#1e293b] rounded text-xs font-mono text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-all">
              <Download size={12} /> Export CSV
            </button>
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Senior Pentester' || currentUser?.role === 'Pentester') && (
              <button onClick={() => setShowNewModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-red-500/40 bg-red-500/10 text-xs font-mono text-red-400 hover:bg-red-500/20 transition-all">
                <Plus size={12} /> Finding
              </button>
            )}
          </div>
        </div>
      </div>

      {showNewModal && (
        <NewFindingModal
          clients={allClientsProp}
          currentUser={currentUser}
          onSave={f => { onAddFinding?.(f); setShowNewModal(false) }}
          onClose={() => setShowNewModal(false)}
        />
      )}

      {editFinding && (
        <NewFindingModal
          clients={allClientsProp}
          currentUser={currentUser}
          editFinding={editFinding}
          onSave={f => { onEditFinding?.(f); setEditFinding(null) }}
          onClose={() => setEditFinding(null)}
        />
      )}

      <Panel>
        <PanelHeader title="Vulnerability Database" subtitle={`${filtered.length} findings`} info={TIPS[tipsLang].vulnDB} />
        <div className="divide-y divide-[#1e293b]">
          {filtered.map(f => {
            const client = allClientsProp.find(c => c.id === f.clientId)
            const isExpanded = expandedId === f.id
            return (
              <div key={f.id} className="hover:bg-slate-800/20 transition-colors">
                <div
                  className="px-4 py-3 flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : f.id)}
                >
                  <div className="w-16 sm:w-20 shrink-0"><SeverityBadge severity={f.severity} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono text-slate-200 font-medium truncate">{f.title}</div>
                    <div className="text-[10px] font-mono text-slate-600 truncate">{client?.name} · {f.category} · {f.date}</div>
                  </div>
                  <div className="hidden sm:block w-40 shrink-0"><CvssBar score={f.cvss} /></div>
                  {f.cve
                    ? <div className="hidden sm:block w-28 shrink-0 text-[10px] font-mono text-cyan-400">{f.cve}</div>
                    : <div className="hidden sm:block w-28 shrink-0 text-[10px] font-mono text-slate-700">No CVE</div>
                  }
                  <div className="shrink-0">
                    {currentUser?.role !== 'Junior Pentester'
                      ? <button onClick={e => { e.stopPropagation(); cycleStatus(f.id) }} className="hover:opacity-75 transition-opacity" title="Status wechseln"><StatusBadge status={f.status} /></button>
                      : <StatusBadge status={f.status} />
                    }
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    {(currentUser?.role === 'Admin' || currentUser?.role === 'Senior Pentester' || currentUser?.role === 'Pentester') && (
                      <button
                        onClick={e => { e.stopPropagation(); setEditFinding(f) }}
                        className="p-1 rounded text-slate-700 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                        title="Finding bearbeiten"
                      >
                        <Edit3 size={12} />
                      </button>
                    )}
                    {canRemind && (
                      <button
                        onClick={e => { e.stopPropagation(); setRemindFinding(f) }}
                        className="p-1 rounded text-slate-700 hover:text-orange-400 hover:bg-orange-500/10 transition-all"
                        title="Erinnerung senden"
                      >
                        <Bell size={12} />
                      </button>
                    )}
                    {currentUser?.role === 'Admin' && (
                      <button
                        onClick={e => { e.stopPropagation(); onDeleteFinding?.(f.id) }}
                        className="p-1 rounded text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Finding löschen"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    {isExpanded ? <ChevronUp size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
                  </div>
                </div>

                {isExpanded && (() => {
                  const discoverer = teamMembers.find(m => m.id === f.discoveredBy)
                  const engagement = engagements.find(e => e.id === f.engagementId)
                  const engTeam    = engagement ? teamMembers.filter(m => (engagement.assignedTo || []).includes(m.id)) : []
                  return (
                  <div className="px-4 pb-4 bg-slate-900/50 border-t border-[#1e293b]">
                    {/* Meta-Zeile: Entdecker + Engagement */}
                    <div className="flex items-center gap-6 pt-3 pb-3 border-b border-[#1e293b] mb-3 flex-wrap">
                      {discoverer && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">Entdeckt von</span>
                          <MemberAvatar member={discoverer} size="sm" />
                          <span className="text-xs font-mono text-slate-300">{discoverer.name}</span>
                          <span className="text-[10px] font-mono text-slate-600">({discoverer.role})</span>
                        </div>
                      )}
                      {engagement && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">Engagement</span>
                          <span className="text-xs font-mono text-cyan-400">{engagement.title}</span>
                          <StatusBadge status={engagement.status} />
                        </div>
                      )}
                      {engTeam.length > 0 && (
                        <div className="flex items-center gap-2 ml-auto">
                          <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">Team</span>
                          <div className="flex -space-x-1">
                            {engTeam.map(m => (
                              <div key={m.id} className="ring-1 ring-[#0f172a] rounded-full" title={m.name}>
                                <MemberAvatar member={m} size="sm" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-mono text-slate-600 uppercase mb-1">Description</p>
                        <p className="text-xs font-mono text-slate-300 leading-relaxed">{f.description}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-slate-600 uppercase mb-1">Remediation</p>
                        <p className="text-xs font-mono text-slate-300 leading-relaxed">{f.remediation}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      {noteInputId === f.id ? (
                        <div className="flex gap-2">
                          <input value={noteText} onChange={e => setNoteText(e.target.value)}
                            placeholder="Add a note..."
                            className="flex-1 bg-[#0f172a] border border-cyan-500/30 rounded px-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none" />
                          <button onClick={() => {
                            if (noteText.trim()) {
                              const updated = { ...f, note: noteText.trim() }
                              setFindings(prev => prev.map(x => x.id === f.id ? updated : x))
                              onEditFinding?.(updated)
                            }
                            setNoteInputId(null); setNoteText('')
                          }}
                            className="px-3 py-1 rounded text-xs font-mono bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-colors">
                            Save
                          </button>
                          <button onClick={() => setNoteInputId(null)}
                            className="px-3 py-1 rounded text-xs font-mono border border-[#1e293b] text-slate-500 hover:text-slate-300 transition-colors">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div>
                          {f.note && (
                            <p className="text-[10px] font-mono text-slate-500 mb-1.5 pl-1 border-l border-[#1e293b]">{f.note}</p>
                          )}
                          <button onClick={() => { setNoteInputId(f.id); setNoteText(f.note || '') }}
                            className="text-[10px] font-mono text-slate-600 hover:text-cyan-400 transition-colors flex items-center gap-1">
                            <Plus size={10} /> {f.note ? 'Notiz bearbeiten' : 'Add note'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      </Panel>

      {remindFinding && (
        <ReminderModal
          finding={remindFinding}
          engagement={engagements.find(e => e.id === remindFinding.engagementId)}
          teamMembers={teamMembers}
          currentUser={currentUser}
          onSend={(r) => { onSendReminder?.(r) }}
          onClose={() => setRemindFinding(null)}
        />
      )}
    </div>
  )
}

// ─── ENGAGEMENT PLANNER ──────────────────────────────────────────────────────

const PHASE_COLORS = {
  Recon:       { bg: 'bg-blue-500', text: 'text-blue-300', border: 'border-blue-500/30' },
  Scanning:    { bg: 'bg-cyan-500', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  Exploitation:{ bg: 'bg-red-500', text: 'text-red-300', border: 'border-red-500/30' },
  Reporting:   { bg: 'bg-green-500', text: 'text-green-300', border: 'border-green-500/30' },
}

const PHASE_TASKS = {
  Recon: [
    'Passive DNS-Aufklärung',
    'WHOIS / RDAP-Abfrage',
    'Subdomains identifiziert',
    'E-Mail-Adressen gesammelt (OSINT)',
    'Shodan / Censys / ZoomEye',
    'Technologie-Stack ermittelt',
    'Social Media / LinkedIn Recherche',
  ],
  Scanning: [
    'Port-Scan durchgeführt (Nmap)',
    'Service-Versionen erfasst',
    'OS-Fingerprinting',
    'Web-App erkundet (Dirbusting)',
    'SSL/TLS-Konfiguration geprüft',
    'Schwachstellen-Scan (OpenVAS / Nessus)',
    'Manuelle Verifikation der Ergebnisse',
  ],
  Exploitation: [
    'CVE-Recherche durchgeführt',
    'Exploit vorbereitet / getestet',
    'Schwachstelle erfolgreich ausgenutzt',
    'Post-Exploitation durchgeführt',
    'Privilege Escalation versucht',
    'Lateral Movement geprüft',
    'Proof-of-Concept dokumentiert',
  ],
  Reporting: [
    'Executive Summary verfasst',
    'Technische Befunde dokumentiert',
    'CVSS-Bewertungen vergeben',
    'Empfehlungen formuliert',
    'Screenshots / Nachweise gesammelt',
    'Internes Review abgeschlossen',
    'Report an Kunden übergeben',
  ],
}

const TYPE_COLORS = {
  'Full Red Team': 'border-l-red-500 bg-red-500/5',
  'Network':       'border-l-blue-500 bg-blue-500/5',
  'Web':           'border-l-cyan-500 bg-cyan-500/5',
  'Social Engineering': 'border-l-purple-500 bg-purple-500/5',
}

// ─── NEW ENGAGEMENT MODAL ─────────────────────────────────────────────────────

function NewEngagementModal({ clients = [], currentUser, onSave, onClose, existing = null }) {
  const [form, setForm] = useState(existing ? { ...existing } : {
    title: '',
    clientId: clients[0]?.id || '',
    type: 'Web',
    start: '',
    end: '',
    status: 'Planned',
    phases: ['Recon'],
    lead: currentUser?.name || '',
  })

  const togglePhase = (phase) => setForm(prev => ({
    ...prev,
    phases: prev.phases.includes(phase)
      ? prev.phases.filter(p => p !== phase)
      : [...prev.phases, phase],
  }))

  const canSubmit = form.title.trim() && form.clientId && form.start && form.end

  const handleSubmit = () => {
    if (!canSubmit) return
    onSave(existing ? { ...form } : { id: `e_${Date.now()}`, ...form })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono font-semibold text-slate-100 flex items-center gap-2">
            <Calendar size={14} className="text-cyan-400" /> {existing ? 'Engagement bearbeiten' : 'Neues Engagement'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors"><X size={16} /></button>
        </div>

        <div>
          <label className="block text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-wider">Titel</label>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
            placeholder="Engagement-Titel..." />
        </div>

        <div>
          <label className="block text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-wider">Client</label>
          <select value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))}
            className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors">
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-wider">Typ</label>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors">
              {['Web', 'Network', 'Social Engineering', 'Full Red Team'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-wider">Status</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors">
              {['Planned', 'Active', 'On Hold'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-wider">Start</label>
            <input type="date" value={form.start} onChange={e => setForm(p => ({ ...p, start: e.target.value }))}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-wider">Ende</label>
            <input type="date" value={form.end} onChange={e => setForm(p => ({ ...p, end: e.target.value }))}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors" />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-wider">Phasen</label>
          <div className="flex gap-2 flex-wrap">
            {['Recon', 'Scanning', 'Exploitation', 'Reporting'].map(phase => {
              const active = form.phases.includes(phase)
              const cfg = PHASE_COLORS[phase]
              return (
                <button key={phase} onClick={() => togglePhase(phase)}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono border transition-all ${active ? `${cfg.border} ${cfg.text} bg-slate-800` : 'border-[#1e293b] text-slate-600 hover:text-slate-400'}`}>
                  {phase}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-wider">Lead</label>
          <input value={form.lead} onChange={e => setForm(p => ({ ...p, lead: e.target.value }))}
            className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
            placeholder="Lead Pentester..." />
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-[#1e293b] text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors">
            Abbrechen
          </button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="flex-1 py-2 rounded-lg border border-cyan-500/50 bg-cyan-500/10 text-xs font-mono text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            Erstellen
          </button>
        </div>
      </div>
    </div>
  )
}

function PhaseDetailModal({ engagement, phase, onSave, onClose, canEdit }) {
  const tasks = PHASE_TASKS[phase] || []
  const savedChecks = engagement.phaseChecks?.[phase] || []
  const [checked, setChecked] = useState(() => new Set(savedChecks))
  const [notes, setNotes] = useState(engagement.phaseNotes?.[phase] || '')
  const cfg = PHASE_COLORS[phase]
  const doneCount = checked.size
  const totalCount = tasks.length
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0

  const toggleTask = idx => {
    if (!canEdit) return
    setChecked(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 pb-4 border-b border-[#1e293b]">
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">{engagement.title}</p>
            <h3 className={`text-base font-mono font-bold ${cfg.text}`}>{phase}</h3>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors mt-0.5 shrink-0"><X size={15} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-500">Fortschritt</span>
              <span className={pct === 100 ? cfg.text : 'text-slate-400'}>{doneCount} / {totalCount} ({pct}%)</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800">
              <div className={`h-1.5 rounded-full transition-all ${cfg.bg}`} style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Checkliste */}
          <div className="space-y-1">
            <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-2">Checkliste</p>
            {tasks.map((task, idx) => (
              <button
                key={idx}
                onClick={() => toggleTask(idx)}
                disabled={!canEdit}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all ${
                  checked.has(idx)
                    ? `${cfg.border} bg-slate-800/60`
                    : 'border-transparent hover:border-[#1e293b] hover:bg-slate-800/30'
                } ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  checked.has(idx) ? `${cfg.bg} border-transparent` : 'border-slate-600 bg-transparent'
                }`}>
                  {checked.has(idx) && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className={`text-xs font-mono ${checked.has(idx) ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{task}</span>
              </button>
            ))}
          </div>

          {/* Notizen */}
          <div className="space-y-1.5">
            <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Notizen</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              readOnly={!canEdit}
              placeholder={canEdit ? 'Tools, Ergebnisse, Besonderheiten...' : 'Keine Notizen vorhanden.'}
              rows={4}
              className="w-full bg-[#080e1a] border border-[#1e293b] rounded-lg p-3 text-xs font-mono text-slate-300 placeholder-slate-700 resize-none focus:outline-none focus:border-cyan-500/40 transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 pt-3 border-t border-[#1e293b]">
          <button onClick={onClose} className="px-4 py-2 rounded border border-[#1e293b] text-xs font-mono text-slate-400 hover:text-slate-200 transition-all">Schließen</button>
          {canEdit && (
            <button onClick={() => onSave({ notes, checks: [...checked] })} className="px-4 py-2 rounded bg-cyan-500/10 border border-cyan-500/40 text-xs font-mono text-cyan-400 hover:bg-cyan-500/20 transition-all">
              Speichern
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function EngagementPlanner({ teamMembers = [], assignments = {}, onAssign, currentUser, groups = [], engagements: allEngProp = [], onAddEngagement, onStatusChange, onEdit, onDelete, clients: allClientsProp = [], defaultStatus = 'All', defaultClientId = null, tipsLang = 'de', uiLang = 'en', pendingReports = {}, onEngDetail }) {
  const ENG_STATUS_CYCLE = { Planned: 'Active', Active: 'On Hold', 'On Hold': 'Completed', Completed: 'Planned' }
  const canCycleStatus = currentUser?.role === 'Admin' || currentUser?.role === 'Senior Pentester'
  const isAdmin = currentUser?.role === 'Admin'
  const [view, setView] = useState('timeline')
  const [phaseModal, setPhaseModal] = useState(null)
  const [assignModal, setAssignModal] = useState(null)
  const [statusFilter, setStatusFilter] = useState(defaultStatus)
  const [myOnly, setMyOnly] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [editingEng, setEditingEng] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const { engagements: scopeEngagements } = useMemo(
    () => getMyScope(currentUser, assignments, allClientsProp, allEngProp),
    [currentUser, assignments, allClientsProp, allEngProp]
  )

  const sorted = useMemo(() => [...scopeEngagements]
    .filter(e => statusFilter === 'All' || e.status === statusFilter)
    .filter(e => !myOnly || (assignments[e.id] || []).includes(currentUser?.id))
    .filter(e => !defaultClientId || e.clientId === defaultClientId)
    .sort((a, b) => {
      if (a.createdAt && !b.createdAt) return -1
      if (!a.createdAt && b.createdAt) return 1
      if (a.createdAt && b.createdAt) return b.createdAt - a.createdAt
      return new Date(a.start) - new Date(b.start)
    }), [scopeEngagements, statusFilter, myOnly, assignments, currentUser?.id, defaultClientId])

  return (
    <div className="p-3 lg:p-6 space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {['timeline', 'list'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded text-xs font-mono capitalize border transition-all ${view === v ? 'border-slate-500/50 bg-slate-700/40 text-slate-300' : 'border-[#1e293b] text-slate-500 hover:text-slate-300'}`}>
                {v}
              </button>
            ))}
          </div>
          {currentUser?.role === 'Admin' && (
            <button onClick={() => setShowNewModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-xs font-mono text-cyan-400 hover:bg-cyan-500/20 transition-all">
              <Plus size={12} /> Erstellen
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <button onClick={() => setMyOnly(v => !v)}
            className={`px-2.5 py-1 rounded text-[10px] font-mono border transition-all ${myOnly ? 'border-purple-500/50 bg-purple-500/10 text-purple-400' : 'border-[#1e293b] text-slate-500 hover:text-slate-300'}`}>
            ★ Meine
          </button>
          {['All', 'Active', 'Planned', 'Completed', 'On Hold'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono border transition-all ${statusFilter === s ? 'border-slate-500/50 bg-slate-700/40 text-slate-300' : 'border-[#1e293b] text-slate-500 hover:text-slate-300'}`}>
              {s}
            </button>
          ))}
        </div>
        <p className="text-[9px] font-mono text-slate-700">Aktive Phasen sind anklickbar — Notizen & Details einsehbar für zugewiesene Mitglieder und Admins.</p>
      </div>

      {showNewModal && (
        <NewEngagementModal clients={allClientsProp} currentUser={currentUser}
          onSave={eng => { onAddEngagement?.(eng); setShowNewModal(false) }}
          onClose={() => setShowNewModal(false)} />
      )}
      {editingEng && (
        <NewEngagementModal clients={allClientsProp} currentUser={currentUser} existing={editingEng}
          onSave={eng => { onEdit?.(eng); setEditingEng(null) }}
          onClose={() => setEditingEng(null)} />
      )}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-red-500/30 rounded-xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-sm font-mono font-bold text-red-400">Engagement löschen?</h3>
            <p className="text-xs font-mono text-slate-400">„{confirmDelete.title}" wird unwiderruflich entfernt.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded border border-[#1e293b] text-xs font-mono text-slate-400 hover:text-slate-200 transition-all">Abbrechen</button>
              <button onClick={() => { onDelete?.(confirmDelete.id); setConfirmDelete(null) }}
                className="px-4 py-2 rounded bg-red-500/20 border border-red-500/40 text-xs font-mono text-red-400 hover:bg-red-500/30 transition-all">Löschen</button>
            </div>
          </div>
        </div>
      )}

      {phaseModal && (
        <PhaseDetailModal
          engagement={phaseModal.eng}
          phase={phaseModal.phase}
          canEdit={isAdmin || (assignments[phaseModal.eng.id] || []).includes(currentUser?.id)}
          onSave={({ notes, checks }) => {
            onEdit?.({ ...phaseModal.eng,
              phaseNotes:  { ...phaseModal.eng.phaseNotes,  [phaseModal.phase]: notes },
              phaseChecks: { ...phaseModal.eng.phaseChecks, [phaseModal.phase]: checks },
            })
            setPhaseModal(null)
          }}
          onClose={() => setPhaseModal(null)}
        />
      )}

      {view === 'timeline' && (
        <Panel>
          <PanelHeader title="Engagements" subtitle={`${sorted.length} Einträge`} info={TIPS[tipsLang].engTimeline} />
          <div className="p-4 space-y-2">
            {sorted.map(eng => {
              const client = allClientsProp.find(c => c.id === eng.clientId)
              const team = assignments[eng.id] || []
              const canAccess = isAdmin || team.includes(currentUser?.id)
              return (
                <div key={eng.id} className="border border-[#1e293b] rounded-lg p-4 hover:border-[#334155] transition-colors">

                  {/* Zeile 1: Titel + Status */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="text-sm font-mono font-semibold text-slate-100 truncate">{eng.title}</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">{client?.name} · {eng.type}</div>
                    </div>
                    <div className="shrink-0">
                      {canCycleStatus
                        ? <button onClick={e => { e.stopPropagation(); onStatusChange?.(eng.id) }} title={`→ ${ENG_STATUS_CYCLE[eng.status]}`} className="hover:opacity-75 transition-opacity"><StatusBadge status={eng.status} /></button>
                        : <StatusBadge status={eng.status} />}
                    </div>
                  </div>

                  {/* Zeile 2: Zeitraum */}
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 mb-3">
                    <Calendar size={10} className="shrink-0" />
                    <span>{fmtDate(eng.start, uiLang)}</span>
                    <span className="text-slate-700">→</span>
                    <span>{fmtDate(eng.end, uiLang)}</span>
                    {eng.lead && <><span className="text-slate-700 mx-1">·</span><span className="text-slate-600">Lead: {eng.lead}</span></>}
                  </div>

                  {/* Zeile 3: Phasen */}
                  <div className="flex items-center gap-1.5 mb-3">
                    {['Recon', 'Scanning', 'Exploitation', 'Reporting'].map(phase => {
                      const active = eng.phases.includes(phase)
                      const clickable = active && canAccess
                      const checks = eng.phaseChecks?.[phase] || []
                      const taskTotal = (PHASE_TASKS[phase] || []).length
                      const taskDone = checks.length
                      return (
                        <button
                          key={phase}
                          disabled={!clickable}
                          onClick={e => { e.stopPropagation(); clickable && setPhaseModal({ eng, phase }) }}
                          className={`px-2.5 py-1 rounded text-[9px] font-mono border transition-all ${
                            active
                              ? clickable
                                ? `${PHASE_COLORS[phase].border} ${PHASE_COLORS[phase].text} bg-slate-800/60 hover:bg-slate-700/60 cursor-pointer`
                                : `${PHASE_COLORS[phase].border} ${PHASE_COLORS[phase].text} bg-slate-800/40 cursor-default`
                              : 'border-transparent text-slate-700 cursor-default'
                          }`}
                          title={clickable ? `${phase} — ${taskDone}/${taskTotal} erledigt` : undefined}
                        >
                          {phase}{active && taskTotal > 0 ? ` ${taskDone}/${taskTotal}` : ''}
                        </button>
                      )
                    })}
                  </div>

                  {/* Zeile 4: Team + Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        {team.map(uid => {
                          const m = teamMembers.find(t => t.id === uid)
                          return m ? <div key={uid} className="ring-1 ring-[#0f172a] rounded-full"><MemberAvatar member={m} /></div> : null
                        })}
                        {!team.length && <span className="text-[9px] font-mono text-slate-700">Kein Team</span>}
                      </div>
                      {groups.filter(g => g.engagementId === eng.id).map(g => {
                        const gc = GROUP_COLORS[g.color] || GROUP_COLORS.cyan
                        return (
                          <span key={g.id} className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border border-current/20 ${gc.text}`}>
                            <Layers size={8} /> {g.name}
                          </span>
                        )
                      })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isAdmin && (
                        <button onClick={e => { e.stopPropagation(); setAssignModal(eng) }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-purple-500/40 bg-purple-500/10 text-[10px] font-mono text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/60 transition-all">
                          <Users2 size={10} /> Zuweisen
                        </button>
                      )}
                      {canAccess && (
                        <button onClick={e => { e.stopPropagation(); onEngDetail?.(eng.id) }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-[10px] font-mono transition-all ${
                            pendingReports[eng.id]
                              ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20'
                              : 'border-slate-500/40 bg-slate-500/10 text-slate-300 hover:bg-slate-500/20 hover:border-slate-400/50'
                          }`}>
                          <FileText size={10} /> Details
                        </button>
                      )}
                      {isAdmin && <>
                        <button onClick={e => { e.stopPropagation(); setEditingEng(eng) }}
                          className="p-1.5 rounded text-slate-600 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all" title="Bearbeiten">
                          <Edit3 size={12} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setConfirmDelete(eng) }}
                          className="p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all" title="Löschen">
                          <Trash2 size={12} />
                        </button>
                      </>}
                    </div>
                  </div>
                </div>
              )
            })}
            {!sorted.length && <p className="text-center text-xs font-mono text-slate-700 py-8">Keine Engagements gefunden.</p>}
          </div>
        </Panel>
      )}

      {assignModal && (
        <AssignTeamModal
          engagement={assignModal}
          teamMembers={teamMembers}
          assigned={assignments[assignModal.id] || []}
          onSave={onAssign}
          onClose={() => setAssignModal(null)}
          groups={groups}
          clients={allClientsProp}
        />
      )}

      {view === 'list' && (
        <Panel>
          <PanelHeader title="All Engagements" subtitle={`${sorted.length} von ${scopeEngagements.length}`} info={TIPS[tipsLang].engList} />
          <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono min-w-[600px]">
            <thead>
              <tr className="border-b border-[#1e293b]">
                {['Engagement', 'Client', 'Typ', 'Zeitraum', 'Status', 'Phasen', 'Team', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] text-slate-600 uppercase tracking-wider font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {sorted.map(eng => {
                const client = allClientsProp.find(c => c.id === eng.clientId)
                const team = assignments[eng.id] || []
                const canAccess = isAdmin || team.includes(currentUser?.id)
                return (
                  <tr key={eng.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-xs font-mono font-medium text-slate-200">{eng.title}</div>
                      <div className="text-[9px] font-mono text-slate-600 mt-0.5">{eng.lead ? `Lead: ${eng.lead}` : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs font-mono">{client?.name}</td>
                    <td className="px-4 py-3 text-slate-500 text-[10px] font-mono">{eng.type}</td>
                    <td className="px-4 py-3 text-slate-500 text-[10px] font-mono whitespace-nowrap">
                      <span>{fmtDate(eng.start, uiLang)}</span>
                      <span className="text-slate-700 mx-1">→</span>
                      <span>{fmtDate(eng.end, uiLang)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {canCycleStatus
                        ? <button onClick={() => onStatusChange?.(eng.id)} title={`→ ${ENG_STATUS_CYCLE[eng.status]}`} className="hover:opacity-75 transition-opacity"><StatusBadge status={eng.status} /></button>
                        : <StatusBadge status={eng.status} />
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {['Recon', 'Scanning', 'Exploitation', 'Reporting'].map(phase => {
                          const active = eng.phases.includes(phase)
                          const clickable = active && canAccess
                          const checks = eng.phaseChecks?.[phase] || []
                          const taskTotal = (PHASE_TASKS[phase] || []).length
                          const taskDone = checks.length
                          return (
                            <button
                              key={phase}
                              disabled={!clickable}
                              onClick={() => clickable && setPhaseModal({ eng, phase })}
                              title={clickable ? `${phase} — ${taskDone}/${taskTotal} erledigt` : undefined}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono border transition-all ${
                                active
                                  ? clickable
                                    ? `${PHASE_COLORS[phase].border} ${PHASE_COLORS[phase].text} bg-slate-800/60 hover:bg-slate-700/60 cursor-pointer`
                                    : `${PHASE_COLORS[phase].border} ${PHASE_COLORS[phase].text} bg-slate-800/40 cursor-default`
                                  : 'border-transparent text-slate-700 cursor-default'
                              }`}
                            >
                              {phase.slice(0, 3)}{active && taskTotal > 0 ? ` ${taskDone}/${taskTotal}` : ''}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex -space-x-1.5">
                        {team.map(uid => {
                          const m = teamMembers.find(t => t.id === uid)
                          return m ? <div key={uid} className="ring-1 ring-[#0a0a0a] rounded-full"><MemberAvatar member={m} /></div> : null
                        })}
                        {!team.length && <span className="text-[9px] font-mono text-slate-700">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {canAccess && (
                          <button onClick={() => onEngDetail?.(eng.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-[10px] font-mono transition-all ${
                              pendingReports[eng.id]
                                ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20'
                                : 'border-slate-500/40 bg-slate-500/10 text-slate-300 hover:bg-slate-500/20 hover:border-slate-400/50'
                            }`}>
                            <FileText size={10} /> Details
                          </button>
                        )}
                        {isAdmin && (
                          <button onClick={() => setAssignModal(eng)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-purple-500/40 bg-purple-500/10 text-[10px] font-mono text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/60 transition-all">
                            <Users2 size={10} /> Zuweisen
                          </button>
                        )}
                        {isAdmin && (
                          <button onClick={() => setEditingEng(eng)} title="Bearbeiten"
                            className="p-1 rounded text-slate-600 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
                            <Edit3 size={11} />
                          </button>
                        )}
                        {isAdmin && (
                          <button onClick={() => setConfirmDelete(eng)} title="Löschen"
                            className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all">
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </Panel>
      )}
    </div>
  )
}

// ─── CLIENT RADAR ────────────────────────────────────────────────────────────

function ClientRadar({ onClientClick, currentUser, assignments, clients: allClients = [], tipsLang = 'de' }) {
  const [radarFilter, setRadarFilter] = useState('All')
  const { clients: scopeClients } = useMemo(
    () => getMyScope(currentUser, assignments, allClients),
    [currentUser, assignments, allClients]
  )

  const activeCount   = useMemo(() => scopeClients.filter(c => c.status === 'Active').length, [scopeClients])
  const onHoldCount   = useMemo(() => scopeClients.filter(c => c.status === 'On Hold').length, [scopeClients])
  const criticalCount = useMemo(() => scopeClients.filter(c => c.criticality === 'CRITICAL').length, [scopeClients])
  const upcomingCount = useMemo(() => scopeClients.filter(c => { const d = daysUntil(c.nextTest); return d >= 0 && d <= 30 }).length, [scopeClients])

  const displayed = useMemo(() => scopeClients.filter(c => {
    if (radarFilter === 'active')   return c.status === 'Active'
    if (radarFilter === 'onhold')   return c.status === 'On Hold'
    if (radarFilter === 'critical') return c.criticality === 'CRITICAL'
    if (radarFilter === 'upcoming') return daysUntil(c.nextTest) >= 0 && daysUntil(c.nextTest) <= 30
    return true
  }), [scopeClients, radarFilter])

  return (
    <div className="p-3 lg:p-6 space-y-4 lg:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label="Active Clients" value={activeCount} sub={`${scopeClients.length} gesamt`} icon={Activity}
          accent={radarFilter === 'All'} active={radarFilter === 'active'}
          info={TIPS[tipsLang].radarActive}
          onClick={() => setRadarFilter(radarFilter === 'active' ? 'All' : 'active')} />
        <KpiCard label="On Hold" value={onHoldCount} sub="Pausiert" icon={Pause}
          active={radarFilter === 'onhold'}
          info={TIPS[tipsLang].radarOnHold}
          onClick={() => setRadarFilter(radarFilter === 'onhold' ? 'All' : 'onhold')} />
        <KpiCard label="Kritisch" value={criticalCount} sub="Höchste Priorität" icon={AlertTriangle}
          active={radarFilter === 'critical'}
          info={TIPS[tipsLang].radarCritical}
          onClick={() => setRadarFilter(radarFilter === 'critical' ? 'All' : 'critical')} />
        <KpiCard label="Test ≤30d" value={upcomingCount} sub="Bald fällig" icon={Calendar}
          active={radarFilter === 'upcoming'}
          info={TIPS[tipsLang].radarDue}
          onClick={() => setRadarFilter(radarFilter === 'upcoming' ? 'All' : 'upcoming')} />
      </div>
      <Panel>
        <PanelHeader title="Client Radar" subtitle={`${displayed.length} von ${scopeClients.length} Clients`} />
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayed.map(client => {
            const ScopeIcon = SCOPE_ICONS[client.scopeType] || Globe
            const days = daysUntil(client.nextTest)
            return (
              <button key={client.id} onClick={() => onClientClick(client.id)}
                className="text-left p-4 bg-[#0a0a0a] border border-[#1e293b] rounded-lg hover:border-cyan-500/40 hover:bg-cyan-500/3 transition-all duration-200 group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ScopeIcon size={13} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    <span className="text-[10px] font-mono text-slate-600">{client.scopeType}</span>
                  </div>
                  <StatusBadge status={client.status} />
                </div>
                <h3 className="text-sm font-mono font-semibold text-slate-100 mb-0.5 truncate group-hover:text-cyan-300 transition-colors">{client.name}</h3>
                <p className="text-[10px] font-mono text-slate-600 mb-3">{client.industry}</p>
                <div className="flex items-center justify-between">
                  <SeverityBadge severity={client.criticality} />
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-slate-600">Nächster Test</div>
                    <div className={`text-xs font-mono font-bold ${days <= 14 ? 'text-red-400' : days <= 30 ? 'text-yellow-400' : 'text-slate-400'}`}>
                      {days <= 0 ? 'HEUTE' : `${days}d`}
                    </div>
                  </div>
                </div>
                {client.openFindings > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    <AlertTriangle size={10} className="text-red-400" />
                    <span className="text-[10px] font-mono text-red-400">{client.openFindings} offene Findings</span>
                  </div>
                )}
              </button>
            )
          })}
          {displayed.length === 0 && (
            <div className="col-span-3 py-10 text-center text-xs font-mono text-slate-600">
              Keine Clients entsprechen dem aktiven Filter.
            </div>
          )}
        </div>
      </Panel>
    </div>
  )
}

// ─── REPORTING CENTER ────────────────────────────────────────────────────────

function NewReportModal({ onAdd, onClose, clients = [], engagements = [] }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    title: '', clientId: clients[0]?.id || '', type: 'Technical Report',
    date: today, status: 'Draft', engagementId: '',
  })
  const inputCls = "w-full bg-[#0a0a0a] border border-[#1e293b] rounded px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-700 focus:outline-none focus:border-cyan-500/50 transition-colors"
  const selectCls = "w-full bg-[#0a0a0a] border border-[#1e293b] rounded px-3 py-2 text-xs font-mono text-slate-400 focus:outline-none focus:border-cyan-500/50 transition-colors"

  const handleSubmit = (e) => {
    e.preventDefault()
    onAdd({ id: `r${Date.now()}`, ...form, engagementId: form.engagementId || undefined })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e293b]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
              <FileText size={14} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold text-slate-100">Neuen Report anlegen</h2>
              <p className="text-[10px] font-mono text-slate-600 mt-0.5">Dokument im Report-Registry erstellen</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 lg:p-6 space-y-4">
          <div>
            <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider block mb-1.5">Titel *</label>
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="z.B. Red Team Report Q3/2026" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider block mb-1.5">Client *</label>
              <select required value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} className={selectCls}>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider block mb-1.5">Typ *</label>
              <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={selectCls}>
                <option>Technical Report</option>
                <option>Executive Summary</option>
                <option>Remediation Plan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider block mb-1.5">Datum *</label>
              <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className={selectCls} />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider block mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={selectCls}>
                <option>Draft</option>
                <option>Delivered</option>
                <option>Final</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider block mb-1.5">Engagement (optional)</label>
            <select value={form.engagementId} onChange={e => setForm(f => ({ ...f, engagementId: e.target.value }))} className={selectCls}>
              <option value="">— kein Engagement —</option>
              {engagements.map(e => {
                const c = clients.find(cl => cl.id === e.clientId)
                return <option key={e.id} value={e.id}>{e.title} · {c?.name}</option>
              })}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit"
              className="flex-1 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-mono font-bold text-xs tracking-widest transition-all flex items-center justify-center gap-2">
              <Plus size={13} /> Report anlegen
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-[#1e293b] text-slate-500 font-mono text-xs hover:text-slate-300 hover:border-slate-600 transition-all">
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const REPORT_TYPE_ICONS = {
  'Technical Report':   FileText,
  'Executive Summary':  TrendingUp,
  'Remediation Plan':   CheckCircle2,
}

function ReportModal({ report, client, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b]">
          <div>
            <h2 className="text-sm font-mono font-bold text-slate-100">{report.title}</h2>
            <p className="text-xs font-mono text-slate-500 mt-0.5">{client?.name} · {report.date}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all">
            <X size={15} />
          </button>
        </div>
        <div className="p-6 space-y-5 text-xs font-mono">
          <div className="border border-[#1e293b] rounded-lg p-4">
            <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-2">Document Header</div>
            <div className="space-y-1 text-slate-400">
              <div className="flex justify-between"><span className="text-slate-600">Classification:</span> <span className="text-red-400 font-bold">CONFIDENTIAL</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Client:</span> <span>{client?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Author:</span> <span>Leif Balthasar // HolySec</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Date:</span> <span>{report.date}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Version:</span> <span>1.0 — {report.status}</span></div>
            </div>
          </div>

          {report.type === 'Executive Summary' && (
            <>
              <div>
                <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-2">Executive Summary</div>
                <div className="text-slate-400 leading-relaxed">HolySec conducted a comprehensive security assessment of {client?.name}'s infrastructure. The engagement revealed several critical vulnerabilities that require immediate attention. Overall security posture is assessed as <span className="text-red-400">HIGH RISK</span>.</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-2">Key Findings</div>
                <div className="space-y-1 text-slate-500">
                  <div>• Critical: 2 findings requiring immediate remediation</div>
                  <div>• High: 3 findings with significant business impact</div>
                  <div>• Recommended immediate actions outlined in Technical Report</div>
                </div>
              </div>
            </>
          )}

          {report.type === 'Technical Report' && (
            <>
              <div>
                <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-2">Scope & Methodology</div>
                <div className="text-slate-400 leading-relaxed">Black-box assessment following PTES and OWASP Testing Guide v4.2. Phases: Reconnaissance, Scanning, Exploitation, Post-Exploitation, Reporting.</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-2">Findings Summary</div>
                <div className="bg-[#0a0a0a] rounded p-3 space-y-1 text-slate-500">
                  {['CRITICAL — 2', 'HIGH — 3', 'MEDIUM — 2', 'LOW — 1'].map(l => <div key={l}>• {l}</div>)}
                </div>
              </div>
            </>
          )}

          {report.type === 'Remediation Plan' && (
            <>
              <div>
                <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-2">Remediation Roadmap</div>
                <div className="space-y-2 text-slate-400">
                  <div className="flex items-start gap-2"><CheckCircle2 size={12} className="text-green-400 mt-0.5 shrink-0" /><span>Phase 1 (0–30 days): Critical findings patched</span></div>
                  <div className="flex items-start gap-2"><Clock size={12} className="text-yellow-400 mt-0.5 shrink-0" /><span>Phase 2 (30–90 days): High findings addressed</span></div>
                  <div className="flex items-start gap-2"><AlertTriangle size={12} className="text-orange-400 mt-0.5 shrink-0" /><span>Phase 3 (90–180 days): Medium/Low findings + hardening</span></div>
                </div>
              </div>
            </>
          )}

          <div className="border-t border-[#1e293b] pt-4 text-slate-700 text-[10px] leading-relaxed">
            This document is confidential and intended solely for {client?.name}. Unauthorized distribution is prohibited. HolySec — Blessed by Offense, Built for Defense.
          </div>
        </div>
      </div>
    </div>
  )
}

function ReportingCenter({ reports, onStatusChange, onAdd, currentUser, assignments, onAuditLog, tipsLang = 'de', clients = [], engagements = [], findings: allFindings = [] }) {
  const [selectedReport, setSelectedReport] = useState(null)
  const [filterClient, setFilterClient] = useState('All')
  const [filterType, setFilterType] = useState('All')
  const [showNewReport, setShowNewReport] = useState(false)

  const { engagements: scopeEngagements } = useMemo(
    () => getMyScope(currentUser, assignments),
    [currentUser, assignments]
  )
  const scopeReports = useMemo(() => {
    if (['Admin', 'Senior Pentester', 'Pentester'].includes(currentUser?.role)) return reports
    const ids = new Set(scopeEngagements.map(e => e.id))
    return reports.filter(r => !r.engagementId || ids.has(r.engagementId))
  }, [currentUser?.role, reports, scopeEngagements])

  const clientsWithReports = useMemo(() => clients.filter(c => scopeReports.some(r => r.clientId === c.id)), [clients, scopeReports])
  const filtered = useMemo(() => scopeReports.filter(r =>
    (filterClient === 'All' || r.clientId === filterClient) &&
    (filterType === 'All' || r.type === filterType)
  ), [scopeReports, filterClient, filterType])

  return (
    <div className="p-3 lg:p-6 space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
            className="bg-[#0f172a] border border-[#1e293b] rounded px-2 py-1.5 text-xs font-mono text-slate-400 focus:outline-none focus:border-cyan-500/50">
            <option value="All">All Clients</option>
            {clientsWithReports.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {currentUser?.role !== 'Junior Pentester' && (
            <button onClick={() => setShowNewReport(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs font-mono text-cyan-400 hover:bg-cyan-500/20 transition-all">
              <Plus size={12} /> New Report
            </button>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          {['All', 'Technical Report', 'Executive Summary', 'Remediation Plan'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono border transition-all ${filterType === t ? 'border-slate-500/50 bg-slate-700/40 text-slate-300' : 'border-[#1e293b] text-slate-500 hover:text-slate-300'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
        {[
          { type: 'Technical Report',  info: 'Detaillierter Befundbericht für das IT- und Security-Team. Enthält alle Findings mit CVSS-Score, Proof of Concept, CVE-Referenz und konkreter Remediation-Empfehlung. Zielgruppe: Admins, Entwickler, Sicherheitsteam.' },
          { type: 'Executive Summary', info: 'Kompakte Managementzusammenfassung ohne tiefe technische Details. Zeigt Gesamtrisikobewertung, kritische Findings und priorisierte Handlungsempfehlungen auf 1–2 Seiten. Zielgruppe: Geschäftsführung, CISO, Vorstand.' },
          { type: 'Remediation Plan',  info: 'Strukturierter Maßnahmenplan zur Behebung aller identifizierten Findings. Enthält priorisierte Schritte, empfohlene Zeitrahmen (CRITICAL ≤ 7d, HIGH ≤ 30d) und Erfolgskriterien für den Retest. Zielgruppe: Projektmanagement, Entwicklung.' },
        ].map(({ type, info }) => {
          const Icon = REPORT_TYPE_ICONS[type]
          const count = scopeReports.filter(r => r.type === type).length
          return (
            <Panel key={type}
              className={`p-4 flex items-center gap-3 cursor-pointer transition-all ${filterType === type ? 'border-cyan-500/40 bg-cyan-500/5' : 'hover:border-slate-600'}`}
              onClick={() => setFilterType(filterType === type ? 'All' : type)}>
              <div className="p-2 bg-slate-800 rounded">
                <Icon size={14} className={filterType === type ? 'text-cyan-400' : 'text-slate-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-slate-400 truncate">{type}</span>
                  <span onClick={e => e.stopPropagation()}><InfoTooltip text={info} /></span>
                </div>
                <div className="text-lg font-mono font-bold text-slate-100">{count}</div>
              </div>
            </Panel>
          )
        })}
      </div>

      <Panel>
        <PanelHeader title="Report Registry" subtitle={`${filtered.length} documents`} info={TIPS[tipsLang].reportRegistry} />
        <div className="divide-y divide-[#1e293b]">
          {filtered.map(rep => {
            const client = clients.find(c => c.id === rep.clientId)
            const Icon = REPORT_TYPE_ICONS[rep.type] || FileText
            return (
              <div key={rep.id} className="px-4 py-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-800 rounded">
                    <Icon size={13} className="text-slate-400" />
                  </div>
                  <div>
                    <div className="text-sm font-mono text-slate-100 group-hover:text-cyan-300 transition-colors">{rep.title}</div>
                    <div className="text-xs font-mono text-slate-600 mt-0.5">{client?.name} · {rep.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{rep.type}</span>
                  <button onClick={() => onStatusChange(rep.id)} title="Status wechseln (Open → Draft → Delivered)"
                    className="cursor-pointer hover:opacity-80 transition-opacity">
                    <StatusBadge status={rep.status} />
                  </button>
                  <button
                    onClick={() => setSelectedReport(rep)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#1e293b] rounded text-xs font-mono text-slate-500 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
                  >
                    <Eye size={11} /> Preview
                  </button>
                  <button
                    onClick={() => { generateReportPDF(rep, client, allFindings); onAuditLog?.(`Report PDF: "${rep.title}"`) }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#1e293b] rounded text-xs font-mono text-slate-500 hover:text-green-400 hover:border-green-500/40 transition-all"
                  >
                    <Download size={11} /> PDF
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </Panel>

      {selectedReport && (
        <ReportModal
          report={selectedReport}
          client={clients.find(c => c.id === selectedReport.clientId)}
          onClose={() => setSelectedReport(null)}
        />
      )}

      {showNewReport && (
        <NewReportModal onAdd={onAdd} onClose={() => setShowNewReport(false)} clients={clients} engagements={engagements} />
      )}
    </div>
  )
}

// ─── ABOUT HOLYSEC ───────────────────────────────────────────────────────────

function AboutHolySec() {
  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Hero */}
      <Panel className="p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
              <Crown size={28} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-mono font-bold text-slate-100 tracking-wider">
                HOLY<span className="text-cyan-400">SEC</span>
              </h1>
              <p className="text-sm font-mono text-slate-500 italic">Blessed by Offense, Built for Defense.</p>
            </div>
          </div>
          <p className="text-sm font-mono text-slate-400 leading-relaxed max-w-2xl">
            HolySec ist eine Elite-Boutique für offensive Sicherheitsleistungen. Wir operieren nach dem Prinzip: wer angreift wie ein Feind, versteht wie ein Feind — und verteidigt wie kein anderer.
          </p>
        </div>
      </Panel>

      {/* Drei Heiligen Könige — Die Erklärung */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="p-6 border-t-2 border-t-cyan-400">
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-cyan-400" />
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">Holy</span>
          </div>
          <h3 className="text-lg font-mono font-bold text-slate-100 mb-2">Heilig</h3>
          <p className="text-xs font-mono text-slate-400 leading-relaxed">
            Die Heiligen Drei Könige folgten einem Stern ins Unbekannte — geleitet von <span className="text-cyan-300">Weisheit</span>, nicht von Zufall. HolySec folgt demselben Prinzip: Jeder Pentest ist eine gezielte Pilgerreise durch feindliche Infrastruktur. Was heilig ist, ist präzise, integer und unbestechlich.
          </p>
          <div className="mt-4 pt-4 border-t border-[#1e293b]">
            <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">Unser Versprechen</div>
            <div className="text-xs font-mono text-cyan-400">Integrität über allem.</div>
          </div>
        </Panel>

        <Panel className="p-6 border-t-2 border-t-yellow-400">
          <div className="flex items-center gap-2 mb-3">
            <Crown size={16} className="text-yellow-400" />
            <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-widest">Balthasar</span>
          </div>
          <h3 className="text-lg font-mono font-bold text-slate-100 mb-2">Der König</h3>
          <p className="text-xs font-mono text-slate-400 leading-relaxed">
            Balthasar — einer der Drei Weisen — brachte <span className="text-yellow-300">Myrrhe</span>: ein Konservierungsmittel, ein Symbol für Schutz und Erhalt. Leif Balthasar trägt diesen Namen nicht zufällig. Wie der König aus dem Morgenland bringt er seinen Kunden das Wertvollste: <span className="text-yellow-300">Schutz vor dem Unsichtbaren</span>.
          </p>
          <div className="mt-4 pt-4 border-t border-[#1e293b]">
            <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">Das Geschenk</div>
            <div className="text-xs font-mono text-yellow-400">Myrrhe — Schutz, der konserviert.</div>
          </div>
        </Panel>

        <Panel className="p-6 border-t-2 border-t-red-400">
          <div className="flex items-center gap-2 mb-3">
            <Sword size={16} className="text-red-400" />
            <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">Offense</span>
          </div>
          <h3 className="text-lg font-mono font-bold text-slate-100 mb-2">Der Angriff</h3>
          <p className="text-xs font-mono text-slate-400 leading-relaxed">
            Die Drei Könige reisten durch feindliches Territorium — unerkannt, strategisch, mit klarem Ziel. Genau so operiert HolySec: <span className="text-red-300">Recon vor dem Angriff</span>, Exploitation mit Präzision, Reporting mit Klarheit. Gesegnet durch Offense — denn nur wer angreift, versteht wie man schützt.
          </p>
          <div className="mt-4 pt-4 border-t border-[#1e293b]">
            <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">Die Methode</div>
            <div className="text-xs font-mono text-red-400">Seek. Strike. Secure.</div>
          </div>
        </Panel>
      </div>

      {/* Drei Wörter */}
      <Panel className="p-6">
        <div className="text-center mb-6">
          <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-2">Die drei Wörter hinter HolySec</div>
          <p className="text-sm font-mono text-slate-400">Was die Heiligen Drei Könige mitbrachten — was wir liefern.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            { word: 'GOLD', sub: 'Aurum', desc: 'Wert ohne Kompromiss. Jeder Report, jede Zeile Code, jeder Befund hat Substanz — kein Füllwerk, kein Boilerplate.', color: 'text-yellow-400', border: 'border-yellow-400/30', bg: 'bg-yellow-400/5', icon: Star },
            { word: 'WEIHRAUCH', sub: 'Incensum', desc: 'Klarheit durch Rauch. Wir durchdringen Nebel und Verschleierung — in Netzwerken, in Code, in Prozessen. Wir bringen Licht ins Dunkel.', color: 'text-cyan-400', border: 'border-cyan-400/30', bg: 'bg-cyan-400/5', icon: Eye },
            { word: 'MYRRHE', sub: 'Myrrha', desc: 'Konservierung und Schutz. Myrrhe bewahrt — so wie wir Systeme, Daten und Reputationen vor dem Verfall durch Angreifer bewahren.', color: 'text-purple-400', border: 'border-purple-400/30', bg: 'bg-purple-400/5', icon: Shield },
          ].map(({ word, sub, desc, color, border, bg, icon: Icon }) => (
            <div key={word} className={`p-5 rounded-lg border ${border} ${bg}`}>
              <Icon size={20} className={`${color} mx-auto mb-3`} />
              <div className={`text-xl font-mono font-black ${color} mb-0.5`}>{word}</div>
              <div className={`text-[10px] font-mono italic mb-3 ${color} opacity-70`}>{sub}</div>
              <p className="text-xs font-mono text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </Panel>

      {/* Leif's Profile */}
      <Panel className="p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          <div className="p-4 bg-[#0a0a0a] border border-[#1e293b] rounded-lg shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center">
              <span className="text-xl font-mono font-black text-black">LB</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div>
                <h2 className="text-lg font-mono font-bold text-slate-100">Leif Balthasar</h2>
                <p className="text-sm font-mono text-cyan-400">Founder & Senior Penetration Tester — HolySec</p>
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-600 mb-1">Contact</div>
                <div className="text-xs font-mono text-cyan-400">leif@holysec.de</div>
              </div>
            </div>
            <p className="text-xs font-mono text-slate-400 leading-relaxed mb-4">
              Spezialist für offensive Sicherheit mit Fokus auf Red Team Operations, Cloud-Security und OT/ICS-Assessments. Methodisch verankert in PTES, OWASP und MITRE ATT&CK — pragmatisch in der Ausführung.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Red Team', 'Web App Pentesting', 'Cloud Security', 'OT/ICS', 'Social Engineering', 'OSCP', 'CRTO', 'AWS Security'].map(tag => (
                <span key={tag} className="text-[10px] font-mono text-slate-500 bg-slate-800 border border-[#1e293b] rounded px-2 py-0.5">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  )
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────

function UserManagementSection({ members, currentUser, onAdd, onRemove, onEdit }) {
  const [search, setSearch]           = useState('')
  const [sortBy, setSortBy]           = useState('name')
  const [filterRole, setFilterRole]   = useState('All')
  const [showAdd, setShowAdd]         = useState(false)
  const [editMember, setEditMember]   = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const displayed = [...members]
    .filter(m =>
      (filterRole === 'All' || m.role === filterRole) &&
      (search === '' || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'name')  return a.name.localeCompare(b.name)
      if (sortBy === 'role')  return a.role.localeCompare(b.role)
      if (sortBy === 'email') return a.email.localeCompare(b.email)
      return 0
    })

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader title="Benutzerverwaltung" subtitle={`${members.length} Benutzer im System`}>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs font-mono text-cyan-400 hover:bg-cyan-500/20 transition-all">
            <UserPlus size={12} /> Benutzer anlegen
          </button>
        </PanelHeader>

        <div className="flex flex-col gap-2 px-5 py-3 border-b border-[#1e293b]">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-0">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name oder E-Mail..."
                className="w-full bg-[#0a0a0a] border border-[#1e293b] rounded px-3 py-1.5 pl-8 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div className="flex gap-1 items-center shrink-0">
              <span className="text-[10px] font-mono text-slate-600">Sortieren:</span>
              {[['name', 'Name'], ['role', 'Rolle'], ['email', 'E-Mail']].map(([k, label]) => (
                <button key={k} onClick={() => setSortBy(k)}
                  className={`px-2 py-1 rounded text-[10px] font-mono border transition-all ${sortBy === k ? 'border-slate-500/50 bg-slate-700/40 text-slate-300' : 'border-[#1e293b] text-slate-500 hover:text-slate-300'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-1 flex-wrap">
            {['All', 'Admin', 'Senior Pentester', 'Pentester', 'Junior Pentester'].map(r => (
              <button key={r} onClick={() => setFilterRole(r)}
                className={`px-2 py-1 rounded text-[10px] font-mono border transition-all ${filterRole === r ? 'border-slate-500/50 bg-slate-700/40 text-slate-300' : 'border-[#1e293b] text-slate-500 hover:text-slate-300'}`}>
                {r === 'All' ? 'Alle' : r}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono min-w-[480px]">
          <thead>
            <tr className="border-b border-[#1e293b]">
              {['Benutzer', 'Rolle', 'E-Mail', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] text-slate-600 uppercase tracking-wider font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {displayed.map(member => {
              const isSelf = member.id === currentUser?.id
              const roleCls = ROLE_BADGE[member.role] || ROLE_BADGE['Pentester']
              return (
                <tr key={member.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <MemberAvatar member={member} size="md" />
                      <div>
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          {member.name}
                          {isSelf && <span className="text-[9px] text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded px-1">YOU</span>}
                        </div>
                        <div className="text-[10px] text-slate-600 mt-0.5">{member.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-mono font-medium ${roleCls}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{member.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-mono text-green-400 bg-green-400/10 border border-green-400/20 rounded px-2 py-0.5">
                      {member.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setEditMember(member)} title="Bearbeiten"
                        className="p-1.5 rounded text-slate-600 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all">
                        <Edit3 size={12} />
                      </button>
                      {!isSelf && (
                        <button onClick={() => setDeleteConfirm(member)} title="Löschen"
                          className="p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </Panel>

      {showAdd && <AddEditMemberModal onAdd={onAdd} onClose={() => setShowAdd(false)} />}
      {editMember && <AddEditMemberModal member={editMember} onEdit={onEdit} onClose={() => setEditMember(null)} />}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-[#0f172a] border border-red-500/20 rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg"><Trash2 size={14} className="text-red-400" /></div>
              <div>
                <h2 className="text-sm font-mono font-bold text-slate-100">Benutzer löschen</h2>
                <p className="text-[10px] font-mono text-slate-600 mt-0.5">Nicht rückgängig zu machen</p>
              </div>
            </div>
            <p className="text-xs font-mono text-slate-400 mb-5 leading-relaxed">
              <span className="text-slate-200 font-semibold">{deleteConfirm.name}</span> ({deleteConfirm.role}) wird dauerhaft aus dem System entfernt.
            </p>
            <div className="flex gap-2">
              <button onClick={() => { onRemove(deleteConfirm.id); setDeleteConfirm(null) }}
                className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white font-mono font-bold text-xs transition-all">
                Endgültig löschen
              </button>
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-lg border border-[#1e293b] text-slate-500 font-mono text-xs hover:text-slate-300 transition-all">
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TIME TRACKING SECTION ───────────────────────────────────────────────────

function TimeTrackingSection({ entries, currentUser, members, uiLang = 'en' }) {
  const isAdmin = currentUser?.role === 'Admin'
  const [userFilter, setUserFilter] = useState('all')
  const [range, setRange] = useState('week')

  const now = new Date()
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1)); startOfWeek.setHours(0,0,0,0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const rangeStart = range === 'week' ? startOfWeek : startOfMonth

  const visible = entries.filter(e => {
    const d = new Date(e.date)
    const matchRange = d >= rangeStart
    const matchUser = isAdmin ? (userFilter === 'all' || e.userId === userFilter) : e.userId === currentUser.id
    return matchRange && matchUser
  })

  const totalSecs = visible.reduce((s, e) => s + e.duration, 0)
  const todayStr = now.toISOString().split('T')[0]
  const todaySecs = visible.filter(e => e.date === todayStr).reduce((s, e) => s + e.duration, 0)

  const byUser = members.map(m => ({
    ...m,
    secs: visible.filter(e => e.userId === m.id).reduce((s, e) => s + e.duration, 0),
    count: visible.filter(e => e.userId === m.id).length,
  })).filter(m => m.secs > 0)

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Heute" value={formatDurationShort(todaySecs) || '—'} sub="Erfasste Zeit" icon={Clock} accent />
        <KpiCard label={range === 'week' ? 'Diese Woche' : 'Dieser Monat'} value={formatDurationShort(totalSecs) || '—'} sub={`${visible.length} Einträge`} icon={Timer} />
        <KpiCard label="Ø pro Tag" value={range === 'week' ? formatDurationShort(Math.floor(totalSecs / 5)) || '—' : formatDurationShort(Math.floor(totalSecs / now.getDate())) || '—'} sub="Durchschnitt" icon={TrendingUp} />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['week','month'].map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${range === r ? 'border-slate-500/50 bg-slate-700/40 text-slate-300' : 'border-[#1e293b] text-slate-500 hover:text-slate-300'}`}>
              {r === 'week' ? 'Diese Woche' : 'Dieser Monat'}
            </button>
          ))}
        </div>
        {isAdmin && (
          <select value={userFilter} onChange={e => setUserFilter(e.target.value)}
            className="bg-[#0a0a0a] border border-[#1e293b] rounded px-3 py-1.5 text-xs font-mono text-slate-400 focus:outline-none focus:border-cyan-500/50">
            <option value="all">Alle Mitarbeiter</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}
      </div>

      {/* Per-user summary (admin only) */}
      {isAdmin && byUser.length > 0 && (
        <Panel>
          <PanelHeader title="Übersicht nach Mitarbeiter" />
          <div className="divide-y divide-[#1e293b]">
            {byUser.map(m => {
              const pct = Math.min(Math.round((m.secs / (range === 'week' ? 40 * 3600 : 160 * 3600)) * 100), 100)
              return (
                <div key={m.id} className="px-5 py-3 flex items-center gap-4">
                  <MemberAvatar member={m} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-slate-200">{m.name}</span>
                      <span className="text-xs font-mono text-slate-400 tabular-nums">{formatDurationShort(m.secs)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 w-12 text-right">{m.count} Eintr.</span>
                </div>
              )
            })}
          </div>
        </Panel>
      )}

      {/* Entries table */}
      <Panel>
        <PanelHeader title="Zeiteinträge" subtitle={`${visible.length} Einträge`} />
        {visible.length === 0 ? (
          <div className="py-10 text-center text-xs font-mono text-slate-600">
            Noch keine Einträge für diesen Zeitraum.
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono min-w-[360px]">
            <thead>
              <tr className="border-b border-[#1e293b]">
                {[...(isAdmin ? ['Mitarbeiter'] : []), 'Datum', 'Beginn', 'Ende', 'Dauer'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] text-slate-600 uppercase tracking-wider font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {[...visible].reverse().map(e => (
                <tr key={e.id} className="hover:bg-slate-800/20 transition-colors">
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {(() => { const m = members.find(m => m.id === e.userId); return m ? <MemberAvatar member={m} size="sm" /> : null })()}
                        <span className="text-slate-300">{e.userName}</span>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3 text-slate-400">{fmtDate(e.date, uiLang)}</td>
                  <td className="px-4 py-3 text-slate-300 tabular-nums">{e.start}</td>
                  <td className="px-4 py-3 text-slate-300 tabular-nums">{e.end}</td>
                  <td className="px-4 py-3">
                    <span className="text-cyan-400 font-semibold tabular-nums">{formatDuration(e.duration)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </Panel>
    </div>
  )
}

function TimeTrackingPage({ timeEntries, currentUser, members, uiLang = 'en' }) {
  const [exportRange,    setExportRange]    = useState('week')
  const [exportMemberId, setExportMemberId] = useState('all')

  const exportRangeStart = useMemo(() => {
    const now = new Date()
    if (exportRange === 'week') {
      const d = new Date(now)
      d.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1))
      d.setHours(0, 0, 0, 0)
      return d
    }
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }, [exportRange])

  const exportTargets = useMemo(() => {
    const hasEntries = m => timeEntries.some(e => e.userId === m.id && new Date(e.date) >= exportRangeStart)
    return exportMemberId === 'all'
      ? members.filter(hasEntries)
      : members.filter(m => m.id === exportMemberId)
  }, [exportMemberId, members, timeEntries, exportRangeStart])

  return (
    <div className="p-3 lg:p-6 space-y-5">
      <TimeTrackingSection entries={timeEntries} currentUser={currentUser} members={members} uiLang={uiLang} />
      <Panel>
        <PanelHeader title="PDF Export" subtitle="Zeiterfassung eines Mitarbeiters oder aller Mitarbeiter ausgeben" />
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-mono text-slate-200">Zeitraum</div>
              <div className="text-[10px] font-mono text-slate-600">Welcher Zeitraum soll exportiert werden?</div>
            </div>
            <div className="flex gap-1">
              {[['week', 'Diese Woche'], ['month', 'Dieser Monat']].map(([val, label]) => (
                <button key={val} onClick={() => setExportRange(val)}
                  className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${exportRange === val ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' : 'border-[#1e293b] text-slate-500 hover:text-slate-300 hover:border-slate-600'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-mono text-slate-200">Mitarbeiter</div>
              <div className="text-[10px] font-mono text-slate-600">Einzelne Person oder alle auf einmal</div>
            </div>
            <select value={exportMemberId} onChange={e => setExportMemberId(e.target.value)}
              className="bg-[#0a0a0a] border border-[#1e293b] rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 w-52">
              <option value="all">Alle Mitarbeiter</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end pt-1">
            <button
              onClick={() => exportTargets.forEach((m, i) => setTimeout(() => exportTimePDF(m, timeEntries, exportRange), i * 300))}
              disabled={exportTargets.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs font-mono text-cyan-400 hover:bg-cyan-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              <Download size={13} />
              {exportMemberId === 'all'
                ? `${exportTargets.length} PDF${exportTargets.length !== 1 ? 's' : ''} generieren`
                : 'PDF generieren'}
            </button>
          </div>
        </div>
      </Panel>
    </div>
  )
}

function SettingsPage({ members, currentUser, onAdd, onRemove, onEdit, timeEntries, darkMode, onToggleDark, uiLang, onUiLangChange, tipsLang, onTipsLangChange }) {
  const isAdmin = currentUser?.role === 'Admin'
  const [tab, setTab]             = useState('general')
  const [apiKey, setApiKey]       = useState('sk-holysec-••••••••••••••••')
  const [notifications, setNotifications] = useState(true)
  const [nickname, setNickname]   = useState(currentUser?.nickname || '')
  const [nickSaved, setNickSaved] = useState(false)

  const tabs = [
    { id: 'general',  label: 'Allgemein', icon: Settings },
    ...(isAdmin ? [
      { id: 'api',     label: 'API & Integrationen', icon: Zap },
      { id: 'billing', label: 'Lizenz & System',     icon: Star },
    ] : []),
  ]

  return (
    <div className="p-3 lg:p-6 max-w-5xl space-y-5">
      <div className="overflow-x-auto">
        <div className="flex gap-1 border-b border-[#1e293b] min-w-max">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono border-b-2 transition-all whitespace-nowrap ${tab === t.id ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
              <t.icon size={12} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'general' && (
        <Panel>
          <PanelHeader title="Allgemeine Einstellungen" />
          <div className="p-5 space-y-5">
            {[
              { label: 'Anzeigename', sub: isAdmin ? 'Vollständiger Name (nur Admin kann ändern)' : 'Vollständiger Name — nur Admin kann ändern', defaultValue: currentUser?.name || '', editable: isAdmin },
              { label: 'Unternehmen', sub: 'Firmenname für Kundendokumente', defaultValue: 'HolySec', editable: isAdmin },
              { label: 'E-Mail Adresse', sub: 'Kontaktadresse für Reports', defaultValue: currentUser?.email || '', editable: isAdmin },
            ].map(({ label, sub, defaultValue, editable }) => (
              <div key={label} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                <div>
                  <div className="text-xs font-mono text-slate-200">{label}</div>
                  <div className="text-[10px] font-mono text-slate-600">{sub}</div>
                </div>
                {editable
                  ? <input defaultValue={defaultValue}
                      className="bg-[#0a0a0a] border border-[#1e293b] rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 w-full sm:w-52" />
                  : <span className="text-xs font-mono text-slate-400 bg-[#0a0a0a] border border-[#1e293b] rounded px-3 py-1.5 w-full sm:w-52 truncate select-none">{defaultValue}</span>
                }
              </div>
            ))}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
              <div>
                <div className="text-xs font-mono text-slate-200">Nickname <span className="text-slate-700">(optional)</span></div>
                <div className="text-[10px] font-mono text-slate-600">Wird im Team-Bereich und in Chats angezeigt</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="z.B. CyberLeif"
                  className="bg-[#0a0a0a] border border-[#1e293b] rounded px-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-700 focus:outline-none focus:border-cyan-500/50 flex-1 sm:w-44 sm:flex-none"
                />
                <button
                  onClick={() => { onEdit({ ...currentUser, nickname }); setNickSaved(true); setTimeout(() => setNickSaved(false), 2000) }}
                  disabled={nickSaved}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-xs font-mono transition-all shrink-0 ${nickSaved ? 'bg-green-500/15 border-green-500/40 text-green-400 cursor-default' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'}`}>
                  {nickSaved ? <><CheckCircle2 size={11} /> Gespeichert</> : 'Speichern'}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-mono text-slate-200">E-Mail Benachrichtigungen</div>
                <div className="text-[10px] font-mono text-slate-600">Alerts für bevorstehende Engagements</div>
              </div>
              <button onClick={() => setNotifications(v => !v)}
                className={`relative w-10 h-5 rounded-full border transition-all shrink-0 ${notifications ? 'bg-cyan-500 border-cyan-500' : 'bg-slate-800 border-[#1e293b]'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${notifications ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-mono text-slate-200">Erscheinungsbild</div>
                <div className="text-[10px] font-mono text-slate-600">Dark Mode / Light Mode</div>
              </div>
              <button onClick={onToggleDark}
                className={`relative w-10 h-5 rounded-full border transition-all shrink-0 ${darkMode ? 'bg-cyan-500 border-cyan-500' : 'bg-slate-800 border-[#1e293b]'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${darkMode ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-mono text-slate-200">Seitensprache</div>
                <div className="text-[10px] font-mono text-slate-600">Sprache der Navigation und Beschriftungen</div>
              </div>
              <div className="flex gap-1 shrink-0">
                {['de', 'en'].map(lang => (
                  <button key={lang} onClick={() => onUiLangChange?.(lang)}
                    className={`px-3 py-1.5 rounded border text-xs font-mono uppercase tracking-wider transition-all ${uiLang === lang ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-400' : 'border-[#1e293b] text-slate-500 hover:text-slate-300'}`}>
                    {lang === 'de' ? '🇩🇪 DE' : '🇬🇧 EN'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-mono text-slate-200">Tooltip-Sprache</div>
                <div className="text-[10px] font-mono text-slate-600">Sprache der Info-Tooltips und Hinweise</div>
              </div>
              <div className="flex gap-1 shrink-0">
                {['de', 'en'].map(lang => (
                  <button key={lang} onClick={() => onTipsLangChange?.(lang)}
                    className={`px-3 py-1.5 rounded border text-xs font-mono uppercase tracking-wider transition-all ${tipsLang === lang ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-400' : 'border-[#1e293b] text-slate-500 hover:text-slate-300'}`}>
                    {lang === 'de' ? '🇩🇪 DE' : '🇬🇧 EN'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      )}

      {tab === 'api' && isAdmin && (
        <div className="space-y-4">
          <Panel>
            <PanelHeader title="API & Integrationen" subtitle="Nur für Administratoren sichtbar" />
            <div className="p-5 space-y-4">
              <div>
                <div className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-2">Report API Key</div>
                <div className="flex gap-2">
                  <input value={apiKey} onChange={e => setApiKey(e.target.value)}
                    className="flex-1 bg-[#0a0a0a] border border-[#1e293b] rounded px-3 py-1.5 text-xs font-mono text-slate-400 focus:outline-none focus:border-cyan-500/50" />
                  <button className="px-3 py-1.5 border border-[#1e293b] rounded text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors">Regenerieren</button>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-2">Integrationen</div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Jira', status: 'Nicht verbunden', ok: false },
                    { name: 'Slack', status: 'Nicht verbunden', ok: false },
                    { name: 'CVE Datenbank', status: 'Verbunden', ok: true },
                    { name: 'MITRE ATT&CK', status: 'Verbunden', ok: true },
                  ].map(int => (
                    <div key={int.name} className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#1e293b] rounded-lg">
                      <span className="text-xs font-mono text-slate-300">{int.name}</span>
                      <span className={`text-[10px] font-mono ${int.ok ? 'text-green-400' : 'text-slate-600'}`}>{int.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'billing' && isAdmin && (
        <Panel>
          <PanelHeader title="Lizenz & System" subtitle="Nur für Administratoren sichtbar" />
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
              <div>
                <div className="text-sm font-mono font-bold text-cyan-400">HolySec Pro</div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">Unbegrenzte Clients & Reports · Alle Features freigeschaltet</div>
              </div>
              <span className="text-[10px] font-mono text-green-400 bg-green-400/10 border border-green-400/20 rounded px-2 py-1 font-bold">AKTIV</span>
            </div>
            <div className="space-y-3 text-xs font-mono">
              {[
                ['Lizenzinhaber', 'Leif Balthasar'],
                ['Lizenz-ID', 'HS-PRO-2026-LB'],
                ['Gültig bis', '31.12.2027'],
                ['Benutzer-Slots', `${members.length} / unbegrenzt`],
                ['Version', 'v1.0.0 // HolySec Ops Platform'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-[#1e293b]">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-slate-300">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}
    </div>
  )
}

// ─── TEAM MANAGEMENT ─────────────────────────────────────────────────────────

function AddEditMemberModal({ member = null, onAdd, onEdit, onClose }) {
  const isEdit = !!member
  const inputCls = "w-full bg-[#0a0a0a] border border-[#1e293b] rounded px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-700 focus:outline-none focus:border-cyan-500/50"
  const [form, setForm] = useState({
    name:     member?.name || '',
    email:    member?.email || '',
    password: '',
    role:     member?.role || 'Pentester',
    title:    member?.title || '',
    skills:   member?.skills?.join(', ') || '',
    color:    member?.color || MEMBER_COLORS_LIST[Math.floor(Math.random() * MEMBER_COLORS_LIST.length)],
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isEdit && !form.password.trim()) return
    const parts = form.name.trim().split(' ')
    const initials = (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : form.name.slice(0, 2)).toUpperCase()
    const data = {
      ...(isEdit ? member : { id: `u${Date.now()}`, status: 'Active' }),
      name:     form.name.trim(),
      email:    form.email.trim(),
      password: form.password.trim() || undefined,
      role:     form.role,
      title:    form.title.trim() || form.role,
      skills:   form.skills.split(',').map(s => s.trim()).filter(Boolean),
      initials,
      color:    form.color,
    }
    isEdit ? onEdit(data) : onAdd(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b]">
          <h2 className="text-sm font-mono font-bold text-slate-100">{isEdit ? 'Mitarbeiter bearbeiten' : 'Mitarbeiter hinzufügen'}</h2>
          <button onClick={onClose} className="p-1.5 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all"><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          <div>
            <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider block mb-1">Vollständiger Name *</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Max Mustermann" className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider block mb-1">E-Mail *</label>
            <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="user@holysec.de" className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider block mb-1">
              Passwort {isEdit ? <span className="text-slate-700 normal-case">(leer = unverändert)</span> : <span className="text-red-400">*</span>}
            </label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder={isEdit ? '••••••••' : 'Initiales Passwort setzen'} required={!isEdit} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider block mb-1">Rolle</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={inputCls}>
                <option>Junior Pentester</option>
                <option>Pentester</option>
                <option>Senior Pentester</option>
                <option>Admin</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider block mb-1">Jobtitel</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Web Analyst" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider block mb-1">Skills (kommagetrennt)</label>
            <input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
              placeholder="Web, Network, Cloud" className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider block mb-1.5">Farbe</label>
            <div className="flex gap-2">
              {MEMBER_COLORS_LIST.map(c => {
                const cfg = MEMBER_COLOR_MAP[c]
                return (
                  <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={`w-6 h-6 rounded-full ${cfg.bg} transition-all ${form.color === c ? 'ring-2 ring-offset-1 ring-offset-[#0f172a] ring-white' : 'opacity-50 hover:opacity-80'}`} />
                )
              })}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit"
              className="flex-1 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs tracking-wider transition-all">
              {isEdit ? 'Speichern' : 'Hinzufügen'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded border border-[#1e293b] text-slate-500 font-mono text-xs hover:text-slate-300 transition-all">
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AssignTeamModal({ engagement, teamMembers, assigned, onSave, onClose, groups = [], clients = [] }) {
  const [selected, setSelected] = useState(new Set(assigned))
  const client = clients.find(c => c.id === engagement.clientId)

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const applyGroup = (group) => setSelected(prev => {
    const allIn = group.memberIds.every(id => prev.has(id))
    if (allIn) {
      const next = new Set(prev)
      group.memberIds.forEach(id => next.delete(id))
      return next
    }
    return new Set(group.memberIds)
  })

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b]">
          <div>
            <h2 className="text-sm font-mono font-bold text-slate-100">Team zuweisen</h2>
            <p className="text-[10px] font-mono text-slate-600 mt-0.5 max-w-[240px] truncate">{engagement.title} — {client?.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all"><X size={14} /></button>
        </div>

        {groups.length > 0 && (
          <div className="px-4 pt-3 pb-2 border-b border-[#1e293b]">
            <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Layers size={9} /> Aus Gruppe wählen
            </div>
            <div className="flex flex-wrap gap-1.5">
              {groups.map(group => {
                const gc = GROUP_COLORS[group.color] || GROUP_COLORS.cyan
                const allIn = group.memberIds.every(id => selected.has(id))
                return (
                  <button key={group.id} onClick={() => applyGroup(group)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-mono transition-all ${allIn ? `${gc.text} border-current/40 bg-current/10` : 'border-[#1e293b] text-slate-500 hover:text-slate-300 hover:border-slate-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${gc.dot}`} />
                    {group.name}
                    <span className="opacity-50">({group.memberIds.length})</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
          {teamMembers.filter(m => m.status === 'Active').map(member => {
            const isSel = selected.has(member.id)
            return (
              <button key={member.id} onClick={() => toggle(member.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${isSel ? 'border-cyan-500/40 bg-cyan-500/8' : 'border-[#1e293b] hover:border-slate-600'}`}>
                <MemberAvatar member={member} />
                <div className="flex-1 text-left">
                  <div className="text-xs font-mono text-slate-200">{member.name}</div>
                  <div className="text-[10px] font-mono text-slate-600">{member.role}</div>
                </div>
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${isSel ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'}`}>
                  {isSel && <CheckCircle2 size={10} className="text-black" />}
                </div>
              </button>
            )
          })}
        </div>
        <div className="px-4 pb-4 flex gap-2">
          <button onClick={() => { onSave(engagement.id, [...selected]); onClose() }}
            className="flex-1 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs tracking-wider transition-all">
            Speichern ({selected.size})
          </button>
          <button onClick={onClose}
            className="flex-1 py-2 rounded border border-[#1e293b] text-slate-500 font-mono text-xs hover:text-slate-300 transition-all">
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  )
}

function downloadReportTemplate(engagement, client) {
  const doc = new jsPDF()
  const now = new Date().toLocaleDateString('de-DE')

  doc.setFont('helvetica', 'bold'); doc.setFontSize(18)
  doc.text('HolySec — Report Template', 14, 20)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text(`Engagement: ${engagement?.title || '—'}`, 14, 30)
  doc.text(`Client: ${client?.name || '—'}  |  Typ: ${engagement?.type || '—'}  |  Erstellt: ${now}`, 14, 37)
  doc.setTextColor(0, 0, 0)
  doc.setDrawColor(30, 41, 59); doc.line(14, 42, 196, 42)

  const section = (title, y) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
    doc.setFillColor(15, 23, 42); doc.rect(14, y, 182, 7, 'F')
    doc.setTextColor(6, 182, 212); doc.text(title, 17, y + 5.2)
    doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
    return y + 12
  }
  const placeholder = (label, y, lines = 1) => {
    doc.setTextColor(100, 116, 139); doc.text(label, 17, y)
    doc.setTextColor(0, 0, 0)
    for (let i = 0; i < lines; i++) {
      doc.setDrawColor(200, 200, 200); doc.line(17, y + 4 + i * 7, 193, y + 4 + i * 7)
    }
    return y + 6 + lines * 7
  }

  let y = section('1. Executive Summary', 48)
  y = placeholder('Kurzbeschreibung der Ergebnisse und Risikoeinschätzung', y, 4)

  y = section('2. Scope & Methodik', y + 4)
  doc.setFontSize(9); doc.setTextColor(60, 60, 60)
  if (client?.scope?.ipRanges?.length) doc.text(`IP-Ranges: ${client.scope.ipRanges.join(', ')}`, 17, y); y += 6
  if (client?.scope?.domains?.length)  doc.text(`Domains:   ${client.scope.domains.join(', ')}`,  17, y); y += 6
  doc.setTextColor(0, 0, 0)
  y = placeholder('Vorgehensweise / Angriffsphasen', y + 2, 2)

  y = section('3. Findings', y + 4)
  const fHeaders = ['#', 'Titel', 'Schwere', 'CVSS', 'Status']
  const fColX    = [17, 28, 120, 150, 170]
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  fHeaders.forEach((h, i) => doc.text(h, fColX[i], y)); y += 3
  doc.line(17, y, 193, y); y += 4
  doc.setFont('helvetica', 'normal')
  for (let i = 1; i <= 8; i++) {
    doc.setTextColor(160, 160, 160)
    doc.text(`${i}`, fColX[0], y)
    doc.text('______________________________', fColX[1], y)
    doc.text('_______', fColX[2], y)
    doc.text('___', fColX[3], y)
    doc.text('______', fColX[4], y)
    doc.setTextColor(0, 0, 0); y += 7
    if (y > 265) { doc.addPage(); y = 20 }
  }

  y += 2; y = section('4. Empfehlungen', y)
  y = placeholder('Priorisierte Maßnahmen und Handlungsempfehlungen', y, 5)

  y += 4; y = section('5. Unterschriften & Freigabe', y)
  doc.setFontSize(9)
  doc.text('Erstellt von (Pentester):', 17, y);          doc.line(65, y, 120, y);  y += 10
  doc.text('Geprüft von (Senior / Admin):', 17, y);     doc.line(75, y, 130, y);  y += 10
  doc.text('Datum der Freigabe:', 17, y);                doc.line(58, y, 100, y)

  doc.save(`holysec_template_${(engagement?.title || 'report').replace(/\s+/g, '_')}.pdf`)
}

function EngagementDetail({ engagementId, onBack, clients: allClients = [], teamMembers = [], assignments = {}, engagements: allEngagements = [], pendingReports = {}, onSetPendingReport, currentUser, onEdit, onDelete, uiLang = 'en' }) {
  const engagement = allEngagements.find(e => e.id === engagementId)
  const client = allClients.find(c => c.id === engagement?.clientId)
  const assignedMembers = (assignments[engagementId] || []).map(uid => teamMembers.find(t => t.id === uid)).filter(Boolean)
  const pendingReport = pendingReports[engagementId] || null

  const [reportForm, setReportForm] = useState({ title: pendingReport?.title || '', type: pendingReport?.type || 'Technical Report' })
  const [uploadedFile, setUploadedFile] = useState(pendingReport?.fileName ? { name: pendingReport.fileName } : null)
  const [dragOver, setDragOver] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef(null)
  const isAdmin = currentUser?.role === 'Admin'
  const [showEditModal, setShowEditModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleFile = (file) => {
    if (!file || file.type !== 'application/pdf') return
    setUploadedFile({ name: file.name, size: file.size })
    if (!reportForm.title) setReportForm(f => ({ ...f, title: file.name.replace(/\.pdf$/i, '') }))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleSave = () => {
    if (!reportForm.title.trim()) return
    onSetPendingReport?.(engagementId, { ...reportForm, fileName: uploadedFile?.name || null })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDiscard = () => {
    onSetPendingReport?.(engagementId, null)
    setReportForm({ title: '', type: 'Technical Report' })
    setUploadedFile(null)
  }

  if (!engagement) return null

  const hoursUsed = client?.contract?.used || 0
  const hoursTotal = client?.contract?.hours || 1
  const hoursPercent = hoursUsed / hoursTotal

  return (
    <div className="p-3 lg:p-6 space-y-6">
      {showEditModal && (
        <NewEngagementModal clients={allClients} currentUser={currentUser} existing={engagement}
          onSave={eng => { onEdit?.(eng); setShowEditModal(false) }}
          onClose={() => setShowEditModal(false)} />
      )}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-red-500/30 rounded-xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-sm font-mono font-bold text-red-400">Engagement löschen?</h3>
            <p className="text-xs font-mono text-slate-400">„{engagement.title}" wird unwiderruflich entfernt.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 rounded border border-[#1e293b] text-xs font-mono text-slate-400 hover:text-slate-200 transition-all">Abbrechen</button>
              <button onClick={() => { onDelete?.(engagementId); onBack?.() }}
                className="px-4 py-2 rounded bg-red-500/20 border border-red-500/40 text-xs font-mono text-red-400 hover:bg-red-500/30 transition-all">Löschen</button>
            </div>
          </div>
        </div>
      )}
      {/* Back + Admin Actions */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors">
          <ChevronLeft size={14} /> Zurück zu Engagements
        </button>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1e293b] rounded text-xs font-mono text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all">
              <Edit3 size={12} /> Bearbeiten
            </button>
            <button onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/20 rounded text-xs font-mono text-red-500/70 hover:text-red-400 hover:border-red-500/40 transition-all">
              <Trash2 size={12} /> Löschen
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Calendar size={18} className="text-cyan-400" />
            <h1 className="text-xl font-mono font-bold text-slate-100">{engagement.title}</h1>
            <StatusBadge status={engagement.status} size="md" />
          </div>
          <p className="text-sm font-mono text-slate-500">{client?.name || '—'} · {engagement.type} · {engagement.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Engagement + Team */}
        <div className="col-span-1 lg:col-span-2 space-y-5">

          {/* Engagement Details */}
          <Panel>
            <PanelHeader title="Engagement Details" subtitle={`${fmtDate(engagement.start, uiLang)} → ${fmtDate(engagement.end, uiLang)}`} />
            <div className="p-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[9px] font-mono text-slate-600 uppercase mb-1">Zeitraum</div>
                <div className="text-sm font-mono text-slate-200">{fmtDate(engagement.start, uiLang)} → {fmtDate(engagement.end, uiLang)}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-slate-600 uppercase mb-1">Lead</div>
                <div className="text-sm font-mono text-slate-200">{engagement.lead || '—'}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-slate-600 uppercase mb-1">Typ</div>
                <div className="text-sm font-mono text-slate-200">{engagement.type}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-slate-600 uppercase mb-1">Status</div>
                <StatusBadge status={engagement.status} />
              </div>
              <div className="col-span-2">
                <div className="text-[9px] font-mono text-slate-600 uppercase mb-2">Phasen</div>
                <div className="flex gap-2">
                  {['Recon', 'Scanning', 'Exploitation', 'Reporting'].map(phase => {
                    const active = engagement.phases?.includes(phase)
                    const cfg = PHASE_COLORS[phase]
                    return (
                      <div key={phase} className={`flex-1 rounded-lg p-3 border text-center ${active ? `${cfg.border} bg-current/5` : 'border-[#1e293b] opacity-30'}`}>
                        <div className={`h-1.5 rounded-full mb-2 ${active ? cfg.bg : 'bg-slate-800'}`} />
                        <span className={`text-[10px] font-mono font-medium ${active ? cfg.text : 'text-slate-600'}`}>{phase}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </Panel>

          {/* Team */}
          <Panel>
            <PanelHeader title="Zugewiesenes Team" subtitle={`${assignedMembers.length} Mitglieder`} />
            <div className="p-4">
              {assignedMembers.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {assignedMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-3 bg-[#0a0a0a] border border-[#1e293b] rounded-lg px-3 py-2.5">
                      <MemberAvatar member={m} />
                      <div>
                        <div className="text-xs font-mono font-medium text-slate-200">{m.name}</div>
                        <div className="text-[10px] font-mono text-slate-500">{m.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-slate-600 py-2">Noch kein Team zugewiesen.</p>
              )}
            </div>
          </Panel>

          {/* Report Upload */}
          {(() => {
            const canApprove = ['Admin', 'Senior Pentester'].includes(currentUser?.role)
            const approvalStatus = pendingReport?.approvalStatus || null
            const isApproved  = approvalStatus === 'approved'
            const isSubmitted = approvalStatus === 'submitted'

            const handleSubmit = () => {
              if (!reportForm.title.trim()) return
              onSetPendingReport?.(engagementId, { ...reportForm, fileName: uploadedFile?.name || null, approvalStatus: 'submitted' })
              setSaved(true); setTimeout(() => setSaved(false), 2000)
            }
            const handleApprove = () => {
              onSetPendingReport?.(engagementId, { ...pendingReport, approvalStatus: 'approved' })
            }

            return (
              <Panel>
                <PanelHeader title="Report" subtitle="Ausgefüllte Vorlage einreichen zur Freigabe">
                  <button onClick={() => downloadReportTemplate(engagement, client)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1e293b] rounded text-[10px] font-mono text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all">
                    <Download size={11} /> Vorlage herunterladen
                  </button>
                </PanelHeader>
                <div className="p-4 space-y-4">
                  {/* Freigabe-Status */}
                  {isApproved && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                      <CheckCircle2 size={14} className="text-green-400" />
                      <span className="text-xs font-mono text-green-400 font-bold">Freigegeben</span>
                      <span className="text-[10px] font-mono text-slate-500 ml-1">— {pendingReport.title}</span>
                    </div>
                  )}
                  {isSubmitted && canApprove && (
                    <div className="flex items-center justify-between px-4 py-3 bg-yellow-400/5 border border-yellow-400/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-yellow-400" />
                        <span className="text-xs font-mono text-yellow-400">Warte auf Freigabe — {pendingReport.title}</span>
                      </div>
                      <button onClick={handleApprove}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded text-[10px] font-mono text-green-400 hover:bg-green-500/20 transition-all">
                        <CheckCircle2 size={11} /> Freigeben
                      </button>
                    </div>
                  )}
                  {isSubmitted && !canApprove && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-yellow-400/5 border border-yellow-400/20 rounded-lg">
                      <Clock size={13} className="text-yellow-400" />
                      <span className="text-xs font-mono text-yellow-400">Eingereicht — warte auf Freigabe durch Senior / Admin</span>
                    </div>
                  )}

                  {/* Drag & Drop Zone */}
                  {!isApproved && (
                    <>
                      <div
                        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-cyan-400/60 bg-cyan-400/5' : uploadedFile ? 'border-green-500/40 bg-green-500/5' : 'border-[#1e293b] hover:border-slate-600 hover:bg-slate-800/20'}`}>
                        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
                        {uploadedFile ? (
                          <div className="space-y-1">
                            <FileText size={28} className="text-green-400 mx-auto mb-2" />
                            <div className="text-sm font-mono font-medium text-green-400">{uploadedFile.name}</div>
                            {uploadedFile.size && <div className="text-[10px] font-mono text-slate-500">{(uploadedFile.size / 1024).toFixed(1)} KB</div>}
                            <div className="text-[10px] font-mono text-slate-600 mt-1">Klicken oder neues PDF hierher ziehen zum Ersetzen</div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Download size={28} className="text-slate-600 mx-auto mb-2" />
                            <div className="text-sm font-mono text-slate-400">Ausgefüllte Vorlage hier ablegen</div>
                            <div className="text-[10px] font-mono text-slate-600">oder klicken zum Auswählen · nur PDF</div>
                          </div>
                        )}
                      </div>

                      {/* Form */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-mono text-slate-600 uppercase mb-1.5 block">Titel *</label>
                          <input value={reportForm.title} onChange={e => setReportForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="z.B. Technical Report Q2 2026"
                            className="w-full bg-[#0a0a0a] border border-[#1e293b] rounded-lg px-3 py-2.5 text-xs font-mono text-slate-200 placeholder-slate-700 focus:outline-none focus:border-cyan-500/50 transition-colors" />
                        </div>
                        <div>
                          <label className="text-[9px] font-mono text-slate-600 uppercase mb-1.5 block">Typ</label>
                          <select value={reportForm.type} onChange={e => setReportForm(f => ({ ...f, type: e.target.value }))}
                            className="w-full bg-[#0a0a0a] border border-[#1e293b] rounded-lg px-3 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors">
                            <option>Technical Report</option>
                            <option>Executive Summary</option>
                            <option>Remediation Plan</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button onClick={handleSubmit} disabled={!reportForm.title.trim()}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-xs font-mono text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                          {saved ? <CheckCircle2 size={12} /> : <FileText size={12} />}
                          {saved ? 'Eingereicht!' : isSubmitted ? 'Erneut einreichen' : 'Zur Freigabe einreichen'}
                        </button>
                        {pendingReport?.title && (
                          <button onClick={handleDiscard}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/5 text-xs font-mono text-red-400 hover:bg-red-500/10 transition-all">
                            <X size={12} /> Verwerfen
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </Panel>
            )
          })()}
        </div>

        {/* Right column: Client Info */}
        <div className="space-y-5">
          {client ? (
            <>
              <Panel>
                <PanelHeader title="Client" subtitle={client.name} />
                <div className="p-4 space-y-4">
                  <div>
                    <div className="text-[9px] font-mono text-slate-600 uppercase mb-2">Status & Kritikalität</div>
                    <div className="flex gap-2 flex-wrap">
                      <StatusBadge status={client.status} />
                      <SeverityBadge severity={client.criticality} />
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-slate-600 uppercase mb-2">Kontakt</div>
                    <div className="text-xs font-mono text-slate-200 mb-0.5">{client.contact?.name}</div>
                    <div className="text-[10px] font-mono text-slate-500 break-all">{client.contact?.email}</div>
                    <div className="text-[10px] font-mono text-slate-500">{client.contact?.phone}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-slate-600 uppercase mb-2">Vertrag</div>
                    <div className="text-[10px] font-mono text-slate-400 mb-2">{fmtDate(client.contract?.start, uiLang)} → {fmtDate(client.contract?.end, uiLang)}</div>
                    <div className="flex justify-between text-[9px] font-mono text-slate-600 mb-1.5">
                      <span>Stunden</span>
                      <span className={hoursPercent > 0.85 ? 'text-red-400' : 'text-slate-400'}>{hoursUsed} / {hoursTotal}h</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800">
                      <div className={`h-1.5 rounded-full transition-all ${hoursPercent > 0.85 ? 'bg-red-500' : 'bg-cyan-500'}`}
                        style={{ width: `${Math.min(100, hoursPercent * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </Panel>

              {client.scope && (
                <Panel>
                  <PanelHeader title="Scope" subtitle={client.scopeType} />
                  <div className="p-4 space-y-3">
                    {client.scope.ipRanges?.length > 0 && (
                      <div>
                        <div className="text-[9px] font-mono text-slate-600 uppercase mb-1.5">IP-Ranges</div>
                        <div className="flex flex-wrap gap-1">
                          {client.scope.ipRanges.map((r, i) => <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-mono text-cyan-400">{r}</span>)}
                        </div>
                      </div>
                    )}
                    {client.scope.domains?.length > 0 && (
                      <div>
                        <div className="text-[9px] font-mono text-slate-600 uppercase mb-1.5">Domains</div>
                        <div className="flex flex-wrap gap-1">
                          {client.scope.domains.map((d, i) => <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-mono text-slate-300">{d}</span>)}
                        </div>
                      </div>
                    )}
                    {client.scope.exclusions?.length > 0 && (
                      <div>
                        <div className="text-[9px] font-mono text-slate-600 uppercase mb-1.5 flex items-center gap-1"><AlertTriangle size={8} className="text-red-400" /> Ausschlüsse</div>
                        <div className="flex flex-wrap gap-1">
                          {client.scope.exclusions.map((ex, i) => <span key={i} className="px-1.5 py-0.5 rounded bg-red-900/20 border border-red-900/30 text-[9px] font-mono text-red-400">{ex}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                </Panel>
              )}
            </>
          ) : (
            <Panel>
              <div className="p-4 text-xs font-mono text-slate-600">Kein Client verknüpft.</div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}

const ROLE_BADGE = {
  'Admin':            'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  'Senior Pentester': 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  'Pentester':        'text-purple-400 bg-purple-400/10 border-purple-400/20',
  'Junior Pentester': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
}

function TeamPage({ members, currentUser, onAdd, onRemove, assignments, engagements, userPresence = 'online', timeEntries = [], onAuditLog, uiLang = 'en' }) {
  const [showAdd, setShowAdd] = useState(false)
  const [roleFilter, setRoleFilter] = useState('All')
  const [timeDetailMember, setTimeDetailMember] = useState(null)
  const isAdmin = currentUser?.role === 'Admin'

  const memberEngCount = (id) => engagements.filter(e => (assignments[e.id] || []).includes(id) && e.status !== 'Completed').length

  const displayedMembers = roleFilter === 'All' ? members : members.filter(m => m.role === roleFilter)

  return (
    <div className="p-3 lg:p-6 space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Team Size" value={members.length} sub={`${members.filter(m => m.status === 'Active').length} aktiv`}
          icon={Users2} accent={roleFilter === 'All'} active={false}
          onClick={() => setRoleFilter('All')} />
        {['Admin', 'Senior Pentester', 'Pentester', 'Junior Pentester'].map(role => (
          <KpiCard key={role} label={role} value={members.filter(m => m.role === role).length} sub="Mitarbeiter"
            icon={Shield} active={roleFilter === role}
            onClick={() => setRoleFilter(roleFilter === role ? 'All' : role)} />
        ))}
      </div>

      <Panel>
        <PanelHeader title="Operator Directory" subtitle={`${displayedMembers.length} von ${members.length} Mitarbeitern`}>
          <div className="flex items-center gap-1 flex-wrap mr-1">
            {['All', 'Admin', 'Senior Pentester', 'Pentester', 'Junior Pentester'].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono border transition-all ${roleFilter === r ? 'border-slate-500/50 bg-slate-700/40 text-slate-300' : 'border-[#1e293b] text-slate-500 hover:text-slate-300'}`}>
                {r}
              </button>
            ))}
          </div>
          {isAdmin && (
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs font-mono text-cyan-400 hover:bg-cyan-500/20 transition-all">
              <UserPlus size={12} /> Hinzufügen
            </button>
          )}
        </PanelHeader>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedMembers.map(member => {
            const isSelf = member.id === currentUser?.id
            const activeEngs = memberEngCount(member.id)
            const roleCls = ROLE_BADGE[member.role] || ROLE_BADGE['Pentester']
            return (
              <div key={member.id} className={`bg-[#0a0a0a] rounded-lg p-4 border transition-all ${isSelf ? 'border-cyan-500/30 bg-cyan-500/3' : 'border-[#1e293b]'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <MemberAvatar member={member} size="lg" />
                      {(() => {
                        const dotColor = isSelf ? (userPresence === 'away' ? 'bg-yellow-400' : 'bg-green-400') : 'bg-slate-600'
                        return (
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0a0a] ${dotColor}`}>
                            {isSelf && userPresence !== 'away' && <div className={`absolute inset-0 rounded-full ${dotColor} animate-ping opacity-60`} />}
                          </div>
                        )
                      })()}
                    </div>
                    <div>
                      <div className="text-sm font-mono font-semibold text-slate-100 flex items-center gap-1.5">
                        {member.nickname ? member.nickname : member.name}
                        {member.nickname && <span className="text-[9px] font-mono text-slate-600">({member.name})</span>}
                        {isSelf && <span className="text-[9px] font-mono text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded px-1 py-0.5">YOU</span>}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isSelf ? (userPresence === 'away' ? 'bg-yellow-400' : 'bg-green-400') : 'bg-slate-600'}`} />
                        <span className={`text-[9px] font-mono ${isSelf ? (userPresence === 'away' ? 'text-yellow-400' : 'text-green-400') : 'text-slate-600'}`}>{isSelf ? (userPresence === 'away' ? 'ABWESEND' : 'ONLINE') : 'OFFLINE'}</span>
                        <span className="text-[9px] font-mono text-slate-700">·</span>
                        <span className="text-[9px] font-mono text-slate-600">{member.title}</span>
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => setTimeDetailMember(member)}
                        className="p-1 rounded text-slate-700 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all" title="Zeiterfassung anzeigen">
                        <Timer size={12} />
                      </button>
                      {!isSelf && (
                        <button onClick={() => onRemove(member.id)}
                          className="p-1 rounded text-slate-700 hover:text-red-400 hover:bg-red-400/10 transition-all" title="Entfernen">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-mono font-medium mb-3 mt-1 ${roleCls}`}>
                  {member.role}
                </span>

                <div className="flex flex-wrap gap-1 mb-3">
                  {member.skills.map(skill => (
                    <span key={skill} className="text-[9px] font-mono text-slate-600 bg-slate-800/80 border border-[#1e293b] rounded px-1.5 py-0.5">{skill}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#1e293b]">
                  <div className="text-[10px] font-mono text-slate-600">
                    <span className="text-slate-300 font-semibold">{activeEngs}</span> aktive Einsätze
                  </div>
                  <a href={`mailto:${member.email}`} onClick={e => e.stopPropagation()}
                    className="text-[10px] font-mono text-slate-700 hover:text-cyan-400 truncate max-w-[120px] transition-colors" title={member.email}>
                    {member.email}
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </Panel>

      {showAdd && <AddEditMemberModal onAdd={onAdd} onClose={() => setShowAdd(false)} />}
      {timeDetailMember && (
        <MemberTimeDetailModal member={timeDetailMember} timeEntries={timeEntries} onClose={() => setTimeDetailMember(null)} onExport={onAuditLog} uiLang={uiLang} />
      )}
    </div>
  )
}

// ─── MEMBER TIME DETAIL MODAL ────────────────────────────────────────────────

function exportTimePDF(member, allEntries, range) {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1))
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const memberEntries = allEntries.filter(e => e.userId === member.id)
  const filtered = memberEntries.filter(e => {
    if (range === 'week')  return new Date(e.date) >= startOfWeek
    if (range === 'month') return new Date(e.date) >= startOfMonth
    return true
  })

  const totalSecs = memberEntries.reduce((s, e) => s + e.duration, 0)
  const weekSecs  = memberEntries.filter(e => new Date(e.date) >= startOfWeek).reduce((s, e) => s + e.duration, 0)
  const monthSecs = memberEntries.filter(e => new Date(e.date) >= startOfMonth).reduce((s, e) => s + e.duration, 0)
  const rangeLabel = range === 'week' ? 'Diese Woche' : range === 'month' ? 'Dieser Monat' : 'Gesamt'

  const doc = new jsPDF()
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16)
  doc.text('HolySec — Zeiterfassung', 14, 18)
  doc.setFontSize(11); doc.setFont('helvetica', 'normal')
  doc.text(`Mitarbeiter: ${member.name}${member.nickname ? ' (' + member.nickname + ')' : ''}`, 14, 28)
  doc.text(`Rolle: ${member.role}`, 14, 35)
  doc.text(`Zeitraum: ${rangeLabel}`, 14, 42)
  doc.text(`Export: ${now.toLocaleDateString('de-DE')}`, 14, 49)
  doc.setDrawColor(30, 41, 59); doc.line(14, 54, 196, 54)

  doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.text('Zusammenfassung', 14, 62)
  doc.setFont('helvetica', 'normal')
  doc.text(`Gesamt:           ${formatDuration(totalSecs)}`, 14, 69)
  doc.text(`Diese Woche:      ${formatDuration(weekSecs)}`, 14, 76)
  doc.text(`Dieser Monat:     ${formatDuration(monthSecs)}`, 14, 83)
  doc.text(`Exportierter Zeitraum: ${formatDuration(filtered.reduce((s, e) => s + e.duration, 0))}`, 14, 90)
  doc.line(14, 95, 196, 95)

  doc.setFont('helvetica', 'bold')
  doc.text(`Einträge (${rangeLabel})`, 14, 103)
  const headers = ['Datum', 'Beginn', 'Ende', 'Dauer (hh:mm:ss)']
  const colX = [14, 55, 85, 120]
  headers.forEach((h, i) => doc.text(h, colX[i], 111))
  doc.line(14, 114, 196, 114)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  let y = 121
  ;[...filtered].reverse().forEach(e => {
    if (y > 270) { doc.addPage(); y = 20 }
    doc.text(e.date, colX[0], y)
    doc.text(e.start, colX[1], y)
    doc.text(e.end || '—', colX[2], y)
    doc.text(formatDuration(e.duration), colX[3], y)
    y += 7
  })

  const rangeStr = range === 'week' ? 'woche' : 'monat'
  doc.save(`holysec_zeit_${member.name.replace(/\s+/g, '_')}_${rangeStr}_${now.toISOString().split('T')[0]}.pdf`)
}

function MemberTimeDetailModal({ member, timeEntries, onClose, onExport, uiLang = 'en' }) {
  const entries = timeEntries.filter(e => e.userId === member.id)
  const totalSecs = entries.reduce((s, e) => s + e.duration, 0)

  const now = new Date()
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1)); startOfWeek.setHours(0,0,0,0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const weekSecs  = entries.filter(e => new Date(e.date) >= startOfWeek).reduce((s, e) => s + e.duration, 0)
  const monthSecs = entries.filter(e => new Date(e.date) >= startOfMonth).reduce((s, e) => s + e.duration, 0)

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('HolySec — Zeiterfassung', 14, 18)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Mitarbeiter: ${member.name}${member.nickname ? ' (' + member.nickname + ')' : ''}`, 14, 28)
    doc.text(`Rolle: ${member.role}`, 14, 35)
    doc.text(`Export: ${new Date().toLocaleDateString('de-DE')}`, 14, 42)
    doc.setDrawColor(30, 41, 59)
    doc.line(14, 47, 196, 47)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Zusammenfassung', 14, 55)
    doc.setFont('helvetica', 'normal')
    doc.text(`Gesamt:        ${formatDuration(totalSecs)}`, 14, 62)
    doc.text(`Diese Woche:   ${formatDuration(weekSecs)}`, 14, 69)
    doc.text(`Dieser Monat:  ${formatDuration(monthSecs)}`, 14, 76)

    doc.line(14, 81, 196, 81)
    doc.setFont('helvetica', 'bold')
    doc.text('Einträge', 14, 89)
    const headers = ['Datum', 'Beginn', 'Ende', 'Dauer (hh:mm:ss)']
    const colX = [14, 55, 85, 120]
    headers.forEach((h, i) => doc.text(h, colX[i], 97))
    doc.line(14, 100, 196, 100)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    let y = 107
    ;[...entries].reverse().forEach(e => {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.text(e.date, colX[0], y)
      doc.text(e.start, colX[1], y)
      doc.text(e.end || '—', colX[2], y)
      doc.text(formatDuration(e.duration), colX[3], y)
      y += 7
    })
    onExport?.(`Zeiterfassung: ${member.name}`)
    doc.save(`holysec_zeit_${member.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b]">
          <div className="flex items-center gap-3">
            <MemberAvatar member={member} size="lg" />
            <div>
              <div className="text-sm font-mono font-bold text-slate-100">{member.nickname || member.name}</div>
              <div className="text-[10px] font-mono text-slate-600">{member.role} · {member.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs font-mono text-cyan-400 hover:bg-cyan-500/20 transition-all">
              <Download size={12} /> PDF exportieren
            </button>
            <button onClick={onClose} className="p-1.5 rounded text-slate-500 hover:text-slate-200"><X size={14} /></button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 p-5 border-b border-[#1e293b]">
          {[
            { label: 'Gesamt', value: formatDuration(totalSecs), sub: `${entries.length} Einträge` },
            { label: 'Diese Woche', value: formatDuration(weekSecs), sub: 'Mo–So' },
            { label: 'Dieser Monat', value: formatDuration(monthSecs), sub: new Date().toLocaleString('de-DE', { month: 'long' }) },
          ].map(k => (
            <div key={k.label} className="text-center p-3 bg-[#0a0a0a] border border-[#1e293b] rounded-lg">
              <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">{k.label}</div>
              <div className="text-lg font-mono font-bold text-cyan-400 tabular-nums">{k.value}</div>
              <div className="text-[10px] font-mono text-slate-600 mt-0.5">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Entries */}
        <div className="max-h-80 overflow-y-auto">
          {entries.length === 0 ? (
            <div className="py-10 text-center text-xs font-mono text-slate-600">Keine Zeiteinträge vorhanden.</div>
          ) : (
            <table className="w-full text-xs font-mono">
              <thead className="sticky top-0 bg-[#0f172a]">
                <tr className="border-b border-[#1e293b]">
                  {['Datum', 'Beginn', 'Ende', 'Dauer'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] text-slate-600 uppercase tracking-wider font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {[...entries].reverse().map(e => (
                  <tr key={e.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-3 text-slate-400">{fmtDate(e.date, uiLang)}</td>
                    <td className="px-5 py-3 text-slate-300 tabular-nums">{e.start}</td>
                    <td className="px-5 py-3 text-slate-300 tabular-nums">{e.end || '—'}</td>
                    <td className="px-5 py-3 text-cyan-400 font-semibold tabular-nums">{formatDuration(e.duration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ENGAGEMENT GROUPS ───────────────────────────────────────────────────────

function GroupModal({ group, teamMembers, engagements = [], onSave, onClose }) {
  const [name, setName]               = useState(group?.name || '')
  const [description, setDescription] = useState(group?.description || '')
  const [memberIds, setMemberIds]     = useState(group?.memberIds || [])
  const [engagementId, setEngId]      = useState(group?.engagementId || '')
  const [color, setColor]             = useState(group?.color || 'cyan')

  const toggle = (id) => setMemberIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono font-bold text-slate-100">{group ? 'Gruppe bearbeiten' : 'Neue Gruppe'}</h3>
          <button onClick={onClose} className="p-1 rounded text-slate-500 hover:text-slate-200"><X size={14} /></button>
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider block mb-1.5">Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Red Team Alpha"
            className="w-full bg-[#0a0a0a] border border-[#1e293b] rounded px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-700 focus:outline-none focus:border-cyan-500/50" />
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider block mb-1.5">Beschreibung</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional..."
            className="w-full bg-[#0a0a0a] border border-[#1e293b] rounded px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-700 focus:outline-none focus:border-cyan-500/50" />
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider block mb-2">Farbe</label>
          <div className="flex gap-2">
            {Object.entries(GROUP_COLORS).map(([c, cfg]) => (
              <button key={c} onClick={() => setColor(c)}
                style={{ backgroundColor: cfg.hex }}
                className={`w-6 h-6 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-offset-[#0f172a] ring-white/60 scale-110' : 'opacity-50 hover:opacity-80'}`} />
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider block mb-2">Mitglieder</label>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {teamMembers.map(m => (
              <label key={m.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-slate-800/40 cursor-pointer">
                <input type="checkbox" checked={memberIds.includes(m.id)} onChange={() => toggle(m.id)} className="accent-cyan-500" />
                <MemberAvatar member={m} size="sm" />
                <span className="text-xs font-mono text-slate-300">{m.nickname || m.name}</span>
                <span className="text-[10px] font-mono text-slate-600 ml-auto">{m.role}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-600 uppercase tracking-wider block mb-1.5">Engagement verknüpfen (optional)</label>
          <select value={engagementId} onChange={e => setEngId(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#1e293b] rounded px-3 py-2 text-xs font-mono text-slate-400 focus:outline-none focus:border-cyan-500/50">
            <option value="">— Kein Engagement —</option>
            {engagements.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2 border border-[#1e293b] rounded text-xs font-mono text-slate-400 hover:text-slate-200 transition-all">Abbrechen</button>
          <button onClick={() => { if (!name.trim()) return; onSave({ id: group?.id || `grp_${Date.now()}`, name: name.trim(), description: description.trim(), memberIds, engagementId: engagementId || null, color }) }}
            disabled={!name.trim()}
            className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 rounded text-xs font-mono font-bold text-black transition-all">
            {group ? 'Speichern' : 'Erstellen'}
          </button>
        </div>
      </div>
    </div>
  )
}

const CRITICALITY_COLOR = {
  CRITICAL: { fill: '#ef4444', stroke: '#991b1b' },
  HIGH:     { fill: '#f97316', stroke: '#9a3412' },
  MEDIUM:   { fill: '#eab308', stroke: '#854d0e' },
  LOW:      { fill: '#22c55e', stroke: '#14532d' },
}

const MAP_TILE_STYLES = {
  dark: [
    { id: 'dark_matter',  label: 'Dark Matter',  url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',       subdomains: 'abcd', attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap' },
    { id: 'esri_imagery', label: 'Satellite',     url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',              subdomains: '', attribution: '&copy; Esri, Maxar, Earthstar Geographics' },
  ],
  light: [
    { id: 'carto',        label: 'Carto Light',  url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',      subdomains: 'abcd', attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap' },
    { id: 'esri_imagery', label: 'Satellite',      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',              subdomains: '', attribution: '&copy; Esri, Maxar, Earthstar Geographics' },
  ],
}

const MAP_STYLE_LS_KEY = 'holysec_map_style'

function ClientMapPage({ clients = [], darkMode = true, onClientClick }) {
  const mapDivRef       = useRef(null)
  const mapRef          = useRef(null)
  const savedViewRef    = useRef(null)
  const flybackTimerRef = useRef(null)
  const spiderRef       = useRef(null)
  const [filterStatus,      setFilterStatus]      = useState('All')
  const [filterCriticality, setFilterCriticality] = useState('All')
  const [mapStyle, setMapStyle] = useState(() => {
    try {
      const saved = localStorage.getItem(MAP_STYLE_LS_KEY)
      const mode  = darkMode ? 'dark' : 'light'
      if (saved && MAP_TILE_STYLES[mode].find(s => s.id === saved)) return saved
    } catch {}
    return darkMode ? 'toner' : 'carto'
  })

  // Stil bei Änderung in localStorage speichern
  useEffect(() => {
    try { localStorage.setItem(MAP_STYLE_LS_KEY, mapStyle) } catch {}
  }, [mapStyle])

  // Wenn darkMode wechselt: gespeicherten Stil für neuen Modus laden oder Fallback
  useEffect(() => {
    const mode = darkMode ? 'dark' : 'light'
    const available = MAP_TILE_STYLES[mode]
    try {
      const saved = localStorage.getItem(MAP_STYLE_LS_KEY)
      if (saved && available.find(s => s.id === saved)) { setMapStyle(saved); return }
    } catch {}
    if (!available.find(s => s.id === mapStyle)) setMapStyle(available[0].id)
  }, [darkMode])

  const mapped = useMemo(() => clients.filter(c => c.lat && c.lng), [clients])

  const visible = useMemo(() => mapped.filter(c => {
    if (filterStatus      !== 'All' && c.status      !== filterStatus)      return false
    if (filterCriticality !== 'All' && c.criticality !== filterCriticality) return false
    return true
  }), [mapped, filterStatus, filterCriticality])

  const totalOpen   = mapped.reduce((s, c) => s + (c.openFindings || 0), 0)
  const activeCount = mapped.filter(c => c.status === 'Active').length

  // Ref, damit der popupopen-Handler immer die aktuelle Callback-Referenz nutzt
  // ohne den useEffect neu auszulösen
  const onClientClickRef = useRef(onClientClick)
  useEffect(() => { onClientClickRef.current = onClientClick }, [onClientClick])

  useEffect(() => {
    if (!mapDivRef.current) return
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }

    const map = L.map(mapDivRef.current, {
      center: [51.1657, 10.4515],
      zoom: 6,
      zoomControl: true,
      maxZoom: 14,
      closePopupOnClick: false,
      wheelPxPerZoomLevel: 200,
      keepBuffer: 4,
      boxZoom: false,
      fadeAnimation: true,
      zoomAnimation: true,
      markerZoomAnimation: true,
      inertia: true,
      inertiaDeceleration: 3000,
      inertiaMaxSpeed: 1500,
      tap: false,
    })
    mapRef.current = map
    mapDivRef.current.style.background = darkMode ? '#0f172a' : '#f0f0f0'

    const modeStyles = MAP_TILE_STYLES[darkMode ? 'dark' : 'light']
    const tileStyle  = modeStyles.find(s => s.id === mapStyle) || modeStyles[0]
    L.tileLayer(tileStyle.url, {
        attribution: tileStyle.attribution,
        subdomains: tileStyle.subdomains || '',
        updateWhenZooming: false,
        updateWhenIdle: false,
        keepBuffer: 4,
        crossOrigin: true,
        errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
      }
    ).addTo(map)

    // ── Cluster-Group ────────────────────────────────────────
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 48,
      spiderfyOnMaxZoom: false,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const count  = cluster.getChildCount()
        const sz     = count >= 10 ? 46 : 38
        const half   = sz / 2
        const accent = darkMode ? '#06b6d4' : '#0e7490'
        const bg     = darkMode ? '#0f172a' : '#ffffff'
        const border = darkMode ? '#164e63' : '#bae6fd'
        return L.divIcon({
          html: `<div class="hs-cluster" style="
            width:${sz}px;height:${sz}px;
            background:${bg};
            border:2px solid ${accent};
            box-shadow:0 0 14px ${accent}55, 0 2px 8px rgba(0,0,0,0.5);
            font-size:${count >= 10 ? 12 : 11}px;
            color:${accent};
          ">${count}</div>`,
          className: '',
          iconSize:   [sz, sz],
          iconAnchor: [half, half],
        })
      },
    })

    const bg  = darkMode ? '#0f172a' : '#ffffff'
    const bd  = darkMode ? '#1e293b' : '#e2e8f0'
    const txt = darkMode ? '#f1f5f9' : '#1e293b'
    const btnBg  = darkMode ? '#1e293b' : '#f1f5f9'
    const btnTxt = darkMode ? '#06b6d4' : '#0e7490'
    const subTxt = darkMode ? '#64748b' : '#94a3b8'

    const popupOpts = { className: 'holysec-popup', autoClose: true, closeOnClick: false }

    // Clients nach Position gruppieren
    const posGroups = {}
    visible.forEach(c => {
      const key = `${c.lat},${c.lng}`
      if (!posGroups[key]) posGroups[key] = []
      posGroups[key].push(c)
    })

    const makeMarkerIcon = (col, count = 1) => {
      const sz   = 34
      const half = sz / 2
      const glowPx = col.fill === CRITICALITY_COLOR.CRITICAL?.fill ? 14 : 8
      if (count === 1) {
        const dotSz = Math.round(sz * 0.35)
        return L.divIcon({
          html: `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${col.fill}1a;border:2px solid ${col.fill};box-shadow:0 0 ${glowPx}px ${col.fill}66,0 2px 8px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;cursor:pointer">
            <div style="width:${dotSz}px;height:${dotSz}px;border-radius:50%;background:${col.fill};box-shadow:0 0 6px ${col.fill}99"></div>
          </div>`,
          className: '', iconSize: [sz, sz], iconAnchor: [half, half], popupAnchor: [0, -half - 6],
        })
      }
      // Gruppen-Icon: gestapelte Ringe + Zahl
      return L.divIcon({
        html: `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:#0f172a;border:2px solid #06b6d4;box-shadow:0 0 12px #06b6d455,0 2px 8px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative">
          <div style="position:absolute;inset:-4px;border-radius:50%;border:1px solid #06b6d430;pointer-events:none"></div>
          <span style="font-size:11px;font-weight:700;font-family:monospace;color:#06b6d4">${count}</span>
        </div>`,
        className: '', iconSize: [sz, sz], iconAnchor: [half, half], popupAnchor: [0, -half - 6],
      })
    }

    const makeSinglePopup = (c) => {
      const col = CRITICALITY_COLOR[c.criticality] || CRITICALITY_COLOR.LOW
      const openLine = c.openFindings > 0
        ? `<div style="margin-top:6px;font-size:10px;font-family:monospace;color:#f87171">&#9888; ${c.openFindings} open finding${c.openFindings !== 1 ? 's' : ''}</div>`
        : ''
      return `<div style="background:${bg};border:1px solid ${bd};border-radius:10px;padding:14px;min-width:210px;font-family:monospace;box-shadow:0 8px 28px rgba(0,0,0,0.35)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <div style="width:8px;height:8px;border-radius:50%;background:${col.fill};box-shadow:0 0 6px ${col.fill};flex-shrink:0"></div>
          <div style="font-size:13px;font-weight:700;color:${txt}">${c.name}</div>
        </div>
        <div style="font-size:10px;color:${subTxt};margin-bottom:8px">${c.city ?? ''} · ${c.industry}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span style="font-size:10px;padding:2px 8px;border-radius:4px;background:${col.fill}22;color:${col.fill};border:1px solid ${col.fill}55;font-weight:700;letter-spacing:.05em">${c.criticality}</span>
          <span style="font-size:10px;color:${subTxt}">${c.status}</span>
        </div>
        ${openLine}
        <button class="map-detail-btn" data-client-id="${c.id}"
          style="margin-top:10px;width:100%;padding:7px 0;background:${btnBg};border:1px solid ${bd};border-radius:6px;color:${btnTxt};font-size:10px;font-family:monospace;font-weight:700;letter-spacing:0.08em;cursor:pointer;text-transform:uppercase"
          onmouseover="this.style.opacity='.7'" onmouseout="this.style.opacity='1'">&#8594; Details anzeigen</button>
      </div>`
    }

    const makeGroupPopup = (group) => {
      const rows = group.map(c => {
        const col = CRITICALITY_COLOR[c.criticality] || CRITICALITY_COLOR.LOW
        return `<button class="map-detail-btn" data-client-id="${c.id}"
          style="width:100%;display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:7px;background:transparent;border:1px solid ${bd};cursor:pointer;text-align:left;transition:background .15s;margin-bottom:6px"
          onmouseover="this.style.background='${btnBg}'" onmouseout="this.style.background='transparent'">
          <div style="width:9px;height:9px;border-radius:50%;background:${col.fill};box-shadow:0 0 6px ${col.fill};flex-shrink:0"></div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:700;color:${txt};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.name}</div>
            <div style="font-size:10px;color:${subTxt}">${c.industry} · ${c.criticality}</div>
          </div>
          <span style="font-size:10px;color:${btnTxt}">&#8594;</span>
        </button>`
      }).join('')
      return `<div style="background:${bg};border:1px solid ${bd};border-radius:10px;padding:14px;min-width:230px;font-family:monospace;box-shadow:0 8px 28px rgba(0,0,0,0.35)">
        <div style="font-size:10px;color:${subTxt};text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px">&#128205; ${group.length} Standorte</div>
        ${rows}
      </div>`
    }

    const collapseSpider = () => {
      if (!spiderRef.current) return
      spiderRef.current.forEach(l => map.removeLayer(l))
      spiderRef.current = null
    }

    const expandSpider = (centerLatLng, group) => {
      collapseSpider()
      const centerPx = map.latLngToLayerPoint(centerLatLng)
      const radius   = 58
      const layers   = []

      group.forEach((c, i) => {
        const angle  = (2 * Math.PI * i) / group.length - Math.PI / 2
        const legEnd = map.layerPointToLatLng(L.point(
          centerPx.x + radius * Math.cos(angle),
          centerPx.y + radius * Math.sin(angle),
        ))

        // Verbindungslinie
        const leg = L.polyline([centerLatLng, legEnd], {
          color: '#06b6d4', weight: 1.5, opacity: 0.35, dashArray: '3,4',
        }).addTo(map)

        // Einzelner Marker
        const col    = CRITICALITY_COLOR[c.criticality] || CRITICALITY_COLOR.LOW
        const icon   = makeMarkerIcon(col, 1)
        const marker = L.marker(legEnd, { icon, zIndexOffset: 1000 })
        marker.on('click', e => L.DomEvent.stopPropagation(e))
        marker.bindPopup(makeSinglePopup(c), popupOpts)
        marker.addTo(map)

        layers.push(leg, marker)
      })

      spiderRef.current = layers
    }

    Object.values(posGroups).forEach(group => {
      const [c0] = group
      const col  = CRITICALITY_COLOR[c0.criticality] || CRITICALITY_COLOR.LOW
      const icon = makeMarkerIcon(col, group.length)
      const marker = L.marker([c0.lat, c0.lng], { icon })
      marker.on('click', e => {
        L.DomEvent.stopPropagation(e)
        if (group.length === 1) return  // normales Popup via bindPopup
        expandSpider(marker.getLatLng(), group)
      })

      if (group.length === 1) {
        marker.bindPopup(makeSinglePopup(c0), popupOpts)
      }

      clusterGroup.addLayer(marker)
    })

    map.addLayer(clusterGroup)

    map.on('click', () => {
      collapseSpider()
      map.closePopup()
    })

    map.on('popupopen', (e) => {
      e.popup.getElement()?.querySelectorAll('.map-detail-btn').forEach(btn => {
        btn.onclick = () => {
          const id = btn.dataset.clientId
          if (id && onClientClickRef.current) onClientClickRef.current(id)
        }
      })
      if (flybackTimerRef.current !== null) {
        clearTimeout(flybackTimerRef.current)
        flybackTimerRef.current = null
      } else {
        savedViewRef.current = { center: map.getCenter(), zoom: map.getZoom() }
      }
      const latlng = e.popup.getLatLng()
      if (latlng) {
        const targetZoom = Math.min(map.getZoom() + 1, 12)
        map.flyTo(latlng, targetZoom, { duration: 0.5 })
      }
    })

    map.on('popupclose', () => {
      if (!savedViewRef.current) return
      const saved = { ...savedViewRef.current }
      flybackTimerRef.current = setTimeout(() => {
        flybackTimerRef.current = null
        savedViewRef.current    = null
        if (mapRef.current) mapRef.current.flyTo(saved.center, saved.zoom, { duration: 0.6 })
      }, 80)
    })


    // Wächter: entfernt Leaflet-BoxZoom-Overlay sofort aus dem DOM
    const zoomBoxWatcher = new MutationObserver((mutations) => {
      mutations.forEach(({ addedNodes }) => {
        addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.classList?.contains('leaflet-zoom-box')) {
            node.remove()
          }
        })
      })
    })
    zoomBoxWatcher.observe(mapDivRef.current, { childList: true, subtree: true })

    return () => {
      if (flybackTimerRef.current) { clearTimeout(flybackTimerRef.current); flybackTimerRef.current = null }
      if (spiderRef.current) { spiderRef.current.forEach(l => { try { map.removeLayer(l) } catch {} }); spiderRef.current = null }
      zoomBoxWatcher.disconnect()
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [visible, darkMode, mapStyle])

  const chipBase   = darkMode
    ? 'border-[#1e293b] text-slate-500 hover:text-slate-300 hover:border-slate-600'
    : 'border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-400'
  const chipActive = darkMode
    ? 'border-slate-500/50 bg-slate-700/40 text-slate-300'
    : 'border-slate-400/60 bg-slate-100 text-slate-700'
  const panelCls   = darkMode ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-gray-200'
  const borderCls  = darkMode ? 'border-[#1e293b]' : 'border-gray-200'
  const dividerCls = darkMode ? 'bg-[#1e293b]'     : 'bg-gray-200'
  const metaText   = darkMode ? 'text-slate-500'   : 'text-gray-500'
  const headText   = darkMode ? 'text-slate-100'   : 'text-gray-900'

  return (
    <div className="h-full flex flex-col p-6 gap-4">
      {/* Stats + Filter-Leiste */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Mini-Stats */}
        <div className={`flex items-center gap-4 px-4 py-2.5 rounded-lg border ${panelCls}`}>
          {[
            { label: 'Standorte',     val: mapped.length,                    cls: headText },
            { label: 'Aktiv',         val: activeCount,                       cls: 'text-cyan-400' },
            { label: 'Open Findings', val: totalOpen, cls: totalOpen > 0 ? 'text-red-400' : 'text-green-400' },
            { label: 'Sichtbar',      val: visible.length,                    cls: headText },
          ].map(({ label, val, cls }, i, arr) => (
            <React.Fragment key={label}>
              <div className="text-center">
                <div className={`text-[9px] font-mono uppercase tracking-widest ${metaText}`}>{label}</div>
                <div className={`text-base font-mono font-bold ${cls}`}>{val}</div>
              </div>
              {i < arr.length - 1 && <div className={`w-px h-8 ${dividerCls}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Status-Filter */}
        <div className="flex items-center gap-1">
          {['All', 'Active', 'Pending', 'Completed', 'On Hold'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1.5 rounded text-[10px] font-mono border transition-all ${filterStatus === s ? chipActive : chipBase}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Kritikalitäts-Filter / Legende */}
        <div className="flex items-center gap-1">
          <button onClick={() => setFilterCriticality('All')}
            className={`px-2.5 py-1.5 rounded text-[10px] font-mono border transition-all ${filterCriticality === 'All' ? chipActive : chipBase}`}>
            All
          </button>
          {Object.entries(CRITICALITY_COLOR).map(([level, col]) => (
            <button key={level} onClick={() => setFilterCriticality(level)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-mono border transition-all ${filterCriticality === level ? chipActive : chipBase}`}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col.fill }} />
              {level}
            </button>
          ))}
        </div>

        {/* Kartensti-Selector */}
        <div className="ml-auto flex items-center gap-1">
          {MAP_TILE_STYLES[darkMode ? 'dark' : 'light'].map(s => (
            <button key={s.id} onClick={() => setMapStyle(s.id)}
              className={`px-2.5 py-1.5 rounded text-[10px] font-mono border transition-all ${mapStyle === s.id ? chipActive : chipBase}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Karte */}
      <div
        className={`flex-1 rounded-xl border ${borderCls}`}
        style={{ minHeight: 400, background: darkMode ? '#0f172a' : '#e2e8f0', isolation: 'isolate' }}
      >
        <div ref={mapDivRef} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  )
}

function EngagementGroupsPage({ groups, onAdd, onDelete, onEdit, teamMembers, currentUser, engagements: allEngagements = [] }) {
  const canManage = ['Admin', 'Senior Pentester'].includes(currentUser?.role)
  const [showModal, setShowModal]       = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)

  const openEdit = (g) => { setEditingGroup(g); setShowModal(true) }
  const openNew  = () => { setEditingGroup(null); setShowModal(true) }

  return (
    <div className="p-3 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-mono font-bold text-slate-100 tracking-widest uppercase">Engagement Groups</h2>
          <p className="text-[10px] font-mono text-slate-600 mt-0.5">{groups.length} Gruppe{groups.length !== 1 ? 'n' : ''} — Wer arbeitet zusammen an einem Pentest?</p>
        </div>
        {canManage && (
          <button onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs font-mono text-cyan-400 hover:bg-cyan-500/20 transition-all">
            <Plus size={12} /> Gruppe erstellen
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <Panel>
          <div className="py-14 text-center space-y-2">
            <Layers size={24} className="text-slate-700 mx-auto" />
            <p className="text-xs font-mono text-slate-600">Noch keine Gruppen definiert.</p>
            {canManage && <p className="text-[10px] font-mono text-slate-700">Erstelle Gruppen um Pentest-Teams pro Engagement zu organisieren.</p>}
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(group => {
            const gc = GROUP_COLORS[group.color] || GROUP_COLORS.cyan
            const groupMembers = teamMembers.filter(m => group.memberIds.includes(m.id))
            const linkedEng = allEngagements.find(e => e.id === group.engagementId)
            return (
              <Panel key={group.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${gc.dot}`} />
                    <span className="text-sm font-mono font-semibold text-slate-100">{group.name}</span>
                  </div>
                  {canManage && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(group)} className="p-1 rounded text-slate-600 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"><Edit3 size={11} /></button>
                      <button onClick={() => onDelete(group.id)} className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={11} /></button>
                    </div>
                  )}
                </div>

                {group.description && <p className="text-[10px] font-mono text-slate-500 mb-3">{group.description}</p>}

                <div className="mb-3">
                  <div className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-2">
                    Mitglieder ({groupMembers.length})
                  </div>
                  {groupMembers.length === 0
                    ? <span className="text-[10px] font-mono text-slate-700">Keine Mitglieder</span>
                    : (
                      <div className="space-y-1.5">
                        <div className="flex -space-x-1.5">
                          {groupMembers.map(m => (
                            <div key={m.id} className="ring-1 ring-[#0f172a] rounded-full" title={m.name}>
                              <MemberAvatar member={m} />
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {groupMembers.map(m => (
                            <span key={m.id} className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${gc.text} bg-slate-800`}>
                              {m.nickname || m.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  }
                </div>

                {linkedEng ? (
                  <div className="pt-3 border-t border-[#1e293b]">
                    <div className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-1.5">Engagement</div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Calendar size={10} className={gc.text} />
                      <span className={`text-[10px] font-mono truncate ${gc.text}`}>{linkedEng.title}</span>
                    </div>
                    <StatusBadge status={linkedEng.status} />
                  </div>
                ) : (
                  <div className="pt-3 border-t border-[#1e293b]">
                    <span className="text-[10px] font-mono text-slate-700">Kein Engagement verknüpft</span>
                  </div>
                )}
              </Panel>
            )
          })}
        </div>
      )}

      {showModal && (
        <GroupModal
          group={editingGroup}
          teamMembers={teamMembers}
          engagements={allEngagements}
          onSave={g => { editingGroup ? onEdit(g) : onAdd(g); setShowModal(false) }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

// ─── ROOT APP ────────────────────────────────────────────────────────────────

// ─── AUDIT LOG ───────────────────────────────────────────────────────────────

const LOG_CAT = {
  auth:        { label: 'Auth',          color: 'text-cyan-400',   bg: 'bg-cyan-400/10 border-cyan-400/20',     dot: 'bg-cyan-400' },
  findings:    { label: 'Findings',      color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/20',       dot: 'bg-red-400' },
  clients:     { label: 'Clients',       color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20',     dot: 'bg-blue-400' },
  engagements: { label: 'Engagements',   color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20', dot: 'bg-purple-400' },
  reports:     { label: 'Reports',       color: 'text-green-400',  bg: 'bg-green-400/10 border-green-400/20',   dot: 'bg-green-400' },
  team:        { label: 'Team',          color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20', dot: 'bg-orange-400' },
  groups:      { label: 'Gruppen',       color: 'text-pink-400',   bg: 'bg-pink-400/10 border-pink-400/20',     dot: 'bg-pink-400' },
  time:        { label: 'Zeiterfassung', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', dot: 'bg-yellow-400' },
  download:    { label: 'Download',      color: 'text-teal-400',   bg: 'bg-teal-400/10 border-teal-400/20',     dot: 'bg-teal-400' },
}

function AuditLogPage({ logs = [], teamMembers = [], onClear, tipsLang = 'de' }) {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [userFilter, setUserFilter] = useState('All')
  const [rangeFilter, setRangeFilter] = useState('7d')
  const [confirmClear, setConfirmClear] = useState(false)

  const filtered = useMemo(() => {
    const now = Date.now()
    const cutoff = ({ '24h': now - 86400000, '7d': now - 7*86400000, '30d': now - 30*86400000, 'all': 0 })[rangeFilter] ?? 0
    return [...logs].reverse().filter(l => {
      const ts = new Date(l.timestamp).getTime()
      if (ts < cutoff) return false
      if (catFilter !== 'All' && l.category !== catFilter) return false
      if (userFilter !== 'All' && l.userId !== userFilter) return false
      const q = search.toLowerCase()
      return !q || l.action.toLowerCase().includes(q) || l.details.toLowerCase().includes(q) || l.userName.toLowerCase().includes(q)
    })
  }, [logs, rangeFilter, catFilter, userFilter, search])

  const { todayLogs, todayLogins, lastLog, mostActive } = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0)
    const tl = logs.filter(l => new Date(l.timestamp) >= today)
    const userCounts = logs.reduce((acc, l) => { acc[l.userName] = (acc[l.userName] || 0) + 1; return acc }, {})
    return {
      todayLogs: tl,
      todayLogins: tl.filter(l => l.action === 'LOGIN').length,
      lastLog: logs.length ? logs[logs.length - 1] : null,
      mostActive: Object.entries(userCounts).sort((a,b) => b[1]-a[1])[0],
    }
  }, [logs])

  const fmtTs = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' }) + ' ' + d.toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
  }

  const exportCSV = () => {
    const rows = [['Timestamp','User','Rolle','Aktion','Details','Kategorie','IP']]
    filtered.forEach(l => rows.push([l.timestamp, l.userName, l.role, l.action, `"${l.details.replace(/"/g,'""')}"`, l.category, l.ip]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `holysec_audit_${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  return (
    <div className="p-3 lg:p-6 space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Events gesamt" value={logs.length} sub="in der Datenbank" icon={ClipboardList} />
        <KpiCard label="Heute" value={todayLogs.length} sub="Events (24h)" icon={Activity} accent />
        <KpiCard label="Logins heute" value={todayLogins} sub="Auth-Events" icon={KeyRound} />
        <KpiCard label="Aktivste Person" value={mostActive ? mostActive[0].split(' ')[0] : '–'} sub={mostActive ? `${mostActive[1]} Events` : ''} icon={Crown} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-0 max-w-xs">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen..."
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded px-3 py-1.5 pl-8 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50" />
          </div>
          <select value={userFilter} onChange={e => setUserFilter(e.target.value)}
            className="bg-[#0f172a] border border-[#1e293b] rounded px-2 py-1.5 text-xs font-mono text-slate-400 focus:outline-none focus:border-cyan-500/50">
            <option value="All">Alle User</option>
            {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select value={rangeFilter} onChange={e => setRangeFilter(e.target.value)}
            className="bg-[#0f172a] border border-[#1e293b] rounded px-2 py-1.5 text-xs font-mono text-slate-400 focus:outline-none focus:border-cyan-500/50">
            <option value="24h">Letzte 24h</option>
            <option value="7d">Letzte 7 Tage</option>
            <option value="30d">Letzte 30 Tage</option>
            <option value="all">Alle</option>
          </select>
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            {['All', ...Object.keys(LOG_CAT)].map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={`px-2 py-1 rounded text-[10px] font-mono border transition-all ${catFilter === c ? 'border-slate-500/50 bg-slate-700/40 text-slate-300' : 'border-[#1e293b] text-slate-500 hover:text-slate-300'}`}>
                {c === 'All' ? 'Alle' : LOG_CAT[c].label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1e293b] rounded text-xs font-mono text-slate-500 hover:text-green-400 hover:border-green-500/40 transition-all">
              <Download size={12} /> CSV Export
            </button>
            {confirmClear ? (
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono text-red-400">Sicher?</span>
                <button onClick={() => { onClear(); setConfirmClear(false) }}
                  className="px-2 py-1 rounded border border-red-500/40 bg-red-500/10 text-[10px] font-mono text-red-400 hover:bg-red-500/20 transition-all">Ja</button>
                <button onClick={() => setConfirmClear(false)}
                  className="px-2 py-1 rounded border border-[#1e293b] text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-all">Nein</button>
              </div>
            ) : (
              <button onClick={() => setConfirmClear(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1e293b] rounded text-xs font-mono text-slate-500 hover:text-red-400 hover:border-red-500/40 transition-all">
                <Trash2 size={12} /> Logs löschen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <Panel>
        <PanelHeader title="Event Log" subtitle={`${filtered.length} Einträge`} info={TIPS[tipsLang].auditLog} />
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1e293b]">
                {['Zeitstempel', 'User', 'Rolle', 'Aktion', 'Details', 'Kategorie', 'IP'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] text-slate-600 uppercase tracking-wider font-normal whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-600 font-mono text-xs">Keine Events gefunden.</td></tr>
              ) : filtered.map(l => {
                const cat = LOG_CAT[l.category] || { label: l.category, color: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/20', dot: 'bg-slate-400' }
                const member = teamMembers.find(m => m.id === l.userId)
                const clr = member ? MEMBER_COLOR_MAP[member.color] : null
                return (
                  <tr key={l.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{fmtTs(l.timestamp)}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {member && <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${clr?.bg} text-white`}>{member.initials}</div>}
                        <span className="text-slate-200">{l.userName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${ROLE_BADGE[l.role] || 'text-slate-400 bg-slate-400/10 border-slate-400/20'}`}>{l.role}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-100 font-semibold whitespace-nowrap">{l.action}</td>
                    <td className="px-4 py-2.5 text-slate-400 max-w-[240px] truncate" title={l.details}>{l.details}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-mono ${cat.bg} ${cat.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />{cat.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 font-mono whitespace-nowrap">{l.ip}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {lastLog && (
        <p className="text-[10px] font-mono text-slate-700 text-right">
          Letzter Eintrag: {fmtTs(lastLog.timestamp)} — {lastLog.userName}
        </p>
      )}
    </div>
  )
}

const PAGE_TITLES = {
  dashboard:        { title: 'DASHBOARD',          subtitle: 'Client & Operations Overview' },
  'client-radar':   { title: 'CLIENT RADAR',       subtitle: 'Client monitoring & status overview' },
  'client-manager': { title: 'CLIENT MANAGER',     subtitle: 'All managed client accounts' },
  findings:         { title: 'FINDINGS TRACKER',   subtitle: 'Vulnerability database — all engagements' },
  engagements:      { title: 'ENGAGEMENT PLANNER', subtitle: 'Active and planned pentest operations' },
  'eng-detail':     { title: 'ENGAGEMENT DETAIL',  subtitle: 'Client info, scope & report upload' },
  'eng-groups':     { title: 'ENGAGEMENT GROUPS',  subtitle: 'Pentest-Teams & Group Management' },
  reports:          { title: 'REPORTING CENTER',   subtitle: 'Report registry and document management' },
  team:             { title: 'TEAM',               subtitle: 'Operators & Assignment' },
  about:            { title: 'ABOUT HOLYSEC',      subtitle: 'Blessed by Offense, Built for Defense.' },
  settings:         { title: 'SETTINGS',           subtitle: 'Application configuration' },
  audit:            { title: 'AUDIT LOG',           subtitle: 'System-Aktivitätsprotokoll — Admin only' },
  map:              { title: 'CLIENT MAP',          subtitle: 'Geografische Übersicht aller Kundenstandorte' },
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [teamMembers, setTeamMembers] = useState(() => {
    try {
      return null
    } catch { return null }
  })
  const [assignments, setAssignments] = useState({})
  const [clients, setClients]                 = useState([])
  const [timeEntries, setTimeEntries]         = useState([])
  const [activeTimer, setActiveTimer]         = useState(() => {
    try { return JSON.parse(localStorage.getItem('holysec_active_timer') || 'null') } catch { return null }
  })
  const [page, setPage] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false)
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [selectedEngId, setSelectedEngId]     = useState(null)
  const [reports, setReports]                 = useState([])
  const [darkMode, setDarkMode]               = useState(true)
  const [userPresence, setUserPresence]       = useState('online')
  const [engagementGroups, setEngagementGroups] = useState([])
  const [customEngagements, setCustomEngagements] = useState([])
  const [customFindings, setCustomFindings]   = useState([])
  const [pageOpts, setPageOpts]               = useState({})
  const [auditLogs, setAuditLogs]             = useState([])
  const [reminders, setReminders]             = useState([])
  const [uiLang, setUiLang]   = useState(() => localStorage.getItem('holysec_ui_lang')   || 'en')
  const [tipsLang, setTipsLang] = useState(() => localStorage.getItem('holysec_tips_lang') || 'de')
  const [pendingReports, setPendingReports]   = useState({})
  const sessionIpRef = useRef('–')
  const currentUserRef = useRef(null)
  const apiLoadedRef = useRef(false)

  useEffect(() => { currentUserRef.current = currentUser }, [currentUser])

  // IP wird serverseitig aus req.ip gelesen — kein externer Dienst nötig
  useEffect(() => { sessionIpRef.current = 'server' }, [])

  // Session-Wiederherstellung: prüft beim Laden ob ein gültiger Cookie existiert
  useEffect(() => {
    apiMe().then(me => {
      if (!me) return
      setCurrentUser(me)
      Promise.all([
        apiGetClients(), apiGetFindings(), apiGetEngagements(), apiGetReports(),
        apiGetUsers(), apiGetTimeEntries(), apiGetEngGroups(), apiGetAuditLogs(),
      ]).then(([c, f, e, r, u, t, g, a]) => {
        const isEmpty = !c || c.length === 0
        if (isEmpty) {
          fetch('/api/seed', { method: 'POST', credentials: 'include' }).then(() =>
            Promise.all([
              apiGetClients(), apiGetFindings(), apiGetEngagements(), apiGetReports(),
              apiGetUsers(), apiGetTimeEntries(), apiGetEngGroups(), apiGetAuditLogs(),
            ]).then(([c2, f2, e2, r2, u2, t2, g2, a2]) => {
              if (c2) setClients(c2)
              if (f2) setCustomFindings(f2)
              if (e2) { setCustomEngagements(e2); setAssignments(Object.fromEntries(e2.map(x => [x.id, x.assignedTo || []]))) }
              if (r2) setReports(r2)
              if (u2) setTeamMembers(u2)
              if (t2) setTimeEntries(t2)
              if (g2) setEngagementGroups(g2)
              if (a2) setAuditLogs(a2)
              apiLoadedRef.current = true
            })
          )
        } else {
          if (c) setClients(c)
          if (f) setCustomFindings(f)
          if (e) { setCustomEngagements(e); setAssignments(Object.fromEntries(e.map(x => [x.id, x.assignedTo || []]))) }
          if (r) setReports(r)
          if (u) setTeamMembers(u)
          if (t) setTimeEntries(t)
          if (g) setEngagementGroups(g)
          if (a) setAuditLogs(a)
          apiLoadedRef.current = true
        }
      })
    }).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps


  const logEvent = useCallback((action, details, category = 'general', userOverride = null) => {
    const user = userOverride || currentUserRef.current
    if (!user) return
    const entry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,
      userId: user.id, userName: user.name, role: user.role,
      action, details, category, ip: sessionIpRef.current, timestamp: new Date().toISOString(),
    }
    setAuditLogs(prev => {
      const next = [...prev, entry]
      return next.length > 1000 ? next.slice(-1000) : next
    })
    apiCreateAuditLog({ action, details, category })
  }, [])

  const handleSendReminder = useCallback((r) => {
    const id = `rem_${Date.now()}`
    setReminders(prev => [...prev, { id, ...r }])
    logEvent('Erinnerung gesendet', `Finding: ${r.findingTitle} → ${r.toUserIds.length} Empfänger`, 'findings')
  }, [logEvent])

  useEffect(() => {
    document.body.classList.toggle('light-mode', !darkMode)
  }, [darkMode])

  useEffect(() => { localStorage.setItem('holysec_ui_lang', uiLang) }, [uiLang])
  useEffect(() => { localStorage.setItem('holysec_tips_lang', tipsLang) }, [tipsLang])

  useEffect(() => {
    if (activeTimer) localStorage.setItem('holysec_active_timer', JSON.stringify(activeTimer))
    else localStorage.removeItem('holysec_active_timer')
  }, [activeTimer])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setClients(prev => prev.map(c => {
      if (c.status !== 'Pending') return c
      const started = customEngagements.some(e => e.clientId === c.id && e.start <= today)
      return started ? { ...c, status: 'Active' } : c
    }))
  }, [customEngagements])


  const handleAddGroup    = useCallback(async (g) => {
    const saved = await apiCreateEngGroup(g)
    if (saved) setEngagementGroups(p => [...p, saved])
    logEvent('GRUPPE_ERSTELLT', g.name, 'groups')
  }, [logEvent])
  const handleEditGroup   = useCallback(async (g) => {
    const saved = await apiUpdateEngGroup(g.id, g)
    if (saved) setEngagementGroups(p => p.map(x => x.id === g.id ? saved : x))
    logEvent('GRUPPE_BEARBEITET', g.name, 'groups')
  }, [logEvent])
  const handleDeleteGroup = useCallback(async (id) => {
    await apiDeleteEngGroup(id)
    setEngagementGroups(p => p.filter(x => x.id !== id))
    logEvent('GRUPPE_GELÖSCHT', `ID: ${id}`, 'groups')
  }, [logEvent])

  const handleReportStatusChange = useCallback(async (id) => {
    const cycle = { Draft: 'Delivered', Delivered: 'Final', Final: 'Draft' }
    const rep = reports.find(r => r.id === id)
    if (!rep) return
    const next = cycle[rep.status] || rep.status
    const saved = await apiUpdateReport(id, { ...rep, status: next })
    if (saved) setReports(prev => prev.map(r => r.id === id ? saved : r))
    logEvent('REPORT_STATUS', `"${rep.title}" → ${next}`, 'reports')
  }, [reports, logEvent])

  const handleAddReport = useCallback(async (report) => {
    const saved = await apiCreateReport(report)
    if (saved) setReports(prev => [...prev, saved])
    logEvent('REPORT_ERSTELLT', `"${report.title}" [${report.type}]`, 'reports')
  }, [logEvent])

  const handleLogin = useCallback(async (memberId) => {
    const me = await apiMe()
    if (!me) return
    setCurrentUser(me)
    logEvent('LOGIN', `Anmeldung von ${window.location.host}`, 'auth', me)
    const [c, f, e, r, u, t, g, a] = await Promise.all([
      apiGetClients(), apiGetFindings(), apiGetEngagements(), apiGetReports(),
      apiGetUsers(), apiGetTimeEntries(), apiGetEngGroups(), apiGetAuditLogs(),
    ])
    const isEmpty = !c || c.length === 0
    if (isEmpty) {
      await fetch('/api/seed', { method: 'POST', credentials: 'include' })
      const [c2, f2, e2, r2, u2, t2, g2, a2] = await Promise.all([
        apiGetClients(), apiGetFindings(), apiGetEngagements(), apiGetReports(),
        apiGetUsers(), apiGetTimeEntries(), apiGetEngGroups(), apiGetAuditLogs(),
      ])
      if (c2) setClients(c2)
      if (f2) setCustomFindings(f2)
      if (e2) { setCustomEngagements(e2); setAssignments(Object.fromEntries(e2.map(x => [x.id, x.assignedTo || []]))) }
      if (r2) setReports(r2)
      if (u2) setTeamMembers(u2)
      if (t2) setTimeEntries(t2)
      if (g2) setEngagementGroups(g2)
      if (a2) setAuditLogs(a2)
    } else {
      if (c) setClients(c)
      if (f) setCustomFindings(f)
      if (e) { setCustomEngagements(e); setAssignments(Object.fromEntries(e.map(x => [x.id, x.assignedTo || []]))) }
      if (r) setReports(r)
      if (u) setTeamMembers(u)
      if (t) setTimeEntries(t)
      if (g) setEngagementGroups(g)
      if (a) setAuditLogs(a)
    }
    apiLoadedRef.current = true
  }, [logEvent])

  const handleLogout = useCallback(() => {
    if (activeTimer) {
      const end = Date.now()
      const duration = Math.floor((end - activeTimer.start) / 1000)
      setTimeEntries(prev => [...prev, {
        id: `te${end}`,
        userId: activeTimer.userId,
        userName: activeTimer.userName,
        date: new Date(activeTimer.start).toISOString().split('T')[0],
        start: new Date(activeTimer.start).toTimeString().slice(0, 5),
        end: new Date(end).toTimeString().slice(0, 5),
        duration,
      }])
      setActiveTimer(null)
      logEvent('ZEITERFASSUNG_STOP', `Dauer: ${formatDurationShort(duration)} (Logout)`, 'time')
    }
    logEvent('LOGOUT', 'Abgemeldet', 'auth')
    apiLogout()
    setCurrentUser(null)
    setClients([]); setCustomFindings([]); setCustomEngagements([])
    setReports([]); setTeamMembers([]); setTimeEntries([])
    setEngagementGroups([]); setAuditLogs([]); setAssignments({})
    apiLoadedRef.current = false
    setPage('dashboard')
  }, [logEvent, activeTimer])

  // 401-Handler: nach handleLogout definiert, damit keine ReferenceError entsteht
  useEffect(() => {
    const handler = () => handleLogout()
    window.addEventListener('holysec:unauthorized', handler)
    return () => window.removeEventListener('holysec:unauthorized', handler)
  }, [handleLogout])

  const handleAddMember = useCallback(async (member) => {
    const { password, ...memberData } = member
    const saved = await apiCreateUser({ ...memberData, password })
    if (saved) setTeamMembers(prev => [...prev, saved])
    logEvent('MITARBEITER_ERSTELLT', `${memberData.name} [${memberData.role}]`, 'team')
  }, [logEvent])
  const handleRemoveMember = useCallback(async (id) => {
    const m = teamMembers.find(x => x.id === id)
    await apiDeleteUser(id)
    setTeamMembers(prev => prev.filter(x => x.id !== id))
    logEvent('MITARBEITER_ENTFERNT', m ? `${m.name} [${m.role}]` : id, 'team')
  }, [teamMembers, logEvent])
  const handleEditMember = useCallback(async (member) => {
    const { password, ...memberData } = member
    const saved = await apiUpdateUser(memberData.id, memberData)
    if (saved) {
      setTeamMembers(prev => prev.map(m => m.id === memberData.id ? saved : m))
      setCurrentUser(prev => prev?.id === memberData.id ? saved : prev)
    }
    if (password) await apiUpdatePassword(memberData.id, password)
    logEvent('MITARBEITER_BEARBEITET', `${memberData.name} [${memberData.role}]${password ? ' + Passwort geändert' : ''}`, 'team')
  }, [logEvent])
  const handleAssign = useCallback((engId, memberIds) => {
    setAssignments(prev => ({ ...prev, [engId]: memberIds }))
    logEvent('ZUWEISUNG_GEÄNDERT', `Engagement ${engId} → ${memberIds.length} Mitglieder`, 'engagements')
  }, [logEvent])

  const handleAddFinding = useCallback(async (f) => {
    const saved = await apiCreateFinding(f)
    if (saved) setCustomFindings(prev => [...prev, saved])
    logEvent('FINDING_ERSTELLT', `"${f.title}" [${f.severity}] — ${f.category}`, 'findings')
  }, [logEvent])
  const handleDeleteFinding = useCallback(async (id) => {
    await apiDeleteFinding(id)
    setCustomFindings(prev => prev.filter(f => f.id !== id))
    logEvent('FINDING_GELÖSCHT', `ID: ${id}`, 'findings')
  }, [logEvent])
  const handleEditFinding = useCallback(async (updated) => {
    const saved = await apiUpdateFinding(updated.id, updated)
    if (saved) setCustomFindings(prev => prev.map(f => f.id === updated.id ? saved : f))
    logEvent('FINDING_BEARBEITET', `"${updated.title}" [${updated.severity}]`, 'findings')
  }, [logEvent])
  const handleNav = useCallback((targetPage, opts = {}) => {
    setPage(targetPage)
    setPageOpts(opts)
  }, [])

  const handleAddEngagement = useCallback(async (eng) => {
    const saved = await apiCreateEngagement(eng)
    if (saved) {
      setCustomEngagements(prev => [...prev, saved])
      setAssignments(prev => ({ ...prev, [saved.id]: [] }))
    }
    logEvent('ENGAGEMENT_ERSTELLT', `"${eng.title}" [${eng.type}] — ${eng.status}`, 'engagements')
  }, [logEvent])

  const handleEditEngagement = useCallback(async (eng) => {
    const saved = await apiUpdateEngagement(eng.id, eng)
    if (saved) setCustomEngagements(prev => prev.map(e => e.id === eng.id ? saved : e))
    logEvent('ENGAGEMENT_BEARBEITET', `"${eng.title}"`, 'engagements')
  }, [logEvent])

  const handleDeleteEngagement = useCallback(async (id) => {
    await apiDeleteEngagement(id)
    setCustomEngagements(prev => prev.filter(e => e.id !== id))
    logEvent('ENGAGEMENT_GELÖSCHT', `ID: ${id}`, 'engagements')
  }, [logEvent])

  const handleSetPendingReport = useCallback((engId, report) => {
    setPendingReports(prev => {
      if (report === null) {
        const next = { ...prev }
        delete next[engId]
        return next
      }
      return { ...prev, [engId]: report }
    })
  }, [])

  const handleEngStatusChange = useCallback(async (id) => {
    const cycle = { Planned: 'Active', Active: 'On Hold', 'On Hold': 'Completed', Completed: 'Planned' }
    const eng = customEngagements.find(e => e.id === id)
    if (!eng) return
    const next = cycle[eng.status] || eng.status
    logEvent('ENGAGEMENT_STATUS', `"${eng.title}" → ${next}`, 'engagements')
    const saved = await apiUpdateEngagement(id, { ...eng, status: next })
    if (saved) setCustomEngagements(prev => prev.map(e => e.id === id ? saved : e))
    if (next === 'Completed') {
      setPendingReports(prev => {
        const pr = prev[id]
        if (!pr?.title) return prev
        const report = {
          id: `r${Date.now()}`,
          clientId: eng.clientId,
          engagementId: id,
          title: pr.title,
          type: pr.type,
          date: new Date().toISOString().split('T')[0],
          status: 'Draft',
        }
        apiCreateReport(report).then(r => { if (r) setReports(rs => [...rs, r]) })
        logEvent('REPORT_ERSTELLT', `"${pr.title}" [${pr.type}] — auto-publiziert`, 'reports')
        const next2 = { ...prev }
        delete next2[id]
        return next2
      })
    }
  }, [customEngagements, logEvent])

  const handleAddClient = useCallback(async (c) => {
    const saved = await apiCreateClient(c)
    if (saved) setClients(prev => [...prev, saved])
    logEvent('CLIENT_ERSTELLT', `"${c.name}" [${c.industry}]`, 'clients')
  }, [logEvent])

  const handleEditClient = useCallback(async (c) => {
    const saved = await apiUpdateClient(c.id, c)
    if (saved) setClients(prev => prev.map(x => x.id === c.id ? saved : x))
    logEvent('CLIENT_BEARBEITET', `"${c.name}"`, 'clients')
  }, [logEvent])

  const handleDeleteClient = useCallback(async (id) => {
    await apiDeleteClient(id)
    setClients(prev => prev.filter(x => x.id !== id))
    logEvent('CLIENT_GELÖSCHT', `ID: ${id}`, 'clients')
  }, [logEvent])

  const handleClockIn = useCallback(() => {
    if (!currentUser || activeTimer) return
    setActiveTimer({ userId: currentUser.id, userName: currentUser.name, start: Date.now() })
    logEvent('ZEITERFASSUNG_START', `Timer gestartet`, 'time')
  }, [currentUser, activeTimer, logEvent])

  const handleClockOut = useCallback(async () => {
    if (!activeTimer) return
    const end = Date.now()
    const now = new Date(end)
    const duration = Math.floor((end - activeTimer.start) / 1000)
    const entry = {
      id: `te${end}`,
      userId: activeTimer.userId,
      userName: activeTimer.userName,
      date: new Date(activeTimer.start).toISOString().split('T')[0],
      start: new Date(activeTimer.start).toTimeString().slice(0, 5),
      end: now.toTimeString().slice(0, 5),
      duration,
    }
    const saved = await apiCreateTimeEntry(entry)
    if (saved) setTimeEntries(prev => [...prev, saved])
    setActiveTimer(null)
    logEvent('ZEITERFASSUNG_STOP', `Dauer: ${formatDurationShort(duration)}`, 'time')
  }, [activeTimer, logEvent])

  const handleAuditLogDownload = useCallback((what) => logEvent('PDF_EXPORT', what, 'download'), [logEvent])
  const handleClearAuditLogs = useCallback(() => {
    setAuditLogs([])
  }, [])

  const handleClientClick = useCallback((id) => { setSelectedClientId(id); setPage('client-detail') }, [])
  const handleBackToClients = useCallback(() => { setSelectedClientId(null); setPage('client-manager') }, [])
  const handleEngDetailClick = useCallback((id) => { setSelectedEngId(id); setPage('eng-detail') }, [])
  const handleBackToEngagements = useCallback(() => { setSelectedEngId(null); setPage('engagements') }, [])

  const allEngagements = customEngagements
  const allFindings = customFindings

  if (!currentUser) return <LoginPage onLogin={handleLogin} darkMode={darkMode} onToggleDark={() => setDarkMode(v => !v)} />

  const titleInfo = PAGE_TITLES[page] || PAGE_TITLES['dashboard']

  return (
    <>
    <div className="flex h-screen bg-[#0a0a0a] text-slate-200 overflow-hidden">
      <Sidebar
        active={page} onNav={p => handleNav(p)}
        collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)}
        currentUser={currentUser} onLogout={handleLogout} uiLang={uiLang}
        mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)}
        onSettingsOpen={() => handleNav('settings')}
        darkMode={darkMode}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar
          title={page === 'client-detail' ? 'CLIENT DETAIL' : page === 'eng-detail' ? 'ENGAGEMENT DETAIL' : titleInfo.title}
          subtitle={page === 'client-detail' ? selectedClientId : page === 'eng-detail' ? selectedEngId : titleInfo.subtitle}
          currentUser={currentUser} assignments={assignments} clients={clients}
          engagements={allEngagements} findings={allFindings}
          activeTimer={activeTimer} onClockIn={handleClockIn} onClockOut={handleClockOut}
          userPresence={userPresence} onPresenceChange={setUserPresence}
          darkMode={darkMode} onToggleDark={() => setDarkMode(v => !v)}
          reminders={reminders}
          onMobileMenuToggle={() => setMobileMenuOpen(v => !v)}
        />

        <main className={`flex-1 relative ${page === 'map' ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'}`}>
          {page === 'dashboard'        && <Dashboard onClientClick={handleClientClick} clients={clients} currentUser={currentUser} assignments={assignments} findings={allFindings} engagements={allEngagements} onNav={handleNav} tipsLang={tipsLang} />}
          {page === 'client-radar'     && <ClientRadar onClientClick={handleClientClick} currentUser={currentUser} assignments={assignments} clients={clients} tipsLang={tipsLang} />}
          {page === 'client-manager'   && <ClientList clients={clients} engagements={allEngagements} reports={reports} onClientClick={handleClientClick} currentUser={currentUser} assignments={assignments} onAdd={handleAddClient} onEdit={handleEditClient} onDelete={handleDeleteClient} defaultStatus={pageOpts.status} tipsLang={tipsLang} />}
          {/* Karte immer gemountet — Leaflet + Tiles bleiben nach Login im Hintergrund geladen */}
          <div style={page === 'map' ? { height: '100%' } : { position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
            {page === 'map' && <ClientMapPage clients={clients} darkMode={darkMode} onClientClick={handleClientClick} />}
          </div>
          {page === 'client-detail'    && selectedClientId && <ClientDetail clientId={selectedClientId} onBack={handleBackToClients} clients={clients} findings={allFindings} engagements={allEngagements} reports={reports} tipsLang={tipsLang} uiLang={uiLang} onNav={handleNav} darkMode={darkMode} />}
          {page === 'findings'         && <FindingsTracker currentUser={currentUser} assignments={assignments} findings={allFindings} onAddFinding={handleAddFinding} onEditFinding={handleEditFinding} onDeleteFinding={handleDeleteFinding} clients={clients} teamMembers={teamMembers} engagements={allEngagements} onSendReminder={handleSendReminder} defaultSeverity={pageOpts.severity} defaultStatus={pageOpts.status} defaultClientId={pageOpts.clientId || 'All'} defaultFindingId={pageOpts.findingId || null} tipsLang={tipsLang} />}
          {page === 'engagements'      && <EngagementPlanner teamMembers={teamMembers} assignments={assignments} onAssign={handleAssign} currentUser={currentUser} groups={engagementGroups} engagements={allEngagements} onAddEngagement={handleAddEngagement} onStatusChange={handleEngStatusChange} onEdit={handleEditEngagement} onDelete={handleDeleteEngagement} clients={clients} defaultStatus={pageOpts.status} defaultClientId={pageOpts.clientId || null} tipsLang={tipsLang} uiLang={uiLang} pendingReports={pendingReports} onEngDetail={handleEngDetailClick} />}
          {page === 'eng-detail'       && selectedEngId && <EngagementDetail engagementId={selectedEngId} onBack={handleBackToEngagements} clients={clients} teamMembers={teamMembers} assignments={assignments} engagements={allEngagements} pendingReports={pendingReports} onSetPendingReport={handleSetPendingReport} currentUser={currentUser} onEdit={handleEditEngagement} onDelete={handleDeleteEngagement} uiLang={uiLang} />}
          {page === 'eng-groups'       && <EngagementGroupsPage groups={engagementGroups} engagements={allEngagements} onAdd={handleAddGroup} onEdit={handleEditGroup} onDelete={handleDeleteGroup} teamMembers={teamMembers} currentUser={currentUser} />}
          {page === 'reports'          && <ReportingCenter reports={reports} onStatusChange={handleReportStatusChange} onAdd={handleAddReport} currentUser={currentUser} assignments={assignments} onAuditLog={handleAuditLogDownload} tipsLang={tipsLang} clients={clients} engagements={allEngagements} findings={allFindings} />}
          {page === 'team'             && <TeamPage members={teamMembers} currentUser={currentUser} onAdd={handleAddMember} onRemove={handleRemoveMember} assignments={assignments} engagements={allEngagements} userPresence={userPresence} timeEntries={timeEntries} onAuditLog={handleAuditLogDownload} uiLang={uiLang} />}
          {page === 'user-management'  && currentUser?.role === 'Admin' && (
            <div className="p-3 lg:p-6">
              <UserManagementSection members={teamMembers} currentUser={currentUser} onAdd={handleAddMember} onRemove={handleRemoveMember} onEdit={handleEditMember} />
            </div>
          )}
          {page === 'time-tracking'    && currentUser?.role === 'Admin' && <TimeTrackingPage timeEntries={timeEntries} currentUser={currentUser} members={teamMembers} uiLang={uiLang} />}
          {page === 'audit'            && <AuditLogPage logs={auditLogs} teamMembers={teamMembers} onClear={handleClearAuditLogs} tipsLang={tipsLang} />}
          {page === 'about'            && <AboutHolySec />}
          {page === 'settings'         && <SettingsPage members={teamMembers} currentUser={currentUser} onAdd={handleAddMember} onRemove={handleRemoveMember} onEdit={handleEditMember} timeEntries={timeEntries} darkMode={darkMode} onToggleDark={() => setDarkMode(v => !v)} uiLang={uiLang} onUiLangChange={setUiLang} tipsLang={tipsLang} onTipsLangChange={setTipsLang} />}
        </main>
      </div>
    </div>
    </>
  )
}
