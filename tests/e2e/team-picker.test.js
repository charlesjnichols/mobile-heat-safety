import { device, element, by, expect } from 'detox'

describe('Team Picker - Select a Team', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  it('opens the team picker and selects a team', async () => {
    // Navigate to the New Practice form.
    await element(by.id('fab-add-practice')).tap()

    // Open the team picker via the Team field trigger.
    await element(by.id('team-selector')).tap()

    // Verify the bottom sheet is presented.
    await expect(element(by.id('team-picker-sheet'))).toBeVisible()

    // Tap a team row (alphabetically first available team).
    await element(by.id('team-row-t1')).tap()

    // The sheet should close and the chosen team should appear in the field.
    await expect(element(by.id('team-picker-sheet'))).not.toBeVisible()
    await expect(element(by.id('team-selector'))).toHaveText('Alpha Team')
  })

  it('dismisses the picker without changing the selection', async () => {
    await element(by.id('fab-add-practice')).tap()
    await element(by.id('team-selector')).tap()

    await expect(element(by.id('team-picker-sheet'))).toBeVisible()

    // Tap the backdrop to dismiss without selecting.
    await element(by.id('team-picker-backdrop')).tap()

    await expect(element(by.id('team-picker-sheet'))).not.toBeVisible()
    await expect(element(by.id('team-selector'))).toHaveText('Select a team...')
  })
})