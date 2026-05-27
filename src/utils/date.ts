import { format } from 'date-fns'

export function formatDateDMY(dateString: string | null) {
  if (!dateString) return 'N/A'
  try {
    return format(new Date(dateString), 'dd/MM/yyyy')
  } catch (error) {
    return 'N/A'
  }
}
