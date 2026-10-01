import * as migration_20261001_042023 from './20261001_042023';
import * as migration_20261001_060702 from './20261001_060702';
import * as migration_20261001_062457 from './20261001_062457';
import * as migration_20261001_063228 from './20261001_063228';

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
    name: '20261001_063228'
  },
];
