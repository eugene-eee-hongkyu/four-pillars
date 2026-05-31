import { describe, test, expect } from 'vitest';
import { maskName, maskLocation, maskBirthDate, formatBirthTime, shouldUnmask } from './mask';

describe('maskName', () => {
  test('2자 한글: 홍규 → 홍*', () => expect(maskName('홍규')).toBe('홍*'));
  test('3자 한글: 이재훈 → 이*훈', () => expect(maskName('이재훈')).toBe('이*훈'));
  test('4자 한글: 남궁민수 → 남**수', () => expect(maskName('남궁민수')).toBe('남**수'));
  test('5자 한글: 황보재석호 → 황***호', () => expect(maskName('황보재석호')).toBe('황***호'));
  test('1자: ㅁ → *', () => expect(maskName('가')).toBe('*'));
  test('빈 값: null → ""', () => expect(maskName(null)).toBe(''));
  test('빈 값: undefined → ""', () => expect(maskName(undefined)).toBe(''));
  test('공백만: "  " → ""', () => expect(maskName('  ')).toBe(''));
  test('영문 4자: John → J**n', () => expect(maskName('John')).toBe('J**n'));
});

describe('maskLocation', () => {
  test('서울특별시 → 서울**시', () => expect(maskLocation('서울특별시')).toBe('서울**시'));
  test('경기도 → 서울*도... 아니 경기도 → 경기*도', () => expect(maskLocation('경기도')).toBe('경기*도'));
  test('서울 → 서울*', () => expect(maskLocation('서울')).toBe('서*'));
  test('null → ""', () => expect(maskLocation(null)).toBe(''));
});

describe('maskBirthDate', () => {
  test('2015-05-15 → 201*-05-15', () => expect(maskBirthDate(2015, 5, 15)).toBe('201*-05-15'));
  test('월일 zero-pad', () => expect(maskBirthDate(1990, 1, 3)).toBe('199*-01-03'));
});

describe('formatBirthTime', () => {
  test('12:00', () => expect(formatBirthTime(12, 0)).toBe('12:00'));
  test('null hour → 시간모름', () => expect(formatBirthTime(null, null)).toBe('시간모름'));
  test('null minute defaults 0', () => expect(formatBirthTime(9, null)).toBe('09:00'));
});

describe('shouldUnmask', () => {
  test('"1" → true', () => expect(shouldUnmask('1')).toBe(true));
  test('"0" → false', () => expect(shouldUnmask('0')).toBe(false));
  test('undefined → false', () => expect(shouldUnmask(undefined)).toBe(false));
  test('array ["1"] → true', () => expect(shouldUnmask(['1'])).toBe(true));
});
