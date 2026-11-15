import { edgeFunctionErrorMessage } from '@/lib/edgeFunctionError'
import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKETS, buildStoragePath } from '@/lib/storage'
import {
  normalizeExtraction,
  type ProjectDocumentExtraction,
  type ProjectDocumentImportResult,
} from '@/types/projectDocumentImport'
import { extractPdfPagesForImport } from '@/services/projectDocumentOcr'
import { uploadPublicFile } from '@/services/storage'

const MAX_PDF_BYTES = 10 * 1024 * 1024

export type ImportProgressStage =
  | 'validating'
  | 'uploading'
  | 'extracting_text'
  | 'ocr'
  | 'analyzing'
  | 'done'

export interface ImportProgress {
  stage: ImportProgressStage
  progress: number
  message: string
}

function assertPdf(file: File) {
  const isPdf =
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) {
    throw new Error('Only PDF files are supported for documentation import.')
  }
  if (file.size <= 0) {
    throw new Error('The selected file is empty.')
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error('PDF exceeds the 10 MB size.')
  }
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function uploadPrivateProjectDoc(file: File) {
  const path = buildStoragePath('imports', file.name)
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.projectDocs)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'application/pdf',
    })
  if (error) throw new Error(error.message)
  return path
}

export async function importProjectDocumentFromPdf(options: {
  file: File
  technologyNames: string[]
  attachAsPublicDocsUrl?: boolean
  onProgress?: (progress: ImportProgress) => void
}): Promise<ProjectDocumentImportResult> {
  const { file, technologyNames, attachAsPublicDocsUrl = false, onProgress } =
    options

  onProgress?.({
    stage: 'validating',
    progress: 5,
    message: 'Validating PDF…',
  })
  assertPdf(file)

  onProgress?.({
    stage: 'uploading',
    progress: 15,
    message: 'Uploading securely…',
  })

  const [storagePath, publicDocsUrl] = await Promise.all([
    uploadPrivateProjectDoc(file).catch((error: unknown) => {
      throw new Error(
        error instanceof Error
          ? `Private upload failed: ${error.message}`
          : 'Private upload failed',
      )
    }),
    attachAsPublicDocsUrl
      ? uploadPublicFile(STORAGE_BUCKETS.resumes, 'project-docs', file).catch(
          () => null,
        )
      : Promise.resolve(null),
  ])

  onProgress?.({
    stage: 'extracting_text',
    progress: 35,
    message: 'Locating relevant PDF sections…',
  })

  const localPages = await extractPdfPagesForImport(file, {
    onOcrStart: () =>
      onProgress?.({
        stage: 'ocr',
        progress: 55,
        message: 'OCR on relevant scanned pages only…',
      }),
  })

  onProgress?.({
    stage: 'analyzing',
    progress: 70,
    message: 'Extracting targeted sections with secure AI…',
  })

  const form = new FormData()
  form.append('file', file, file.name)
  form.append('technologies', JSON.stringify(technologyNames))
  form.append('storage_path', storagePath)
  if (localPages.ocrPages.length) {
    form.append('ocr_pages', JSON.stringify(localPages.ocrPages))
  }

  const { data, error } = await supabase.functions.invoke(
    'extract-project-document',
    { body: form },
  )

  if (error) {
    // Fallback: send JSON pages if multipart invoke fails in some environments.
    const fallback = await supabase.functions.invoke('extract-project-document', {
      body: {
        pages: localPages.pages,
        technologies: technologyNames,
        storage_path: storagePath,
        used_ocr_pages: localPages.ocrPages.map((page) => page.page),
      },
    })
    if (fallback.error) {
      throw new Error(
        await edgeFunctionErrorMessage(fallback.error, fallback.data),
      )
    }
    return finalize(fallback.data, file, storagePath, publicDocsUrl, onProgress)
  }

  return finalize(data, file, storagePath, publicDocsUrl, onProgress)
}

function finalize(
  data: unknown,
  file: File,
  storagePath: string,
  publicDocsUrl: string | null,
  onProgress?: (progress: ImportProgress) => void,
): ProjectDocumentImportResult {
  const payload = data as {
    ok?: boolean
    error?: string
    extraction?: ProjectDocumentExtraction
    storage_path?: string | null
  }

  if (!payload?.ok || !payload.extraction) {
    throw new Error(payload?.error || 'Document extraction failed.')
  }

  onProgress?.({
    stage: 'done',
    progress: 100,
    message: 'Extraction complete',
  })

  return {
    extraction: normalizeExtraction(payload.extraction),
    storagePath: payload.storage_path ?? storagePath,
    publicDocsUrl,
    fileName: file.name,
    fileSize: file.size,
  }
}
