import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  conditionBands,
  preventionTopics,
  call911Triggers,
  conditions,
  heatIndexDisclaimer,
  guideSections,
  BandSeverity,
  ConditionBand,
  PreventionTopic,
  GuideCondition,
} from '../../utils/heatStressGuide'
import { HEAT_INDEX_COLORS } from '../../utils/outdoorColors'
import { PALETTE } from '../../utils/outdoorColors'

// Map band severity to high-contrast outdoor color tokens.
const SEVERITY_STYLES: Record<
  BandSeverity,
  { backgroundColor: string; borderColor: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  moderate: {
    backgroundColor: HEAT_INDEX_COLORS.MODERATE.bg,
    borderColor: HEAT_INDEX_COLORS.MODERATE.border,
    icon: 'alert-circle',
  },
  high: {
    backgroundColor: HEAT_INDEX_COLORS.HIGH.bg,
    borderColor: HEAT_INDEX_COLORS.HIGH.border,
    icon: 'warning',
  },
  critical: {
    backgroundColor: HEAT_INDEX_COLORS.EXTREME.bg,
    borderColor: HEAT_INDEX_COLORS.EXTREME.border,
    icon: 'alert',
  },
}

const SEVERITY_LABELS: Record<BandSeverity, string> = {
  moderate: 'Moderate',
  high: 'High',
  critical: 'Critical',
}

const BandCard = ({ band }: { band: ConditionBand }) => {
  const severity = SEVERITY_STYLES[band.severity]
  const accessibilityLabel = `${band.title} — ${SEVERITY_LABELS[band.severity]}${
    band.codeLabel ? `, ${band.codeLabel}` : ''
  }`

  return (
    <View
      style={[styles.bandCard, { borderColor: severity.borderColor }]}
      testID={`guide-band-${band.id}`}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[styles.bandHeader, { backgroundColor: severity.backgroundColor }]}>
        <Ionicons name={severity.icon} size={22} color={PALETTE.WHITE} />
        <Text style={styles.bandTitle}>{band.title}</Text>
        {band.codeLabel ? (
          <View style={styles.codeBadge} testID={`guide-band-${band.id}-code`}>
            <Text style={styles.codeBadgeText}>{band.codeLabel}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.bandSummary}>{band.summary}</Text>

      <Text style={styles.responsibilityLabel}>Coach</Text>
      {band.coachResponsibilities.map((item, index) => (
        <Bullet key={`coach-${index}`} text={item} />
      ))}

      <Text style={styles.responsibilityLabel}>Athlete</Text>
      {band.athleteResponsibilities.map((item, index) => (
        <Bullet key={`athlete-${index}`} text={item} />
      ))}
    </View>
  )
}

const Bullet = ({ text, inverted = false }: { text: string; inverted?: boolean }) => (
  <View style={styles.bulletRow}>
    <Text style={[styles.bulletDot, inverted && styles.bulletInverted]}>
      {'\u2022'}
    </Text>
    <Text style={[styles.bulletText, inverted && styles.bulletInverted]}>{text}</Text>
  </View>
)

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
)

