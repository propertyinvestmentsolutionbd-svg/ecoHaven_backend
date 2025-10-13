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
