
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create avatars bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabaseClient
      .storage
      .listBuckets();
      
    if (bucketsError) {
      throw bucketsError;
    }
    
    const avatarsBucketExists = buckets.some(bucket => bucket.name === 'avatars');
    
    if (!avatarsBucketExists) {
      const { error: createBucketError } = await supabaseClient
        .storage
        .createBucket('avatars', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2, // 2MB
        });
      
      if (createBucketError) {
        throw createBucketError;
      }
    }

    // Add participants to the default chat
    const { data: defaultChat, error: chatError } = await supabaseClient
      .from('chats')
      .select('id')
      .eq('name', 'Nexus Arena Team Chat')
      .single();

    if (chatError) {
      throw chatError;
    }

    // Get all users that are not in the default chat
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('id');

    if (usersError) {
      throw usersError;
    }

    // For each user, check if they're in the chat and add them if not
    for (const user of users) {
      const { data: existing, error: checkError } = await supabaseClient
        .from('chat_participants')
        .select('id')
        .eq('chat_id', defaultChat.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error(`Error checking if user ${user.id} is in chat: ${checkError.message}`);
        continue;
      }

      if (!existing) {
        const { error: insertError } = await supabaseClient
          .from('chat_participants')
          .insert({
            chat_id: defaultChat.id,
            user_id: user.id
          });

        if (insertError) {
          console.error(`Error adding user ${user.id} to chat: ${insertError.message}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Setup completed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
