export type GlicemiaFaixa = 'critico-baixo' | 'baixo' | 'normal' | 'elevado' | 'critico-alto'

export interface ClassificacaoGlicemia {
  faixa: GlicemiaFaixa
  label: string
  cor: string
  corBg: string
  corTexto: string
  critico: boolean
}

export function classificarGlicemia(valor: number): ClassificacaoGlicemia {
  if (valor < 54) {
    return {
      faixa: 'critico-baixo',
      label: 'Hipoglicemia severa',
      cor: '#ef4444',
      corBg: 'bg-red-100',
      corTexto: 'text-red-700',
      critico: true,
    }
  }
  if (valor < 70) {
    return {
      faixa: 'baixo',
      label: 'Hipoglicemia',
      cor: '#f97316',
      corBg: 'bg-orange-100',
      corTexto: 'text-orange-700',
      critico: false,
    }
  }
  if (valor <= 180) {
    return {
      faixa: 'normal',
      label: 'Faixa alvo',
      cor: '#22c55e',
      corBg: 'bg-green-100',
      corTexto: 'text-green-700',
      critico: false,
    }
  }
  if (valor <= 250) {
    return {
      faixa: 'elevado',
      label: 'Hiperglicemia leve',
      cor: '#eab308',
      corBg: 'bg-yellow-100',
      corTexto: 'text-yellow-700',
      critico: false,
    }
  }
  return {
    faixa: 'critico-alto',
    label: 'Hiperglicemia severa',
    cor: '#ef4444',
    corBg: 'bg-red-100',
    corTexto: 'text-red-700',
    critico: true,
  }
}

export function ehCritico(valor: number): boolean {
  return valor < 54 || valor > 250
}
