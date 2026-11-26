import React, { useState } from 'react';
import { 
  MapPin, 
  Plus, 
  Search, 
  Wifi, 
  Shield, 
  Users, 
  Edit3, 
  Trash2, 
  X, 
  Compass, 
  CheckCircle2, 
  AlertTriangle,
  Navigation,
  Building2,
  Info,
  ShieldCheck
} from 'lucide-react';
import { 
  GeoFenceLocation, 
  INITIAL_GEO_FENCES, 
  KOLKATA_PERMITTED_OFFICES 
} from '../../data/mockAttendanceData';
import { useTheme } from '../../hooks/useTheme';
import { useKpiDetail } from '../../hooks/useKpiDetail';
import { KpiDetailPanel, type KpiDetailData } from '../../components/page/KpiDetailPanel';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface GeoFenceSubmoduleProps {
  onShowToast: (msg: string) => void;
}

export const GeoFenceSubmodule: React.FC<GeoFenceSubmoduleProps> = ({ onShowToast }) => {
  const { isDark } = useTheme();
  const [locations, setLocations] = useState<GeoFenceLocation[]>(INITIAL_GEO_FENCES);
  const [selectedLocation, setSelectedLocation] = useState<GeoFenceLocation>(INITIAL_GEO_FENCES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const { activeId, toggle, close, isActive } = useKpiDetail<'sites' | 'users' | 'strict' | 'wifi'>();

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<GeoFenceLocation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.4485,
    longitude: 78.3756,
    radiusMeters: 150,
    enforcementMode: 'Strict (Block Outside)' as GeoFenceLocation['enforcementMode'],
    allowedWifiSSID: '2COMS-Corp-5G',
    allowedIPSubnet: '10.24.100.0/24',
    status: 'Active' as 'Active' | 'Inactive',
  });

  // Test Punch Simulation state
  const [testResult, setTestResult] = useState<string | null>(null);

  const filteredLocations = locations.filter(loc => 
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    loc.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      address: '',
      city: 'Hyderabad',
      state: 'Telangana',
      latitude: 17.4485,
      longitude: 78.3756,
      radiusMeters: 150,
      enforcementMode: 'Strict (Block Outside)',
      allowedWifiSSID: '2COMS-Corp-5G',
      allowedIPSubnet: '10.24.100.0/24',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loc: GeoFenceLocation) => {
    setEditingLocation(loc);
    setFormData({
      name: loc.name,
      address: loc.address,
      city: loc.city,
      state: loc.state,
      latitude: loc.latitude,
      longitude: loc.longitude,
      radiusMeters: loc.radiusMeters,
      enforcementMode: loc.enforcementMode,
      allowedWifiSSID: loc.allowedWifiSSID,
      allowedIPSubnet: loc.allowedIPSubnet,
      status: loc.status,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      alert('Location name and address are required.');
      return;
    }

    if (editingLocation) {
      setLocations(locations.map(l => l.id === editingLocation.id ? {
        ...l,
        ...formData,
      } : l));
      onShowToast(`Geofence location "${formData.name}" updated.`);
    } else {
      const newLoc: GeoFenceLocation = {
        id: `geo-${Date.now()}`,
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        radiusMeters: Number(formData.radiusMeters),
        enforcementMode: formData.enforcementMode,
        allowedWifiSSID: formData.allowedWifiSSID,
        allowedIPSubnet: formData.allowedIPSubnet,
        enrolledStaff: 0,
        status: formData.status,
        lastActivity: 'Configured just now',
      };
      setLocations([...locations, newLoc]);
      onShowToast(`Geofence location "${formData.name}" created.`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete geofence perimeter for "${name}"?`)) {
      setLocations(locations.filter(l => l.id !== id));
      onShowToast(`Location "${name}" removed.`);
    }
  };

  const runTestPunch = () => {
    setTestResult('Testing GPS coordinates against geofence perimeter...');
    setTimeout(() => {
      setTestResult(`Success! Device coordinates (17.4487, 78.3758) are WITHIN the ${selectedLocation.radiusMeters}m perimeter of ${selectedLocation.name}. Punch validated.`);
    }, 1200);
  };

  const kpiDetail: KpiDetailData | null = (() => {
    if (!activeId) return null;
    const siteCols = [
      { key: 'name', label: 'Site' },
      { key: 'city', label: 'City' },
      { key: 'radius', label: 'Radius', align: 'right' as const },
      { key: 'mode', label: 'Enforcement' },
      { key: 'wifi', label: 'Wi-Fi SSID' },
      { key: 'staff', label: 'Enrolled staff', align: 'right' as const },
      { key: 'status', label: 'Status' },
    ];
    const siteRows = (list: GeoFenceLocation[]) => list.map(l => ({
      name: l.name, city: `${l.city}, ${l.state}`, radius: `${l.radiusMeters} m`, mode: l.enforcementMode,
      wifi: l.allowedWifiSSID, staff: l.enrolledStaff, status: l.status,
    }));
    if (activeId === 'sites') return { title: 'Total Defined Sites', columns: siteCols, rows: siteRows(locations) };
    if (activeId === 'users') return { title: 'Enrolled Mobile Users', subtitle: 'Enrolment by geofence site', columns: siteCols, rows: siteRows(locations) };
    if (activeId === 'strict') return { title: 'Strict Enforcement', subtitle: 'Sites that block punches outside the radius', columns: siteCols, rows: siteRows(locations.filter(l => l.enforcementMode.startsWith('Strict'))), emptyText: 'No site uses strict enforcement.' };
    const ssids = Array.from(new Set(locations.map(l => l.allowedWifiSSID)));
    return {
      title: 'Wi-Fi Beacons', subtitle: `${ssids.length} SSID${ssids.length === 1 ? '' : 's'} configured`,
      columns: [{ key: 'ssid', label: 'Wi-Fi SSID' }, { key: 'sites', label: 'Sites using it' }, { key: 'count', label: 'Site count', align: 'right' as const }],
      rows: ssids.map(ss => { const ls = locations.filter(l => l.allowedWifiSSID === ss); return { ssid: ss, sites: ls.map(l => l.name).join(', '), count: ls.length }; }),
    };
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Geo Fence & Mobile Boundaries</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure biometric GPS punch radiuses, authorized corporate Wi-Fi SSIDs, and location enforcement policies.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Geofence Location</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button type="button" onClick={() => toggle('sites')} className={`cc-card-hover bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs cc-card-link cursor-pointer text-left ${isActive('sites') ? 'cc-card-selected' : ''}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Defined Sites</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white block font-mono mt-0.5">{locations.length}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Across 3 metropolitan hubs</span>
        </button>
        <button type="button" onClick={() => toggle('users')} className={`cc-card-hover bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs cc-card-link cursor-pointer text-left ${isActive('users') ? 'cc-card-selected' : ''}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Enrolled Mobile Users</span>
          <span className="text-2xl font-bold text-sky-700 dark:text-sky-300 block font-mono mt-0.5">218</span>
          <span className="text-[11px] text-sky-600 font-medium">GPS Geofence App enabled</span>
        </button>
        <button type="button" onClick={() => toggle('strict')} className={`cc-card-hover bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs cc-card-link cursor-pointer text-left ${isActive('strict') ? 'cc-card-selected' : ''}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Strict Enforcement</span>
          <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 block font-mono mt-0.5">Active</span>
          <span className="text-[11px] text-emerald-600 font-medium">Blocks punches outside radius</span>
        </button>
        <button type="button" onClick={() => toggle('wifi')} className={`cc-card-hover bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs cc-card-link cursor-pointer text-left ${isActive('wifi') ? 'cc-card-selected' : ''}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Wi-Fi Beacons</span>
          <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 block font-mono mt-0.5">3 SSIDs</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Secondary verification layer</span>
        </button>
      </div>
      <KpiDetailPanel detail={kpiDetail} onClose={close} />

      {/* ========================================================================= */}
      {/* KOLKATA PERMITTED WORK LOCATIONS SECTION (MANDATED REQUIREMENT)           */}
      {/* ========================================================================= */}
      <div className={`rounded-xl border shadow-2xs overflow-hidden transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className={`px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isDark ? 'bg-slate-850/80 border-slate-800' : 'bg-slate-50/80 border-slate-100'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-500" />
              <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Kolkata Permitted Offices
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                Work Zone: Kolkata
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Multi-office attendance policy configuration for Kolkata employees
            </p>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            3 Active Offices Authorized
          </span>
        </div>

        {/* Clear Helper Text Banner (Mandated Requirement) */}
        <div className={`px-5 py-3 border-b text-xs flex items-center gap-2.5 ${
          isDark ? 'bg-sky-950/40 border-slate-800 text-sky-200' : 'bg-sky-50 border-sky-100 text-sky-800'
        }`}>
          <Info className="w-4 h-4 text-sky-500 shrink-0" />
          <div className="flex-1">
            <strong>Attendance Acceptance Policy:</strong> Employees mapped to Kolkata may mark attendance from any permitted Kolkata office: <strong>RDB</strong>, <strong>Big Bagan</strong>, or <strong>Alipore</strong>. Attendance is accepted seamlessly across all three work locations.
          </div>
        </div>

        {/* Table of Kolkata Permitted Offices */}
        <div className="overflow-x-auto">
          <table className={`cc-table-stack w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <thead className={`text-[11px] uppercase tracking-wider font-semibold border-b ${
              isDark ? 'bg-slate-800/90 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}>
              <tr>
                <th className="px-5 py-3">Office Name</th>
                <th className="px-4 py-3">City / Work Zone</th>
                <th className="px-4 py-3">Pincode / Address Placeholder</th>
                <th className="px-4 py-3">Geo-fence Status</th>
                <th className="px-4 py-3">Attendance Allowed</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {KOLKATA_PERMITTED_OFFICES.map((office) => (
                <tr key={office.id} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/70'}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{office.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-sky-600 dark:text-sky-400">{office.city} / {office.workZone}</span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500 dark:text-slate-400 max-w-xs truncate" title={office.pincodeAddressPlaceholder}>
                    {office.pincodeAddressPlaceholder}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      {office.geoFenceStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      {office.attendanceAllowed}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onShowToast(`Simulating GPS test punch at Kolkata ${office.name} office.`)}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 border border-sky-200 dark:border-sky-800 transition-colors"
                      >
                        Test Punch
                      </button>
                      <button
                        type="button"
                        onClick={() => onShowToast(`Geo-fence radius for ${office.name} set to ${office.geofenceRadiusMeters}m.`)}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 border border-slate-200 dark:border-slate-800 transition-colors"
                      >
                        Configure
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Split Layout: Locations List (Left 2 cols) & Map Simulation (Right col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Geofence Boundaries ({filteredLocations.length})
            </h2>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search locations..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="space-y-3">
            {filteredLocations.map((loc) => {
              const isSelected = selectedLocation.id === loc.id;
              return (
                <div
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc)}
                  className={`bg-white rounded-xl border p-5 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-sky-500 ring-2 ring-sky-100 shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{loc.name}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          loc.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {loc.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{loc.address}, {loc.city}, {loc.state}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(loc);
                        }}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded"
                        title="Edit Location"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(loc.id, loc.name);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete Location"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Badges Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Radius</span>
                      <strong className="font-mono text-sky-800 dark:text-sky-300">{loc.radiusMeters} Meters</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">GPS Coordinates</span>
                      <strong className="font-mono text-slate-700 dark:text-slate-200 text-[11px]">{loc.latitude}° N, {loc.longitude}° E</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Enforcement</span>
                      <strong className="text-slate-800 dark:text-slate-100 text-[11px]">{loc.enforcementMode}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Enrolled Staff</span>
                      <strong className="font-mono text-slate-900 dark:text-white">{loc.enrolledStaff} Staff</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Visual Simulation & Testing Sandbox */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-sky-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Interactive Radius Simulation
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Inspecting Target Site</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedLocation.name}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{selectedLocation.city} Campus · {selectedLocation.radiusMeters}m Geofence</p>
            </div>

            {/* Visual Simulated Radar Canvas */}
            <div className="relative h-56 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
              {/* Concentric radial grid */}
              <div className="absolute w-44 h-44 rounded-full border border-sky-500/30 animate-ping opacity-25" />
              <div className="absolute w-36 h-36 rounded-full border border-sky-400/40 bg-sky-950/30" />
              <div className="absolute w-24 h-24 rounded-full border border-sky-400/60 bg-sky-900/40 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-sky-400 animate-pulse shadow-lg shadow-sky-400/50" />
              </div>

              {/* Simulated staff punch pins */}
              <div className="absolute top-10 left-16 flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-mono">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>Priya (Punch In OK)</span>
              </div>
              <div className="absolute bottom-8 right-12 flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-mono">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>Rahul (Within 45m)</span>
              </div>

              <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 font-mono">
                Lat: {selectedLocation.latitude}° | Lng: {selectedLocation.longitude}°
              </div>
            </div>

            {/* Wi-Fi & Secondary Verification Info */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-200">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Wifi className="w-3.5 h-3.5 text-sky-600" />
                  <span>Wi-Fi SSID Whitelist:</span>
                </span>
                <strong className="font-mono">{selectedLocation.allowedWifiSSID}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-200">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-sky-600" />
                  <span>Subnet Whitelist:</span>
                </span>
                <strong className="font-mono">{selectedLocation.allowedIPSubnet}</strong>
              </div>
            </div>

            {/* Test Simulation Button */}
            <button
              type="button"
              onClick={runTestPunch}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5 text-sky-400" />
              <span>Simulate Employee Test Punch</span>
            </button>

            {testResult && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-900 dark:text-emerald-200 text-xs leading-relaxed animate-in fade-in">
                {testResult}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: ADD / EDIT GEOFENCE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingLocation ? 'Edit Geofence Boundary' : 'Create New Geofence Perimeter'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-900 dark:text-white mb-1">
                  Location / Facility Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Hyderabad Home Branch / Tech Campus"
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-white mb-1">
                  Street Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Plot 42, Hitec City Phase 2, Madhapur"
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white mb-1">Radius (Meters)</label>
                  <input
                    type="number"
                    value={formData.radiusMeters}
                    onChange={(e) => setFormData({ ...formData, radiusMeters: Number(e.target.value) })}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white mb-1">Enforcement Mode</label>
                  <SelectMenu
                    value={formData.enforcementMode}
                    onChange={(e) => setFormData({ ...formData, enforcementMode: e.target.value as any })}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-xs"
                  >
                    <option value="Strict (Block Outside)">Strict (Block Outside)</option>
                    <option value="Warning (Allow with Flag)">Warning (Allow with Flag)</option>
                    <option value="Audit Log Only">Audit Log Only</option>
                  </SelectMenu>
                </div>
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-white mb-1">Wi-Fi SSID Beacon</label>
                  <input
                    type="text"
                    value={formData.allowedWifiSSID}
                    onChange={(e) => setFormData({ ...formData, allowedWifiSSID: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs"
                >
                  {editingLocation ? 'Save Changes' : 'Save Geofence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
