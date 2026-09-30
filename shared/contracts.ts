export type AccountUser = {
  id: string
  name: string
  email: string
  createdAt: string
}

export type SimulationRecord = {
  id: string
  serviceId: string
  serviceName: string
  barberId: string
  barberName: string
  dayId: string
  dayDate: string
  dayLabel: string
  dayNumber: string
  time: string
  createdAt: string
}

export type ApiError = {
  error: string
  code?: string
}

export type AuthBootstrap = {
  csrfToken: string
  nonce: string
}

export type CurrentUserResponse = {
  user: AccountUser | null
}

export type HistoryResponse = {
  items: SimulationRecord[]
}
