import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';

import { PersistedStateSnapshot } from '../src/persisted-state';

describe('PersistedStateSnapshot', () => {
    let root: string;

    beforeEach(async () => {
        root = await mkdtemp(path.join(os.tmpdir(), 'academy-h5p-'));
    });

    afterEach(async () => {
        await rm(root, { force: true, recursive: true });
    });

    it('starts cleanly when no snapshot has been written', async () => {
        const fetchImpl = jest.fn(
            async () => new Response(null, { status: 404 })
        );
        const snapshot = new PersistedStateSnapshot(
            root,
            'http://academy.storage/runtime-state.tar.gz',
            fetchImpl
        );

        await expect(snapshot.restore()).resolves.toBe(false);
        expect(fetchImpl).toHaveBeenCalledWith(
            'http://academy.storage/runtime-state.tar.gz',
            expect.objectContaining({ method: 'GET' })
        );
    });

    it('round-trips the entire H5P state through the storage endpoint', async () => {
        let archive: Uint8Array | undefined;
        const fetchImpl = jest.fn(async (_url: string, init?: RequestInit) => {
            if (init?.method === 'PUT') {
                archive = new Uint8Array(init.body as ArrayBuffer);
                return new Response(null, { status: 204 });
            }
            return archive
                ? new Response(archive, { status: 200 })
                : new Response(null, { status: 404 });
        });
        const snapshot = new PersistedStateSnapshot(
            root,
            'http://academy.storage/runtime-state.tar.gz',
            fetchImpl
        );

        await writeFile(
            path.join(root, 'content.json'),
            '{"title":"Scenario"}'
        );
        await snapshot.persist();
        await rm(path.join(root, 'content.json'));

        await expect(snapshot.restore()).resolves.toBe(true);
        await expect(
            readFile(path.join(root, 'content.json'), 'utf8')
        ).resolves.toBe('{"title":"Scenario"}');
    });

    it('serializes concurrent writes so snapshots cannot corrupt one another', async () => {
        let active = 0;
        let maxActive = 0;
        const fetchImpl = jest.fn(async (_url: string, init?: RequestInit) => {
            if (init?.method === 'PUT') {
                active += 1;
                maxActive = Math.max(maxActive, active);
                await new Promise((resolve) => setTimeout(resolve, 10));
                active -= 1;
            }
            return new Response(null, { status: 204 });
        });
        const snapshot = new PersistedStateSnapshot(
            root,
            'http://academy.storage/runtime-state.tar.gz',
            fetchImpl
        );
        await writeFile(path.join(root, 'content.json'), '{}');

        await Promise.all([snapshot.persist(), snapshot.persist()]);

        expect(maxActive).toBe(1);
    });
});
