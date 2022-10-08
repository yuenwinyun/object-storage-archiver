import { archiveFolder, type ArchiveFolderOption } from './'
import fs from 'fs'

jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    createWriteStream: jest.fn(),
    createReadStream: jest.fn(),
    unlink: jest.fn((filename, callback) => callback()),
    access: jest.fn((fileName, callback) => callback()),
}))

jest.mock('archiver', () => () => ({
    on: jest.fn(),
    pipe: jest.fn(),
    finalize: jest.fn(),
    append: jest.fn(),
}))

describe('archiveFolder', () => {
    let archiveFolderOption: ArchiveFolderOption<unknown>

    beforeEach(() => {
        archiveFolderOption = {} as ArchiveFolderOption<unknown>
    })

    it('should zip all objects to local file', async () => {
        archiveFolderOption = {
            dest: 'dest.zip',
            source: {
                keys: ['file1.pdf', 'file2.pdf'],
                getObject: jest.fn(),
            },
        }
        await archiveFolder(archiveFolderOption)
        expect(archiveFolderOption.source.getObject).toHaveBeenCalledWith('file1.pdf')
        expect(archiveFolderOption.source.getObject).toHaveBeenCalledWith('file2.pdf')
        expect(fs.createWriteStream).toHaveBeenCalledWith('dest.zip')
        expect(fs.unlink).not.toHaveBeenCalled()
    })

    it('should zip all objects and call provided destination method with read stream of archived file', async () => {
        const archiveFolderOption: ArchiveFolderOption<{}> = {
            dest: jest.fn(),
            source: {
                keys: ['file1.pdf', 'file2.pdf'],
                getObject: jest.fn(),
            },
        }
        await archiveFolder(archiveFolderOption)
        expect(archiveFolderOption.source.getObject).toHaveBeenCalledWith('file1.pdf')
        expect(archiveFolderOption.source.getObject).toHaveBeenCalledWith('file2.pdf')
        expect(fs.createWriteStream).toHaveBeenCalledWith(expect.any(String))
        expect(fs.unlink).toHaveBeenCalled()
        expect(archiveFolderOption.dest).toHaveBeenCalled()
    })
})
