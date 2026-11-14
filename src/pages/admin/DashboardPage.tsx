import { Link } from 'react-router-dom'

import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAsyncData } from '@/hooks/useAsyncData'
import { fetchDashboardStats } from '@/services/adminDashboard'
import { formatDate } from '@/utils/date'

export function DashboardPage() {
  const { data, error, loading, reload } = useAsyncData(fetchDashboardStats)

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return null

  const cards = [
    { label: 'Total Projects', value: data.totalProjects, href: '/admin/projects' },
    {
      label: 'Published Projects',
      value: data.publishedProjects,
      href: '/admin/projects',
    },
    { label: 'Draft Projects', value: data.draftProjects, href: '/admin/projects' },
    { label: 'Total Skills', value: data.totalSkills, href: '/admin/skills' },
    {
      label: 'Total Certifications',
      value: data.totalCertifications,
      href: '/admin/certifications',
    },
    { label: 'Total Hobbies', value: data.totalHobbies, href: '/admin/hobbies' },
    {
      label: 'Unread Messages',
      value: data.unreadMessages,
      href: '/admin/messages',
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Portfolio content overview, recent activity, and quick actions."
        actions={
          <>
            <Button asChild>
              <Link to="/admin/projects/new">Create Project</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/hobbies/new">Add Hobby</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/admin/messages">Review Messages</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} to={card.href} className="no-underline">
            <Card className="h-full transition-colors hover:bg-accent/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{card.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Recently updated projects</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/projects">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b text-left text-muted-foreground">
                    <tr>
                      <th className="pb-2 pr-3 font-medium">Project</th>
                      <th className="pb-2 pr-3 font-medium">Status</th>
                      <th className="pb-2 font-medium">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentProjects.map((project) => (
                      <tr key={project.id} className="border-b last:border-0">
                        <td className="py-2.5 pr-3">
                          <Link
                            to={`/admin/projects/${project.id}/edit`}
                            className="font-medium no-underline hover:underline"
                          >
                            {project.title}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-3">
                          <Badge
                            variant={project.is_published ? 'success' : 'secondary'}
                          >
                            {project.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {formatDate(project.updated_at, 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Recent contact messages</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/messages">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b text-left text-muted-foreground">
                    <tr>
                      <th className="pb-2 pr-3 font-medium">From</th>
                      <th className="pb-2 pr-3 font-medium">Subject</th>
                      <th className="pb-2 font-medium">Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentMessages.map((message) => (
                      <tr key={message.id} className="border-b last:border-0">
                        <td className="py-2.5 pr-3">
                          <p className="font-medium">{message.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {message.email}
                          </p>
                        </td>
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="line-clamp-1">{message.subject}</span>
                            {!message.is_read ? (
                              <Badge variant="default">New</Badge>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {formatDate(message.created_at, 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Content publication overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                {
                  label: 'Published',
                  value: data.publicationOverview.publishedPercent,
                  count: data.publishedProjects,
                },
                {
                  label: 'Drafts',
                  value: data.publicationOverview.draftPercent,
                  count: data.draftProjects,
                },
                {
                  label: 'Featured',
                  value: data.publicationOverview.featuredPercent,
                  count: data.featuredProjects,
                },
              ] as const
            ).map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="text-muted-foreground">
                    {item.count} · {item.value}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <Button asChild variant="outline" className="justify-start">
              <Link to="/admin/projects/new">New project</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/admin/skills">Manage skills</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/admin/profile">Update profile</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/admin/settings">Site settings</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/" target="_blank" rel="noreferrer">
                View public website
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
