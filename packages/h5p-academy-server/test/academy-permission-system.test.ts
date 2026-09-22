import {
    ContentPermission,
    GeneralPermission,
    TemporaryFilePermission,
    UserDataPermission
} from '@lumieducation/h5p-server';

import { AcademyPermissionSystem } from '../src/academy-permission-system';
import { AcademyAuthoringScope } from '../src/app';
import { AcademyUser } from '../src/runtime';

function user(operationSet: 'editor' | 'admin'): AcademyUser {
    const scope: AcademyAuthoringScope = {
        actorId: 'actor_1',
        blockId: 'block_1',
        contentId: 'content_1',
        draftId: 'draft_1',
        lessonId: 'lesson_1',
        operationSet,
        parentOrigin: 'https://academy.example',
        sessionId: 'session_1',
        workspaceId: 'workspace_1'
    };
    return new AcademyUser(scope);
}

describe('Academy H5P permission system', () => {
    const permissions = new AcademyPermissionSystem();

    it('limits content reads and edits to the session content', async () => {
        const editor = user('editor');
        await expect(
            permissions.checkForContent(
                editor,
                ContentPermission.Create,
                undefined
            )
        ).resolves.toBe(true);
        await expect(
            permissions.checkForContent(
                editor,
                ContentPermission.Edit,
                'content_1'
            )
        ).resolves.toBe(true);
        await expect(
            permissions.checkForContent(
                editor,
                ContentPermission.View,
                'content_2'
            )
        ).resolves.toBe(false);
        await expect(
            permissions.checkForContent(
                editor,
                ContentPermission.Download,
                'content_1'
            )
        ).resolves.toBe(false);
    });

    it('reserves library installation and restricted types for Academy admins', async () => {
        for (const permission of [
            GeneralPermission.CreateRestricted,
            GeneralPermission.InstallRecommended,
            GeneralPermission.UpdateAndInstallLibraries
        ]) {
            await expect(
                permissions.checkForGeneralAction(user('editor'), permission)
            ).resolves.toBe(false);
            await expect(
                permissions.checkForGeneralAction(user('admin'), permission)
            ).resolves.toBe(true);
        }
    });

    it('allows actor-owned temporary files but disables learner-state APIs', async () => {
        await expect(
            permissions.checkForTemporaryFile(
                user('editor'),
                TemporaryFilePermission.Create,
                undefined
            )
        ).resolves.toBe(true);
        await expect(
            permissions.checkForUserData(
                user('editor'),
                UserDataPermission.ViewState,
                'content_1'
            )
        ).resolves.toBe(false);
    });
});
