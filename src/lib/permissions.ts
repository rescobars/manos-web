export type UserRole = 'ADMIN' | 'OWNER' | 'MANAGER' | 'MEMBER' | 'PLATFORM_ADMIN' | 'SUPER_ADMIN' | 'PLATFORM_MANAGER';

export interface UserPermissions {
  canInviteToAnyOrganization: boolean;
  canInviteToOwnOrganization: boolean;
  canCreateOrganizations: boolean;
  canManageMembers: boolean;
  canViewAllOrganizations: boolean;
  canManageOwnOrganization: boolean;
}

export interface OrganizationMember {
  id: number;
  organization_id: number;
  user_id: number;
  roles: string[];
  is_owner?: boolean;
}

export interface Organization {
  id: number;
  name: string;
  owner_id?: number;
  roles: string[];
}

export function getUserPermissions(
  userRoles: string[],
  userOrganizations: Organization[],
  currentUserId: number
): UserPermissions {
  // Check for admin roles (including platform admins)
  const isAdmin = userRoles.includes('ADMIN') || 
                  userRoles.includes('PLATFORM_ADMIN') || 
                  userRoles.includes('SUPER_ADMIN');
  
  const isOwner = userOrganizations.some(org => org.owner_id === currentUserId);
  const hasManagerRole = userRoles.includes('MANAGER') || userRoles.includes('PLATFORM_MANAGER');

  return {
    // Admin can invite to any organization and create new ones
    canInviteToAnyOrganization: isAdmin,
    canInviteToOwnOrganization: isOwner || hasManagerRole,
    
    // Only admin can create new organizations
    canCreateOrganizations: isAdmin,
    
    // Admin and managers can manage members
    canManageMembers: isAdmin || hasManagerRole,
    
    // Admin can view all organizations, others only their own
    canViewAllOrganizations: isAdmin,
    canManageOwnOrganization: isOwner || hasManagerRole,
  };
}

export function canInviteToOrganization(
  userPermissions: UserPermissions,
  targetOrganizationId: number,
  userOrganizations: Organization[]
): boolean {
  // Admin can invite to any organization
  if (userPermissions.canInviteToAnyOrganization) {
    return true;
  }

  // Others can only invite to organizations they belong to
  const userOrg = userOrganizations.find(org => org.id === targetOrganizationId);
  return !!(userOrg && userPermissions.canInviteToOwnOrganization);
}

export function getAvailableOrganizationsForInvite(
  userPermissions: UserPermissions,
  userOrganizations: Organization[]
): Organization[] {
  if (userPermissions.canInviteToAnyOrganization) {
    // Admin can invite to all organizations
    return userOrganizations;
  }

  // Others can only invite to their own organizations
  return userOrganizations.filter(org => 
    userPermissions.canInviteToOwnOrganization
  );
}
