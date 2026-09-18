// Compiled by old TypeScript versions against the packed tarball, as a consumer would.
// Keep the syntax old: `import type` rather than inline `type` modifiers, which need TS 4.5.
import { localizeUnit, normalizeUnit, sumQuantities } from 'cooking-units';
import type { SummedQuantity } from 'cooking-units';

const summed: SummedQuantity[] = sumQuantities([{ amount: '500', unit: 'g' }, { amount: '1', unit: 'kg' }]);
const unit: string | undefined = normalizeUnit('eetlepels');

if (unit !== 'tbsp' || summed[0]?.unit !== 'kg' || localizeUnit('tbsp', 'nl') !== 'el') {
  throw new Error(`unexpected result: ${unit} ${JSON.stringify(summed)}`);
}
console.log('ok');
