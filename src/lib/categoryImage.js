import { supabase } from '../supabaseClient'

const PLACEHOLDERS = ['/cat1.png', '/cat2.png', '/cat3.png', '/cat4.png']
const PUBLIC_BUCKET = 'category-images'

export function getDefaultCategoryImage(index = 0) {
  return PLACEHOLDERS[index % PLACEHOLDERS.length]
}

export function getCategoryImageUrl(category, index = 0) {
  if (category?.image_path) {
    if (category.image_path.startsWith('/')) return category.image_path
    return supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(category.image_path).data.publicUrl
  }
  return getDefaultCategoryImage(index)
}
