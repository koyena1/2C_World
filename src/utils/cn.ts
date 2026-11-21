/** Joins truthy class names: cn('a', cond && 'b', undefined) -> 'a b'. */
export const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');
