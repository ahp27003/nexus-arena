
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getMatches, createMatch } from '@/services/api';
import { Tables } from '@/integrations/supabase/types';

// Define types for match data

// Define a type for the raw match data from the database
type RawMatchData = {
  created_at: string;
  created_by: string | null;
  date: string;
  details: string | null;
  game: string;
  id: string;
  mvp_user_id: string | null;
  status: string;
  team1_id: string | null;
  team1_score: number | null;
  team2_id: string | null;
  team2_score: number | null;
  type: string;
  winner_id: string | null;
  team1?: any; // From the join query
  team2?: any; // From the join query
  [key: string]: any; // Allow any other properties
};

// Define our enhanced match type for the UI
type MatchWithTeams = {
  id: string;
  type: string;
  date: string;
  game: string;
  status: string;
  details?: string;
  team1?: {
    id: string;
    name: string;
    logo_url?: string;
  };
  team2?: {
    id: string;
    name: string;
    logo_url?: string;
  };
  winner?: {
    id: string;
    name: string;
  };
  team1_id?: string;
  team2_id?: string;
  team1_score?: number;
  team2_score?: number;
  mvp_user_id?: string;
  created_at?: string;
  created_by?: string;
  winner_id?: string;
  result?: {
    team1Score: number;
    team2Score: number;
    winner: string;
    mvp?: string;
  };
};

// Default stats data (to be replaced with real data in the future)
const defaultPerformanceData = [
  { name: 'Jan', wins: 0, losses: 0 },
  { name: 'Feb', wins: 0, losses: 0 },
  { name: 'Mar', wins: 0, losses: 0 },
  { name: 'Apr', wins: 0, losses: 0 },
  { name: 'May', wins: 0, losses: 0 },
];

const defaultPlayerStatsData = [
  { name: 'Player 1', kills: 0, deaths: 0, assists: 0, kd: 0 },
  { name: 'Player 2', kills: 0, deaths: 0, assists: 0, kd: 0 },
  { name: 'Player 3', kills: 0, deaths: 0, assists: 0, kd: 0 },
];

