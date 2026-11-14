export type ProjectType = 'Individual' | 'Group' | 'Capstone' | 'Academic'
export type ProjectPlatform = 'Web' | 'Mobile' | 'Web and Mobile'
export type ProjectStatus = 'Ongoing' | 'Completed' | 'Archived'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string
          email: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          title: string | null
          short_intro: string | null
          bio: string | null
          career_objective: string | null
          specialization: string | null
          technical_interests: string | null
          profile_image_url: string | null
          email: string | null
          location: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          title?: string | null
          short_intro?: string | null
          bio?: string | null
          career_objective?: string | null
          specialization?: string | null
          technical_interests?: string | null
          profile_image_url?: string | null
          email?: string | null
          location?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          title?: string | null
          short_intro?: string | null
          bio?: string | null
          career_objective?: string | null
          specialization?: string | null
          technical_interests?: string | null
          profile_image_url?: string | null
          email?: string | null
          location?: string | null
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          title: string
          slug: string
          short_description: string | null
          full_description: string | null
          objectives: string | null
          project_type: ProjectType
          platform: ProjectPlatform
          role: string | null
          status: ProjectStatus
          start_date: string | null
          end_date: string | null
          is_published: boolean
          is_featured: boolean
          display_order: number
          github_url: string | null
          live_url: string | null
          docs_url: string | null
          video_url: string | null
          thumbnail_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          short_description?: string | null
          full_description?: string | null
          objectives?: string | null
          project_type: ProjectType
          platform: ProjectPlatform
          role?: string | null
          status?: ProjectStatus
          start_date?: string | null
          end_date?: string | null
          is_published?: boolean
          is_featured?: boolean
          display_order?: number
          github_url?: string | null
          live_url?: string | null
          docs_url?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          short_description?: string | null
          full_description?: string | null
          objectives?: string | null
          project_type?: ProjectType
          platform?: ProjectPlatform
          role?: string | null
          status?: ProjectStatus
          start_date?: string | null
          end_date?: string | null
          is_published?: boolean
          is_featured?: boolean
          display_order?: number
          github_url?: string | null
          live_url?: string | null
          docs_url?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_features: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          image_url: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          image_url?: string | null
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          display_order?: number
          created_at?: string
        }
        Relationships: []
      }
      project_contributions: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          display_order?: number
          created_at?: string
        }
        Relationships: []
      }
      project_media: {
        Row: {
          id: string
          project_id: string
          image_url: string
          caption: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          image_url: string
          caption?: string | null
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          image_url?: string
          caption?: string | null
          display_order?: number
          created_at?: string
        }
        Relationships: []
      }
      technologies: {
        Row: {
          id: string
          name: string
          category: string | null
          icon: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          icon?: string | null
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          icon?: string | null
          display_order?: number
          created_at?: string
        }
        Relationships: []
      }
      project_technologies: {
        Row: {
          project_id: string
          technology_id: string
        }
        Insert: {
          project_id: string
          technology_id: string
        }
        Update: {
          project_id?: string
          technology_id?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          id: string
          name: string
          category: string
          icon: string | null
          is_visible: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          icon?: string | null
          is_visible?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          icon?: string | null
          is_visible?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          id: string
          title: string
          organization: string
          start_date: string | null
          end_date: string | null
          is_current: boolean
          description: string | null
          achievements: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          organization: string
          start_date?: string | null
          end_date?: string | null
          is_current?: boolean
          description?: string | null
          achievements?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          organization?: string
          start_date?: string | null
          end_date?: string | null
          is_current?: boolean
          description?: string | null
          achievements?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      education: {
        Row: {
          id: string
          degree: string
          institution: string
          specialization: string | null
          start_date: string | null
          end_date: string | null
          is_current: boolean
          description: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          degree: string
          institution: string
          specialization?: string | null
          start_date?: string | null
          end_date?: string | null
          is_current?: boolean
          description?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          degree?: string
          institution?: string
          specialization?: string | null
          start_date?: string | null
          end_date?: string | null
          is_current?: boolean
          description?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hobbies: {
        Row: {
          id: string
          name: string
          category: string
          short_description: string | null
          detailed_description: string | null
          icon: string | null
          cover_image_url: string | null
          is_visible: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          short_description?: string | null
          detailed_description?: string | null
          icon?: string | null
          cover_image_url?: string | null
          is_visible?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          short_description?: string | null
          detailed_description?: string | null
          icon?: string | null
          cover_image_url?: string | null
          is_visible?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hobby_media: {
        Row: {
          id: string
          hobby_id: string
          image_url: string
          caption: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          hobby_id: string
          image_url: string
          caption?: string | null
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          hobby_id?: string
          image_url?: string
          caption?: string | null
          display_order?: number
          created_at?: string
        }
        Relationships: []
      }
      certifications: {
        Row: {
          id: string
          title: string
          issuer: string
          issued_at: string | null
          credential_url: string | null
          image_url: string | null
          category: string | null
          is_visible: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          issuer: string
          issued_at?: string | null
          credential_url?: string | null
          image_url?: string | null
          category?: string | null
          is_visible?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          issuer?: string
          issued_at?: string | null
          credential_url?: string | null
          image_url?: string | null
          category?: string | null
          is_visible?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          id: string
          label: string
          file_url: string
          is_published: boolean
          uploaded_at: string
        }
        Insert: {
          id?: string
          label: string
          file_url: string
          is_published?: boolean
          uploaded_at?: string
        }
        Update: {
          id?: string
          label?: string
          file_url?: string
          is_published?: boolean
          uploaded_at?: string
        }
        Relationships: []
      }
      social_links: {
        Row: {
          id: string
          platform: string
          url: string
          display_order: number
          is_visible: boolean
          created_at: string
        }
        Insert: {
          id?: string
          platform: string
          url: string
          display_order?: number
          is_visible?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          platform?: string
          url?: string
          display_order?: number
          is_visible?: boolean
          created_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          id: string
          full_name: string
          email: string
          subject: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          subject: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          subject?: string
          message?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_published_project: {
        Args: { target_project_id: string }
        Returns: boolean
      }
      submit_contact_message: {
        Args: {
          p_full_name: string
          p_email: string
          p_subject: string
          p_message: string
          p_honeypot?: string | null
        }
        Returns: string
      }
    }
    Enums: {
      project_type: ProjectType
      project_platform: ProjectPlatform
      project_status: ProjectStatus
    }
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Profile = Tables<'profiles'>
export type Project = Tables<'projects'>
export type ProjectFeature = Tables<'project_features'>
export type ProjectContribution = Tables<'project_contributions'>
export type ProjectMedia = Tables<'project_media'>
export type Technology = Tables<'technologies'>
export type Skill = Tables<'skills'>
export type Experience = Tables<'experiences'>
export type Education = Tables<'education'>
export type Certification = Tables<'certifications'>
export type Resume = Tables<'resumes'>
export type SocialLink = Tables<'social_links'>
export type ContactMessage = Tables<'contact_messages'>
export type SiteSetting = Tables<'site_settings'>
export type AdminUser = Tables<'admin_users'>
export type Hobby = Tables<'hobbies'>
export type HobbyMedia = Tables<'hobby_media'>
