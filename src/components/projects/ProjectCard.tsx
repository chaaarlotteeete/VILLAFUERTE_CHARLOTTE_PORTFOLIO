import { motion } from 'motion/react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { getProjectTechnologies } from '@/services/projects'
import type { ProjectListItem } from '@/types/portfolio'
import { formatDateRange } from '@/utils/date'

interface ProjectCardProps {
  project: ProjectListItem
}

export function ProjectCard({ project }: ProjectCardProps) {
  const technologies = getProjectTechnologies(project).slice(0, 4)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35 }}
    >
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <div className="aspect-[16/10] overflow-hidden bg-muted">
          {project.thumbnail_url ? (
            <img
              src={project.thumbnail_url}
              alt={project.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No thumbnail
            </div>
          )}
        </div>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{project.project_type}</Badge>
            <Badge variant="outline">{project.status}</Badge>
            {project.is_featured ? <Badge>Featured</Badge> : null}
          </div>
          <CardTitle className="text-xl">{project.title}</CardTitle>
          {project.short_description ? (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {project.short_description}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {project.role ? <p>Role: {project.role}</p> : null}
          <p>
            {formatDateRange(
              project.start_date,
              project.end_date,
              project.status === 'Ongoing',
              project.start_date_precision,
              project.end_date_precision,
            ) ?? 'Timeline unavailable'}
          </p>
          {technologies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {technologies.map((tech) => (
                <Badge key={tech.id} variant="outline">
                  {tech.name}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link to={`/projects/${project.slug}`}>View Details</Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
