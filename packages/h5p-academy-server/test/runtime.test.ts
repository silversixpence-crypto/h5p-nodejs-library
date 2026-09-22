import { AcademyAuthoringScope } from '../src/app';
import { AcademyUser, createRuntimeAdapter } from '../src/runtime';

const scope: AcademyAuthoringScope = {
    actorId: 'user_123',
    blockId: 'block_1',
    contentId: 'content_1',
    draftId: 'draft_1',
    lessonId: 'lesson_1',
    parentOrigin: 'https://academy.example',
    sessionId: 'session_1',
    workspaceId: 'workspace_1'
};

describe('Academy Lumi adapter', () => {
    it('uses the Clerk actor as Lumi user without inventing profile data', () => {
        expect(new AcademyUser(scope)).toEqual({
            email: 'user_123@academy.invalid',
            id: 'user_123',
            name: 'Academy author',
            type: 'local'
        });
    });

    it('adapts native render, save, and metadata operations', async () => {
        const editor = {
            contentStorage: {
                contentExists: jest.fn(async () => true),
                getMetadata: jest.fn(async () => ({
                    title: 'Decision path',
                    mainLibrary: 'H5P.BranchingScenario'
                }))
            },
            render: jest.fn(async () => '<html>native editor</html>'),
            saveOrUpdateContentReturnMetaData: jest.fn(async () => ({
                id: 'content_2',
                metadata: {
                    title: 'Decision path',
                    mainLibrary: 'H5P.BranchingScenario'
                }
            }))
        };
        const ajaxRouter = jest.fn();
        const runtime = createRuntimeAdapter(editor, ajaxRouter as never);

        await expect(runtime.renderEditor('content_1', scope)).resolves.toBe(
            '<html>native editor</html>'
        );
        await expect(
            runtime.saveContent(
                'content_1',
                {
                    library: 'H5P.BranchingScenario 1.8',
                    params: {
                        metadata: { title: 'Decision path' },
                        params: { branchingScenario: {} }
                    }
                },
                scope
            )
        ).resolves.toEqual({
            contentId: 'content_2',
            metadata: {
                title: 'Decision path',
                mainLibrary: 'H5P.BranchingScenario'
            }
        });
        expect(editor.render).toHaveBeenCalledWith(
            'content_1',
            'en',
            expect.objectContaining({ id: 'user_123' })
        );
    });
});
