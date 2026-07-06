export const hasPermission = (
  permissions: string[],
  permission: string,
): boolean => {
  return permissions.includes(permission);
};

export const hasAnyPermission = (
  userPermissions: string[],
  permissions: string[],
): boolean => {
  if (permissions.length === 0) {
    return true;
  }

  return permissions.some((permission) => userPermissions.includes(permission));
};

export const hasAllPermissions = (
  userPermissions: string[],
  permissions: string[],
): boolean => {
  if (permissions.length === 0) {
    return true;
  }

  return permissions.every((permission) => userPermissions.includes(permission));
};
