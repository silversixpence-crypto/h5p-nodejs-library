import { access, mkdir, writeFile } from 'fs/promises';
import path from 'path';
import express, { NextFunction, Request, Response } from 'express';

import { h5pAjaxExpressRouter } from '@lumieducation/h5p-express';
import * as H5P from '@lumieducation/h5p-server';

import type { AcademyAuthoringScope, AcademyH5pRuntime } from './app';
import { AcademyPermissionSystem } from './academy-permission-system';
import { AcademyUser, createRuntimeAdapter } from './runtime';

export interface LumiRuntimeOptions {
    assetsRoot?: string;
    dataRoot: string;
}

async function ensureJsonFile(file: string): Promise<void> {
    try {
        await access(file);
    } catch {
        await writeFile(file, '{}');
    }
}

function scopeFromResponse(response: Response): AcademyAuthoringScope {
    return response.locals.academyScope as AcademyAuthoringScope;
}

export async function createLumiRuntime(
    options: LumiRuntimeOptions
): Promise<AcademyH5pRuntime> {
    const dataRoot = path.resolve(options.dataRoot);
    const assetsRoot = path.resolve(
        options.assetsRoot ?? path.join(__dirname, '../../h5p-examples/h5p')
    );
    const directories = {
        content: path.join(dataRoot, 'content'),
        libraries: path.join(dataRoot, 'libraries'),
        temporary: path.join(dataRoot, 'temporary'),
        userData: path.join(dataRoot, 'user-data')
    };
    await Promise.all([
        mkdir(dataRoot, { recursive: true }),
        ...Object.values(directories).map((directory) =>
            mkdir(directory, { recursive: true })
        )
    ]);

    const storageFile = path.join(dataRoot, 'runtime.json');
    await ensureJsonFile(storageFile);
    const storage = await H5P.fsImplementations.JsonStorage.create(storageFile);
    const config = await new H5P.H5PConfig(storage, {
        baseUrl: '/h5p',
        contentHubEnabled: false,
        fetchingDisabled: 0,
        platformName: 'LedgerBrain Academy',
        platformVersion: '1',
        playUrl: '/saved',
        sendUsageStatistics: false,
        siteType: 'network'
    }).load();

    const editor = new H5P.H5PEditor(
        storage,
        config,
        new H5P.fsImplementations.FileLibraryStorage(directories.libraries),
        new H5P.fsImplementations.FileContentStorage(directories.content),
        new H5P.fsImplementations.DirectoryTemporaryFileStorage(
            directories.temporary
        ),
        undefined,
        undefined,
        {
            lockProvider: new H5P.SimpleLockProvider(),
            permissionSystem: new AcademyPermissionSystem()
        },
        new H5P.fsImplementations.FileContentUserDataStorage(
            directories.userData
        )
    );

    const nativeRouter = h5pAjaxExpressRouter(
        editor,
        path.join(assetsRoot, 'core'),
        path.join(assetsRoot, 'editor'),
        {
            routeContentUserData: false,
            routeFinishedData: false,
            routeGetDownload: false
        },
        'en'
    );
    const ajaxRouter = express.Router();
    ajaxRouter.use(
        (request: Request, response: Response, next: NextFunction) => {
            const academyRequest = request as any;
            academyRequest.user = new AcademyUser(scopeFromResponse(response));
            academyRequest.language = 'en';
            academyRequest.t = (key) => key;
            academyRequest.i18n = {
                changeLanguage: async () => undefined
            };
            next();
        }
    );
    ajaxRouter.use(nativeRouter);

    return createRuntimeAdapter(editor, ajaxRouter);
}
