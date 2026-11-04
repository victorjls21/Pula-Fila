export const RETIRADA_IMEDIATA = 'Assim que ficar pronto'

const QUINZE_MINUTOS = 15 * 60_000

/** "Assim que ficar pronto" + 6 horários de 15 em 15 min, a partir de pelo menos 10 min de agora. */
export function gerarHorariosRetirada(agora: Date, quantidade = 6): string[] {
  const base = new Date(agora)
  base.setMinutes(Math.ceil((agora.getMinutes() + 10) / 15) * 15, 0, 0)
  const horarios = [RETIRADA_IMEDIATA]
  for (let i = 0; i < quantidade; i++) {
    const h = new Date(base.getTime() + i * QUINZE_MINUTOS)
    horarios.push(String(h.getHours()).padStart(2, '0') + ':' + String(h.getMinutes()).padStart(2, '0'))
  }
  return horarios
}
