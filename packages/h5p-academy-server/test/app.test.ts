import request from 'supertest';

import { AcademyH5pRuntime, createAcademyH5pApp } from '../src/app';

const trustedHeaders = {
    'x-academy-session-id': 'session_1',
    'x-academy-workspace-id': 'workspace_1',
    'x-academy-actor-id': 'actor_1',
    'x-academy-draft-id': 'draft_1',
    'x-academy-lesson-id': 'lesson_1',
    'x-academy-block-id': 'block_1',
    'x-academy-content-id': 'new-content',
    'x-academy-operation-set': 'admin',
    'x-academy-parent-origin': 'https://workspace.example'
};

function withTrustedHeaders(testRequest: request.Test): request.Test {
    return Object.entries(trustedHeaders).reduce(
        (current, [name, value]) => current.set(name, value),
        testRequest
    );
}

function fakeRuntime(): AcademyH5pRuntime {
    const metadata = {
        title: 'Decision path',
        mainLibrary: 'H5P.BranchingScenario',
        preloadedDependencies: []
    };
    return {
        ajaxRouter: (_request, response) => response.status(404).end(),
        contentExists: async (contentId) => contentId === 'existing-content',
        getContentMetadata: async () => metadata,
        renderEditor: async (contentId) =>
            `<html><body>${contentId ?? 'native-content-type-chooser'}</body></html>`,
        saveContent: async () => ({
            contentId: 'created-content',
            metadata
        })
    };
}

describe('Academy H5P runtime', () => {
    it('reports readiness without exposing authoring routes', async () => {
        const app = createAcademyH5pApp();

        const health = await request(app).get('/health');
        expect(health.status).toBe(200);
        expect(health.body).toEqual({ ok: true, runtime: 'lumi-h5p' });

        const editor = await request(app).get('/editor/new-content');
        expect(editor.status).toBe(401);
        expect(editor.headers['set-cookie']).toBeUndefined();
    });

    it('accepts only complete trusted Academy scope headers', async () => {
        const app = createAcademyH5pApp();
        const response = await request(app)
            .get('/editor/content_1')
            .set('x-academy-session-id', 'session_1')
            .set('x-academy-actor-id', 'actor_1');

        expect(response.status).toBe(401);
    });

    it('renders the native chooser for a new scoped content record', async () => {
        const app = createAcademyH5pApp({
            loadRuntime: async () => fakeRuntime(),
            parentOrigin: 'https://academy.example'
        });
        const response = await withTrustedHeaders(
            request(app).get('/editor/new-content')
        );

        expect(response.status).toBe(200);
        expect(response.text).toContain('native-content-type-chooser');
        expect(response.headers['cache-control']).toBe('private, no-store');
        expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('saves through Lumi, persists state, and reports the real content id', async () => {
        let persisted = 0;
        const app = createAcademyH5pApp({
            loadRuntime: async () => fakeRuntime(),
            parentOrigin: 'https://academy.example',
            persistState: async () => {
                persisted += 1;
            }
        });
        const response = await withTrustedHeaders(
            request(app)
                .post('/editor/new-content')
                .send({
                    library: 'H5P.BranchingScenario 1.8',
                    params: {
                        metadata: { title: 'Decision path' },
                        params: { branchingScenario: {} }
                    }
                })
        );

        expect(response.status).toBe(200);
        expect(JSON.parse(response.text)).toEqual({
            contentId: 'created-content'
        });
        expect(persisted).toBe(1);
    });

    it('normalizes numeric Lumi ids before confirming a saved activity', async () => {
        const runtime = fakeRuntime();
        runtime.saveContent = async () => ({
            contentId: 578619162,
            metadata: {
                title: 'Release, pause or return?',
                mainLibrary: 'H5P.MultiChoice'
            }
        });
        const app = createAcademyH5pApp({
            loadRuntime: async () => runtime,
            parentOrigin: 'https://academy.example'
        });

        const saved = await withTrustedHeaders(
            request(app)
                .post('/editor/new-content')
                .send({
                    library: 'H5P.MultiChoice 1.16',
                    params: {
                        metadata: { title: 'Release, pause or return?' },
                        params: { question: 'What should the operator do?' }
                    }
                })
        );
        expect(JSON.parse(saved.text)).toEqual({ contentId: '578619162' });

        const confirmation = await withTrustedHeaders(
            request(app).get('/h5p/saved/578619162')
        );
        expect(confirmation.status).toBe(200);
        expect(confirmation.text).toContain('academy:h5p:saved');
        expect(confirmation.text).toContain('578619162');
    });

    it('rejects malformed editor payloads before they reach Lumi', async () => {
        const runtime = fakeRuntime();
        runtime.saveContent = jest.fn(runtime.saveContent);
        const app = createAcademyH5pApp({
            loadRuntime: async () => runtime,
            parentOrigin: 'https://academy.example'
        });

        const response = await withTrustedHeaders(
            request(app).post('/editor/new-content').send({ params: {} })
        );

        expect(response.status).toBe(400);
        expect(runtime.saveContent).not.toHaveBeenCalled();
    });

    it('returns a same-origin completion page with an exact parent message', async () => {
        const app = createAcademyH5pApp({
            loadRuntime: async () => fakeRuntime(),
            parentOrigin: 'https://academy.example'
        });
        const response = await withTrustedHeaders(
            request(app).get('/h5p/saved/created-content')
        ).set('x-academy-content-id', 'created-content');

        expect(response.status).toBe(200);
        expect(response.text).toContain('academy:h5p:saved');
        expect(response.text).toContain('created-content');
        expect(response.text).toContain('https://workspace.example');
        expect(response.text).not.toContain('https://academy.example');
        expect(response.headers['referrer-policy']).toBe('same-origin');
    });
});
