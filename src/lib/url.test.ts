import { describe, expect, test } from 'bun:test'
import { parseNumberParam } from './url'

describe('parseNumberParam', () => {
  test('reads a valid start number', () => {
    expect(parseNumberParam('?n=1004')).toBe('1004')
  })

  test('ignores a missing, short, repdigit or leading-zero value', () => {
    for (const search of ['', '?n=', '?n=123', '?n=1111', '?n=0123', '?n=12345', '?n=12a4']) {
      expect(parseNumberParam(search)).toBeNull()
    }
  })

  test('keeps other params out of the way', () => {
    expect(parseNumberParam('?utm=x&n=3524')).toBe('3524')
  })
})
