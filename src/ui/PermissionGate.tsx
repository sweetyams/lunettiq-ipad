import React from 'react';
import { usePermissions } from '@/src/features/auth/usePermissions';

interface PermissionGateProps {
  /** Single permission to check */
  permission?: string;
  /** Multiple permissions to check */
  permissions?: string[];
  /** If true, ALL permissions must be present. If false (default), ANY suffices */
  requireAll?: boolean;
  /** Rendered when permission check fails. Defaults to null (hidden) */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditionally renders children based on the user's Clerk org permissions.
 *
 * Usage:
 * ```tsx
 * <PermissionGate permission="org:rx:verify">
 *   <RxApprovalQueue />
 * </PermissionGate>
 *
 * <PermissionGate permissions={["org:loyalty:read", "org:loyalty:write"]} requireAll>
 *   <LoyaltyManager />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps): React.ReactElement | null {
  const { has, hasAny, hasAll } = usePermissions();

  let allowed = true;

  if (permission) {
    allowed = has(permission);
  } else if (permissions && permissions.length > 0) {
    allowed = requireAll ? hasAll(...permissions) : hasAny(...permissions);
  }

  if (!allowed) return fallback as React.ReactElement | null;
  return <>{children}</>;
}
