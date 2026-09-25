export interface CurrentUser {
  id: string;
  businessId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
}

export interface BusinessSummary {
  id: string;
  businessCode: string;
  name: string;
  currency: string;
  isActive: boolean;
}
