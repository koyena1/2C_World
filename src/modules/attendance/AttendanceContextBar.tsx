import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  GitBranch
} from 'lucide-react';
import { 
  CLIENT_HIERARCHIES, 
  ClientLocation, 
  ClientBranch 
} from '../../data/mockAttendanceData';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface AttendanceContextBarProps {
  selectedClientId?: string;
  selectedLocationId?: string;
  selectedBranchId?: string;
  onContextChange?: (clientId: string, locationId: string, branchId: string) => void;
  // Backward compatibility props
  clientName?: string;
  location?: string;
  branch?: string;
  state?: string;
  city?: string;
  status?: string;
}

export const AttendanceContextBar: React.FC<AttendanceContextBarProps> = ({
  selectedClientId: propClientId,
  selectedLocationId: propLocationId,
  selectedBranchId: propBranchId,
  onContextChange,
  clientName = '2COMS Services',
  location: propLocationName,
  branch: propBranchName,
  state: propState,
  city: propCity,
  status: propStatus = 'Active',
}) => {
  // Find initial client
  const initialClient = CLIENT_HIERARCHIES.find(c => c.name === clientName || c.id === propClientId) || CLIENT_HIERARCHIES[0];
  const [currentClientId, setCurrentClientId] = useState<string>(propClientId || initialClient.id);

  // Active client object
  const activeClient = useMemo(() => {
    return CLIENT_HIERARCHIES.find(c => c.id === currentClientId) || CLIENT_HIERARCHIES[0];
  }, [currentClientId]);

  // Available locations (City / Work Zone) for active client
  const availableLocations = useMemo(() => {
    return activeClient ? activeClient.locations : [];
  }, [activeClient]);

  // Current City / Work Zone location (default to Kolkata loc-kol if present or first)
  const defaultLocId = availableLocations.find(l => l.name === 'Kolkata')?.id || availableLocations[0]?.id || 'loc-kol';
  const [currentLocationId, setCurrentLocationId] = useState<string>(
    propLocationId || defaultLocId
  );

  // Active location object
  const activeLocation = useMemo(() => {
    return availableLocations.find(l => l.id === currentLocationId) || availableLocations[0];
  }, [availableLocations, currentLocationId]);

  const isKolkataZone = activeLocation?.city?.toLowerCase() === 'kolkata' || activeLocation?.name?.toLowerCase() === 'kolkata';

  // Available branches / office locations for active location
  const availableBranches = useMemo(() => {
    return activeLocation ? activeLocation.branches : [];
  }, [activeLocation]);

  // Current Office Location
  const [currentBranchId, setCurrentBranchId] = useState<string>(
    propBranchId || (isKolkataZone ? 'all' : (availableBranches[0]?.id || ''))
  );

  // Sync when props change
  useEffect(() => {
    if (propClientId && propClientId !== currentClientId) {
      setCurrentClientId(propClientId);
    }
  }, [propClientId]);

  useEffect(() => {
    if (propLocationId && propLocationId !== currentLocationId) {
      setCurrentLocationId(propLocationId);
    }
  }, [propLocationId]);

  useEffect(() => {
    if (propBranchId && propBranchId !== currentBranchId) {
      setCurrentBranchId(propBranchId);
    }
  }, [propBranchId]);

  const activeBranch = useMemo(() => {
    if (isKolkataZone && (currentBranchId === 'all' || !currentBranchId)) {
      return { id: 'all', name: 'All Kolkata Offices (RDB, Big Bagan, Alipore)', staffCount: 106 };
    }
    return availableBranches.find(b => b.id === currentBranchId) || availableBranches[0];
  }, [availableBranches, currentBranchId, isKolkataZone]);

  // Handle Client Change -> resets Location and Branch
  const handleClientChange = (newClientId: string) => {
    setCurrentClientId(newClientId);
    const newClient = CLIENT_HIERARCHIES.find(c => c.id === newClientId);
    const kolLoc = newClient?.locations.find(l => l.city.toLowerCase() === 'kolkata');
    const firstLoc = kolLoc || newClient?.locations[0];
    const isNewKol = firstLoc?.city.toLowerCase() === 'kolkata';
    const nextLocId = firstLoc ? firstLoc.id : '';
    const nextBranchId = isNewKol ? 'all' : (firstLoc?.branches[0]?.id || '');

    setCurrentLocationId(nextLocId);
    setCurrentBranchId(nextBranchId);

    if (onContextChange) {
      onContextChange(newClientId, nextLocId, nextBranchId);
    }
  };

  // Handle City / Work Zone Change -> resets Office Location
  const handleLocationChange = (newLocId: string) => {
    setCurrentLocationId(newLocId);
    const loc = availableLocations.find(l => l.id === newLocId);
    const isNowKol = loc?.city.toLowerCase() === 'kolkata' || loc?.name.toLowerCase() === 'kolkata';
    const nextBranchId = isNowKol ? 'all' : (loc?.branches[0]?.id || '');

    setCurrentBranchId(nextBranchId);

    if (onContextChange) {
      onContextChange(currentClientId, newLocId, nextBranchId);
    }
  };

  // Handle Office Location Change
  const handleBranchChange = (newBranchId: string) => {
    setCurrentBranchId(newBranchId);
    if (onContextChange) {
      onContextChange(currentClientId, currentLocationId, newBranchId);
    }
  };

  return (
    <div className="cc-card p-3 sm:p-4">
      {/* The ONE place for Client -> City / Work Zone -> Office Location */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="min-w-0">
          <label htmlFor="att-client" className="cc-label flex items-center gap-1.5">
            <Building2 className="cc-accent w-3.5 h-3.5" />
            <span>Client</span>
          </label>
          <SelectMenu
            id="att-client"
            value={currentClientId}
            onChange={(e) => handleClientChange(e.target.value)}
            className="cc-input"
          >
            {CLIENT_HIERARCHIES.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </SelectMenu>
        </div>

        <div className="min-w-0">
          <label htmlFor="att-zone" className="cc-label flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[color:var(--cc-good)]" />
            <span>City / Work Zone</span>
          </label>
          <SelectMenu
            id="att-zone"
            value={currentLocationId}
            disabled={!currentClientId || availableLocations.length === 0}
            onChange={(e) => handleLocationChange(e.target.value)}
            className="cc-input"
          >
            {availableLocations.map(l => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.state})
              </option>
            ))}
          </SelectMenu>
        </div>

        {/* Cascading: Kolkata has RDB, Big Bagan, Alipore; HYD/BLR are city-level */}
        <div className="min-w-0">
          <label htmlFor="att-office" className="cc-label flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-[color:var(--cc-violet)]" />
            <span>Office Location</span>
          </label>
          <SelectMenu
            id="att-office"
            value={currentBranchId}
            disabled={!currentLocationId}
            onChange={(e) => handleBranchChange(e.target.value)}
            className="cc-input"
          >
            {isKolkataZone ? (
              <>
                <option value="all">All Kolkata Offices</option>
                <option value="br-kol-rdb">RDB</option>
                <option value="br-kol-bbg">Big Bagan</option>
                <option value="br-kol-alp">Alipore</option>
              </>
            ) : (
              availableBranches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))
            )}
          </SelectMenu>
        </div>
      </div>
    </div>
  );
};
