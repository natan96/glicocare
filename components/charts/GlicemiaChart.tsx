'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Ponto {
  recorded_at: string
  value: number
  context: string
}

interface Props {
  dados: Ponto[]
  modo: 'dia' | 'semana' | 'mes'
}

const contextoLabel: Record<string, string> = {
  'jejum': 'Jejum',
  'pre-refeicao': 'Pré-ref.',
  'pos-refeicao': 'Pós-ref.',
  'antes-dormir': 'Ao dormir',
  'outro': 'Outro',
}

export default function GlicemiaChart({ dados, modo }: Props) {
  const pontos = dados.map(d => ({
    hora: format(new Date(d.recorded_at), modo === 'dia' ? 'HH:mm' : 'dd/MM HH:mm', { locale: ptBR }),
    valor: d.value,
    contexto: contextoLabel[d.context] ?? d.context,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={pontos} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="hora"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[40, 320]}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => [`${value} mg/dL`, 'Glicemia']}
          labelStyle={{ fontSize: 12 }}
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
        />
        {/* Faixas de referência */}
        <ReferenceLine y={70} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1.5} />
        <ReferenceLine y={180} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1.5} />
        <ReferenceLine y={54} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} />
        <ReferenceLine y={250} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} />
        <Line
          type="monotone"
          dataKey="valor"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#1d4ed8' }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
