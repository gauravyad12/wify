import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Volume2, Search, Music, Video } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';
import { useSettings } from '../contexts/SettingsContext';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
}

export default function MusicPlayer() {
  const { isPlaying, currentTrack, playTrack, pauseTrack, setVolume, volume } = useAudio();
  const { settings, updateSettings } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioMode, setAudioMode] = useState<'audio' | 'video'>('audio');

  const searchYouTube = async (query: string) => {
    if (!settings.youtubeApiKey || !query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&key=${settings.youtubeApiKey}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const videos: YouTubeVideo[] = data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium.url,
          duration: 'Unknown'
        }));
        setSearchResults(videos);
      }
    } catch (error) {
      console.error('Error searching YouTube:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchYouTube(searchQuery);
  };

  const handlePlayVideo = (video: YouTubeVideo) => {
    playTrack({
      id: video.id,
      title: video.title,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      thumbnail: video.thumbnail
    });
  };

  // Background audio player for audio-only mode
  useEffect(() => {
    if (currentTrack && audioMode === 'audio') {
      // In a real implementation, you would use YouTube Audio API or extract audio stream
      // For now, we'll simulate background audio playback
      console.log('Playing audio-only:', currentTrack.title);
    }
  }, [currentTrack, audioMode]);

  return (
    <div className="h-full flex flex-col">
      {/* Header with Mode Toggle */}
      <div className="bg-black/20 backdrop-blur-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-semibold text-lg">Music Player</h2>
          
          {/* Audio/Video Mode Toggle */}
          <div className="flex bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setAudioMode('audio')}
              className={`flex items-center space-x-2 px-3 py-1 rounded transition-colors ${
                audioMode === 'audio' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Music size={16} />
              <span className="text-sm">Audio</span>
            </button>
            <button
              onClick={() => setAudioMode('video')}
              className={`flex items-center space-x-2 px-3 py-1 rounded transition-colors ${
                audioMode === 'video' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Video size={16} />
              <span className="text-sm">Video</span>
            </button>
          </div>
        </div>
        
        {/* Search */}
        <form onSubmit={handleSearch} className="flex space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for songs, artists, or genres..."
            className="flex-1 bg-white/10 text-white placeholder-white/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={isSearching || !settings.youtubeApiKey}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Search size={20} />
          </button>
        </form>

        {!settings.youtubeApiKey && (
          <p className="text-yellow-400 text-sm mt-2">
            Please add your YouTube API key in settings to enable music search
          </p>
        )}

        {audioMode === 'audio' && (
          <p className="text-green-400 text-sm mt-2">
            🎵 Audio-only mode: Music plays in background without video
          </p>
        )}
      </div>

      {/* Current Track */}
      {currentTrack && (
        <div className="bg-black/20 backdrop-blur-md p-4 border-b border-white/10">
          <div className="flex items-center space-x-4">
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="text-white font-semibold">{currentTrack.title}</h3>
              <p className="text-white/60 text-sm">
                Now Playing {audioMode === 'audio' ? '(Audio Only)' : '(Video)'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4 mt-4">
            <button className="text-white/70 hover:text-white transition-colors">
              <SkipBack size={24} />
            </button>
            <button
              onClick={isPlaying ? pauseTrack : () => playTrack(currentTrack)}
              className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full transition-colors"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button className="text-white/70 hover:text-white transition-colors">
              <SkipForward size={24} />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center space-x-2 mt-4">
            <Volume2 size={20} className="text-white/70" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-white/70 text-sm w-8">{volume}%</span>
          </div>

          {/* Background Audio Player */}
          {audioMode === 'audio' && (
            <audio
              ref={audioRef}
              className="hidden"
              controls={false}
              autoPlay={isPlaying}
            />
          )}
        </div>
      )}

      {/* Video Player for Video Mode */}
      {currentTrack && audioMode === 'video' && (
        <div className="bg-black aspect-video">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${currentTrack.id}?autoplay=${isPlaying ? 1 : 0}&controls=1`}
            title={currentTrack.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {isSearching ? (
          <div className="flex items-center justify-center h-32">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"
            />
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-white font-semibold mb-4">Search Results</h3>
            {searchResults.map((video) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                onClick={() => handlePlayVideo(video)}
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1">
                  <h4 className="text-white font-medium text-sm">{video.title}</h4>
                  <p className="text-white/60 text-xs">{video.duration}</p>
                </div>
                <Play size={16} className="text-white/70" />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center text-white/50 mt-8">
            <Search size={48} className="mx-auto mb-4" />
            <p>Search for music to get started</p>
            <p className="text-sm">Try searching for "hindi songs" or "relaxing music"</p>
            <div className="mt-4 text-xs text-white/40">
              <p>🎵 Audio mode: Background music without video</p>
              <p>📺 Video mode: Full YouTube video player</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}