export interface UserRecord {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isStaff: boolean;
  isSuperuser: boolean;
  dateJoined: string;
  lastLogin: string | null;
}

export const MOCK_USERS: UserRecord[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@slavevoyages.org',
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
    isStaff: true,
    isSuperuser: true,
    dateJoined: '2023-01-01T00:00:00Z',
    lastLogin: '2026-02-24T06:00:00Z',
  },
  {
    id: 2,
    username: 'editor_jane',
    email: 'jane.doe@slavevoyages.org',
    firstName: 'Jane',
    lastName: 'Doe',
    isActive: true,
    isStaff: true,
    isSuperuser: false,
    dateJoined: '2023-03-15T09:00:00Z',
    lastLogin: '2026-02-23T14:30:00Z',
  },
  {
    id: 3,
    username: 'contributor_smith',
    email: 'john.smith@university.edu',
    firstName: 'John',
    lastName: 'Smith',
    isActive: true,
    isStaff: false,
    isSuperuser: false,
    dateJoined: '2023-06-20T11:00:00Z',
    lastLogin: '2026-02-20T09:15:00Z',
  },
  {
    id: 4,
    username: 'researcher_maria',
    email: 'maria.garcia@research.org',
    firstName: 'Maria',
    lastName: 'Garcia',
    isActive: true,
    isStaff: false,
    isSuperuser: false,
    dateJoined: '2023-09-10T08:00:00Z',
    lastLogin: '2026-02-18T16:45:00Z',
  },
  {
    id: 5,
    username: 'editor_chen',
    email: 'wei.chen@slavevoyages.org',
    firstName: 'Wei',
    lastName: 'Chen',
    isActive: true,
    isStaff: true,
    isSuperuser: false,
    dateJoined: '2024-01-05T10:00:00Z',
    lastLogin: '2026-02-24T05:55:00Z',
  },
  {
    id: 6,
    username: 'contrib_brown',
    email: 'alice.brown@museum.org',
    firstName: 'Alice',
    lastName: 'Brown',
    isActive: false,
    isStaff: false,
    isSuperuser: false,
    dateJoined: '2023-11-01T13:00:00Z',
    lastLogin: '2025-12-01T10:00:00Z',
  },
  {
    id: 7,
    username: 'prof_johnson',
    email: 'r.johnson@history.edu',
    firstName: 'Robert',
    lastName: 'Johnson',
    isActive: true,
    isStaff: false,
    isSuperuser: false,
    dateJoined: '2024-02-14T09:30:00Z',
    lastLogin: '2026-02-22T11:20:00Z',
  },
  {
    id: 8,
    username: 'editor_nguyen',
    email: 'lisa.nguyen@slavevoyages.org',
    firstName: 'Lisa',
    lastName: 'Nguyen',
    isActive: true,
    isStaff: true,
    isSuperuser: false,
    dateJoined: '2024-04-01T08:00:00Z',
    lastLogin: '2026-02-23T17:00:00Z',
  },
];
