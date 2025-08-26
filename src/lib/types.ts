
export interface Event {
  id: string;
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
}

export type NewEvent = Omit<Event, "id">;

export interface Participant {
  id: string;
  name: string;
  organization: string;
  contact: string;
  phone: string;
  eventId: string;
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
