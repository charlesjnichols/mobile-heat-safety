import React from 'react'
import { render } from '@testing-library/react-native'
import HeatStressGuideView from './HeatStressGuideView'

describe('HeatStressGuideView', () => {
  it('renders the guide container and disclaimer', () => {
    const { getByTestId, getAllByText } = render(<HeatStressGuideView />)
    expect(getByTestId('heat-stress-guide')).toBeTruthy()
    expect(getByTestId('guide-disclaimer')).toBeTruthy()
    // The disclaimer appears in the top banner and the footer; assert at least one.
    expect(getAllByText(/heat index values/i).length).toBeGreaterThanOrEqual(1)
  })

  describe('US1 - condition bands', () => {
    it('renders all three bands in order with coach/athlete responsibilities', () => {
      const { getByTestId, getAllByText } = render(<HeatStressGuideView />)
      expect(getByTestId('guide-band-elevated')).toBeTruthy()
      expect(getByTestId('guide-band-high')).toBeTruthy()
      expect(getByTestId('guide-band-extreme')).toBeTruthy()

      // Coach and Athlete labels appear once per band (3 bands).
      expect(getAllByText('Coach')).toHaveLength(3)
      expect(getAllByText('Athlete')).toHaveLength(3)
    })

    it('shows the Code Red tag only on the Extreme band', () => {
      const { getByTestId, queryByTestId } = render(<HeatStressGuideView />)
      expect(getByTestId('guide-band-extreme-code')).toBeTruthy()
      expect(queryByTestId('guide-band-elevated-code')).toBeNull()
      expect(queryByTestId('guide-band-high-code')).toBeNull()
    })

    it('exposes severity via accessibility labels', () => {
      const { getByTestId } = render(<HeatStressGuideView />)
      expect(getByTestId('guide-band-extreme').props.accessibilityLabel).toContain(
        'Code Red'
      )
      expect(getByTestId('guide-band-elevated').props.accessibilityLabel).toContain(
        'Moderate'
      )
    })
  })

  describe('US2 - prevention and call 911', () => {
    it('renders all four prevention topics', () => {
      const { getByTestId } = render(<HeatStressGuideView />)
      expect(getByTestId('guide-topic-acclimatization')).toBeTruthy()
      expect(getByTestId('guide-topic-water-shade')).toBeTruthy()
      expect(getByTestId('guide-topic-high-heat-procedures')).toBeTruthy()
      expect(getByTestId('guide-topic-training')).toBeTruthy()
    })

    it('renders the prominent Call 911 block with all three triggers', () => {
      const { getByTestId, getByText } = render(<HeatStressGuideView />)
      expect(getByTestId('guide-call-911')).toBeTruthy()
      expect(getByText(/confused, unresponsive, or seizing/i)).toBeTruthy()
      expect(getByText(/do not improve with cooling/i)).toBeTruthy()
      expect(getByText(/suspected heat stroke/i)).toBeTruthy()
    })
  })

  describe('US3 - symptoms and first aid', () => {
    it('renders all four conditions with symptoms and responses', () => {
      const { getByTestId, getByText } = render(<HeatStressGuideView />)
      expect(getByTestId('guide-condition-heat-rash')).toBeTruthy()
      expect(getByTestId('guide-condition-heat-cramps')).toBeTruthy()
      expect(getByTestId('guide-condition-heat-exhaustion')).toBeTruthy()
      expect(getByTestId('guide-condition-heat-stroke')).toBeTruthy()

      // Heat Stroke's emergency response text is present.
      expect(getByText(/call 911, begin cooling immediately/i)).toBeTruthy()
    })

    it('flags Heat Stroke as a medical emergency', () => {
      const { getByTestId, queryByTestId } = render(<HeatStressGuideView />)
      expect(getByTestId('guide-condition-heat-stroke-emergency')).toBeTruthy()
      expect(queryByTestId('guide-condition-heat-rash-emergency')).toBeNull()
    })

    it('shows the escalation note only for Heat Exhaustion', () => {
      const { getByTestId, queryByTestId } = render(<HeatStressGuideView />)
      expect(
        getByTestId('guide-condition-heat-exhaustion-escalation')
      ).toBeTruthy()
      expect(
        queryByTestId('guide-condition-heat-stroke-escalation')
      ).toBeNull()
    })
  })
})