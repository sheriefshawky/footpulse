
export enum UserRole {
  ADMIN = 'ADMIN',
  PLAYER = 'PLAYER',
  GUARDIAN = 'GUARDIAN',
  TRAINER = 'TRAINER'
}

export type Language = 'en' | 'ar';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  avatar?: string;
  trainerId?: string;
  playerId?: string;
  password?: string;
}

export interface Question {
  id: string;
  text: string;
  arText: string;
  weight: number;
}

export interface Category {
  id: string;
  name: string;
  arName: string;
  weight: number;
  questions: Question[];
}

export interface SurveyTemplate {
  id: string;
  name: string;
  arName: string;
  description: string;
  arDescription: string;
  categories: Category[];
}

export interface SurveyResponse {
  id: string;
  templateId: string;
  userId: string;
  targetPlayerId: string;
  month: string;
  date: string;
  answers: Record<string, number>;
  weightedScore: number;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}
