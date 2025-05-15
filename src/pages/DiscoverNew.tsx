import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Loader2, X, Search, Filter, Users, Star, Clock, Calendar, Trophy, SortDesc } from 'lucide-react';
import { getPlayers } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Define the player profile type
interface PlayerProfile {
  id: string;
  username: string;
  avatar_url?: string;
  full_name?: string;
  skill_level?: string; // Changed to string to match the database type
  games?: string[];
  play_style?: string;
  availability?: string;
  created_at?: string;
  updated_at?: string;
  // Add any additional fields that might be in the profiles table
}

// Define skill level mapping for UI display
const skillLevelMap = {
  'beginner': { value: 25, label: 'Beginner' },
  'intermediate': { value: 50, label: 'Intermediate' },
  'advanced': { value: 75, label: 'Advanced' },
  'professional': { value: 100, label: 'Professional' }
};

// Get all unique games from player profiles
const getUniqueGames = (players: PlayerProfile[]): string[] => {
  const gameSet = new Set<string>();
  
  players.forEach(player => {
    if (player.games && Array.isArray(player.games)) {
      player.games.forEach(game => gameSet.add(game));
    }
  });
  
  return ['All Games', ...Array.from(gameSet)];
};

// Player card component
const PlayerCard = ({ player, onInvite, viewMode }: { player: PlayerProfile, onInvite: (playerId: string) => void, viewMode: string }) => {
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Calculate skill level for display
  const getSkillValue = (level?: string) => {
    if (!level) return 50; // Default to intermediate
    return skillLevelMap[level as keyof typeof skillLevelMap]?.value || 50;
  };

  // Get skill color based on level
  const getSkillColor = (level?: string) => {
    const value = getSkillValue(level);
    if (value > 90) return 'from-green-400 to-emerald-500';
    if (value > 75) return 'from-blue-400 to-indigo-500';
    if (value > 50) return 'from-purple-400 to-pink-500';
    return 'from-orange-400 to-red-500';
  };

  // Format the skill level for display
  const formatSkillLevel = (level?: string) => {
    if (!level) return 'Intermediate';
    return skillLevelMap[level as keyof typeof skillLevelMap]?.label || level;
  };

  // Grid view card
  if (viewMode === 'grid') {
    return (
      <motion.div
        className="glass-card rounded-xl overflow-hidden relative border border-white/10 hover:border-white/20 transition-all"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
      >
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getSkillColor(player.skill_level)}`}></div>
        
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16 border-2 border-white/10 ring-2 ring-offset-2 ring-offset-background ring-white/5">
              <AvatarImage src={player.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
                {player.username ? getInitials(player.username) : <User className="h-6 w-6" />}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">{player.username}</h3>
              {player.full_name && <p className="text-white/70">{player.full_name}</p>}
            </div>
          </div>
          
          <div className="space-y-4">
            {player.games && player.games.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Trophy className="h-3 w-3 text-white/50" />
                  <p className="text-xs font-medium text-white/70">GAMES</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {player.games.map((game, index) => (
                    <Badge key={index} variant="outline" className="bg-white/5 hover:bg-white/10 transition-colors">
                      {game}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {player.skill_level && (
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="h-3 w-3 text-white/50" />
                    <p className="text-xs font-medium text-white/70">SKILL</p>
                  </div>
                  <Badge className={`bg-gradient-to-r ${getSkillColor(player.skill_level)} text-white border-0`}>
                    {formatSkillLevel(player.skill_level)}
                  </Badge>
                </div>
              )}
              
              {player.availability && (
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="h-3 w-3 text-white/50" />
                    <p className="text-xs font-medium text-white/70">AVAILABLE</p>
                  </div>
                  <p className="text-sm font-medium">{player.availability}</p>
                </div>
              )}
            </div>
            
            {player.play_style && (
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <User className="h-3 w-3 text-white/50" />
                  <p className="text-xs font-medium text-white/70">PLAY STYLE</p>
                </div>
                <p className="text-sm">{player.play_style}</p>
              </div>
            )}
          </div>
          
          <div className="mt-6">
            <Button 
              onClick={() => onInvite(player.id)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition-opacity"
            >
              Invite to Team
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }
  
  // List view card
  return (
    <motion.div
      className="glass-card rounded-xl overflow-hidden relative border border-white/10 hover:border-white/20 transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border border-white/10 ring-1 ring-offset-1 ring-offset-background ring-white/5">
            <AvatarImage src={player.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
              {player.username ? getInitials(player.username) : <User className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="font-bold">{player.username}</h3>
            {player.full_name && <p className="text-sm text-white/70">{player.full_name}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {player.skill_level && (
            <div className="hidden md:block">
              <Badge className={`bg-gradient-to-r ${getSkillColor(player.skill_level)} text-white border-0`}>
                {formatSkillLevel(player.skill_level)}
              </Badge>
            </div>
          )}
          
          {player.games && player.games.length > 0 && (
            <div className="hidden md:block">
              <div className="flex flex-wrap gap-1">
                {player.games.slice(0, 2).map((game, index) => (
                  <Badge key={index} variant="outline" className="bg-white/5">
                    {game}
                  </Badge>
                ))}
                {player.games.length > 2 && (
                  <Badge variant="outline" className="bg-white/5">+{player.games.length - 2}</Badge>
                )}
              </div>
            </div>
          )}
          
          <Button 
            onClick={() => onInvite(player.id)}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition-opacity"
          >
            Invite
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const DiscoverNew = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<PlayerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState('All Games');
  const [skillRange, setSkillRange] = useState([0, 100]);
  const [availableGames, setAvailableGames] = useState<string[]>(['All Games']);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState('skill_desc');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedAvailability, setSelectedAvailability] = useState('All');

  // Fetch players data
  useEffect(() => {
    const fetchPlayers = async () => {
      setIsLoading(true);
      try {
        const playersData = await getPlayers();
        
        // Filter out the current user from the player list
        const filteredData = playersData.filter((player: any) => player.id !== user?.id);
        
        setPlayers(filteredData as PlayerProfile[]);
        setFilteredPlayers(filteredData as PlayerProfile[]);
        
        // Extract unique games from player profiles
        setAvailableGames(getUniqueGames(filteredData as PlayerProfile[]));
      } catch (error) {
        console.error('Error fetching players:', error);
        toast.error('Failed to load players. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlayers();
  }, [user?.id]);

  // Filter and sort players based on search and filters
  useEffect(() => {
    const filterAndSortPlayers = () => {
      let result = [...players];
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(player => 
          player.username?.toLowerCase().includes(query) || 
          player.full_name?.toLowerCase().includes(query)
        );
      }
      
      // Filter by game
      if (selectedGame !== 'All Games') {
        result = result.filter(player => 
          player.games && Array.isArray(player.games) && 
          player.games.some(game => game === selectedGame)
        );
      }
      
      // Filter by skill level
      result = result.filter(player => {
        const skillValue = getSkillValue(player.skill_level);
        return skillValue >= skillRange[0] && skillValue <= skillRange[1];
      });
      
      // Filter by availability
      if (selectedAvailability !== 'All') {
        result = result.filter(player => 
          player.availability?.toLowerCase().includes(selectedAvailability.toLowerCase())
        );
      }
      
      // Sort players based on selected option
      result = sortPlayers(result, sortOption);
      
      setFilteredPlayers(result);
    };
    
    filterAndSortPlayers();
  }, [searchQuery, selectedGame, skillRange, selectedAvailability, sortOption, players]);
  
  // Sort players based on selected option
  const sortPlayers = (playerList: PlayerProfile[], sortBy: string) => {
    const sorted = [...playerList];
    
    switch (sortBy) {
      case 'skill_desc':
        return sorted.sort((a, b) => getSkillValue(b.skill_level) - getSkillValue(a.skill_level));
      case 'skill_asc':
        return sorted.sort((a, b) => getSkillValue(a.skill_level) - getSkillValue(b.skill_level));
      case 'name_asc':
        return sorted.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
      case 'name_desc':
        return sorted.sort((a, b) => (b.username || '').localeCompare(a.username || ''));
      case 'recent':
        return sorted.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
      default:
        return sorted;
    }
  };

  // Handle player invite
  const handleInvite = async (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!user || !player) return;

    try {
      // Insert notification for the invited user
      const { error } = await (window as any).supabase
        ? (window as any).supabase
          .from('notifications')
          .insert({
            user_id: playerId,
            title: 'Team Invitation',
            message: `${user.user_metadata?.username || user.email || 'A user'} has invited you to join their team!`,
            type: 'team',
            read: false
          })
        : await import('@/integrations/supabase/client').then(({ supabase }) =>
          supabase.from('notifications').insert({
            user_id: playerId,
            title: 'Team Invitation',
            message: `${user.user_metadata?.username || user.email || 'A user'} has invited you to join their team!`,
            type: 'team',
            read: false
          })
        );

      if (error) throw error;
      toast.success(`Invitation sent to ${player.username}!`);
    } catch (error: any) {
      toast.error(`Failed to send invite: ${error.message || error}`);
    }
  };

  // Calculate skill value for filtering
  const getSkillValue = (level?: string) => {
    if (!level) return 50; // Default to intermediate
    return skillLevelMap[level as keyof typeof skillLevelMap]?.value || 50;
  };

  return (
    <MainLayout>
      <section className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent inline-block">Discover Players</h1>
          <p className="text-white/70 mt-2">Find the perfect teammates for your next gaming adventure</p>
        </div>
        
        <div className="mb-6 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search players by username or full name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border-white/10 pl-10 pr-4 h-12 rounded-xl"
            />
          </div>
        </div>
        
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/5 border-white/10'}
            >
              <Users className="h-4 w-4 mr-2" />
              Grid View
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/5 border-white/10'}
            >
              <SortDesc className="h-4 w-4 mr-2" />
              List View
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="bg-white/5 border-white/10 w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skill_desc">Skill: High to Low</SelectItem>
                <SelectItem value="skill_asc">Skill: Low to High</SelectItem>
                <SelectItem value="name_asc">Name: A to Z</SelectItem>
                <SelectItem value="name_desc">Name: Z to A</SelectItem>
                <SelectItem value="recent">Recently Joined</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters - Desktop */}
          <motion.div 
            className="lg:w-1/4 glass-card p-6 rounded-xl border border-white/10 hidden lg:block"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Filter className="h-5 w-5 text-purple-400" />
              <h3 className="text-xl font-bold">Filters</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="game" className="text-white/70 flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5" />
                  Game
                </Label>
                <Select value={selectedGame} onValueChange={setSelectedGame}>
                  <SelectTrigger className="bg-white/5 border-white/10 rounded-lg">
                    <SelectValue placeholder="Select game" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGames.map((game) => (
                      <SelectItem key={game} value={game}>
                        {game}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="availability" className="text-white/70 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Availability
                </Label>
                <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                  <SelectTrigger className="bg-white/5 border-white/10 rounded-lg">
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">Any Time</SelectItem>
                    <SelectItem value="Weekends">Weekends</SelectItem>
                    <SelectItem value="Evenings">Evenings</SelectItem>
                    <SelectItem value="Anytime">Anytime</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label className="text-white/70 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5" />
                    Skill Level
                  </Label>
                  <span className="text-sm text-white/70">
                    {skillRange[0] === 0 && skillRange[1] === 100 
                      ? 'Any' 
                      : `${skillRange[0]} - ${skillRange[1]}`}
                  </span>
                </div>
                <Slider
                  defaultValue={[0, 100]}
                  max={100}
                  min={0}
                  step={25}
                  value={skillRange}
                  onValueChange={setSkillRange}
                  className="py-2"
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/10 mt-6">
              <Button 
                className="w-full bg-gradient-to-r from-neon-blue to-neon-pink hover:opacity-90"
                onClick={() => {
                  setSelectedGame('All Games');
                  setSkillRange([0, 100]);
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </Button>
            </div>
          </motion.div>
          
          {/* Filters - Mobile */}
          <motion.div 
            className={`glass-card p-6 rounded-lg lg:hidden ${showFilters ? 'block' : 'hidden'}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Filters</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowFilters(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="game">Game</Label>
                <Select value={selectedGame} onValueChange={setSelectedGame}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Select game" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGames.map((game) => (
                      <SelectItem key={game} value={game}>
                        {game}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Skill Level</Label>
                  <span className="text-sm text-white/70">
                    {skillRange[0] === 0 && skillRange[1] === 100 
                      ? 'Any' 
                      : `${skillRange[0]} - ${skillRange[1]}`}
                  </span>
                </div>
                <Slider
                  defaultValue={[0, 100]}
                  max={100}
                  min={0}
                  step={25}
                  value={skillRange}
                  onValueChange={setSkillRange}
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/10 mt-6">
              <Button 
                className="w-full bg-gradient-to-r from-neon-blue to-neon-pink hover:opacity-90"
                onClick={() => {
                  setSelectedGame('All Games');
                  setSkillRange([0, 100]);
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </Button>
            </div>
          </motion.div>
          
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-white/70">
                {isLoading 
                  ? 'Loading players...' 
                  : `Found ${filteredPlayers.length} players`}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="lg:hidden bg-white/5 border-white/10 hover:bg-white/10"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
            
            {isLoading ? (
              // Loading state
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="glass-card rounded-lg p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-full mt-4" />
                  </div>
                ))}
              </div>
            ) : (
              // Player grid
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-3'}>
                {filteredPlayers.length > 0 ? (
                  filteredPlayers.map((player) => (
                    <PlayerCard 
                      key={player.id} 
                      player={player} 
                      onInvite={handleInvite}
                      viewMode={viewMode}
                    />
                  ))
                ) : (
                  <div className="glass-card p-12 rounded-lg text-center col-span-full">
                    <h3 className="text-xl font-medium mb-2">No players found</h3>
                    <p className="text-white/70 mb-4">Try adjusting your filters or search query</p>
                    <Button 
                      variant="outline" 
                      className="bg-white/5 border-white/10 hover:bg-white/10"
                      onClick={() => {
                        setSelectedGame('All Games');
                        setSkillRange([0, 100]);
                        setSearchQuery('');
                      }}
                    >
                      Reset Filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default DiscoverNew;
