import { Storage } from 'happy-dom';
import { vi } from 'vitest';

// Node 25 also defines Web Storage. Use isolated browser storage for DOM tests.
vi.stubGlobal('localStorage', new Storage());
vi.stubGlobal('sessionStorage', new Storage());
