import * as migration_20261001_042023 from './20261001_042023';

export const migrations = [
  {
    up: migration_20261001_042023.up,
    down: migration_20261001_042023.down,
    name: '20261001_042023'
  },
];
