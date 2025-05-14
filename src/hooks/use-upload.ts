
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface UploadOptions {
  bucketName?: string;
  folder?: string;
}

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = async (
    file: File,
    options: UploadOptions = {}
  ): Promise<{ url: string } | null> => {
    const { bucketName = 'user_uploads', folder = '' } = options;
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder ? `${folder}/` : ''}${uuidv4()}.${fileExt}`;

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // First check if bucket exists and create it if it doesn't
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

      if (!bucketExists) {
        const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
          public: true
        });

        if (createBucketError) {
          throw new Error(`Error creating bucket: ${createBucketError.message}`);
        }
      }

      // Upload the file
      const { error: uploadError, data } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        throw new Error(`Error uploading file: ${uploadError.message}`);
      }

      if (!data?.path) {
        throw new Error('Upload failed - no path returned');
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      return { url: publicUrlData.publicUrl };
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message);
      toast.error(`Upload failed: ${error.message}`);
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  return {
    uploadFile,
    isUploading,
    uploadProgress,
    uploadError
  };
}
