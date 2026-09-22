import { createAcademyH5pApp } from './app';
import { createLumiRuntime } from './lumi-runtime';
import { PersistedStateSnapshot } from './persisted-state';

const port = Number.parseInt(process.env.PORT ?? '8080', 10);
const dataRoot = process.env.H5P_DATA_ROOT ?? '/data/h5p';
const storageUrl =
    process.env.ACADEMY_STORAGE_URL ??
    'http://academy.storage/runtime-state.tar.gz';
const snapshot = new PersistedStateSnapshot(dataRoot, storageUrl);

let runtimePromise: ReturnType<typeof createLumiRuntime> | undefined;

function loadRuntime(): ReturnType<typeof createLumiRuntime> {
    if (!runtimePromise) {
        runtimePromise = snapshot.restore().then(() =>
            createLumiRuntime({
                assetsRoot: process.env.H5P_ASSETS_ROOT,
                dataRoot
            })
        );
    }
    return runtimePromise;
}

const app = createAcademyH5pApp({
    loadRuntime,
    parentOrigin: process.env.ACADEMY_PARENT_ORIGIN,
    persistState: () => snapshot.persist()
});

app.listen(port, '0.0.0.0', () => {
    console.log(`LedgerBrain Academy H5P runtime listening on ${port}.`);
});
