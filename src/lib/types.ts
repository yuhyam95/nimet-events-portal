
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
