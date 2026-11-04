import { useState } from 'react'

type Props = { src: string; alt: string; classe: string; dica: string }

/** Foto do produto ou, enquanto o arquivo não existir em public/assets, um placeholder com o nome esperado. */
export function Foto({ src, alt, classe, dica }: Props) {
  const [srcComErro, setSrcComErro] = useState<string | null>(null)
  if (srcComErro === src) {
    return (
      <div className={'placeholder ' + classe} role="img" aria-label={alt}>
        <span>{src.replace('/assets/', '')}</span>
        <small>{dica}</small>
      </div>
    )
  }
  return <img className={'foto ' + classe} src={src} alt={alt} onError={() => setSrcComErro(src)} />
}
