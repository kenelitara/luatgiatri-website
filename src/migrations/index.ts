import * as migration_20261001_042023 from './20261001_042023';
import * as migration_20261001_060702 from './20261001_060702';
import * as migration_20261001_062457 from './20261001_062457';
import * as migration_20261001_063228 from './20261001_063228';
import * as migration_20261001_064058 from './20261001_064058';
import * as migration_20261001_081342 from './20261001_081342';
import * as migration_20261001_085957 from './20261001_085957';
import * as migration_20261001_092326 from './20261001_092326';
import * as migration_20261001_105457 from './20261001_105457';
import * as migration_20261001_165834_search_vector from './20261001_165834_search_vector';
import * as migration_20261002_123501_add_tax_lookups from './20261002_123501_add_tax_lookups';

export const migrations = [
  {
    up: migration_20261001_042023.up,
    down: migration_20261001_042023.down,
    name: '20261001_042023',
  },
  {
    up: migration_20261001_060702.up,
    down: migration_20261001_060702.down,
    name: '20261001_060702',
  },
  {
    up: migration_20261001_062457.up,
    down: migration_20261001_062457.down,
    name: '20261001_062457',
  },
  {
    up: migration_20261001_063228.up,
    down: migration_20261001_063228.down,
    name: '20261001_063228',
  },
  {
    up: migration_20261001_064058.up,
    down: migration_20261001_064058.down,
    name: '20261001_064058',
  },
  {
    up: migration_20261001_081342.up,
    down: migration_20261001_081342.down,
    name: '20261001_081342',
  },
  {
    up: migration_20261001_085957.up,
    down: migration_20261001_085957.down,
    name: '20261001_085957',
  },
  {
    up: migration_20261001_092326.up,
    down: migration_20261001_092326.down,
    name: '20261001_092326',
  },
  {
    up: migration_20261001_105457.up,
    down: migration_20261001_105457.down,
    name: '20261001_105457',
  },
  {
    up: migration_20261001_165834_search_vector.up,
    down: migration_20261001_165834_search_vector.down,
    name: '20261001_165834_search_vector',
  },
  {
    up: migration_20261002_123501_add_tax_lookups.up,
    down: migration_20261002_123501_add_tax_lookups.down,
    name: '20261002_123501_add_tax_lookups'
  },
];
