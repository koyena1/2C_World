import React, { useState, useMemo } from 'react';
import { downloadCsv } from '../../utils/download';
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  CalendarCheck,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowRight,
  TrendingUp,
  Search,
  Filter,
  Download,
  ExternalLink,
  ChevronRight,
  Activity,
  Layers,
  Sparkles,
  Server,
  Zap,
  RefreshCw,
  Eye,
  Sliders,
  Check,
  XCircle,
  FileText,
  UserPlus
} from 'lucide-react';
import {
  SUPER_ADMIN_TENANTS,
  KPI_SUMMARIES,
  FUNNEL_STAGES,
  MICROSERVICES_HEALTH,
  CRITICAL_ALERTS,
  RECENT_AUDIT_LOGS,
  TenantSummary,
  KpiMetric,
  MicroserviceHealth,
  SuperAdminAlert,
  AuditEventLog
} from '../../data/mockSuperAdminData';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface SuperAdminOverviewProps {
  onNavigate: (view: string) => void;
  onOpenInviteModal?: () => void;
  onShowToast?: (message: string) => void;
}

export const SuperAdminOverview: React.FC<SuperAdminOverviewProps> = ({
  onNavigate,
  onOpenInviteModal,
  onShowToast
}) => {
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'today' | '7days' | 'month' | 'ytd'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'pipeline' | 'services' | 'audit'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [auditModuleFilter, setAuditModuleFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtered tenants based on search or tenant filter
  const filteredTenants = useMemo(() => {
    return SUPER_ADMIN_TENANTS.filter((tenant) => {
      const matchesTenant = selectedTenantFilter === 'all' || tenant.id === selectedTenantFilter;
      const matchesSearch =
        tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.accountLead.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tenant.primaryLocations.some((loc) => loc.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesTenant && matchesSearch;
    });
  }, [selectedTenantFilter, searchQuery]);

  // Aggregate totals
  const totalHeadcount = useMemo(() => {
    return filteredTenants.reduce((acc, t) => acc + t.activeHeadcount, 0);
  }, [filteredTenants]);

  const totalCandidates = useMemo(() => {
    return filteredTenants.reduce((acc, t) => acc + t.activeCandidatesInPipeline, 0);
  }, [filteredTenants]);

  const totalPendingKyc = useMemo(() => {
    return filteredTenants.reduce((acc, t) => acc + t.pendingKycCount, 0);
  }, [filteredTenants]);

  const avgKycCompliance = useMemo(() => {
    if (filteredTenants.length === 0) return 0;
    const sum = filteredTenants.reduce((acc, t) => acc + t.kycCompliancePct, 0);
    return Math.round((sum / filteredTenants.length) * 10) / 10;
  }, [filteredTenants]);

  // Filtered audit events
  const filteredAuditLogs = useMemo(() => {
    return RECENT_AUDIT_LOGS.filter((log) => {
      const matchesModule = auditModuleFilter === 'all' || log.module.toLowerCase() === auditModuleFilter.toLowerCase();
      const matchesSearch =
        log.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.detail.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesModule && matchesSearch;
    });
  }, [auditModuleFilter, searchQuery]);

  // Refresh handler simulation
  const handleRefreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      if (onShowToast) {
        onShowToast('Multi-Tenant telemetry synchronized across 7 enterprise instances.');
      }
    }, 600);
  };

  // CSV Export for Super Admin Executive Report
  const handleExportCsv = () => {
    const headers = [
      'Tenant ID',
      'Tenant Code',
      'Tenant Name',
      'Subscription Tier',
      'Active Headcount',
      'Active Onboarding Pipeline',
      'Pending KYC Reviews',
      'KYC Compliance %',
      'Active Attendance Cycle',
      'Cycle Status',
      'Locations Count',
      'Branches Count',
      'Account Lead',
      'Statutory Status',
      'GSTIN'
    ];

    const rows = SUPER_ADMIN_TENANTS.map((t) => [
      t.id,
      t.code,
      `"${t.name}"`,
      t.tier,
      t.activeHeadcount,
      t.activeCandidatesInPipeline,
      t.pendingKycCount,
      `${t.kycCompliancePct}%`,
      `"${t.activeCycleName}"`,
      t.activeCycleStatus,
      t.locationsCount,
      t.branchesCount,
      `"${t.accountLead}"`,
      t.statutoryHealth,
      t.gstin
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCsv(csvContent, `2COMS_SuperAdmin_Enterprise_Report_${new Date().toISOString().slice(0, 10)}.csv`);

    if (onShowToast) {
      onShowToast('Executive Super Admin report downloaded as CSV.');
    }
  };

  return (
    <div className="flex-1 bg-slate-900 text-slate-100 min-h-screen pb-16">
      {/* Top Banner / Breadcrumb Bar */}
      <div className="border-b border-slate-800 bg-slate-950/80 sticky top-0 z-20 backdrop-blur px-6 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span className="font-semibold text-sky-400">Enterprise Operations</span>
              <span>/</span>
              <span>Super Admin Cockpit</span>
              <span>/</span>
              <span className="text-slate-200">Global Overview</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  Super Admin Overview
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
                    7 Active Tenants
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Real-time multi-tenant telemetry for onboarding pipeline, muster attendance, statutory KYC, and bulk data operations.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-md transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>Export CSV</span>
            </button>

            {onOpenInviteModal && (
              <button
                onClick={onOpenInviteModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md transition-colors shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Candidate</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Tenant Scope:
            </span>
            <SelectMenu
              value={selectedTenantFilter}
              onChange={(e) => setSelectedTenantFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-sky-500 font-medium"
            >
              <option value="all">All Enterprise Tenants (7 Clients)</option>
              {SUPER_ADMIN_TENANTS.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.code})
                </option>
              ))}
            </SelectMenu>

            <span className="text-slate-600 px-1">|</span>

            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Period:
            </span>
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded p-0.5">
              {(['today', '7days', 'month', 'ytd'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTimeRange(mode)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                    timeRange === mode
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode === 'today'
                    ? 'Today'
                    : mode === '7days'
                    ? 'Last 7D'
                    : mode === 'month'
                    ? 'Oct FY26'
                    : 'YTD FY26'}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tenant, branch, code, actor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nav Tabs for Deep-Dive Views */}
      <div className="border-b border-slate-800 bg-slate-950/40 px-6">
        <div className="flex items-center gap-6 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Executive Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('tenants')}
            className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'tenants'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Tenants & Hierarchy ({filteredTenants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'pipeline'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Candidate Funnel & SLA</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'services'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Statutory & Gateways ({MICROSERVICES_HEALTH.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live Audit Stream ({filteredAuditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* Action Required Alert Cards (Super Admin Attention Queue) */}
        {CRITICAL_ALERTS.length > 0 && (
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Super Admin Action Queue ({CRITICAL_ALERTS.length} Items Pending)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Action required to prevent SLA or compliance breach
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {CRITICAL_ALERTS.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-lg p-3 border transition-colors flex flex-col justify-between ${
                    alert.severity === 'critical'
                      ? 'bg-rose-950/30 border-rose-800/60 hover:bg-rose-950/50'
                      : alert.severity === 'warning'
                      ? 'bg-amber-950/30 border-amber-800/60 hover:bg-amber-950/50'
                      : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span
                        className={`font-semibold uppercase px-1.5 py-0.5 rounded text-[10px] ${
                          alert.severity === 'critical'
                            ? 'bg-rose-900/60 text-rose-300'
                            : alert.severity === 'warning'
                            ? 'bg-amber-900/60 text-amber-300'
                            : 'bg-sky-900/60 text-sky-300'
                        }`}
                      >
                        {alert.category}
                      </span>
                      <span className="text-slate-400 text-[10px]">{alert.dueDate}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-100 mb-1 leading-snug">
                      {alert.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                      {alert.description}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 mb-2">
                      Client: <span className="text-slate-200">{alert.tenantName}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => onNavigate(alert.targetView)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-sky-600 border border-slate-700 rounded transition-colors mt-1"
                  >
                    <span>{alert.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top 5 KPI Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* Stat 1: Total Workforce */}
              <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition-colors">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Active Workforce</span>
                    <Users className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {totalHeadcount.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-400">
                      +4.2% MoM
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Across {filteredTenants.length} tenants</span>
                  <button
                    onClick={() => setActiveTab('tenants')}
                    className="text-sky-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>View</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Stat 2: Candidates in Pipeline */}
              <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition-colors">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Active Pipeline</span>
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {totalCandidates}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-400">
                      38 joined
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>89.4% SLA adherence</span>
                  <button
                    onClick={() => onNavigate('directory')}
                    className="text-sky-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Directory</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Stat 3: KYC Pass Rate */}
              <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition-colors">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>KYC Compliance</span>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {avgKycCompliance}%
                    </span>
                    <span className="text-[11px] font-semibold text-amber-400">
                      {totalPendingKyc} review
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>1,280 verified via ₹1</span>
                  <button
                    onClick={() => onNavigate('kyc')}
                    className="text-amber-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>KYC Desk</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Stat 4: Attendance Capture */}
              <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition-colors">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Attendance Muster</span>
                    <CalendarCheck className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      98.7%
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-400">
                      7 Cycles Live
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>0.2% muster variance</span>
                  <button
                    onClick={() => onNavigate('attendance')}
                    className="text-sky-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Muster</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Stat 5: Bulk Ingestion */}
              <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition-colors">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Bulk Operations</span>
                    <UploadCloud className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      24.1k
                    </span>
                    <span className="text-[11px] font-semibold text-purple-400">
                      15 batches
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>99.4% row pass rate</span>
                  <button
                    onClick={() => onNavigate('import')}
                    className="text-purple-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Import Hub</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Middle Section: Tenant Ecosystem Card & Quick Launchpad */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1 & 2: Multi-Tenant Operational Performance */}
              <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/80 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-sky-400" />
                      Enterprise Tenant Performance & Multi-Location Deployment
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Client-by-client breakdown of active headcount, location hierarchy, muster cycles, and compliance.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('tenants')}
                    className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    <span>Full Hierarchy</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-700 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="pb-2.5">Enterprise Client</th>
                        <th className="pb-2.5">Locations</th>
                        <th className="pb-2.5 text-right">Headcount</th>
                        <th className="pb-2.5 text-right">Pipeline</th>
                        <th className="pb-2.5">KYC Health</th>
                        <th className="pb-2.5">Active Muster</th>
                        <th className="pb-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                      {filteredTenants.slice(0, 5).map((t) => (
                        <tr key={t.id} className="hover:bg-slate-750/50 transition-colors">
                          <td className="py-3">
                            <div className="font-semibold text-slate-100">{t.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                              <span>{t.code}</span>
                              <span>·</span>
                              <span className="text-sky-400">{t.tier}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="font-semibold text-slate-200">
                              {t.locationsCount} Locs
                            </span>
                            <span className="text-slate-400 text-[11px]"> ({t.branchesCount} Br)</span>
                            <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                              {t.primaryLocations.slice(0, 2).join(', ')}
                            </div>
                          </td>
                          <td className="py-3 text-right font-mono font-semibold text-slate-200">
                            {t.activeHeadcount.toLocaleString()}
                          </td>
                          <td className="py-3 text-right">
                            <span className="font-mono font-semibold text-emerald-400">
                              {t.activeCandidatesInPipeline}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${t.kycCompliancePct}%` }}
                                />
                              </div>
                              <span className="font-mono text-[11px] text-slate-300 font-medium">
                                {t.kycCompliancePct}%
                              </span>
                            </div>
                            {t.pendingKycCount > 0 ? (
                              <span className="text-[10px] text-amber-400">
                                {t.pendingKycCount} pending review
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-400">All cleared</span>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="text-[11px] font-medium text-slate-300 truncate max-w-[140px]">
                              {t.activeCycleName}
                            </div>
                            <span className="text-[10px] text-sky-400 bg-sky-950/60 px-1 py-0.2 rounded font-medium">
                              {t.activeCycleStatus}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onNavigate('directory')}
                                title="Inspect Candidate Pipeline"
                                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                              >
                                <Users className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onNavigate('attendance')}
                                title="Open Attendance Muster"
                                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                              >
                                <CalendarCheck className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onNavigate('import')}
                                title="Bulk Excel Import for Client"
                                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                              >
                                <UploadCloud className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Column 3: Quick Launchpad & Statutory Gateway Pulse */}
              <div className="space-y-6">
                {/* Microservice & Gateway Health Widget */}
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      Statutory & Gateway Pulse
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Live connection status for instant statutory KYC and biometric streams.
                  </p>

                  <div className="space-y-2.5">
                    {MICROSERVICES_HEALTH.slice(0, 4).map((srv) => (
                      <div
                        key={srv.id}
                        className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-xs font-semibold text-slate-200">
                              {srv.name}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">{srv.provider}</span>
                        </div>
                        <div className="text-right font-mono text-[11px]">
                          <span className="text-emerald-400 font-semibold">{srv.latencyMs}ms</span>
                          <div className="text-[10px] text-slate-500">{srv.successRate}% SLA</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveTab('services')}
                    className="w-full mt-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors text-center"
                  >
                    View All Integrations ({MICROSERVICES_HEALTH.length})
                  </button>
                </div>

                {/* Direct Cross-Module Jump Cards */}
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                    Multi-Module Quick Launchpad
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onNavigate('directory')}
                      className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-750 border border-slate-800 text-left transition-colors group"
                    >
                      <Users className="w-4 h-4 text-sky-400 mb-1" />
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                        Candidate Directory
                      </div>
                      <div className="text-[10px] text-slate-400">142 candidates</div>
                    </button>

                    <button
                      onClick={() => onNavigate('import')}
                      className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-750 border border-slate-800 text-left transition-colors group"
                    >
                      <UploadCloud className="w-4 h-4 text-purple-400 mb-1" />
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                        Bulk Excel Hub
                      </div>
                      <div className="text-[10px] text-slate-400">15 import types</div>
                    </button>

                    <button
                      onClick={() => onNavigate('kyc')}
                      className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-750 border border-slate-800 text-left transition-colors group"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400 mb-1" />
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                        KYC & ₹1 Desk
                      </div>
                      <div className="text-[10px] text-slate-400">Penny-drop logs</div>
                    </button>

                    <button
                      onClick={() => onNavigate('attendance')}
                      className="p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-750 border border-slate-800 text-left transition-colors group"
                    >
                      <CalendarCheck className="w-4 h-4 text-emerald-400 mb-1" />
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                        Attendance Muster
                      </div>
                      <div className="text-[10px] text-slate-400">7 live cycles</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Live Audit Stream Preview */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-400" />
                    Live Multi-Tenant Operational Audit Stream
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time chronological events from candidate sign-ups, KYC verifications, biometric punch ingestion, and bulk imports.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('audit')}
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                >
                  <span>View Full Log</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {RECENT_AUDIT_LOGS.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.module === 'Bulk Import'
                              ? 'bg-purple-950/70 text-purple-300 border border-purple-800/60'
                              : log.module === 'KYC Desk'
                              ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                              : log.module === 'Attendance'
                              ? 'bg-sky-950/70 text-sky-300 border border-sky-800/60'
                              : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                          }`}
                        >
                          {log.module}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">
                          {log.action}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {log.detail}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right self-end md:self-auto shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-medium text-slate-300">
                          {log.tenantName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          by {log.actor} · {log.timestamp}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TENANTS & HIERARCHY DEEP DIVE */}
        {activeTab === 'tenants' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/60 border border-slate-700/80 rounded-xl p-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Multi-Client Tenant Architecture ({filteredTenants.length} Instances)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Full multi-location & multi-branch breakdown for each client tenant on 2COMS Connect.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export Tenant Roster</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTenants.map((t) => (
                <div
                  key={t.id}
                  className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-5 hover:border-slate-600 transition-colors flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white leading-tight">
                            {t.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[11px] text-slate-400">{t.code}</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-[10px] font-semibold text-sky-400 bg-sky-950/60 px-1.5 py-0.2 rounded">
                            {t.tier}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          t.statutoryHealth === 'Compliant'
                            ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/80'
                            : 'bg-amber-950/70 text-amber-300 border border-amber-800/80'
                        }`}
                      >
                        {t.statutoryHealth}
                      </span>
                    </div>

                    {/* Key Stats Matrix */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900/60 rounded-lg border border-slate-800 mb-3.5 text-center">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">
                          Headcount
                        </div>
                        <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">
                          {t.activeHeadcount.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">
                          Pipeline
                        </div>
                        <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                          {t.activeCandidatesInPipeline}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">
                          KYC Rate
                        </div>
                        <div className="text-sm font-bold text-sky-400 font-mono mt-0.5">
                          {t.kycCompliancePct}%
                        </div>
                      </div>
                    </div>

                    {/* Hierarchy details */}
                    <div className="space-y-1.5 text-xs text-slate-300 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Locations & Branches:</span>
                        <span className="font-semibold text-slate-200">
                          {t.locationsCount} Locations ({t.branchesCount} Branches)
                        </span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-slate-400">Primary Hubs:</span>
                        <span className="text-right text-slate-300 text-[11px] max-w-[180px] truncate">
                          {t.primaryLocations.join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Muster Cycle:</span>
                        <span className="text-sky-400 text-[11px] font-medium truncate max-w-[170px]">
                          {t.activeCycleName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Account Lead:</span>
                        <span className="text-slate-200 font-medium">{t.accountLead}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">GSTIN:</span>
                        <span className="font-mono text-[10px] text-slate-400">{t.gstin}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onNavigate('directory')}
                      className="flex-1 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors text-center border border-slate-700"
                    >
                      Candidates
                    </button>
                    <button
                      onClick={() => onNavigate('attendance')}
                      className="flex-1 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors text-center border border-slate-700"
                    >
                      Muster
                    </button>
                    <button
                      onClick={() => onNavigate('import')}
                      className="flex-1 py-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 bg-sky-950/40 hover:bg-sky-950/70 border border-sky-800/60 rounded transition-colors text-center"
                    >
                      Bulk Import
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CANDIDATE PIPELINE FUNNEL & SLA */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Cross-Tenant Candidate Onboarding Funnel (142 Active in Pipeline)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Conversion rates, step drop-offs, and SLA turn-around time across each onboarding milestone.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('directory')}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded transition-colors flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Inspect Candidate Directory</span>
                </button>
              </div>

              {/* Visual Funnel Step List */}
              <div className="space-y-3">
                {FUNNEL_STAGES.map((stage) => (
                  <div
                    key={stage.step}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-sky-950 border border-sky-700 text-sky-400 font-bold text-xs flex items-center justify-center font-mono">
                          {stage.step}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{stage.name}</span>
                            <span className="text-[10px] font-semibold text-slate-400 font-mono">
                              ({stage.slaDays})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Conversion to next step: <span className="text-emerald-400 font-semibold">{stage.conversionRate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-sm font-bold text-white font-mono">
                            {stage.count}
                          </span>
                          <span className="text-xs text-slate-400 ml-1">candidates</span>
                        </div>
                        <span className="font-mono text-xs text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded font-semibold min-w-[50px] text-center">
                          {stage.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${stage.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SERVICES & STATUTORY COMPLIANCE */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    Statutory Verification & Edge Gateway Infrastructure
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time operational status, latency metrics, and API uptime for all integrated statutory and banking rail microservices.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/70 border border-emerald-800/80 text-[11px] font-semibold text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    All Microservices Live
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {MICROSERVICES_HEALTH.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          {srv.category}
                        </span>
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                          {srv.status}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white mb-0.5">{srv.name}</h4>
                      <p className="text-[11px] text-slate-400 mb-3">{srv.provider}</p>

                      <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-950/50 rounded-lg border border-slate-800/60 text-center font-mono mb-2">
                        <div>
                          <div className="text-[9px] text-slate-400 uppercase">Latency</div>
                          <div className="text-xs font-bold text-emerald-400 mt-0.5">
                            {srv.latencyMs}ms
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-400 uppercase">SLA Success</div>
                          <div className="text-xs font-bold text-slate-200 mt-0.5">
                            {srv.successRate}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-400 uppercase">Volume 24h</div>
                          <div className="text-xs font-bold text-sky-400 mt-0.5">
                            {srv.requestsToday.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Telemetry check: {srv.lastChecked}</span>
                      <span className="text-sky-400 font-medium">99.9% Uptime</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: LIVE AUDIT STREAM */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/60 border border-slate-700/80 rounded-xl p-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Multi-Tenant Audit Trail & Security Logs
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Immutable security audit events captured across all 7 live tenant instances.
                </p>
              </div>

              {/* Module Filter buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['all', 'onboarding', 'kyc desk', 'attendance', 'bulk import', 'holidays'] as const).map(
                  (mod) => (
                    <button
                      key={mod}
                      onClick={() => setAuditModuleFilter(mod)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors uppercase ${
                        auditModuleFilter === mod
                          ? 'bg-sky-600 text-white font-semibold'
                          : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mod}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-700 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Tenant</th>
                      <th className="py-3 px-4">Module</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Action & Event Detail</th>
                      <th className="py-3 px-4 text-right">IP Origin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-750/50 transition-colors">
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-200 whitespace-nowrap">
                          {log.tenantName}
                          <div className="font-mono text-[10px] text-slate-400">{log.tenantCode}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.module === 'Bulk Import'
                                ? 'bg-purple-950/70 text-purple-300 border border-purple-800/60'
                                : log.module === 'KYC Desk'
                                ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                                : log.module === 'Attendance'
                                ? 'bg-sky-950/70 text-sky-300 border border-sky-800/60'
                                : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                            }`}
                          >
                            {log.module}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-slate-200 font-semibold">{log.actor}</div>
                          <div className="text-[10px] text-slate-400">{log.actorRole}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-100">{log.action}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{log.detail}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {log.ipAddress}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
