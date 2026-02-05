
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
  department?: string;
  position?: string;
  assignedStaff?: string[]; // Array of user IDs
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
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export type NewUser = Omit<User, "id" | "createdAt" | "updatedAt">;

export interface UserWithPassword extends User {
  password: string;
}

export type CreateUserData = Omit<UserWithPassword, "id" | "createdAt" | "updatedAt">;
