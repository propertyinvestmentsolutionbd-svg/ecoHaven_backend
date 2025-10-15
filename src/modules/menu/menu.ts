// interfaces/menu.ts
export interface IMenu {
  id: number;
  name: string;
  path?: string;
  icon?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMenuCreate {
  name: string;
  path: string;
  icon?: string;
  description?: string;
}

export interface IMenuUpdate {
  name?: string;
  path?: string;
  icon?: string;
  description?: string;
}

// interfaces/userMenuPermission.ts
export interface IUserMenuPermission {
  id: number;
  userId: string;
  menuId: number;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: Date;
}

export interface IUserPermissionCreate {
  userId: string;
  menuId: number;
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface IUserPermissionUpdate {
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface IUserWithPermissions {
  userId: string;
  userName: string;
  userEmail: string;
  permissions: {
    menuId: number;
    menuName: string;
    menuPath?: string;
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }[];
}

// interfaces/userMenuPermission.ts
export interface IUserMenuWithPermissions {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  assignedPermissions: {
    permissionId: number;
    menuId: number;
    menuName: string;
    menuPath?: string;
    menuIcon?: string;
    menuDescription?: string;
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }[];
  availableMenus: {
    menuId: number;
    menuName: string;
    menuPath?: string;
    menuIcon?: string;
    menuDescription?: string;
    isAssigned: boolean;
  }[];
}
// interfaces/userMenuPermission.ts
export interface IUserPermissionUpsert {
  userId: string;
  permissions: {
    menuId: number;
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }[];
}

export interface IUpsertPermissionsResponse {
  userId: string;
  userName: string;
  userEmail: string;
  totalPermissions: number;
  created: number;
  updated: number;
  permissions: {
    menuId: number;
    menuName: string;
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    action: "created" | "updated" | "unchanged";
  }[];
}
