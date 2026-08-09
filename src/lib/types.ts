
export interface AgendaItem {
  id: string;
  title: string;
  time?: string;
  speaker?: string;
}

export interface FoodMenuItem {
  id: string;
  name: string;
  description?: string;
}

export type EventType =
  | 'conference'
  | 'workshop'
  | 'seminar'
  | 'summit'
  | 'banquet'
  | 'dinner'
  | 'symposium'
  | 'exhibition'
  | 'training'
  | 'other';

export interface Event {
  id: string;
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  isActive: boolean;
  isInternal: boolean;
  category?: 'internal' | 'external' | 'meeting';
  eventType?: EventType;
  allowPublicRegistration?: boolean;
  isInvitationOnly?: boolean;
  invitationCode?: string;
  department?: string;
  position?: string;
  assignedStaff?: string[]; // Array of user IDs
  agenda?: AgendaItem[];
  foodMenu?: FoodMenuItem[];
}

export type NewEvent = Omit<Event, "id">;

export interface Participant {
  id: string;
  _id?: any; // MongoDB ObjectId
  name: string;
  organization: string;
  designation: string;
  department?: string;
  position?: string;
  contact: string;
  phone: string;
  eventId: string;
  qrEmailSent?: boolean;
  onboardedBy?: string; // ID of the staff who onboarded this participant
  onboardingDate?: string; // Date when manual onboarding happened
  isMediaPersonnel?: boolean; // Whether the participant is a media personnel
  mealPreference?: string; // Meal selection if event has a food menu
  invitationId?: string; // Linked invitation ID if registered via unique invite
}

export interface Invitation {
  id: string;
  eventId: string;
  code: string; // Unique alphanumeric code e.g. NMT-A3X9
  inviteeName?: string; // Pre-filled name (optional)
  inviteeEmail?: string; // Pre-filled email (optional)
  inviteeOrg?: string; // Pre-filled organization (optional)
  isUsed: boolean;
  participantId?: string; // Set after successful registration
  createdAt: string;
  usedAt?: string;
}

export interface Attendance {
  id: string;
  participantId: string;
  eventId: string;
  checkedInAt: string;
  attendanceDate: string; // Date in YYYY-MM-DD format for day-by-day tracking
  participantName?: string;
  participantOrganization?: string;
  checkedInBy?: string; // ID of the staff who scanned the QR
  signedBy?: string; // Name of the user who onboarded the participant or 'Self'
  participantPosition?: string; // Position or designation of the participant
  isMediaPersonnel?: boolean; // Whether the participant is a media personnel
}

export type UserRole = 'admin' | 'scan_admin' | 'user';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type NewUser = Omit<User, "id" | "createdAt" | "updatedAt">;

export interface UserWithPassword extends User {
  password: string;
}

export type CreateUserData = Omit<UserWithPassword, "id" | "createdAt" | "updatedAt">;
