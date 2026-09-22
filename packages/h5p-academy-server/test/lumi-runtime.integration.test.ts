import { mkdtemp, rm } from 'fs/promises';
import os from 'os';
import path from 'path';
import request from 'supertest';

import { createAcademyH5pApp } from '../src/app';
import { createLumiRuntime } from '../src/lumi-runtime';

const trustedHeaders = {
    'x-academy-session-id': 'session_1',
    'x-academy-workspace-id': 'workspace_1',
    'x-academy-actor-id': 'actor_1',
    'x-academy-draft-id': 'draft_1',
    'x-academy-lesson-id': 'lesson_1',
    'x-academy-block-id': 'block_1',
    'x-academy-content-id': 'new-content',
    'x-academy-parent-origin': 'https://academy.example'
};

function scoped(testRequest: request.Test): request.Test {
    return Object.entries(trustedHeaders).reduce(
        (current, [name, value]) => current.set(name, value),
        testRequest
    );
}

describe('native Lumi integration', () => {
    let dataRoot: string;

    beforeEach(async () => {
        dataRoot = await mkdtemp(path.join(os.tmpdir(), 'academy-lumi-'));
    });

    afterEach(async () => {
        await rm(dataRoot, { force: true, recursive: true });
    });

    it('renders the generic editor and serves its native client assets', async () => {
        const runtime = await createLumiRuntime({
            assetsRoot: path.resolve(__dirname, '../../h5p-examples/h5p'),
            dataRoot
        });
        const app = createAcademyH5pApp({
            loadRuntime: async () => runtime,
            parentOrigin: 'https://academy.example'
        });

        const editor = await scoped(request(app).get('/editor/new-content'));
        expect(editor.status).toBe(200);
        expect(editor.text).toContain('window.H5PIntegration');
        expect(editor.text).toContain('class="h5p-editor"');

        const asset = await scoped(
            request(app).get('/h5p/editor/scripts/h5peditor.js')
        );
        expect(asset.status).toBe(200);
        expect(asset.headers['content-type']).toContain('javascript');
    });
});
