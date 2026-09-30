export type Service = {
  id: string
  name: string
  duration: string
  price: string
  description: string
  index: string
}

export type BarberOption = {
  id: string
  name: string
  specialty: string
  initials: string
  tone: string
}

export type BookingSlot = {
  time: string
  occupied?: boolean
}

export type ScheduleDay = {
  id: string
  date: string
  week: string
  day: string
  label: string
}

export const services: Service[] = [
  {
    id: 'corte',
    name: 'Corte Navalha',
    duration: '45 min',
    price: 'R$ 95',
    description: 'Leitura de rosto, corte preciso e finalização com produtos de alta perfumaria.',
    index: '01',
  },
  {
    id: 'barba',
    name: 'Barba Ritual',
    duration: '35 min',
    price: 'R$ 75',
    description: 'Toalha quente, desenho de barba e acabamento clássico à navalha.',
    index: '02',
  },
  {
    id: 'combo',
    name: 'Combo 13',
    duration: '75 min',
    price: 'R$ 155',
    description: 'Corte e barba no mesmo ritual, com tempo para cada detalhe importar.',
    index: '03',
  },
]

export const barbers: BarberOption[] = [
  { id: 'marcos', name: 'Marcos Fiore', specialty: 'Fades & precisão', initials: 'MF', tone: 'copper' },
  { id: 'caio', name: 'Caio Mendes', specialty: 'Barba & navalha', initials: 'CM', tone: 'cream' },
  { id: 'rafa', name: 'Rafa Lins', specialty: 'Clássicos & textura', initials: 'RL', tone: 'sand' },
]

export const slotsByDay: Record<string, BookingSlot[]> = {
  ter: [
    { time: '09:00', occupied: true },
    { time: '10:00' },
    { time: '11:00' },
    { time: '13:30', occupied: true },
    { time: '14:30' },
    { time: '15:30' },
    { time: '17:00', occupied: true },
  ],
  qua: [
    { time: '09:00' },
    { time: '10:00', occupied: true },
    { time: '11:00' },
    { time: '13:30' },
    { time: '14:30', occupied: true },
    { time: '15:30' },
    { time: '17:00' },
  ],
  qui: [
    { time: '09:00' },
    { time: '10:00' },
    { time: '11:00', occupied: true },
    { time: '13:30' },
    { time: '14:30' },
    { time: '15:30', occupied: true },
    { time: '17:00' },
  ],
  sex: [
    { time: '09:00', occupied: true },
    { time: '10:00' },
    { time: '11:00' },
    { time: '13:30' },
    { time: '14:30' },
    { time: '15:30' },
    { time: '17:00', occupied: true },
  ],
  sab: [
    { time: '09:00' },
    { time: '10:00', occupied: true },
    { time: '11:00' },
    { time: '13:30', occupied: true },
    { time: '14:30' },
    { time: '15:30' },
  ],
}

const weekdayIds: Record<number, string> = {
  2: 'ter',
  3: 'qua',
  4: 'qui',
  5: 'sex',
  6: 'sab',
}
const weekdayLabels = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

function saoPauloToday(now: Date): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find((value) => value.type === type)?.value ?? ''
  return new Date(Date.UTC(Number(part('year')), Number(part('month')) - 1, Number(part('day'))))
}

export function getUpcomingScheduleDays(now = new Date()): ScheduleDay[] {
  const today = saoPauloToday(now)
  const days: ScheduleDay[] = []

  for (let offset = 0; offset < 14 && days.length < 5; offset += 1) {
    const date = new Date(today)
    date.setUTCDate(today.getUTCDate() + offset)
    const weekday = date.getUTCDay()
    const id = weekdayIds[weekday]
    if (!id) continue

    const dateKey = date.toISOString().slice(0, 10)
    const day = String(date.getUTCDate()).padStart(2, '0')
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const label = offset === 0 ? 'Hoje' : offset === 1 ? 'Amanhã' : `${weekdayLabels[weekday]}, ${day}/${month}`
    days.push({ id, date: dateKey, week: weekdayLabels[weekday], day, label })
  }

  return days
}

export function findScheduleDay(dayId: string, date: string): ScheduleDay | undefined {
  return getUpcomingScheduleDays().find((day) => day.id === dayId && day.date === date)
}
