import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { create, extract } from 'tar';

export type SnapshotFetch = (
    input: string,
    init?: RequestInit
) => Promise<Response>;

export class PersistedStateSnapshot {
    public constructor(
        private readonly dataRoot: string,
        private readonly storageUrl: string,
        private readonly fetchImpl: SnapshotFetch = globalThis.fetch.bind(
            globalThis
        )
    ) {}

    private persistenceQueue: Promise<void> = Promise.resolve();

    public async restore(): Promise<boolean> {
        const response = await this.fetchImpl(this.storageUrl, {
            method: 'GET'
        });
        if (response.status === 404) return false;
        if (!response.ok) {
            throw new Error(
                `Could not restore H5P state (${response.status}).`
            );
        }

        const parent = path.dirname(this.dataRoot);
        await mkdir(parent, { recursive: true });
        const restoreRoot = await mkdtemp(
            path.join(parent, '.academy-h5p-restore-')
        );
        const archivePath = path.join(
            os.tmpdir(),
            `academy-h5p-${randomUUID()}.tar.gz`
        );
        try {
            await writeFile(
                archivePath,
                Buffer.from(await response.arrayBuffer())
            );
            await extract({
                cwd: restoreRoot,
                file: archivePath,
                gzip: true,
                preservePaths: false,
                strict: true
            });
            await rm(this.dataRoot, { force: true, recursive: true });
            await rename(restoreRoot, this.dataRoot);
            return true;
        } finally {
            await rm(archivePath, { force: true });
            await rm(restoreRoot, { force: true, recursive: true });
        }
    }

    public persist(): Promise<void> {
        const operation = this.persistenceQueue.then(() =>
            this.createAndUploadSnapshot()
        );
        this.persistenceQueue = operation.catch(() => undefined);
        return operation;
    }

    private async createAndUploadSnapshot(): Promise<void> {
        await mkdir(this.dataRoot, { recursive: true });
        const archivePath = path.join(
            os.tmpdir(),
            `academy-h5p-${randomUUID()}.tar.gz`
        );
        try {
            await create(
                {
                    cwd: this.dataRoot,
                    file: archivePath,
                    gzip: true,
                    portable: true
                },
                ['.']
            );
            const archive = await readFile(archivePath);
            const response = await this.fetchImpl(this.storageUrl, {
                body: archive,
                headers: { 'content-type': 'application/gzip' },
                method: 'PUT'
            });
            if (!response.ok) {
                throw new Error(
                    `Could not persist H5P state (${response.status}).`
                );
            }
        } finally {
            await rm(archivePath, { force: true });
        }
    }
}
