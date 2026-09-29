export type Service = {
  id: string
  name: string
  duration: string
  price: string
  description: string
  index: string
}

export type Barber = {
  id: string
  name: string
  specialty: string
  initials: string
  tone: string
}

export type Slot = {
  time: string
  occupied?: boolean
}

export const images = {
  hero: '/manus-storage/async-images/TAYRp9StaUhnWiGc72ezkF/image-2.webp',
  beard: '/manus-storage/async-images/TAYRp9StaUhnWiGc72ezkF/image-3.webp',
  tools: '/manus-storage/async-images/TAYRp9StaUhnWiGc72ezkF/image-4.webp',
  interior: '/manus-storage/async-images/TAYRp9StaUhnWiGc72ezkF/image-5.webp',
  mark: '/manus-storage/async-images/TAYRp9StaUhnWiGc72ezkF/image-1.webp',
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

export const barbers: Barber[] = [
  { id: 'marcos', name: 'Marcos Fiore', specialty: 'Fades & precisão', initials: 'MF', tone: 'copper' },
  { id: 'caio', name: 'Caio Mendes', specialty: 'Barba & navalha', initials: 'CM', tone: 'cream' },
  { id: 'rafa', name: 'Rafa Lins', specialty: 'Clássicos & textura', initials: 'RL', tone: 'sand' },
]

export const scheduleDays = [
  { id: 'ter', week: 'TER', day: '14', label: 'Hoje' },
  { id: 'qua', week: 'QUA', day: '15', label: 'Amanhã' },
  { id: 'qui', week: 'QUI', day: '16', label: 'Qui, 16' },
  { id: 'sex', week: 'SEX', day: '17', label: 'Sex, 17' },
  { id: 'sab', week: 'SÁB', day: '18', label: 'Sáb, 18' },
]

export const slotsByDay: Record<string, Slot[]> = {
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

export const testimonials = [
  { quote: 'Não é só corte. Você entra no ritmo certo antes mesmo de sentar.', name: 'Bruno Oliveira', detail: 'cliente desde 2021', rating: '5.0' },
  { quote: 'A barba ficou com desenho, mas sem parecer montada. Precisão real.', name: 'Theo Ramos', detail: 'Barba Ritual', rating: '5.0' },
  { quote: 'Espaço, atendimento e tempo de cadeira. Tudo tem intenção.', name: 'André Fraga', detail: 'Combo 13', rating: '5.0' },
]
