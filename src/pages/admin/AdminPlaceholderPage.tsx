import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'

interface AdminPlaceholderPageProps {
  title: string
  description: string
}

export function AdminPlaceholderPage({
  title,
  description,
}: AdminPlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <EmptyState
        title="Coming soon"
        description="This admin module is wired into the CMS navigation and will be expanded with full management tools next."
      />
    </div>
  )
}
