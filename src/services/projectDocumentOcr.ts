import {
  parseProjectDocumentText,
  type ParsedProjectDocument,
} from '@/utils/projectDocumentParse'
import {
  selectPagesForOcr,
  type PageText,
} from '@/utils/projectDocumentSections'

export type { ParsedProjectDocument }

export interface PdfPageText {
  page: number
  text: string
}

const MAX_PAGES = 100
const MAX_OCR_PAGES = 8
const MIN_TEXT_CHARS = 40

async function extractTextFromImage(file: File): Promise<string> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng')
  try {
    const result = await worker.recognize(file)
    return result.data.text.trim()
  } finally {
    await worker.terminate()
  }
}

async function ocrPdfPage(page: unknown, pageNumber: number) {
  const pdfPage = page as {
    getViewport: (params: { scale: number }) => {
      width: number
      height: number
    }
    render: (params: Record<string, unknown>) => { promise: Promise<void> }
  }
  const viewport = pdfPage.getViewport({ scale: 1.6 })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const context = canvas.getContext('2d')
  if (!context) return ''

  await pdfPage.render({
    canvasContext: context,
    viewport,
    canvas,
  }).promise

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  )
  if (!blob) return ''

  return extractTextFromImage(
    new File([blob], `page-${pageNumber}.png`, { type: 'image/png' }),
  )
}

/**
 * Extract page text for section targeting.
 * OCR runs only on sparse pages that look project-relevant (not whole PDF).
 */
export async function extractPdfPagesForImport(
  file: File,
  options?: { onOcrStart?: () => void },
): Promise<{ pages: PdfPageText[]; ocrPages: PdfPageText[] }> {
  const pdfjs = await import('pdfjs-dist')
  const workerUrl = (
    await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  ).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const data = new Uint8Array(await file.arrayBuffer())
  let doc
  try {
    doc = await pdfjs.getDocument({ data }).promise
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PDF open failed'
    if (/password|encrypt/i.test(message)) {
      throw new Error(
        'This PDF appears encrypted or password-protected. Remove protection and try again.',
      )
    }
    throw new Error(
      'Could not open this PDF. It may be corrupted or unsupported.',
    )
  }

  const pageCount = Math.min(doc.numPages, MAX_PAGES)
  const pages: PdfPageText[] = []
  const sparseCandidates: Array<{ pageNumber: number; page: unknown }> = []

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await doc.getPage(pageNumber)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (pageText.length >= MIN_TEXT_CHARS) {
      pages.push({ page: pageNumber, text: pageText })
    } else {
      // Keep a stub so relevance scoring can still prefer early/front-matter pages.
      pages.push({
        page: pageNumber,
        text: pageText || `[scanned page ${pageNumber}]`,
      })
      sparseCandidates.push({ pageNumber, page })
    }
  }

  const ocrTargets = new Set(
    selectPagesForOcr(
      pages.filter((page) =>
        sparseCandidates.some((item) => item.pageNumber === page.page),
      ) as PageText[],
      MAX_OCR_PAGES,
    ),
  )

  const ocrPages: PdfPageText[] = []
  if (ocrTargets.size) {
    options?.onOcrStart?.()
    for (const candidate of sparseCandidates) {
      if (!ocrTargets.has(candidate.pageNumber)) continue
      try {
        const ocrText = await ocrPdfPage(candidate.page, candidate.pageNumber)
        if (!ocrText.trim()) continue
        const entry = {
          page: candidate.pageNumber,
          text: ocrText.trim(),
        }
        const index = pages.findIndex((item) => item.page === entry.page)
        if (index >= 0) pages[index] = entry
        else pages.push(entry)
        ocrPages.push(entry)
      } catch {
        // Server-side extraction may still recover text.
      }
    }
  }

  pages.sort((a, b) => a.page - b.page)
  return {
    pages: pages.filter(
      (page) =>
        page.text.length >= MIN_TEXT_CHARS &&
        !page.text.startsWith('[scanned page'),
    ),
    ocrPages,
  }
}

async function extractTextFromPdf(file: File): Promise<string> {
  const { pages } = await extractPdfPagesForImport(file)
  return pages.map((page) => page.text).join('\n\n')
}

export async function extractProjectFromDocument(
  file: File,
): Promise<{ text: string; parsed: ParsedProjectDocument }> {
  const isPdf =
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  const isImage =
    file.type.startsWith('image/') ||
    /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)

  let text = ''
  if (isPdf) {
    text = await extractTextFromPdf(file)
  } else if (isImage) {
    text = await extractTextFromImage(file)
  } else {
    throw new Error('Upload a PDF or image (PNG, JPG, WEBP).')
  }

  if (!text.trim()) {
    throw new Error(
      'Could not read text from this file. Try a clearer scan or a text PDF.',
    )
  }

  return {
    text,
    parsed: parseProjectDocumentText(text),
  }
}
