
import { supabase } from '@/integrations/supabase/client';

// ---- Teams API ----

export async function updateTeam(id: string, updates: Partial<{ name: string; description: string; region: string; rank: string; is_recruiting: boolean; }>) {
  const { data, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('Error updating team:', error);
    throw error;
  }
  return data;
}

export async function deleteTeam(id: string) {
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) {
    console.error('Error deleting team:', error);
    throw error;
  }
  return true;
}

export async function getTeams() {
  try {
    // First fetch all teams
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });

    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      throw teamsError;
    }

    // If no teams, return empty array
    if (!teamsData || teamsData.length === 0) {
      return [];
    }

    // For each team, fetch its members separately
    const teamsWithMembers = await Promise.all(
      teamsData.map(async (team) => {
        const { data: membersData, error: membersError } = await supabase
          .from('team_members')
          .select(`
            *,
            profile:profiles(*)
          `)
          .eq('team_id', team.id);

        if (membersError) {
          console.error(`Error fetching members for team ${team.id}:`, membersError);
          // Don't throw here, just return team without members
          return { ...team, team_members: [] };
        }

        return { ...team, team_members: membersData || [] };
      })
    );

    return teamsWithMembers;
  } catch (error) {
    console.error('Error in getTeams:', error);
    throw error;
  }
}

export async function getTeamById(id: string) {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      team_members:team_members(
        profile:profiles(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching team with id ${id}:`, error);
    throw error;
  }

  return data;
}

export async function createTeam(teamData: any) {
  try {
    // Step 1: Create the team
    const { data: newTeam, error: createError } = await supabase
      .from('teams')
      .insert(teamData)
      .select()
      .single();

    if (createError) {
      console.error('Error creating team:', createError);
      throw createError;
    }

    if (!newTeam) {
      throw new Error('Team created but no data returned');
    }

    // Step 2: Add the creator as a team member (if created_by is provided)
    if (teamData.created_by) {
      const teamMemberData = {
        team_id: newTeam.id,
        user_id: teamData.created_by,
        profile_id: teamData.created_by, // Set profile_id for correct join logic
        role: 'Captain', // Default role for the creator
        joined_at: new Date().toISOString()
      };

      const { error: memberError } = await supabase
        .from('team_members')
        .insert(teamMemberData);

      if (memberError) {
        console.error('Error adding creator as team member:', memberError);
        // Don't throw here, we still created the team successfully
      }
    }

    // Step 3: Return the team with empty team_members array
    // The UI will refresh and get the full data later
    return { ...newTeam, team_members: [] };
  } catch (error) {
    console.error('Error in createTeam:', error);
    throw error;
  }
}

// ---- Players/Profiles API ----
export async function getPlayers(filters: any = {}) {
  let query = supabase
    .from('profiles')
    .select('*');

  // Apply filters if provided
  if (filters.game) {
    query = query.contains('games', [filters.game]);
  }
  
  if (filters.skillMin && filters.skillMax) {
    // This is simplified - actual implementation depends on how skill level is stored
    query = query.gte('skill_level', filters.skillMin).lte('skill_level', filters.skillMax);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching players:', error);
    throw error;
  }

  return data || [];
}

// ---- Matches API ----
export async function getMatches() {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      team1:teams!matches_team1_id_fkey(*),
      team2:teams!matches_team2_id_fkey(*)
    `)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching matches:', error);
    throw error;
  }

  return data || [];
}

export async function createMatch(matchData: any) {
  const { data, error } = await supabase
    .from('matches')
    .insert(matchData)
    .select()
    .single();

  if (error) {
    console.error('Error creating match:', error);
    throw error;
  }

  return data;
}

// ---- Player Requests API ----
export async function getPlayerRequests() {
  const { data, error } = await supabase
    .from('player_requests')
    .select(`
      *,
      sender:profiles!player_requests_sender_id_fkey(*),
      receiver:profiles!player_requests_receiver_id_fkey(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching player requests:', error);
    throw error;
  }

  return data || [];
}

export async function sendPlayerRequest(requestData: any) {
  const { data, error } = await supabase
    .from('player_requests')
    .insert(requestData)
    .select()
    .single();

  if (error) {
    console.error('Error sending player request:', error);
    throw error;
  }

  return data;
}

export async function updatePlayerRequest(id: string, status: string) {
  const { data, error } = await supabase
    .from('player_requests')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating player request:', error);
    throw error;
  }

  return data;
}

// ---- Notifications API ----
export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  return data || [];
}

export async function markNotificationAsRead(id: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }

  return data;
}
