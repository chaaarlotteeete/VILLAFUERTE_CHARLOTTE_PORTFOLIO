import { FileUploadField } from '@/components/admin/FileUploadField'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { ContentFieldDef } from '@/lib/cms-defaults'
import { parseContentBoolean, serializeContentBoolean } from '@/lib/cms-defaults'
import type { SectionContentMap } from '@/services/cms'

interface SectionContentFieldsProps {
  fields: ContentFieldDef[]
  values: SectionContentMap
  onChange: (next: SectionContentMap) => void
}

export function SectionContentFields({
  fields,
  values,
  onChange,
}: SectionContentFieldsProps) {
  function setValue(key: string, value: string) {
    onChange({ ...values, [key]: value })
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {fields.map((field) => {
        if (field.type === 'boolean') {
          return (
            <label
              key={field.key}
              className="flex items-center gap-3 text-sm md:col-span-2"
            >
              <Switch
                checked={parseContentBoolean(values[field.key])}
                onCheckedChange={(checked) =>
                  setValue(field.key, serializeContentBoolean(checked))
                }
              />
              {field.label}
            </label>
          )
        }

        if (field.type === 'json' || field.type === 'markdown') {
          return (
            <div key={field.key} className="space-y-2 md:col-span-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Textarea
                id={field.key}
                className="min-h-[100px] font-mono text-xs"
                value={values[field.key] ?? ''}
                onChange={(event) => setValue(field.key, event.target.value)}
                placeholder={field.placeholder}
              />
              {field.description ? (
                <p className="text-xs text-muted-foreground">{field.description}</p>
              ) : null}
            </div>
          )
        }

        if (field.key.endsWith('_url') || field.type === 'url') {
          return (
            <div key={field.key} className="space-y-2 md:col-span-2">
              <FileUploadField
                label={field.label}
                folder="branding"
                value={values[field.key] ?? ''}
                onUploaded={(url) => setValue(field.key, url)}
              />
              <Input
                value={values[field.key] ?? ''}
                onChange={(event) => setValue(field.key, event.target.value)}
                placeholder={field.placeholder ?? 'URL'}
              />
            </div>
          )
        }

        if (field.type === 'number') {
          return (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                type="number"
                value={values[field.key] ?? ''}
                onChange={(event) => setValue(field.key, event.target.value)}
              />
            </div>
          )
        }

        const isLong =
          field.key.includes('description') ||
          field.key.includes('intro') ||
          field.key.includes('headline')

        return (
          <div
            key={field.key}
            className={`space-y-2 ${isLong ? 'md:col-span-2' : ''}`}
          >
            <Label htmlFor={field.key}>{field.label}</Label>
            {isLong ? (
              <Textarea
                id={field.key}
                value={values[field.key] ?? ''}
                onChange={(event) => setValue(field.key, event.target.value)}
                placeholder={field.placeholder}
              />
            ) : (
              <Input
                id={field.key}
                value={values[field.key] ?? ''}
                onChange={(event) => setValue(field.key, event.target.value)}
                placeholder={field.placeholder}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}