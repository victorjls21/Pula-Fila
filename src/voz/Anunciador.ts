/** Quem fala no balcão. A tela não sabe se é a voz do navegador, um alto-falante de verdade ou um teste. */
export interface Anunciador {
  readonly disponivel: boolean
  anunciar(texto: string): void
}

/** Síntese de voz nativa do navegador (Web Speech API), em português do Brasil. */
export class VozDoNavegador implements Anunciador {
  get disponivel(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  anunciar(texto: string): void {
    if (!this.disponivel) return
    const fala = new SpeechSynthesisUtterance(texto)
    fala.lang = 'pt-BR'
    fala.rate = 0.95
    const voz = window.speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').toLowerCase() === 'pt-br')
    if (voz) fala.voice = voz
    // speak() enfileira: duas senhas prontas ao mesmo tempo são lidas uma depois da outra.
    window.speechSynthesis.speak(fala)
  }
}
