import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Share } from 'react-native'
import { PracticeDetailView } from '../../src/components/views/PracticeDetailView'
import { AppProvider } from '../../src/context/AppContext'
import { db } from '../../src/db/database'
import type { DbPractice } from '../../src/db/types'

const mockPractice = {
  id: 'practice-1',
  name: 'Morning Practice',
  date: '2026-09-02',
  location: 'Main Field',
  coach: 'John Coach',
  headCoach: 'John Coach',
  sport: 'Soccer',
  contactInfo: 'coach@example.com',
  teamId: 'team-1',
  notes: '',
  checklists: [
    {
      id: 'checklist-1',
      practiceId: 'practice-1',
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
}

const mockTeam = {
  id: 'team-1',
  name: 'Varsity Team',
  color: '#FF6B6B',
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T10:00:00Z',
}

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
}
const mockRoute = { params: { practiceId: 'practice-1' } }

describe('Export Interface', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await db.teams.put({ ...mockTeam, _syncStatus: 'synced' })
    await db.practices.put({ ...(mockPractice as unknown as DbPractice), _syncStatus: 'synced' })
  })

  afterAll(async () => {
    await db.teams.clear()
    await db.practices.clear()
    await db.syncQueue.clear()
  })

  it('renders an overflow menu exposing an export action', async () => {
    const { getByTestId, getByText } = render(
      <AppProvider>
        <PracticeDetailView navigation={mockNavigation} route={mockRoute} />
      </AppProvider>
    )
    await waitFor(() => expect(getByTestId('overflow-menu')).toBeTruthy())

    fireEvent.press(getByTestId('overflow-menu'))
    expect(getByText('Export')).toBeTruthy()
  })

  it('shares JSON data when the export action is pressed', async () => {
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction })
    const { getByTestId, getByText } = render(
      <AppProvider>
        <PracticeDetailView navigation={mockNavigation} route={mockRoute} />
      </AppProvider>
    )

    await waitFor(() => expect(getByTestId('overflow-menu')).toBeTruthy())

    fireEvent.press(getByTestId('overflow-menu'))
    fireEvent.press(getByText('Export'))

    await waitFor(() => expect(shareSpy).toHaveBeenCalled())
    const payload = shareSpy.mock.calls[0][0] as { message?: string; url?: string }
    expect(payload.message ?? payload.url).toBeDefined()
    shareSpy.mockRestore()
  })
})
