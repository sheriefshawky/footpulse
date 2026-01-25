
export enum UserRole {
  ADMIN = 'ADMIN',
  PLAYER = 'PLAYER',
  GUARDIAN = 'GUARDIAN',
  TRAINER = 'TRAINER'
}

export type Language = 'en' | 'ar';

export type QuestionType = 'RATING' | 'MULTIPLE_CHOICE';

export interface QuestionOption {
  id: string;
  text: string;
  arText: string;
  value: number; 
}

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  avatar?: string;
  trainerId?: string;
  playerId?: string;
  position?: string;
  password?: string;
  isActive: boolean;
}

export interface Question {
  id: string;
  text: string;
  arText: string;
  weight: number;
  type: QuestionType;
  options?: QuestionOption[];
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

export interface SurveyAssignment {
  id: string;
  templateId: string;
  assignerId: string;
  respondentId: string;
  targetId: string;
  month: string;
  status: 'PENDING' | 'COMPLETED';
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
