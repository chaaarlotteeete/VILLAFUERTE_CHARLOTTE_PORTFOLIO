import { STORAGE_BUCKETS, type StorageBucket } from '@/lib/storage'
import { supabase } from '@/lib/supabase'

export interface MediaLibraryItem {
  id: string
  name: string
  path: string
  bucket: StorageBucket
  publicUrl: string
  updatedAt: string | null
  size: number | null
  mimeType: string | null
  kind: 'image' | 'document' | 'other'
}

const FOLDERS = [
  'profile',
  'project-thumbnails',
  'project-screenshots',
  'project-features',
  'certifications',
  'hobby-covers',
  'hobby-gallery',
  'branding',
  'resumes',
] as const

function detectKind(name: string, mimeType: string | null): MediaLibraryItem['kind'] {
  const lower = name.toLowerCase()
  const mime = (mimeType || '').toLowerCase()
  if (
    mime.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(lower)
  ) {
    return 'image'
  }
  if (
    mime.includes('pdf') ||
    mime.includes('document') ||
    /\.(pdf|doc|docx|txt|md)$/i.test(lower)
  ) {
    return 'document'
  }
  return 'other'
}

async function listFolder(
  bucket: StorageBucket,
  folder: string,
): Promise<MediaLibraryItem[]> {
  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 200,
    sortBy: { column: 'updated_at', order: 'desc' },
  })
  if (error) throw new Error(error.message)

  return (data ?? [])
    .filter((item) => Boolean(item.name) && item.id)
    .map((item) => {
      const path = `${folder}/${item.name}`
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
      const mimeType = item.metadata?.mimetype ?? null
      return {
        id: `${bucket}:${path}`,
        name: item.name,
        path,
        bucket,
        publicUrl: urlData.publicUrl,
        updatedAt: item.updated_at ?? item.created_at ?? null,
        size: typeof item.metadata?.size === 'number' ? item.metadata.size : null,
        mimeType,
        kind: detectKind(item.name, mimeType),
      } satisfies MediaLibraryItem
    })
}

export async function fetchMediaLibrary(): Promise<MediaLibraryItem[]> {
  const mediaLists = await Promise.all(
    FOLDERS.filter((folder) => folder !== 'resumes').map((folder) =>
      listFolder(STORAGE_BUCKETS.media, folder).catch(() => [] as MediaLibraryItem[]),
    ),
  )
  const resumes = await listFolder(STORAGE_BUCKETS.resumes, 'resumes').catch(
    () => [] as MediaLibraryItem[],
  )

  return [...mediaLists.flat(), ...resumes].sort((a, b) =>
    (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''),
  )
}

export async function deleteMediaLibraryItem(item: MediaLibraryItem) {
  const { error } = await supabase.storage.from(item.bucket).remove([item.path])
  if (error) throw new Error(error.message)
}

export async function uploadMediaLibraryFile(
  file: File,
  folder = 'library',
  bucket: StorageBucket = STORAGE_BUCKETS.media,
) {
  const { uploadPublicFile } = await import('@/services/storage')
  return uploadPublicFile(bucket, folder, file)
}
