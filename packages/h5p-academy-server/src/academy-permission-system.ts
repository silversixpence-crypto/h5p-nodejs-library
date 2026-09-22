import {
    ContentPermission,
    GeneralPermission,
    IPermissionSystem,
    IUser,
    TemporaryFilePermission,
    UserDataPermission
} from '@lumieducation/h5p-server';

import { AcademyUser } from './runtime';

function academyUser(user: IUser): AcademyUser | null {
    return user instanceof AcademyUser ? user : null;
}

/**
 * Least-privilege permissions for a single Academy authoring session.
 * The Worker constructs the scope; browser-provided Academy headers are removed
 * before the request reaches this process.
 */
export class AcademyPermissionSystem implements IPermissionSystem {
    public async checkForContent(
        actingUser: IUser,
        permission: ContentPermission,
        contentId: string | undefined
    ): Promise<boolean> {
        const user = academyUser(actingUser);
        if (!user) return false;
        if (permission === ContentPermission.Create) return true;
        if (
            permission === ContentPermission.Edit ||
            permission === ContentPermission.Embed ||
            permission === ContentPermission.View
        ) {
            return Boolean(contentId) && contentId === user.scopedContentId;
        }
        return false;
    }

    public async checkForUserData(
        _actingUser: IUser,
        _permission: UserDataPermission,
        _contentId: string,
        _affectedUserId?: string
    ): Promise<boolean> {
        return false;
    }

    public async checkForTemporaryFile(
        actingUser: IUser,
        permission: TemporaryFilePermission,
        _filename: string | undefined
    ): Promise<boolean> {
        if (!academyUser(actingUser)) return false;
        // The filesystem adapter additionally binds every temp file to user.id.
        return permission !== TemporaryFilePermission.List;
    }

    public async checkForGeneralAction(
        actingUser: IUser,
        _permission: GeneralPermission
    ): Promise<boolean> {
        return academyUser(actingUser)?.operationSet === 'admin';
    }
}
