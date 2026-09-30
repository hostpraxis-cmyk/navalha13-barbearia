import {
  barbers as barberOptions,
  getUpcomingScheduleDays,
  services,
  slotsByDay,
} from '../shared/catalog'
import type { BarberOption, BookingSlot, ScheduleDay } from '../shared/catalog'

export type { Service } from '../shared/catalog'
export type Barber = BarberOption & { photo: string }
export type Slot = BookingSlot
export type { ScheduleDay } from '../shared/catalog'

const publicBase = import.meta.env.BASE_URL
export const images = {
  hero: `${publicBase}images/hero.webp`,
  beard: `${publicBase}images/beard.webp`,
  tools: `${publicBase}images/tools.webp`,
  interior: `${publicBase}images/interior.webp`,
  mark: `${publicBase}images/mark.webp`,
}

export { services, slotsByDay }
export const scheduleDays: ScheduleDay[] = getUpcomingScheduleDays()

const barberPhotos = [images.hero, images.beard, images.tools]
export const barbers: Barber[] = barberOptions.map((barber, index) => ({
  ...barber,
  photo: barberPhotos[index] ?? images.tools,
}))

export const testimonials = [
  { quote: 'Não é só corte. Você entra no ritmo certo antes mesmo de sentar.', name: 'Bruno Oliveira', detail: 'cliente desde 2021', rating: '5.0' },
  { quote: 'A barba ficou com desenho, mas sem parecer montada. Precisão real.', name: 'Theo Ramos', detail: 'Barba Ritual', rating: '5.0' },
  { quote: 'Espaço, atendimento e tempo de cadeira. Tudo tem intenção.', name: 'André Fraga', detail: 'Combo 13', rating: '5.0' },
]

export const shopContact = {
  phone: '(11) 0000-0013',
  address: 'Rua da Navalha, 13',
  neighborhood: 'Vila do Corte · São Paulo, SP',
  days: 'Terça a sábado',
  hours: '09h às 20h · horário demonstrativo',
} as const
