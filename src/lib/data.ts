import type { Event, Participant } from './types';

export const events: Event[] = [
  {
    id: 'tech-summit-2024',
    name: 'Global Tech Summit 2024',
    date: 'October 26-28, 2024',
    location: 'Virtual',
    description: 'A gathering of the brightest minds in technology to discuss the future of innovation, AI, and sustainable tech.',
  },
  {
    id: 'Innovate-con-2024',
    name: 'InnovateCon 2024',
    date: 'November 15, 2024',
    location: 'Metropolis Convention Center',
    description: 'The premier conference for innovators, entrepreneurs, and investors to network and showcase groundbreaking ideas.',
  },
  {
    id: 'design-forward-2024',
    name: 'Design Forward 2024',
    date: 'December 5-6, 2024',
    location: 'Online',
    description: 'Explore the latest trends in UI/UX, product design, and creative strategy with industry leaders.',
  },
];

export const participants: Participant[] = [
  {
    id: 'p1',
    name: 'Alice Johnson',
    organization: 'Innovate Inc.',
    contact: 'alice.j@innovate.com',
    interests: 'Artificial Intelligence, Machine Learning, UI/UX',
    eventId: 'tech-summit-2024',
  },
  {
    id: 'p2',
    name: 'Bob Williams',
    organization: 'Solutions Co.',
    contact: 'bob@solutions.co',
    interests: 'Cloud Computing, DevOps, Cybersecurity',
    eventId: 'tech-summit-2024',
  },
  {
    id: 'p3',
    name: 'Charlie Brown',
    organization: 'Creative Designs',
    contact: 'charlie@creativedesigns.com',
    interests: 'Graphic Design, Branding, User Research',
    eventId: 'design-forward-2024',
  },
  {
    id: 'p4',
    name: 'Diana Prince',
    organization: 'Future Ventures',
    contact: 'diana.p@futureventures.io',
    interests: 'Venture Capital, Startups, FinTech',
    eventId: 'Innovate-con-2024',
  },
    {
    id: 'p5',
    name: 'Ethan Hunt',
    organization: 'Synergy Systems',
    contact: 'ethan.hunt@synergy.com',
    interests: 'Project Management, Agile Methodologies, Team Leadership',
    eventId: 'Innovate-con-2024',
  },
];
