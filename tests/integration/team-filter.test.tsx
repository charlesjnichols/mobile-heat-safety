import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { AppProvider } from '../../src/context/AppContext'
import TeamView from '../../src/components/views/TeamView'

const AsyncStorage = require('@react-native-async-storage/async-storage')

const mockTeams = [
  {
    id: 'team-1',
    name: 'Team A',
    color: '#FF6B6B',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'team-2',
    name: 'Team B',
    color: '#4ECDC4',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
]

const makePractice = (id: string, teamId: string, location: string) => ({
  id,
  name: `Practice ${id}`,
  date: '2026-09-02',
  location,
  coach: 'John Coach',
  headCoach: 'John Coach',
  sport: 'Soccer',
  contactInfo: 'coach@example.com',
  teamId,
  checklists: [
    {
      id: `c-${id}`,
      practiceId: id,
      time: '14:00',
      temperature: 85,
      humidity: 70,
      heatIndex: 95,
      actionTaken: 'Water breaks every 20 minutes',
      timestamp: '2026-09-02T14:00:00Z',
      deviceInfo: 'iPhone 12',
    },
  ],
  createdAt: '2026-09-02T10:00:00Z',
  updatedAt: '2026-09-02T14:00:00Z',
})

const mockPractices = [
  makePractice('p1', 'team-1', 'Field A'),
  makePractice('p2', 'team-2', 'Field B'),
]

describe('Team Filtering Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    AsyncStorage.getItem.mockResolvedValue(
      JSON.stringify({
        version: '1.0.0',
        lastSync: null,
        data: { teams: mockTeams, practices: mockPractices },
      })
    )
  })

  it('renders all teams by default', async () => {
    render(
      <AppProvider>
        <TeamView />
      </AppProvider>
    )

    await waitFor(() => expect(screen.getByText('Team A')).toBeTruthy())
    expect(screen.getByText('Team B')).toBeTruthy()
  })

  it('opens the edit form when a team card is tapped', async () => {
    render(
      <AppProvider>
        <TeamView />
      </AppProvider>
    )

    await waitFor(() => expect(screen.getByText('Team A')).toBeTruthy())

    fireEvent.press(screen.getByLabelText('Team Team A'))

    await waitFor(() => {
      expect(screen.getByText('Update Team')).toBeTruthy()
    })
  })
})
