export type PainLevel = 1 | 2 | 3 | 4;

export interface PainLog {
  id: string;
  painLevel: PainLevel;
  medicineIds: string[];  // 最大5個
  painAreaIds: string[];  // 最大5個
  memo: string;          // 最大250文字
  createdAt: string;
}

export interface Medicine {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface PainArea {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface PainImage {
  id: string;
  url: string;
  uploadedAt: string;
  painLogId: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface PainLogInput {
  painLevel: PainLevel;
  medicineIds: string[];
  painAreaIds: string[];
  memo: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}