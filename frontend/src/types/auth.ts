export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  initials?: string;
}

export interface CompanyInfo {
  id: string;
  name: string;
  environment: string;
}
