import stream from 'stream'
import fs from 'fs'
import archiver from 'archiver'
import path from 'path'

export interface ArchiveFolderOption<T> {
    dest: T extends object ? (readStream: fs.ReadStream) => Promise<T> : string
    source: {
        keys: string[]
        getObject: <ObjectStream extends stream.Readable>(key: string) => Promise<ObjectStream>
    }
}

export async function archiveFolder<Result = void>(option: ArchiveFolderOption<Result>): Promise<Result | undefined> {
    const { dest, source } = option
    const isArchiveToLocal = typeof dest === 'string'
    const archive = archiver('zip')
    const destFileName = isArchiveToLocal ? dest : 'tmp_archived_file.zip'
    const writeStream = fs.createWriteStream(destFileName)

    archive.pipe(writeStream)
    archive.on('error', (err) => {
        throw err
    })

    let currentObjectKey: string | undefined
    while ((currentObjectKey = source.keys.pop())) {
        archive.append(await source.getObject(currentObjectKey), { name: path.basename(currentObjectKey) })
    }
    await archive.finalize()

    let result: Result | undefined
    if (!isArchiveToLocal) {
        result = await dest(fs.createReadStream(destFileName))
        await safeUnlinkFile(destFileName)
    }
    return result
}

function safeUnlinkFile(fileName: string) {
    return new Promise<void>((resolve) => {
        fs.access(fileName, (err) => {
            if (err) {
                resolve()
            } else {
                fs.unlink(fileName, () => resolve())
            }
        })
    })
}
