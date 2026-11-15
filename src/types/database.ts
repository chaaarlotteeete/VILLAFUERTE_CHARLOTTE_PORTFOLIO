export type ProjectType = 'Individual' | 'Group' | 'Capstone' | 'Academic'
export type ProjectPlatform = 'Web' | 'Mobile' | 'Web and Mobile'
export type ProjectStatus = 'Ongoing' | 'Completed' | 'Archived'

export type EducationStatus =
  | 'currently_studying'
  | 'completed'
  | 'incomplete'
  | 'discontinued'
  | 'on_hold'

export type DatePrecision = 'year' | 'month'

export type TrainingType =
  | 'TESDA Training'
  | 'Short Course'
  | 'Bootcamp'
  | 'Workshop'
  | 'Seminar'
  | 'Professional Development'
  | 'Other'

export type TrainingStatus =
  | 'currently_attending'
  | 'completed'
  | 'incomplete'
  | 'discontinued'
  | 'on_hold'

export type CertificationType =
  | 'National Certificate I (NC I)'
  | 'National Certificate II (NC II)'
  | 'National Certificate III (NC III)'
  | 'National Certificate IV (NC IV)'
  | 'Certificate of Competency (COC)'
  | 'Training Certificate'
  | 'Other'

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
          birthdate: string | null
          gender: string | null
          religion: string | null
          birthplace: string | null
          nationality: string | null
          civil_status: string | null
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
          birthdate?: string | null
          gender?: string | null
          religion?: string | null
          birthplace?: string | null
          nationality?: string | null
          civil_status?: string | null
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
          birthdate?: string | null
          gender?: string | null
          religion?: string | null
          birthplace?: string | null
          nationality?: string | null
          civil_status?: string | null
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
          start_date_precision: DatePrecision
          end_date_precision: DatePrecision
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
          start_date_precision?: DatePrecision
          end_date_precision?: DatePrecision
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
          start_date_precision?: DatePrecision
          end_date_precision?: DatePrecision
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
      project_field_content_versions: {
        Row: {
          id: string
          project_id: string | null
          draft_key: string | null
          field_name: string
          content: string
          version_type: 'original' | 'ai_generated' | 'manual_edit' | 'pdf_import'
          ai_action:
            | 'rephrase'
            | 'summarize'
            | 'improve'
            | 'organize'
            | 'pdf_import'
            | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          draft_key?: string | null
          field_name: string
          content: string
          version_type: 'original' | 'ai_generated' | 'manual_edit' | 'pdf_import'
          ai_action?:
            | 'rephrase'
            | 'summarize'
            | 'improve'
            | 'organize'
            | 'pdf_import'
            | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string | null
          draft_key?: string | null
          field_name?: string
          content?: string
          version_type?: 'original' | 'ai_generated' | 'manual_edit' | 'pdf_import'
          ai_action?:
            | 'rephrase'
            | 'summarize'
            | 'improve'
            | 'organize'
            | 'pdf_import'
            | null
          created_by?: string | null
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
          is_visible: boolean
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
          is_visible?: boolean
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
          is_visible?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      education_levels: {
        Row: {
          id: string
          name: string
          slug: string
          display_order: number
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          display_order?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          display_order?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      education_tracks: {
        Row: {
          id: string
          name: string
          slug: string
          display_order: number
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          display_order?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          display_order?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      education_strands: {
        Row: {
          id: string
          track_id: string | null
          name: string
          slug: string
          display_order: number
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          track_id?: string | null
          name: string
          slug: string
          display_order?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          track_id?: string | null
          name?: string
          slug?: string
          display_order?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      degree_options: {
        Row: {
          id: string
          education_level_id: string
          name: string
          slug: string
          display_order: number
          is_visible: boolean
          is_custom: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          education_level_id: string
          name: string
          slug: string
          display_order?: number
          is_visible?: boolean
          is_custom?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          education_level_id?: string
          name?: string
          slug?: string
          display_order?: number
          is_visible?: boolean
          is_custom?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hobby_categories: {
        Row: {
          id: string
          name: string
          slug: string
          display_order: number
          is_visible: boolean
          is_custom: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          display_order?: number
          is_visible?: boolean
          is_custom?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          display_order?: number
          is_visible?: boolean
          is_custom?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hobby_options: {
        Row: {
          id: string
          hobby_category_id: string
          name: string
          slug: string
          display_order: number
          is_visible: boolean
          is_custom: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hobby_category_id: string
          name: string
          slug: string
          display_order?: number
          is_visible?: boolean
          is_custom?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hobby_category_id?: string
          name?: string
          slug?: string
          display_order?: number
          is_visible?: boolean
          is_custom?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      award_categories: {
        Row: {
          id: string
          name: string
          slug: string
          display_order: number
          is_visible: boolean
          is_custom: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          display_order?: number
          is_visible?: boolean
          is_custom?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          display_order?: number
          is_visible?: boolean
          is_custom?: boolean
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
          is_visible: boolean
          display_order: number
          education_level_id: string | null
          custom_education_level: string | null
          degree_option_id: string | null
          school_address: string | null
          city: string | null
          province: string | null
          country: string | null
          school_logo_url: string | null
          track_id: string | null
          strand_id: string | null
          custom_track: string | null
          custom_strand: string | null
          academic_highlights: string | null
          status: EducationStatus
          expected_graduation: string | null
          start_date_precision: DatePrecision
          end_date_precision: DatePrecision
          expected_graduation_precision: DatePrecision
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
          is_visible?: boolean
          display_order?: number
          education_level_id?: string | null
          custom_education_level?: string | null
          degree_option_id?: string | null
          school_address?: string | null
          city?: string | null
          province?: string | null
          country?: string | null
          school_logo_url?: string | null
          track_id?: string | null
          strand_id?: string | null
          custom_track?: string | null
          custom_strand?: string | null
          academic_highlights?: string | null
          status?: EducationStatus
          expected_graduation?: string | null
          start_date_precision?: DatePrecision
          end_date_precision?: DatePrecision
          expected_graduation_precision?: DatePrecision
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
          is_visible?: boolean
          display_order?: number
          education_level_id?: string | null
          custom_education_level?: string | null
          degree_option_id?: string | null
          school_address?: string | null
          city?: string | null
          province?: string | null
          country?: string | null
          school_logo_url?: string | null
          track_id?: string | null
          strand_id?: string | null
          custom_track?: string | null
          custom_strand?: string | null
          academic_highlights?: string | null
          status?: EducationStatus
          expected_graduation?: string | null
          start_date_precision?: DatePrecision
          end_date_precision?: DatePrecision
          expected_graduation_precision?: DatePrecision
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'education_education_level_id_fkey'
            columns: ['education_level_id']
            isOneToOne: false
            referencedRelation: 'education_levels'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'education_track_id_fkey'
            columns: ['track_id']
            isOneToOne: false
            referencedRelation: 'education_tracks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'education_strand_id_fkey'
            columns: ['strand_id']
            isOneToOne: false
            referencedRelation: 'education_strands'
            referencedColumns: ['id']
          },
        ]
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
          hobby_category_id: string | null
          hobby_option_id: string | null
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
          hobby_category_id?: string | null
          hobby_option_id?: string | null
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
          hobby_category_id?: string | null
          hobby_option_id?: string | null
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
          alt_text: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          hobby_id: string
          image_url: string
          caption?: string | null
          alt_text?: string | null
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          hobby_id?: string
          image_url?: string
          caption?: string | null
          alt_text?: string | null
          display_order?: number
          created_at?: string
        }
        Relationships: []
      }
      training_records: {
        Row: {
          id: string
          title: string
          provider: string
          training_type: TrainingType
          qualification_code: string | null
          description: string | null
          location: string | null
          start_date: string | null
          completion_date: string | null
          is_current: boolean
          expected_completion: string | null
          training_hours: number | null
          completion_status: TrainingStatus
          document_url: string | null
          is_visible: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          provider: string
          training_type?: TrainingType
          qualification_code?: string | null
          description?: string | null
          location?: string | null
          start_date?: string | null
          completion_date?: string | null
          is_current?: boolean
          expected_completion?: string | null
          training_hours?: number | null
          completion_status?: TrainingStatus
          document_url?: string | null
          is_visible?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          provider?: string
          training_type?: TrainingType
          qualification_code?: string | null
          description?: string | null
          location?: string | null
          start_date?: string | null
          completion_date?: string | null
          is_current?: boolean
          expected_completion?: string | null
          training_hours?: number | null
          completion_status?: TrainingStatus
          document_url?: string | null
          is_visible?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      awards: {
        Row: {
          id: string
          title: string
          award_category_id: string | null
          custom_category: string | null
          issuer: string | null
          description: string | null
          received_at: string | null
          education_id: string | null
          experience_id: string | null
          project_id: string | null
          image_url: string | null
          credential_url: string | null
          is_visible: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          award_category_id?: string | null
          custom_category?: string | null
          issuer?: string | null
          description?: string | null
          received_at?: string | null
          education_id?: string | null
          experience_id?: string | null
          project_id?: string | null
          image_url?: string | null
          credential_url?: string | null
          is_visible?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          award_category_id?: string | null
          custom_category?: string | null
          issuer?: string | null
          description?: string | null
          received_at?: string | null
          education_id?: string | null
          experience_id?: string | null
          project_id?: string | null
          image_url?: string | null
          credential_url?: string | null
          is_visible?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      education_awards: {
        Row: {
          education_id: string
          award_id: string
          created_at: string
        }
        Insert: {
          education_id: string
          award_id: string
          created_at?: string
        }
        Update: {
          education_id?: string
          award_id?: string
          created_at?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          id: string
          bucket: string
          storage_path: string
          public_url: string | null
          file_name: string
          mime_type: string | null
          file_size: number | null
          alt_text: string | null
          caption: string | null
          folder: string | null
          is_public: boolean
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bucket: string
          storage_path: string
          public_url?: string | null
          file_name: string
          mime_type?: string | null
          file_size?: number | null
          alt_text?: string | null
          caption?: string | null
          folder?: string | null
          is_public?: boolean
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bucket?: string
          storage_path?: string
          public_url?: string | null
          file_name?: string
          mime_type?: string | null
          file_size?: number | null
          alt_text?: string | null
          caption?: string | null
          folder?: string | null
          is_public?: boolean
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
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
          certification_type: CertificationType | null
          qualification_name: string | null
          credential_number: string | null
          expires_at: string | null
          show_credential_number: boolean
          training_record_id: string | null
          document_url: string | null
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
          certification_type?: CertificationType | null
          qualification_name?: string | null
          credential_number?: string | null
          expires_at?: string | null
          show_credential_number?: boolean
          training_record_id?: string | null
          document_url?: string | null
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
          certification_type?: CertificationType | null
          qualification_name?: string | null
          credential_number?: string | null
          expires_at?: string | null
          show_credential_number?: boolean
          training_record_id?: string | null
          document_url?: string | null
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
export type EducationLevel = Tables<'education_levels'>
export type EducationTrack = Tables<'education_tracks'>
export type EducationStrand = Tables<'education_strands'>
export type DegreeOption = Tables<'degree_options'>
export type Certification = Tables<'certifications'>
export type Resume = Tables<'resumes'>
export type SocialLink = Tables<'social_links'>
export type ContactMessage = Tables<'contact_messages'>
export type SiteSetting = Tables<'site_settings'>
export type AdminUser = Tables<'admin_users'>
export type Hobby = Tables<'hobbies'>
export type HobbyMedia = Tables<'hobby_media'>
export type HobbyCategory = Tables<'hobby_categories'>
export type HobbyOption = Tables<'hobby_options'>
export type AwardCategory = Tables<'award_categories'>
export type Award = Tables<'awards'>
export type TrainingRecord = Tables<'training_records'>
export type EducationAward = Tables<'education_awards'>
export type MediaAsset = Tables<'media_assets'>
