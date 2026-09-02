// RFC 5545 text primitives, shared by the subscription feed the Worker serves
// and the single-event download the client generates.

/**
 * Escape a value for an iCalendar TEXT field.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function escapeIcsText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

/**
 * YYYY-MM-DD → YYYYMMDD, the DATE value format.
 *
 * @param {string} dateStr
 * @returns {string}
 */
export function compactDate(dateStr) {
  return String(dateStr).replace(/-/g, '');
}

/**
 * The day after `dateStr` as YYYYMMDD. All-day VEVENTs take an exclusive
 * DTEND, so a one-day holiday ends on the following morning.
 *
 * @param {string} dateStr
 * @returns {string}
 */
export function nextDayCompact(dateStr) {
  const [year, month, day] = String(dateStr).split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));

  return [
    next.getUTCFullYear(),
    String(next.getUTCMonth() + 1).padStart(2, '0'),
    String(next.getUTCDate()).padStart(2, '0')
  ].join('');
}

const MAX_OCTETS = 75;
const encoder = new TextEncoder();

/**
 * Fold a content line as RFC 5545 requires; Outlook rejects feeds that ignore
 * this.
 *
 * The limit counts UTF-8 octets, not characters, so a CJK summary reaches it
 * at 25 characters rather than 75. Iteration is over code points, so a
 * surrogate pair is never cut in half — slicing by code unit would turn an
 * emoji into two replacement characters.
 *
 * @param {string} line
 * @returns {string}
 */
export function foldLine(line) {
  if (encoder.encode(line).length <= MAX_OCTETS) return line;

  const chunks = [];
  let current = '';
  let octets = 0;
  // The first line gets the whole budget; every continuation spends one octet
  // on the leading space that marks it as one.
  let budget = MAX_OCTETS;

  for (const char of line) {
    const size = encoder.encode(char).length;

    if (octets + size > budget) {
      chunks.push(current);
      current = '';
      octets = 0;
      budget = MAX_OCTETS - 1;
    }

    current += char;
    octets += size;
  }

  if (current) chunks.push(current);

  return chunks.map((chunk, index) => (index === 0 ? chunk : ` ${chunk}`)).join('\r\n');
}
