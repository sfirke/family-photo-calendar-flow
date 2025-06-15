
import { Event } from '@/types/calendar';

export const sampleEvents: Event[] = [
  {
    id: 1,
    title: 'Team Building Activity',
    time: '1:00 PM - 5:00 PM',
    location: 'Adventure Park',
    attendees: 1,
    category: 'Work',
    color: 'bg-blue-500',
    description: 'Annual team building event with outdoor activities and team challenges.',
    organizer: 'HR Department',
    date: new Date(2024, 11, 15) // Today
  },
  {
    id: 2,
    title: 'Parent-Teacher Conference',
    time: '4:00 PM - 5:00 PM',
    location: 'Elementary School',
    attendees: 1,
    category: 'Kids',
    color: 'bg-orange-500',
    description: 'Quarterly parent-teacher meeting to discuss academic progress.',
    organizer: 'Ms. Johnson',
    date: new Date(2024, 11, 15) // Today
  },
  {
    id: 3,
    title: 'Book Club Meeting',
    time: '7:00 PM - 9:00 PM',
    location: 'Local Library',
    attendees: 1,
    category: 'Personal',
    color: 'bg-purple-500',
    description: 'Monthly book club discussion about "The Great Gatsby".',
    organizer: 'Library Staff',
    date: new Date(2024, 11, 16) // Tomorrow
  },
  {
    id: 4,
    title: 'Family Hiking Trip',
    time: '9:00 AM - 4:00 PM',
    location: 'State Park Trail',
    attendees: 4,
    category: 'Family',
    color: 'bg-green-500',
    description: 'Weekend family adventure exploring nature trails.',
    organizer: 'Dad',
    date: new Date(2024, 11, 17) // Day after tomorrow
  },
  {
    id: 5,
    title: 'Birthday Party',
    time: '3:00 PM - 6:00 PM',
    location: 'Community Center',
    attendees: 1,
    category: 'Personal',
    color: 'bg-purple-500',
    description: 'Celebrating Sarah\'s 8th birthday with friends and family.',
    organizer: 'Mom',
    date: new Date(2024, 11, 16) // Tomorrow
  },
  {
    id: 6,
    title: 'Weekly Meal Prep',
    time: '10:00 AM - 1:00 PM',
    location: 'Home Kitchen',
    attendees: 1,
    category: 'Personal',
    color: 'bg-purple-500',
    description: 'Preparing healthy meals for the upcoming week.',
    organizer: 'Self',
    date: new Date(2024, 11, 17) // Day after tomorrow
  }
];
