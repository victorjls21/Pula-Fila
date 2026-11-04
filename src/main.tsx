import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ServicosContext } from './hooks/contexto.ts'
import { criarServicos } from './servicos/servicos.ts'

// Para trocar o armazenamento (ex.: MemoriaPedidoRepositorio ou uma API), basta mudar criarServicos().
const servicos = criarServicos()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ServicosContext.Provider value={servicos}>
      <App />
    </ServicosContext.Provider>
  </StrictMode>,
)
