
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Users, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { getTeams, getTeamById, createTeam, deleteTeam, updateTeam } from '@/services/api';
import { Tables } from '@/integrations/supabase/types';
// Define types for our team data
type TeamMember = {
  id: string;
  username: string;
  avatar?: string;
  role?: string;
};

// Extended profile type to include optional role property
type ExtendedProfile = Tables<'profiles'> & {
  role?: string;
};

// Extended team type to include all necessary properties
type TeamWithMembers = Tables<'teams'> & {
  team_members: Array<{
    profile: ExtendedProfile | any; // Using any to handle SelectQueryError
  }>;
  members?: number;
  maxMembers?: number;
  recruiting?: boolean;
  logo?: string; // For backward compatibility
  // --- Canonical fields from DB schema ---
  rank?: string;
  max_members?: number;
  is_recruiting?: boolean;
  region?: string;
  // ---
  created?: string;
  role?: string;
};


// Team card component
const TeamCard = ({ team, isMyTeam = false }: { team: TeamWithMembers, isMyTeam?: boolean }) => {
  const { profile } = useAuth();
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [editTeamName, setEditTeamName] = useState(team.name || '');
  const [editTeamDescription, setEditTeamDescription] = useState(team.description || '');
  const [editTeamRegion, setEditTeamRegion] = useState(team.region || '');
  const [editTeamRank, setEditTeamRank] = useState(team.rank || '');
  const [editTeamRecruiting, setEditTeamRecruiting] = useState(!!team.recruiting || !!team.is_recruiting);

  useEffect(() => {
    if (manageDialogOpen) {
      setEditTeamName(team.name || '');
      setEditTeamDescription(team.description || '');
      setEditTeamRegion(team.region || '');
      setEditTeamRank(team.rank || '');
      setEditTeamRecruiting(!!team.recruiting || !!team.is_recruiting);
    }
  }, [manageDialogOpen, team]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateTeam(team.id, {
        name: editTeamName,
        description: editTeamDescription,
        region: editTeamRegion,
        rank: editTeamRank,
        is_recruiting: editTeamRecruiting,
      });
      toast.success('Team updated successfully!');
      setManageDialogOpen(false);
      // Optionally: trigger parent fetchTeams if passed as prop
      if (typeof window !== 'undefined' && window.location) {
        window.location.reload(); // fallback, ideally call fetchTeams
      }
    } catch (err: any) {
      toast.error('Failed to update team: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleDeleteTeam = async () => {
    if (!window.confirm('Are you sure you want to delete this team? This cannot be undone.')) return;
    try {
      await deleteTeam(team.id);
      toast.success('Team deleted successfully!');
      setManageDialogOpen(false);
      if (typeof window !== 'undefined' && window.location) {
        window.location.reload(); // fallback, ideally call fetchTeams
      }
    } catch (err: any) {
      toast.error('Failed to delete team: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleJoin = () => {
    toast.success(`Request to join ${team.name} has been sent!`);
  };

  return (
    <motion.div
      className="glass-card rounded-lg overflow-hidden h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="p-6 flex-1">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-12 w-12 border-2 border-white/10">
            <AvatarImage src={team.logo} />
            <AvatarFallback>
              <Users className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center">
              <h3 className="text-lg font-bold">{team.name}</h3>
              {team.recruiting && (
                <Badge className="ml-2 bg-neon-green text-black text-xs">Recruiting</Badge>
              )}
            </div>
            <p className="text-sm text-white/70">{team.rank || 'Unranked'}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
          
          <div>
            <p className="text-xs text-white/50">Region</p>
            <p className="text-sm font-medium">{team.region}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Members</p>
            <p className="text-sm font-medium">{team.members}/{team.maxMembers}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Founded</p>
            <p className="text-sm text-white/70">Created: {new Date(team.created || team.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-xs text-white/50 mb-1">Description</p>
          <p className="text-sm">{team.description}</p>
        </div>
      </div>
      
      <div className="border-t border-white/10 p-4 mt-auto">
        {(isMyTeam || (profile && team.created_by === profile.id)) ? (
          <>
            <Button
              className="w-full bg-gradient-to-r from-neon-blue to-neon-green hover:opacity-90"
              onClick={() => setManageDialogOpen(true)}
            >
              Manage Team
            </Button>
            <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
              <DialogContent className="glass-card sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Manage Team</DialogTitle>
                  <DialogDescription>Edit your team details or delete the team.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <Label htmlFor="edit-team-name">Team Name</Label>
                  <Input id="edit-team-name" value={editTeamName} onChange={e => setEditTeamName(e.target.value)} required />
                  <Label htmlFor="edit-team-description">Description</Label>
                  <Textarea id="edit-team-description" value={editTeamDescription} onChange={e => setEditTeamDescription(e.target.value)} />
                  <Label htmlFor="edit-team-region">Region</Label>
                  <Select value={editTeamRegion} onValueChange={setEditTeamRegion}>
                    <SelectTrigger id="edit-team-region">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="na">North America</SelectItem>
                      <SelectItem value="eu">Europe</SelectItem>
                      <SelectItem value="asia">Asia</SelectItem>
                      <SelectItem value="global">Global</SelectItem>
                    </SelectContent>
                  </Select>
                  <Label htmlFor="edit-team-rank">Rank</Label>
                  <Input id="edit-team-rank" value={editTeamRank} onChange={e => setEditTeamRank(e.target.value)} />
                  <Label htmlFor="edit-team-recruiting">Recruiting</Label>
                  <Select value={editTeamRecruiting ? "true" : "false"} onValueChange={v => setEditTeamRecruiting(v === "true") }>
                    <SelectTrigger id="edit-team-recruiting">
                      <SelectValue placeholder="Select recruiting status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Recruiting</SelectItem>
                      <SelectItem value="false">Not Recruiting</SelectItem>
                    </SelectContent>
                  </Select>
                  <DialogFooter>
                    <Button type="submit" className="bg-gradient-to-r from-neon-blue to-neon-green hover:opacity-90">Save Changes</Button>
                    <Button type="button" variant="destructive" onClick={handleDeleteTeam}>Delete Team</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <Button 
            className="w-full bg-gradient-to-r from-neon-blue to-neon-pink hover:opacity-90"
            onClick={handleJoin}
            disabled={!team.recruiting}
          >
            {team.recruiting ? 'Request to Join' : 'Team Not Recruiting'}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

// My team detailed view
const MyTeamDetail = ({ team, fetchTeams }: { team: TeamWithMembers, fetchTeams: () => void }) => {
  const { profile } = useAuth();

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this team? This cannot be undone.')) return;
    try {
      await deleteTeam(team.id);
      toast.success('Team deleted successfully!');
      if (fetchTeams) fetchTeams();
    } catch (error: any) {
      toast.error('Failed to delete team: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <div className="glass-card rounded-2xl shadow-lg overflow-hidden border border-white/10 bg-gradient-to-br from-black/80 to-gray-900/80 mb-8">
  <div className="p-8 md:p-10 flex flex-col gap-8">
    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
      <Avatar className="h-20 w-20 border-4 border-white/10 shadow-md">
        <AvatarImage src={team.logo} />
        <AvatarFallback>
          <Users className="h-10 w-10" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
          <div>
            <h3 className="text-3xl font-extrabold mb-1 text-white">{team.name}</h3>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`ml-0 px-2 py-1 text-xs ${team.recruiting ? 'bg-neon-green text-black' : 'bg-gray-700 text-white/70'}`}>{team.recruiting ? 'Recruiting' : 'Closed'}</Badge>
              <span className="text-xs text-white/60">{team.rank || 'Unranked'}</span>
            </div>
          </div>
          {profile?.id === team.created_by && (
            <Button variant="destructive" className="mt-2 md:mt-0" onClick={handleDelete} aria-label="Delete Team">
              Delete Team
            </Button>
          )}
        </div>
        <p className="text-white/80 mt-2 text-base leading-relaxed break-words max-w-2xl">{team.description}</p>
      </div>
    </div>

    <div>
      <h4 className="text-lg font-semibold mb-3 text-white">Team Members</h4>
      <div className="flex flex-wrap gap-4 mt-2">
        {team.team_members?.map((member) => (
          <div key={member.profile.id} className="flex items-center gap-3 bg-white/10 rounded-full px-4 py-2 shadow-sm">
            <Avatar className="h-8 w-8 border border-white/10">
              <AvatarImage src={member.profile.avatar_url || ''} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-white/90">{member.profile.username || member.profile.full_name}</span>
            {(member.profile as ExtendedProfile).role && (
              <Badge variant="outline" className="ml-1 bg-white/10 text-xs">
                {(member.profile as ExtendedProfile).role}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>

    <div className="flex flex-wrap gap-4 mt-4">
      {/* Schedule Practice Button/Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-neon-blue to-neon-green hover:opacity-90" aria-label="Schedule Practice">
            Schedule Practice
          </Button>
        </DialogTrigger>
        <DialogContent className="glass-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Team Practice</DialogTitle>
            <DialogDescription>
              Set up a practice session for your team members.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 py-4"
            onSubmit={e => {
              e.preventDefault();
              toast.success('Practice session scheduled!');
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="practice-date">Date</Label>
              <Input
                id="practice-date"
                type="date"
                className="bg-white/5 border-white/10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="practice-time">Time</Label>
              <Input
                id="practice-time"
                type="time"
                className="bg-white/5 border-white/10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="practice-duration">Duration (hours)</Label>
              <Input
                id="practice-duration"
                type="number"
                defaultValue={2}
                min={1}
                max={8}
                className="bg-white/5 border-white/10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="practice-notes">Notes</Label>
              <Textarea
                id="practice-notes"
                placeholder="Optional notes for the practice session..."
                className="bg-white/5 border-white/10"
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-gradient-to-r from-neon-blue to-neon-green hover:opacity-90">
                Schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Team Settings Button/Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10" aria-label="Team Settings">
            Team Settings
          </Button>
        </DialogTrigger>
        <DialogContent className="glass-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team Settings</DialogTitle>
            <DialogDescription>
              Update your team details below.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 py-4"
            onSubmit={async e => {
              e.preventDefault();
              // Collect values from the form
              const form = e.target as HTMLFormElement;
              const name = (form.elements.namedItem('team-name') as HTMLInputElement).value;
              const description = (form.elements.namedItem('team-description') as HTMLInputElement).value;
              const region = (form.elements.namedItem('team-region') as HTMLInputElement).value;
              const rank = (form.elements.namedItem('team-rank') as HTMLInputElement).value;
              const isRecruiting = (form.elements.namedItem('team-recruiting') as HTMLInputElement).checked;
              try {
                await updateTeam(team.id, {
                  name,
                  description,
                  region,
                  rank,
                  is_recruiting: isRecruiting,
                });
                toast.success('Team updated successfully!');
                if (fetchTeams) fetchTeams();
              } catch (err: any) {
                toast.error('Failed to update team: ' + (err?.message || 'Unknown error'));
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input id="team-name" name="team-name" defaultValue={team.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-description">Description</Label>
              <Textarea id="team-description" name="team-description" defaultValue={team.description} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-region">Region</Label>
              <Input id="team-region" name="team-region" defaultValue={team.region} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-rank">Rank</Label>
              <Input id="team-rank" name="team-rank" defaultValue={team.rank} />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                id="team-recruiting"
                name="team-recruiting"
                type="checkbox"
                defaultChecked={!!team.recruiting || !!team.is_recruiting}
                className="accent-neon-green scale-125"
              />
              <Label htmlFor="team-recruiting">Recruiting</Label>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-gradient-to-r from-neon-blue to-neon-green hover:opacity-90">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Open Recruitment Button */}
      <Button
        className={`bg-gradient-to-r from-neon-pink to-neon-blue hover:opacity-90 ${team.recruiting ? '' : 'opacity-60'}`}
        aria-label="Toggle Recruitment"
        onClick={async () => {
          try {
            await updateTeam(team.id, { is_recruiting: !team.recruiting });
            toast.success(`Recruitment ${team.recruiting ? 'closed' : 'opened'}!`);
            if (fetchTeams) fetchTeams();
          } catch (err: any) {
            toast.error('Failed to update recruitment status: ' + (err?.message || 'Unknown error'));
          }
        }}
      >
        {team.recruiting ? 'Close Recruitment' : 'Open Recruitment'}
      </Button>
    </div>
  </div>
</div>
  );
};

// Create team form
const CreateTeamForm = ({ onClose, onTeamCreated }: { onClose: () => void, onTeamCreated?: (team: TeamWithMembers) => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Use FormData for robust extraction
      const formData = new FormData(e.target as HTMLFormElement);
      const teamData = {
        name: formData.get('teamName') as string,
        logo_url: (formData.get('teamLogo') as string) || 'https://i.pravatar.cc/150?img=15',
        game: formData.get('teamGame') as string,
        rank: formData.get('teamRank') ? (formData.get('teamRank') as string) : undefined,
        max_members: formData.get('teamMaxMembers') ? parseInt(formData.get('teamMaxMembers') as string) : undefined,
        region: formData.get('teamRegion') ? (formData.get('teamRegion') as string) : undefined,
        description: formData.get('teamDescription') ? (formData.get('teamDescription') as string) : undefined,
        created_by: profile?.id,
        is_recruiting: formData.get('teamRecruiting') ? formData.get('teamRecruiting') === 'yes' : undefined
      };

      // Debug: log the data being sent
      console.log('Submitting teamData:', teamData);

      const newTeam = await createTeam(teamData);
      
      toast.success('Team created successfully!');
      if (onTeamCreated) onTeamCreated(newTeam as TeamWithMembers);
      onClose();
    } catch (error: any) {
      console.error('Error creating team:', error);
      // Show the actual error message from Supabase if available
      const errorMessage = error?.message || (typeof error === 'string' ? error : 'Failed to create team. Please try again.');
      toast.error(`Failed to create team: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="teamName">Team Name</Label>
        <Input
          id="team-name"
          name="teamName"
          placeholder="Enter team name"
          className="bg-white/5 border-white/10"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="team-game">Game</Label>
        <Select name="teamGame" required defaultValue="">
          <SelectTrigger className="bg-white/5 border-white/10">
            <SelectValue placeholder="Select a game" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="valorant">Valorant</SelectItem>
            <SelectItem value="csgo">CS:GO</SelectItem>
            <SelectItem value="dota2">Dota 2</SelectItem>
            <SelectItem value="lol">League of Legends</SelectItem>
            <SelectItem value="apex">Apex Legends</SelectItem>
            <SelectItem value="freefire">Free Fire</SelectItem>
            <SelectItem value="bgmi">BGMI</SelectItem>
            <SelectItem value="pubg">PUBG</SelectItem>
            <SelectItem value="fortnite">Fortnite</SelectItem>
            <SelectItem value="codm">Call of Duty Mobile</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="team-rank">Minimum Rank Requirement</Label>
        <Input
          id="team-rank"
          name="teamRank"
          placeholder="e.g., Gold+, Diamond+, etc."
          className="bg-white/5 border-white/10"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="team-recruiting">Recruiting?</Label>
        <Select name="teamRecruiting" required defaultValue="yes">
          <SelectTrigger className="bg-white/5 border-white/10">
            <SelectValue placeholder="Are you recruiting?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="team-region">Region</Label>
        <Select name="teamRegion" required defaultValue="">
          <SelectTrigger className="bg-white/5 border-white/10">
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="na">North America</SelectItem>
            <SelectItem value="eu">Europe</SelectItem>
            <SelectItem value="asia">Asia</SelectItem>
            <SelectItem value="global">Global</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="team-description">Team Description</Label>
        <Textarea
          id="team-description"
          name="teamDescription"
          placeholder="Describe your team, goals, and what kind of players you're looking for..."
          className="bg-white/5 border-white/10"
          rows={4}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="team-max-members">Maximum Members</Label>
        <Input
          id="team-max-members"
          name="teamMaxMembers"
          type="number"
          defaultValue={6}
          min={2}
          max={10}
          className="bg-white/5 border-white/10"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="team-logo">Team Logo (Optional)</Label>
        <Input
          id="team-logo"
          name="teamLogo"
          type="file"
          accept="image/*"
          className="bg-white/5 border-white/10"
        />
      </div>
      
      <div className="pt-4">
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-neon-blue to-neon-green hover:opacity-90"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Team...' : 'Create Team'}
        </Button>
      </div>
    </form>
  );
};

const Teams = () => {
  const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [myTeams, setMyTeams] = useState<TeamWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuth();
  
  // Move fetchTeams to top-level so it can be used in JSX and as a prop
  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const teamsData = await getTeams();
      // Process teams data to add computed properties
      const processedTeams = teamsData.map(team => {
        const processedTeam: TeamWithMembers = {
          ...team,
          members: team.team_members?.length || 0,
          logo: team.logo_url,
           rank: (team as any).rank ?? undefined,
          max_members: (team as any).max_members ?? undefined,
          is_recruiting: (team as any).is_recruiting ?? undefined,
          region: (team as any).region ?? undefined,
          // Backward compatibility fields
          maxMembers: (team as any).max_members ?? undefined,
          recruiting: (team as any).is_recruiting ?? undefined,
          created: (team as any).created_at,
        };
        return processedTeam;
      });
      // Filter teams into all teams and my teams with safe type checking
      if (profile?.id) {
        const userTeams = processedTeams.filter(team => 
          team.team_members?.some(member => {
            // Safely check if profile exists and has an id
            if (typeof member.profile === 'object' && member.profile && 'id' in member.profile) {
              return member.profile.id === profile.id;
            }
            return false;
          })
        );
        setMyTeams(userTeams);
        // All other teams (not including my teams)
        const otherTeams = processedTeams.filter(team => 
          !team.team_members?.some(member => {
            // Safely check if profile exists and has an id
            if (typeof member.profile === 'object' && member.profile && 'id' in member.profile) {
              return member.profile.id === profile.id;
            }
            return false;
          })
        );
        setTeams(otherTeams);
      } else {
        setTeams(processedTeams);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to load teams data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [profile?.id]);

  const handleTeamCreated = (newTeam: TeamWithMembers) => {
    // Add the new team to myTeams
    setMyTeams(prev => [newTeam, ...prev]);
  };

  return (
    <MainLayout>
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold">Teams</h1>
              <p className="text-white/70 mt-2">Create or join teams to compete together</p>
            </div>
            
            <Dialog open={createTeamDialogOpen} onOpenChange={setCreateTeamDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-neon-blue to-neon-green hover:opacity-90">
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create a New Team</DialogTitle>
                  <DialogDescription>
                    Fill out the form below to create your esports team.
                  </DialogDescription>
                </DialogHeader>
                <CreateTeamForm 
                  onClose={() => setCreateTeamDialogOpen(false)} 
                  onTeamCreated={handleTeamCreated} 
                />
              </DialogContent>
            </Dialog>
          </div>
          
          <Tabs defaultValue="browse" className="w-full">
            <TabsList className="mb-6 bg-white/5">
              <TabsTrigger value="browse">Browse Teams</TabsTrigger>
              <TabsTrigger value="my-teams">My Teams</TabsTrigger>
            </TabsList>
            
            <TabsContent value="browse">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : teams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teams.map((team) => {
                    // If this team is also in myTeams, pass isMyTeam
                    const isMyTeam = myTeams.some((myTeam) => myTeam.id === team.id);
                    return <TeamCard key={team.id} team={team} isMyTeam={isMyTeam} />;
                  })}
                </div>
              ) : (
                <div className="glass-card p-12 rounded-lg text-center">
                  <h3 className="text-xl font-medium mb-2">No teams available</h3>
                  <p className="text-white/70 mb-6">Be the first to create a team!</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="my-teams">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : myTeams.length > 0 ? (
                <div className="space-y-8">
                  {myTeams.map((team) => (
                    <MyTeamDetail key={team.id} team={team} fetchTeams={fetchTeams} />
                  ))}
                </div>
              ) : (
                <div className="glass-card p-12 rounded-lg text-center">
                  <h3 className="text-xl font-medium mb-2">You haven't joined any teams yet</h3>
                  <p className="text-white/70 mb-6">Create your own team or join an existing one to get started</p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-neon-blue to-neon-green hover:opacity-90 mr-4">
                        Create Team
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create a New Team</DialogTitle>
                        <DialogDescription>
                          Fill out the form below to create your esports team.
                        </DialogDescription>
                      </DialogHeader>
                      <CreateTeamForm onClose={() => {}} onTeamCreated={handleTeamCreated} />
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10">
                    Browse Teams
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </MainLayout>
  );
};

export default Teams;
