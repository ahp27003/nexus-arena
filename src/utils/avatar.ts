import { supabase } from '../integrations/supabase/client';

/**
 * Avatar style names available in DiceBear API
 */
const AVATAR_STYLES = [
  'avataaars',
  'bottts',
  'lorelei',
  'micah',
  'miniavs',
  'personas'
];

/**
 * Background color options for avatars
 */
const BACKGROUND_COLORS = ['b6e3f4', 'c0aede', 'ffd5dc', 'ffdfbf', 'd1d4f9'];

/**
 * Generate a hash number from a string
 * @param seed - String to hash
 * @returns A numeric hash value
 */
const hashString = (seed: string): number => {
  return Math.abs(seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
};

/**
 * Generate a consistent avatar URL based on a user's ID or username
 * @param seed - Unique identifier (user ID or username)
 * @param style - Optional style index (0-5)
 * @returns URL for the avatar image
 */
export const generateAvatar = (seed: string, style?: number): string => {
  // Use a consistent style based on the seed if not specified
  const styleIndex = style !== undefined 
    ? style 
    : hashString(seed) % AVATAR_STYLES.length;
  
  // Generate color based on seed
  const colorIndex = hashString(seed) % BACKGROUND_COLORS.length;
  const backgroundColor = BACKGROUND_COLORS[colorIndex];
  
  // Get the style name
  const styleName = AVATAR_STYLES[styleIndex];
  
  // Return a direct URL to the DiceBear API
  return `https://api.dicebear.com/6.x/${styleName}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${backgroundColor}`;
};

/**
 * Get a random avatar style index
 * @returns A number between 0-5 representing an avatar style
 */
export const getRandomAvatarStyle = (): number => {
  return Math.floor(Math.random() * AVATAR_STYLES.length);
};

/**
 * Generate an avatar with specific options
 * @param seed - Unique identifier (user ID or username)
 * @param options - Optional configuration
 * @returns URL for the avatar image
 */
export const generateAvatarWithOptions = (seed: string, options: {
  style?: number;
  size?: number;
  backgroundColor?: string;
} = {}): string => {
  const styleIndex = options.style ?? hashString(seed) % AVATAR_STYLES.length;
  const styleName = AVATAR_STYLES[styleIndex];
  const size = options.size ?? 128;
  const backgroundColor = options.backgroundColor ?? 
    BACKGROUND_COLORS[hashString(seed) % BACKGROUND_COLORS.length];
  
  return `https://api.dicebear.com/6.x/${styleName}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${backgroundColor}&size=${size}`;
};

/**
 * Upload an avatar image to Supabase Storage
 * @param userId - The user's ID
 * @param file - The image file to upload
 * @returns The URL of the uploaded avatar or null if upload failed
 */
export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
  try {
    // Create a unique file path for this user's avatar
    const filePath = `${userId}/avatar-${Date.now()}`;
    
    // Upload the file to the avatars bucket
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true, // Replace if exists
        contentType: file.type
      });
    
    if (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
    
    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error) {
    console.error('Error in avatar upload:', error);
    return null;
  }
};

/**
 * Get avatar URL for a user - either their uploaded avatar or a generated one
 * @param user - User object with id and optional avatar_url
 * @returns URL to display for the user's avatar
 */
export const getAvatarUrl = (user: { id: string; username?: string; avatar_url?: string | null }): string => {
  // If user has a custom avatar, use it
  if (user.avatar_url) {
    return user.avatar_url;
  }
  
  // Otherwise generate an avatar based on their username or ID
  const seed = user.username || user.id;
  return generateAvatar(seed);
};

/**
 * Delete a user's custom avatar from storage
 * @param userId - The user's ID
 * @param avatarPath - The path of the avatar in storage
 * @returns True if deletion was successful
 */
export const deleteAvatar = async (userId: string, avatarPath: string): Promise<boolean> => {
  try {
    // Extract just the filename from the full URL if needed
    const pathParts = avatarPath.split('avatars/');
    const storagePath = pathParts.length > 1 ? pathParts[1] : avatarPath;
    
    const { error } = await supabase.storage
      .from('avatars')
      .remove([`${userId}/${storagePath}`]);
    
    if (error) {
      console.error('Error deleting avatar:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in avatar deletion:', error);
    return false;
  }
};
