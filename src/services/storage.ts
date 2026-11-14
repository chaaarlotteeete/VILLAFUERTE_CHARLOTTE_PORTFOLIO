import { supabase } from '@/lib/supabase'
import { buildStoragePath, type StorageBucket } from '@/lib/storage'

export async function uploadPublicFile(
  bucket: StorageBucket,
  folder: string,
  file: File,
) {
  const path = buildStoragePath(folder, file.name)
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteStorageObjectByUrl(
  bucket: StorageBucket,
  publicUrl: string,
) {
  const marker = `/object/public/${bucket}/`
  const index = publicUrl.indexOf(marker)
  if (index === -1) return

  const path = decodeURIComponent(publicUrl.slice(index + marker.length))
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw new Error(error.message)
}
