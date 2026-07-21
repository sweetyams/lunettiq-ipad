import { useAuth } from '@clerk/clerk-expo';

type Permission = string; // e.g., 'org:clients:read'

export function usePermissions() {
  const { sessionClaims } = useAuth();
  
  // Clerk stores org permissions in the JWT
  const permissions: Permission[] = 
    (sessionClaims?.org_permissions as string[]) ?? [];

  const has = (permission: Permission): boolean => 
    permissions.includes(permission);

  const hasAny = (...perms: Permission[]): boolean => 
    perms.some(p => permissions.includes(p));

  const hasAll = (...perms: Permission[]): boolean => 
    perms.every(p => permissions.includes(p));

  return { permissions, has, hasAny, hasAll };
}