import { describe, expect, test } from 'bun:test'
import { parseInputParam } from './url'

describe('parseInputParam', () => {
  test('reads n as the field would hold it if typed: digits only, at most 4', () => {
    expect(parseInputParam('?n=1004')).toBe('1004')
    expect(parseInputParam('?n=12345')).toBe('1234')
    expect(parseInputParam('?n=1,234')).toBe('1234')
    expect(parseInputParam('?n=abcd')).toBe('')
  })

  test('keeps an unusable number, so the page can say why it cannot run', () => {
    expect(parseInputParam('?n=1111')).toBe('1111')
    expect(parseInputParam('?n=0999')).toBe('0999')
  })

  test('is null with no n, and ignores other params', () => {
    expect(parseInputParam('')).toBeNull()
    expect(parseInputParam('?utm=x&n=3524')).toBe('3524')
  })
})
