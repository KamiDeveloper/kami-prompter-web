export interface DiffSegment {
  text: string
  type: 'unchanged' | 'added' | 'removed' | 'restructured'
}

function lcsMatrix(a: string[], b: string[]): number[][] {
  const matrix = Array.from({ length: a.length + 1 }, () => Array.from({ length: b.length + 1 }, () => 0))

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1])
      }
    }
  }

  return matrix
}

/**
 * Calcula segmentos de diff linea a linea con LCS simplificado.
 * @param original Texto original.
 * @param improved Texto mejorado.
 * @returns Segmentos tipados para resaltado de cambios.
 */
export function parseDiff(original: string, improved: string): DiffSegment[] {
  const a = original === '' ? [] : original.split('\n')
  const b = improved === '' ? [] : improved.split('\n')
  const matrix = lcsMatrix(a, b)

  const rawSegments: DiffSegment[] = []
  let i = a.length
  let j = b.length

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      rawSegments.push({ text: a[i - 1], type: 'unchanged' })
      i -= 1
      j -= 1
      continue
    }

    if (matrix[i - 1][j] >= matrix[i][j - 1]) {
      rawSegments.push({ text: a[i - 1], type: 'removed' })
      i -= 1
    } else {
      rawSegments.push({ text: b[j - 1], type: 'added' })
      j -= 1
    }
  }

  while (i > 0) {
    rawSegments.push({ text: a[i - 1], type: 'removed' })
    i -= 1
  }

  while (j > 0) {
    rawSegments.push({ text: b[j - 1], type: 'added' })
    j -= 1
  }

  const segments = rawSegments.reverse()

  for (let index = 0; index < segments.length - 1; index += 1) {
    const current = segments[index]
    const next = segments[index + 1]

    const isReplacement =
      (current.type === 'removed' && next.type === 'added') ||
      (current.type === 'added' && next.type === 'removed')

    if (isReplacement) {
      current.type = 'restructured'
      next.type = 'restructured'
    }
  }

  return segments
}
