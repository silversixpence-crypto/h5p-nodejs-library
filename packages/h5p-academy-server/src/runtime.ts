import type { RequestHandler } from 'express';

import type { AcademyAuthoringScope, AcademyH5pRuntime } from './app';
import { applyLedgerBrainEditorTheme } from './editor-theme';

interface H5pEditorPort {
    contentStorage: {
        contentExists(contentId: string): Promise<boolean>;
        getMetadata(
            contentId: string,
            user?: AcademyUser
        ): Promise<{ title: string; mainLibrary?: string }>;
    };
    render(
        contentId: string | undefined,
        language: string,
        user: AcademyUser
    ): Promise<string>;
    saveOrUpdateContentReturnMetaData(
        contentId: string | undefined,
        parameters: any,
        metadata: any,
        library: string,
        user: AcademyUser
    ): Promise<{
        id: string;
        metadata: { title: string; mainLibrary?: string };
    }>;
}

interface EditorPayload {
    library: string;
    params: {
        metadata: Record<string, unknown>;
        params: unknown;
    };
}

export class AcademyUser {
    public constructor(scope: AcademyAuthoringScope) {
        this.id = scope.actorId;
        this.email = `${scope.actorId}@academy.invalid`;
    }

    public readonly email: string;
    public readonly id: string;
    public readonly name = 'Academy author';
    public readonly type = 'local';
}

export function createRuntimeAdapter(
    editor: H5pEditorPort,
    ajaxRouter: RequestHandler
): AcademyH5pRuntime {
    return {
        ajaxRouter,
        contentExists: (contentId) =>
            editor.contentStorage.contentExists(contentId),
        getContentMetadata: (contentId) =>
            editor.contentStorage.getMetadata(contentId),
        async renderEditor(contentId, scope) {
            const html = await editor.render(
                contentId,
                'en',
                new AcademyUser(scope)
            );
            return applyLedgerBrainEditorTheme(html);
        },
        async saveContent(contentId, body, scope) {
            const payload = body as EditorPayload;
            const saved = await editor.saveOrUpdateContentReturnMetaData(
                contentId,
                payload.params.params,
                payload.params.metadata,
                payload.library,
                new AcademyUser(scope)
            );
            return {
                contentId: saved.id,
                metadata: saved.metadata
            };
        }
    };
}
