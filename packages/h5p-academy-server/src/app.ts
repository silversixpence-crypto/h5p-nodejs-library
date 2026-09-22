import express, { NextFunction, Request, Response } from 'express';
import fileUpload from 'express-fileupload';

export interface AcademyH5pContentMetadata {
    title: string;
    mainLibrary?: string;
    preloadedDependencies?: unknown[];
}

export interface AcademyH5pRuntime {
    ajaxRouter: express.RequestHandler;
    contentExists(contentId: string): Promise<boolean>;
    getContentMetadata(contentId: string): Promise<AcademyH5pContentMetadata>;
    renderEditor(
        contentId: string | undefined,
        scope: AcademyAuthoringScope
    ): Promise<string>;
    saveContent(
        contentId: string | undefined,
        body: unknown,
        scope: AcademyAuthoringScope
    ): Promise<{
        contentId: string;
        metadata: AcademyH5pContentMetadata;
    }>;
}

export interface AcademyH5pAppOptions {
    loadRuntime?: () => Promise<AcademyH5pRuntime>;
    parentOrigin?: string;
    persistState?: () => Promise<void>;
}

export interface AcademyAuthoringScope {
    sessionId: string;
    workspaceId: string;
    actorId: string;
    draftId: string;
    lessonId: string;
    parentOrigin: string;
    blockId: string;
    contentId: string;
    operationSet: 'editor' | 'admin';
}

const scopeHeaders = {
    sessionId: 'x-academy-session-id',
    workspaceId: 'x-academy-workspace-id',
    actorId: 'x-academy-actor-id',
    draftId: 'x-academy-draft-id',
    lessonId: 'x-academy-lesson-id',
    parentOrigin: 'x-academy-parent-origin',
    blockId: 'x-academy-block-id',
    contentId: 'x-academy-content-id',
    operationSet: 'x-academy-operation-set'
} as const;

function readAuthoringScope(request: Request): AcademyAuthoringScope | null {
    const entries = Object.entries(scopeHeaders).map(([key, header]) => [
        key,
        request.header(header)
    ]);
    if (entries.some(([, value]) => !value)) return null;
    const scope = Object.fromEntries(
        entries
    ) as unknown as AcademyAuthoringScope;
    if (scope.operationSet !== 'editor' && scope.operationSet !== 'admin') {
        return null;
    }
    return scope;
}

function asyncRoute(
    handler: (
        request: Request,
        response: Response,
        next: NextFunction
    ) => Promise<void>
): express.RequestHandler {
    return (request, response, next) => {
        void handler(request, response, next).catch(next);
    };
}

function serializeForInlineScript(value: unknown): string {
    return JSON.stringify(value).replace(/</g, '\\u003c');
}

function isEditorPayload(value: unknown): value is {
    library: string;
    params: { metadata: Record<string, unknown>; params: unknown };
} {
    if (!value || typeof value !== 'object') return false;
    const body = value as Record<string, unknown>;
    if (typeof body.library !== 'string' || body.library.length === 0) {
        return false;
    }
    if (!body.params || typeof body.params !== 'object') return false;
    const params = body.params as Record<string, unknown>;
    return (
        Object.prototype.hasOwnProperty.call(params, 'params') &&
        Boolean(params.metadata) &&
        typeof params.metadata === 'object'
    );
}

