import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/database.types'

const supabase = createClientComponentClient<Database>()

export interface GalleryImage {
  id: string
  dining_hall_name: string
  image_url: string
  caption?: string | null
  rating: number
  created_at: string
  user_id: string | null
  author_name: string | null
}

export interface GalleryStats {
  average_rating: number
  total_posts: number
}

export const uploadGalleryImage = async (
  file: File,
  diningHallName: string,
  caption: string | null,
  rating: number,
): Promise<{ success: boolean; data?: GalleryImage; error?: string }> => {
  try {
    // Create path for image
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    const path = `dining-images/${diningHallName}/${filename}`

    // Upload image
    const { error: uploadError } = await supabase.storage
      .from('dining-images')
      .upload(path, file)

    if (uploadError) throw uploadError

    const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/dining-images/${path}`

    // Create database entry
    const { data: galleryData, error: dbError } = await supabase
      .from('dining_gallery')
      .insert({
        dining_hall_name: diningHallName,
        image_url: imageUrl,
        caption,
        rating,
      })
      .select()
      .single()

    if (dbError) throw dbError

    return { success: true, data: galleryData }
  } catch (error) {
    console.error('Error uploading gallery image:', error)
    return { success: false, error: 'Failed to upload image' }
  }
}

export const getGalleryImages = async (diningHallName?: string): Promise<GalleryImage[]> => {
  try {
    // Run cleanup first
    await supabase.rpc('cleanup_old_gallery_images')

    // Build query
    let query = supabase
      .from('dining_gallery')
      .select('*')
      .order('created_at', { ascending: false })

    if (diningHallName) {
      query = query.eq('dining_hall_name', diningHallName)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching gallery images:', error)
    return []
  }
}

export const deleteGalleryImage = async (imageId: string): Promise<boolean> => {
  try {
    // Get image info first
    const { data: imageData, error: fetchError } = await supabase
      .from('dining_gallery')
      .select('image_url')
      .eq('id', imageId)
      .single()

    if (fetchError) throw fetchError

    // Extract path from URL
    const urlParts = imageData.image_url.split('dining-images/')
    const path = `dining-images/${urlParts[1]}`

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('dining-images')
      .remove([path])

    if (storageError) throw storageError

    // Delete database entry
    const { error: dbError } = await supabase
      .from('dining_gallery')
      .delete()
      .eq('id', imageId)

    if (dbError) throw dbError

    return true
  } catch (error) {
    console.error('Error deleting gallery image:', error)
    return false
  }
}

export const getGalleryStats = async (diningHallName: string): Promise<GalleryStats | null> => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('dining_gallery')
      .select('rating')
      .eq('dining_hall_name', diningHallName)
      .gte('created_at', today.toISOString())

    if (error) throw error

    if (!data.length) return null

    const totalPosts = data.length
    const averageRating = data.reduce((sum, item) => sum + item.rating, 0) / totalPosts

    return {
      average_rating: Number(averageRating.toFixed(1)),
      total_posts: totalPosts,
    }
  } catch (error) {
    console.error('Error fetching gallery stats:', error)
    return null
  }
} 