const HeatStressGuideView = () => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        testID="heat-stress-guide"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Heat Stress Guide</Text>
        </View>

        <View
          style={styles.disclaimerBanner}
          accessible
          accessibilityRole="text"
          testID="guide-disclaimer"
        >
          <Ionicons name="information-circle" size={20} color={PALETTE.BLUE_900} />
          <Text style={styles.disclaimerText}>{heatIndexDisclaimer}</Text>
        </View>

        <SectionHeader title={guideSections.conditions} />
        {conditionBands.map((band) => (
          <BandCard key={band.id} band={band} />
        ))}

        <SectionHeader title={guideSections.prevention} />
        {preventionTopics.map((topic) => (
          <PreventionTopicCard key={topic.id} topic={topic} />
        ))}

        <View
          style={styles.call911Block}
          accessible
          accessibilityRole="summary"
          accessibilityLabel="Call 911 if worker is confused, unresponsive, or seizing; symptoms do not improve with cooling; or suspected heat stroke"
          testID="guide-call-911"
        >
          <View style={styles.call911Header}>
            <Ionicons name="call" size={22} color={PALETTE.WHITE} />
            <Text style={styles.call911Title}>Call 911 if</Text>
          </View>
          {call911Triggers.map((trigger, index) => (
            <Bullet key={`call-${index}`} text={trigger} inverted />
          ))}
        </View>

        <SectionHeader title={guideSections.symptoms} />
        {conditions.map((condition) => (
          <ConditionCard key={condition.id} condition={condition} />
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>{heatIndexDisclaimer}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const PreventionTopicCard = ({ topic }: { topic: PreventionTopic }) => (
  <View style={styles.topicCard} testID={`guide-topic-${topic.id}`}>
    <Text style={styles.topicTitle}>{topic.title}</Text>
    {topic.points.map((point, index) => (
      <Bullet key={`point-${index}`} text={point} />
    ))}
  </View>
)

const ConditionCard = ({ condition }: { condition: GuideCondition }) => {
  const accessibilityLabel = condition.isEmergency
    ? `${condition.name} — medical emergency`
    : condition.name

  return (
    <View
      style={[
        styles.conditionCard,
        condition.isEmergency && styles.conditionCardEmergency,
      ]}
      testID={`guide-condition-${condition.id}`}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.conditionHeader}>
        <Text style={styles.conditionName}>{condition.name}</Text>
        {condition.isEmergency ? (
          <View style={styles.emergencyBadge} testID={`guide-condition-${condition.id}-emergency`}>
            <Ionicons name="medical" size={14} color={PALETTE.WHITE} />
            <Text style={styles.emergencyBadgeText}>MEDICAL EMERGENCY</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.conditionSubheading}>Symptoms</Text>
      {condition.symptoms.map((symptom, index) => (
        <Bullet key={`symptom-${index}`} text={symptom} />
      ))}

      <Text style={styles.conditionSubheading}>First Aid</Text>
      {condition.response.map((step, index) => (
        <Bullet key={`response-${index}`} text={step} />
      ))}

      {condition.escalationNote ? (
        <View style={styles.escalationNote} testID={`guide-condition-${condition.id}-escalation`}>
          <Ionicons name="call" size={16} color={PALETTE.RED_700} />
          <Text style={styles.escalationNoteText}>{condition.escalationNote}</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  bandCard: {
    backgroundColor: PALETTE.WHITE,
    borderRadius: 12,
    borderWidth: 2,
    elevation: 2,
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: PALETTE.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bandHeader: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bandSummary: {
    color: PALETTE.TEXT_STRONG,
    fontSize: 14,
    marginBottom: 12,
  },
  bandTitle: {
    color: PALETTE.WHITE,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  bulletDot: {
    color: PALETTE.NEUTRAL_600,
    fontSize: 14,
    marginRight: 8,
  },
  bulletInverted: {
    color: PALETTE.WHITE,
  },
  bulletRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 4,
  },
  bulletText: {
    color: PALETTE.TEXT_STRONG,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  call911Block: {
    backgroundColor: PALETTE.RED_700,
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 16,
  },
  call911Header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  call911Title: {
    color: PALETTE.WHITE,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  codeBadge: {
    backgroundColor: PALETTE.RED_900,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  codeBadgeText: {
    color: PALETTE.WHITE,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  conditionCard: {
    backgroundColor: PALETTE.WHITE,
    borderRadius: 12,
    elevation: 1,
    marginBottom: 12,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: PALETTE.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  conditionCardEmergency: {
    borderColor: PALETTE.RED_700,
    borderWidth: 2,
  },
  conditionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  conditionName: {
    color: PALETTE.TEXT_DARK,
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  conditionSubheading: {
    color: PALETTE.NEUTRAL_600,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  disclaimerBanner: {
    alignItems: 'center',
    backgroundColor: PALETTE.BLUE_100,
    borderColor: PALETTE.BLUE_200,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
  },
  disclaimerText: {
    color: PALETTE.BLUE_900,
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
  },
  emergencyBadge: {
    alignItems: 'center',
    backgroundColor: PALETTE.RED_700,
    borderRadius: 4,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  emergencyBadgeText: {
    color: PALETTE.WHITE,
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  escalationNote: {
    alignItems: 'flex-start',
    backgroundColor: PALETTE.RED_100,
    borderRadius: 6,
    flexDirection: 'row',
    marginTop: 12,
    padding: 8,
  },
  escalationNoteText: {
    color: PALETTE.RED_700,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  footer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  footerText: {
    color: PALETTE.TEXT_SECONDARY,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    backgroundColor: PALETTE.WHITE,
    borderBottomColor: PALETTE.NEUTRAL_200,
    borderBottomWidth: 1,
    padding: 16,
  },
  headerTitle: {
    color: PALETTE.TEXT_DEFAULT,
    fontSize: 24,
    fontWeight: 'bold',
  },
  responsibilityLabel: {
    color: PALETTE.TEXT_DARK,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 8,
  },
  safeArea: {
    backgroundColor: PALETTE.GRAY_50,
    flex: 1,
  },
  sectionHeader: {
    color: PALETTE.TEXT_DEFAULT,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    marginHorizontal: 16,
    marginTop: 24,
  },
  topicCard: {
    backgroundColor: PALETTE.WHITE,
    borderRadius: 12,
    elevation: 1,
    marginBottom: 12,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: PALETTE.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  topicTitle: {
    color: PALETTE.TEXT_DARK,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
})

export default HeatStressGuideView