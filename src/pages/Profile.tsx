
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, CameraIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Create schema for profile form validation
const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  full_name: z.string().optional(),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced', 'professional']).optional(),
  games: z.string().optional(),
  play_style: z.string().optional(),
  availability: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile = () => {
  const { user, profile, updateProfile, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      full_name: '',
      skill_level: undefined,
      games: '',
      play_style: '',
      availability: '',
    },
  });

  // Initialize form with user profile data
  useEffect(() => {
    if (profile) {
      form.reset({
        username: profile.username || '',
        full_name: profile.full_name || '',
        skill_level: (profile.skill_level as any) || undefined,
        games: profile.games ? profile.games.join(', ') : '',
        play_style: profile.play_style || '',
        availability: profile.availability || '',
      });
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    
    try {
      let avatarPath = profile?.avatar_url || null;
      
      // Upload new avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `avatars/${user!.id}-${Date.now()}.${fileExt}`;

        // Upload avatar to Supabase Storage
        const { error: uploadError } = await supabase
          .storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL for the avatar
        const { data: urlData } = supabase
          .storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatarPath = urlData.publicUrl;
      }

      // Convert comma-separated games string to array
      const gamesArray = data.games
        ? data.games.split(',').map(game => game.trim())
        : [];

      // Update profile in database
      await updateProfile({
        username: data.username,
        full_name: data.full_name || '',
        skill_level: data.skill_level,
        games: gamesArray,
        play_style: data.play_style || '',
        availability: data.availability || '',
        ...(avatarPath && { avatar_url: avatarPath }),
      });

      toast.success('Profile updated successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(`Failed to update profile: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
        
        <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your profile information to help teammates find you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-2 border-border">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl">
                        {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <label 
                      htmlFor="avatar-upload" 
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                    >
                      <CameraIcon className="h-8 w-8 text-white" />
                    </label>
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      className="sr-only" 
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <p className="text-xs mt-2 text-muted-foreground">
                    Click to upload a profile picture
                  </p>
                </div>
                
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username*</FormLabel>
                        <FormControl>
                          <Input placeholder="gamertag" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Gaming Info */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="skill_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skill Level</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your skill level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="professional">Professional</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="games"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Games</FormLabel>
                        <FormControl>
                          <Input placeholder="League of Legends, Valorant, etc. (comma separated)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="play_style"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Play Style</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your play style, favorite roles, etc."
                            className="resize-none h-20"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="availability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Availability</FormLabel>
                        <FormControl>
                          <Input placeholder="Weekends, evenings, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <CardFooter className="flex justify-end px-0">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Profile;
