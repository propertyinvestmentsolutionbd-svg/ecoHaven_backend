// interfaces/contact.ts
export interface IContact {
  id: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
  read: boolean;
  replied: boolean;
  createdAt: Date;
}

export interface IContactCreate {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface IContactUpdate {
  read?: boolean;
  replied?: boolean;
}

export interface IContactFilters {
  search?: string;
  read?: boolean;
  replied?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface IContactStats {
  total: number;
  unread: number;
  unreplied: number;
  today: number;
}
