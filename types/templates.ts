export interface TemplateWithRelations {
  id: string
  name: string
  description: string | null
  is_nsfw: boolean
  category_id: string | null
  category?: { id: string; name: string; emoji: string }
  tags: { tag: string; created_by: 'user' | 'ai' }[]
  branches: BranchSummary[]
  main_branch_content?: string
  created_at: string
  updated_at: string
}

export interface BranchSummary {
  id: string
  name: string
  is_main: boolean
  parent_branch_id: string | null
  updated_at: string
}

export interface BranchWithHistory {
  id: string
  name: string
  content: string
  is_main: boolean
  parent_branch_id: string | null
  history: { id: string; content: string; change_description: string | null; created_at: string }[]
  created_at: string
  updated_at: string
}

export interface TemplateFilters {
  categoryId?: string
  tags?: string[]
  showNsfw?: boolean
  searchQuery?: string
  orderBy?: 'created_at' | 'updated_at' | 'name'
  orderDirection?: 'asc' | 'desc'
}

export interface CreateTemplatePayload {
  name: string
  description?: string
  category_id?: string
  is_nsfw?: boolean
  initialContent: string
  tags?: string[]
}

export interface CreateBranchPayload {
  templateId: string
  branchName: string
  sourceContent: string
  parentBranchId?: string
}

export interface MergeBranchPayload {
  templateId: string
  sourceBranchId: string
  targetBranchId: string
}
