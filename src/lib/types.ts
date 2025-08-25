export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
}

export interface Participant {
  id: string;
  name: string;
  organization: string;
  contact: string;
  interests: string;
  eventId: string;
}
