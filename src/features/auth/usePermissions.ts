import { useAuth } from '@clerk/clerk-expo';

type Permission = string; // e.g., 'org:clients:read'

/**
 * All known permissions in the system.
 * When org_permissions is empty/absent (dev mode, platform admin),
 * all permissions are granted by default.
 */
const ALL_PERMISSIONS: Permission[] = [
  'org:clients:read', 'org:clients:write',
  'org:products:read',
  'org:inventory:read', 'org:inventory:hold',
  'org:scheduling:write',
  'org:interactions:create',
  'org:prescriptions:read', 'org:prescriptions:write',
  'org:rx-pipeline:read', 'org:rx-pipeline:write',
  'org:rx:write', 'org:rx:verify', 'org:rx:sign_off',
  'org:multi_pair:read', 'org:multi_pair:recommend', 'org:multi_pair:manage',
  'org:receipts:read', 'org:receipts:write',
  'org:loyalty:read', 'org:loyalty:write',
  'org:second-sight:read', 'org:second-sight:write',
  'org:custom-designs:read', 'org:custom-designs:write',
  'org:media:write',
];

export function usePermissions() {
  const { sessionClaims } = useAuth();
  
  // Clerk stores org permissions in the JWT
  const claimedPermissions = sessionClaims?.org_permissions as string[] | undefined;
  
  // If no permissions in token (dev mode, platform admin, or Clerk not configured),
  // grant all permissions. This ensures the app is fully usable during development
  // and for admin users whose roles aren't granularly configured.
  const permissions: Permission[] = 
    (claimedPermissions && claimedPermissions.length > 0)
      ? claimedPermissions
      : ALL_PERMISSIONS;

  const has = (permission: Permission): boolean => 
    permissions.includes(permission);

  const hasAny = (...perms: Permission[]): boolean => 
    perms.some(p => permissions.includes(p));

  const hasAll = (...perms: Permission[]): boolean => 
    perms.every(p => permissions.includes(p));

  return { permissions, has, hasAny, hasAll };
}
