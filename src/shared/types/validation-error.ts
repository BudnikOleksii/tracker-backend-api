export interface ValidationErrorItem {
  property: string
  constraints?: Record<string, string>
  contexts?: Record<string, { code?: string } | undefined>
  children?: ValidationErrorItem[]
}
