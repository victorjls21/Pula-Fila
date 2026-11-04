import { createContext, useContext } from 'react'
import type { Servicos } from '../servicos/servicos'

/** Inversão de dependência: as telas recebem os serviços prontos, sem saber onde os dados ficam. */
export const ServicosContext = createContext<Servicos | null>(null)

export function useServicos(): Servicos {
  const servicos = useContext(ServicosContext)
  if (!servicos) throw new Error('useServicos precisa estar dentro de <ServicosContext.Provider>.')
  return servicos
}