export function createAcademyH5pApp(
    options: AcademyH5pAppOptions = {}
): express.Express {
    const app = express();
    const loadRuntime = options.loadRuntime;
    const parentOrigin = options.parentOrigin ?? 'http://localhost:5173';
    const persistedContentBySession = new Map<string, string>();
    app.disable('x-powered-by');
    app.use(
        fileUpload({
            abortOnLimit: true,
            limits: { fileSize: 64 * 1024 * 1024 }
        })
    );
    app.use(express.json({ limit: '16mb' }));
    app.use(express.urlencoded({ extended: true, limit: '16mb' }));

    app.get('/health', (_request, response) => {
        response.status(200).json({ ok: true, runtime: 'lumi-h5p' });
    });

    app.use((request: Request, response: Response, next: NextFunction) => {
        const scope = readAuthoringScope(request);
        if (!scope) {
            response
                .status(401)
                .set('Cache-Control', 'private, no-store')
                .send('Academy authoring scope required.');
            return;
        }
        response.locals.academyScope = scope;
        next();
    });

    app.get(
        '/editor/:contentId',
        asyncRoute(async (request, response) => {
            const scope = response.locals.academyScope as AcademyAuthoringScope;
            const requestedId = String(request.params.contentId);
            if (requestedId !== scope.contentId) {
                response.status(403).send('Content scope mismatch.');
                return;
            }
            if (!loadRuntime) {
                response.status(503).json({ error: 'H5P_RUNTIME_STARTING' });
                return;
            }
            const runtime = await loadRuntime();
            const isNew = requestedId.startsWith('new-');
            const existingId =
                !isNew && (await runtime.contentExists(requestedId))
                    ? requestedId
                    : undefined;
            const html = await runtime.renderEditor(existingId, scope);
            response
                .status(200)
                .type('html')
                .set('Cache-Control', 'private, no-store')
                .send(html);
        })
    );

    app.post(
        '/editor/:contentId',
        asyncRoute(async (request, response) => {
            const scope = response.locals.academyScope as AcademyAuthoringScope;
            const requestedId = String(request.params.contentId);
            if (requestedId !== scope.contentId) {
                response.status(403).send('Content scope mismatch.');
                return;
            }
            if (!loadRuntime) {
                response.status(503).json({ error: 'H5P_RUNTIME_STARTING' });
                return;
            }
            if (!isEditorPayload(request.body)) {
                response.status(400).send('Malformed H5P editor payload.');
                return;
            }

            const runtime = await loadRuntime();
            const existingId =
                !requestedId.startsWith('new-') &&
                (await runtime.contentExists(requestedId))
                    ? requestedId
                    : undefined;
            const saved = await runtime.saveContent(
                existingId,
                request.body,
                scope
            );
            persistedContentBySession.set(scope.sessionId, saved.contentId);
            await options.persistState?.();
            response
                .status(200)
                .type('text/plain')
                .set('Cache-Control', 'private, no-store')
                .send(JSON.stringify({ contentId: saved.contentId }));
        })
    );

    app.get(
        '/h5p/saved/:contentId',
        asyncRoute(async (request, response) => {
            const scope = response.locals.academyScope as AcademyAuthoringScope;
            const contentId = String(request.params.contentId);
            const savedContentId = persistedContentBySession.get(
                scope.sessionId
            );
            if (contentId !== scope.contentId && contentId !== savedContentId) {
                response.status(403).send('Content scope mismatch.');
                return;
            }
            if (!loadRuntime) {
                response.status(503).json({ error: 'H5P_RUNTIME_STARTING' });
                return;
            }

            const metadata = await (
                await loadRuntime()
            ).getContentMetadata(contentId);
            const message = serializeForInlineScript({
                type: 'academy:h5p:saved',
                contentId,
                title: metadata.title,
                library: metadata.mainLibrary
            });
            const targetParentOrigin = scope.parentOrigin || parentOrigin;
            response
                .status(200)
                .type('html')
                .set('Cache-Control', 'private, no-store')
                .set('Referrer-Policy', 'same-origin')
                .send(
                    `<!doctype html><html><body><script>window.parent.postMessage(${message}, ${serializeForInlineScript(
                        targetParentOrigin
                    )});</script></body></html>`
                );
        })
    );

    app.use('/h5p', async (request, response, next) => {
        if (!loadRuntime) {
            response.status(503).json({ error: 'H5P_RUNTIME_STARTING' });
            return;
        }
        const runtime = await loadRuntime();
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            response.once('finish', () => {
                if (response.statusCode < 400) {
                    void options.persistState?.().catch((error: Error) => {
                        console.error('Could not persist H5P mutation.', error);
                    });
                }
            });
        }
        runtime.ajaxRouter(request, response, next);
    });

    app.use((_request, response) => response.status(404).end());

    app.use(
        (
            error: Error,
            _request: Request,
            response: Response,
            _next: NextFunction
        ) => {
            response
                .status(500)
                .set('Cache-Control', 'private, no-store')
                .json({ error: 'H5P_RUNTIME_ERROR', message: error.message });
        }
    );

    return app;
}
