export const STORAGE_BUCKETS = {
  media: 'portfolio-media',
  resumes: 'portfolio-resumes',
} as const

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS]

export function buildStoragePath(folder: string, fileName: string) {
  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+|\/+$/g, '')
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const stamp = Date.now()
  return `${safeFolder}/${stamp}-${safeName}`
}
