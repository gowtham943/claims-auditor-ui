export type Geography = 'INDIA' | 'WESTERN'

export type PlanType = 'CMCHIS' | 'NHIS' | 'HMO' | 'PPO'

export const GEOGRAPHY_OPTIONS: { value: Geography; label: string }[] = [
  { value: 'INDIA', label: 'India' },
  { value: 'WESTERN', label: 'Western (US)' },
]

export const PLAN_TYPES_BY_GEOGRAPHY: Record<
  Geography,
  { value: PlanType; label: string; description: string }[]
> = {
  INDIA: [
    {
      value: 'CMCHIS',
      label: 'CMCHIS',
      description: "Chief Minister's Comprehensive Health Insurance Scheme",
    },
    {
      value: 'NHIS',
      label: 'NHIS',
      description: 'New Health Insurance Scheme',
    },
  ],
  WESTERN: [
    {
      value: 'HMO',
      label: 'HMO',
      description: 'Health Maintenance Organization',
    },
    {
      value: 'PPO',
      label: 'PPO',
      description: 'Preferred Provider Organization',
    },
  ],
}

export function getDefaultPlanType(geography: Geography): PlanType {
  return PLAN_TYPES_BY_GEOGRAPHY[geography][0].value
}

export function formatGeographyLabel(geography: string): string {
  return GEOGRAPHY_OPTIONS.find((item) => item.value === geography)?.label ?? geography
}

export function formatPlanTypeLabel(geography: Geography, planType: PlanType): string {
  const option = PLAN_TYPES_BY_GEOGRAPHY[geography].find((item) => item.value === planType)
  return option ? `${option.label} — ${option.description}` : planType
}

export function formatPolicyLabel(planName: string, geography: string, planType: string): string {
  return `${planName} (${planType} · ${formatGeographyLabel(geography)})`
}