// Match card component
const MatchCard = ({ match }: { match: MatchWithTeams }) => {
  const isUpcoming = match.status === 'upcoming' || match.status === 'scheduled';
  const isPast = !isUpcoming;
  const isWinner = isPast && match.team1 && match.winner && match.winner.id === match.team1.id;
  
  return (
    <motion.div
      className="glass-card rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <Badge className={
            match.type === 'Tournament' 
              ? 'bg-neon-pink text-white' 
              : 'bg-neon-blue text-white'
          }>
            {match.type}
          </Badge>
          <div className="text-sm text-white/70">
            {format(new Date(match.date), 'MMM d, yyyy • h:mm a')}
          </div>
        </div>
        
        <div className="flex items-center justify-between my-6">
          <div className="flex flex-col items-center">
            <Avatar className="h-16 w-16 border-2 border-white/10">
              <AvatarImage src={match.team1?.logo_url || ''} />
              <AvatarFallback>
                <Users className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-bold">{match.team1?.name || 'Team 1'}</h3>
            {isPast && (
              <p className={`text-2xl font-bold mt-1 ${isWinner ? 'text-neon-green' : 'text-white/80'}`}>
                {match.result?.team1Score}
              </p>
            )}
          </div>
          
          <div className="flex flex-col items-center px-4">
            <p className="text-lg font-bold mb-2">VS</p>
            <p className="text-sm text-white/70">{match.game}</p>
            {isPast && (
              <Badge className={
                isWinner ? 'bg-neon-green text-black mt-2' : 'bg-red-500 text-white mt-2'
              }>
                {isWinner ? 'Victory' : 'Defeat'}
              </Badge>
            )}
          </div>
          
          <div className="flex flex-col items-center">
            <Avatar className="h-16 w-16 border-2 border-white/10">
              <AvatarImage src={match.team2?.logo_url || ''} />
              <AvatarFallback>
                <Users className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-bold">{match.team2?.name || 'Team 2'}</h3>
            {isPast && (
              <p className={`text-2xl font-bold mt-1 ${!isWinner ? 'text-neon-green' : 'text-white/80'}`}>
                {match.result?.team2Score}
              </p>
            )}
          </div>
        </div>
        
        <div className="text-sm text-white/80 mb-4">
          {match.details}
        </div>
        
        {isPast && match.mvp_user_id && (
          <div className="text-sm text-white/70 mb-4">
            MVP: {match.mvp_user_id}
          </div>
        )}
        
        <div className="flex justify-end gap-3 mt-4">
          {isUpcoming && (
            <>
              <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10">
                View Details
              </Button>
              <Button className="bg-gradient-to-r from-neon-blue to-neon-pink hover:opacity-90">
                Prepare
              </Button>
            </>
          )}
          {isPast && (
            <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10">
              Match Details
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Schedule match form
const ScheduleMatchForm = ({ onClose, onMatchCreated }: { onClose: () => void, onMatchCreated?: (match: MatchWithTeams) => void }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { profile } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Get form values
      const target = e.target as HTMLFormElement;
      const matchData = {
        type: (target.elements.namedItem('matchType') as HTMLSelectElement).value,
        date: new Date(date).toISOString(),
        game: (target.elements.namedItem('matchGame') as HTMLSelectElement).value,
        team1_id: (target.elements.namedItem('team1') as HTMLSelectElement).value,
        team2_id: (target.elements.namedItem('team2') as HTMLSelectElement).value,
        details: (target.elements.namedItem('matchDetails') as HTMLTextAreaElement).value,
        status: 'scheduled',
        created_by: profile?.id
      };
      
      // Create match in database
      const newMatch = await createMatch(matchData);
      
      toast.success('Match scheduled successfully!');
      if (onMatchCreated) onMatchCreated(newMatch as MatchWithTeams);
      onClose();
    } catch (error) {
      console.error('Error scheduling match:', error);
      toast.error('Failed to schedule match. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="matchType">Match Type</Label>
        <Select required defaultValue="">
          <SelectTrigger className="bg-white/5 border-white/10">
            <SelectValue placeholder="Select match type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tournament">Tournament</SelectItem>
            <SelectItem value="scrim">Scrim</SelectItem>
            <SelectItem value="friendly">Friendly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="matchGame">Game</Label>
        <Select required defaultValue="">
          <SelectTrigger className="bg-white/5 border-white/10">
            <SelectValue placeholder="Select game" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="League of Legends">League of Legends</SelectItem>
            <SelectItem value="Dota 2">Dota 2</SelectItem>
            <SelectItem value="Overwatch">Overwatch</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="team1">Team 1</Label>
        <Select required defaultValue="">
          <SelectTrigger className="bg-white/5 border-white/10">
            <SelectValue placeholder="Select team 1" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="phoenix">Phoenix Flames</SelectItem>
            <SelectItem value="nexus">Nexus Guardians</SelectItem>
            <SelectItem value="radiant">Radiant Rebels</SelectItem>
            <SelectItem value="overwatch">Overwatch Outlaws</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="team2">Team 2</Label>
        <Select required defaultValue="">
          <SelectTrigger className="bg-white/5 border-white/10">
            <SelectValue placeholder="Select team 2" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="phoenix">Phoenix Flames</SelectItem>
            <SelectItem value="nexus">Nexus Guardians</SelectItem>
            <SelectItem value="radiant">Radiant Rebels</SelectItem>
            <SelectItem value="overwatch">Overwatch Outlaws</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="matchDate">Date & Time</Label>
        <div className="grid gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal bg-white/5 border-white/10 ${!date && "text-muted-foreground"}`}
              >
                {date ? format(date, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background border-white/10" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Input
            type="time"
            className="bg-white/5 border-white/10"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="matchDetails">Match Details</Label>
        <Textarea
          id="matchDetails"
          placeholder="Add any additional details about the match..."
          className="bg-white/5 border-white/10"
          rows={3}
        />
      </div>
      
      <div className="pt-4">
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-neon-blue to-neon-green hover:opacity-90"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Scheduling Match...' : 'Schedule Match'}
        </Button>
      </div>
    </form>
  );
};

const StatsSection = () => {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-lg p-6">
        <h3 className="text-xl font-medium mb-4">Team Performance</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[]}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
              <YAxis stroke="rgba(255,255,255,0.7)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(30,30,35,0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.5rem' 
                }} 
              />
              <Bar dataKey="wins" fill="#00FFFF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="losses" fill="#FF00FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="glass-card rounded-lg p-6">
        <h3 className="text-xl font-medium mb-4">Player Statistics</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4">Player</th>
                <th className="text-right py-3 px-4">Kills</th>
                <th className="text-right py-3 px-4">Deaths</th>
                <th className="text-right py-3 px-4">Assists</th>
                <th className="text-right py-3 px-4">K/D Ratio</th>
              </tr>
            </thead>
            <tbody>
              {[].map((player, index) => (
                <tr 
                  key={player.name} 
                  className={`
                    border-b border-white/10 
                    ${player.name === 'You' ? 'bg-white/5' : ''}
                    ${index === [].length - 1 ? 'border-b-0' : ''}
                  `}
                >
                  <td className="py-3 px-4 font-medium">{player.name}</td>
                  <td className="text-right py-3 px-4">{player.kills}</td>
                  <td className="text-right py-3 px-4">{player.deaths}</td>
                  <td className="text-right py-3 px-4">{player.assists}</td>
                  <td className={`text-right py-3 px-4 font-medium ${
                    player.kd > 1.5 ? 'text-neon-green' :
                    player.kd > 1 ? 'text-neon-blue' :
                    'text-neon-pink'
                  }`}>
                    {player.kd.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Matches = () => {
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<MatchWithTeams[]>([]);
  const [pastMatches, setPastMatches] = useState<MatchWithTeams[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuth();
  
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        const matchesData = await getMatches();
        
        // Process matches data
        const processedMatches = matchesData.map((match: RawMatchData) => {
          // Create a properly typed match object
          const matchWithTeams: MatchWithTeams = {
            id: match.id,
            type: match.type,
            date: match.date,
            game: match.game,
            status: match.status,
            details: match.details || undefined,
            team1_id: match.team1_id || undefined,
            team2_id: match.team2_id || undefined,
            team1_score: match.team1_score || undefined,
            team2_score: match.team2_score || undefined,
            mvp_user_id: match.mvp_user_id || undefined,
            created_at: match.created_at,
            created_by: match.created_by || undefined,
            winner_id: match.winner_id || undefined,
            
            // Handle joined team data
            team1: match.team1 ? {
              id: match.team1.id,
              name: match.team1.name,
              logo_url: match.team1.logo_url
            } : undefined,
            
            team2: match.team2 ? {
              id: match.team2.id,
              name: match.team2.name,
              logo_url: match.team2.logo_url
            } : undefined,
            
            // Add computed result property
            result: match.team1_score !== null && match.team2_score !== null ? {
              team1Score: match.team1_score || 0,
              team2Score: match.team2_score || 0,
              winner: match.team1_score > match.team2_score ? 
                match.team1?.name || 'Team 1' : 
                match.team2?.name || 'Team 2'
            } : undefined,
            
            // Handle winner reference if available
            winner: match.winner_id ? {
              id: match.winner_id,
              name: match.team1_id === match.winner_id ? 
                match.team1?.name || 'Team 1' : 
                match.team2?.name || 'Team 2'
            } : undefined
          };
          
          return matchWithTeams;
        });
        
        setMatches(processedMatches);
        
        // Filter upcoming and past matches
        const upcoming = processedMatches.filter(match => 
          match.status === 'upcoming' || match.status === 'scheduled'
        );
        const past = processedMatches.filter(match => 
          match.status === 'completed'
        );
        
        setUpcomingMatches(upcoming);
        setPastMatches(past);
        
      } catch (error) {
        console.error('Error fetching matches:', error);
        toast.error('Failed to load matches data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const handleMatchCreated = (newMatch: MatchWithTeams) => {
    // Add the new match to upcomingMatches
    setUpcomingMatches(prev => [newMatch, ...prev]);
  };

  return (
    <MainLayout>
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold">Matches</h1>
              <p className="text-white/70 mt-2">Schedule and track your team's matches</p>
            </div>
            
            <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-neon-blue to-neon-green hover:opacity-90">
                  Schedule Match
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Schedule a New Match</DialogTitle>
                  <DialogDescription>
                    Fill out the form below to schedule a match for your team.
                  </DialogDescription>
                </DialogHeader>
                <ScheduleMatchForm 
                  onClose={() => setScheduleDialogOpen(false)} 
                  onMatchCreated={handleMatchCreated}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="mb-6 bg-white/5">
              <TabsTrigger value="upcoming">Upcoming Matches</TabsTrigger>
              <TabsTrigger value="past">Past Matches</TabsTrigger>
              <TabsTrigger value="stats">Team Stats</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : upcomingMatches.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {upcomingMatches.map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              ) : (
                <div className="glass-card p-12 rounded-lg text-center">
                  <h3 className="text-xl font-medium mb-2">No upcoming matches</h3>
                  <p className="text-white/70 mb-6">Schedule a match to see it here</p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-neon-blue to-neon-green hover:opacity-90">
                        Schedule Match
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Schedule a New Match</DialogTitle>
                        <DialogDescription>
                          Fill out the form below to schedule a match for your team.
                        </DialogDescription>
                      </DialogHeader>
                      <ScheduleMatchForm onClose={() => {}} onMatchCreated={handleMatchCreated} />
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="past">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : pastMatches.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pastMatches.map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              ) : (
                <div className="glass-card p-12 rounded-lg text-center">
                  <h3 className="text-xl font-medium mb-2">No match history</h3>
                  <p className="text-white/70">Play matches to build your team's history</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="stats">
              <StatsSection />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </MainLayout>
  );
};

export default Matches;
