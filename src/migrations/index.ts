import * as migration_20261001_042023 from './20261001_042023';
import * as migration_20261001_060702 from './20261001_060702';

export const migrations = [
  {
    up: migration_20261001_042023.up,
    down: migration_20261001_042023.down,
    name: '20261001_042023',
  },
  {
    up: migration_20261001_060702.up,
    down: migration_20261001_060702.down,
    name: '20261001_060702'
  },
];
