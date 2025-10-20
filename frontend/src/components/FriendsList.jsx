import React, { useState, useEffect, useCallback } from 'react';
import { Search, Users, Loader2, UserPlus, MessageCircle, CheckCircle2 } from 'lucide-react';
import { getFriendsList, searchUsers, getUnreadMessageCounts } from '../services/api';
import socket from '../services/socket';
import debounce from 'lodash.debounce';
import { PlayCircle } from 'lucide-react';

const FriendsList = ({ onSelectFriend }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openChatStatuses, setOpenChatStatuses] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hoveredFriend, setHoveredFriend] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({}); // New state for unread counts

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const response = await getUnreadMessageCounts();
      setUnreadCounts(response.data);
    } catch (err) {
      console.error('Error fetching unread message counts:', err);
    }
  }, []);

  useEffect(() => {
    console.log('FriendsList useEffect: registering socket listeners');
    const fetchAllFriends = async () => {
      try {
        setLoading(true);
        const response = await getFriendsList();
        setFriends(response.data.friends || response.data);
        fetchUnreadCounts(); // Fetch unread counts after friends are loaded
      } catch (err) {
        setError('Failed to fetch friends.');
        console.error('Error fetching friends:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllFriends();

    socket.on('chatStatus', ({ friendId, status, context }) => {
      console.log('FriendsList received chatStatus:', { friendId, status, context });
      if (context === 'friendsList') {
        setOpenChatStatuses(prevStatuses => ({
          ...prevStatuses,
          [friendId]: status === 'opened'
        }));
      }
    });

    socket.on('unreadCountsUpdated', () => {
      console.log('FriendsList received unreadCountsUpdated event');
      fetchUnreadCounts(); // Re-fetch unread counts when event is received
    });

    return () => {
      console.log('FriendsList useEffect cleanup: unregistering socket listeners');
      socket.off('chatStatus');
      socket.off('unreadCountsUpdated');
    };
  }, [fetchUnreadCounts]);

  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (query.length > 0) {
        setSearchLoading(true);
        setSearchError(null);
        try {
          const response = await searchUsers(query);
          setSearchResults(response.data);
        } catch (err) {
          setSearchError('Failed to search users.');
          console.error('Error searching users:', err);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm);
    } else {
      setSearchResults([]);
    }
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const UserCard = ({ user, isSearchResult = false }) => {
    const getProfileImage = () => {
      return user.profileImage || user.profilePhoto || 'https://via.placeholder.com/48';
    };

    return (
      <div
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
        onClick={() => onSelectFriend(user)}
        onMouseEnter={() => setHoveredFriend(user._id)}
        onMouseLeave={() => setHoveredFriend(null)}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 transition-all duration-500" />
        
        <div className="relative p-3 sm:p-4 flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
            <img
              src={getProfileImage()}
              alt={user.name}
              className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-slate-700 group-hover:ring-blue-500 transition-all duration-300"
            />
            {!isSearchResult && openChatStatuses[user._id] && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium truncate group-hover:text-blue-400 transition-colors duration-200">
              {user.name}
            </h4>
            <p className="text-slate-400 text-sm truncate">
              {isSearchResult ? 'Add as friend' : 'Click to chat'}
            </p>
            {!isSearchResult && unreadCounts[user._id] > 0 && (
              <div className="absolute top-1/2 right-4 -translate-y-1/2 flex items-center gap-1 text-blue-400 text-xs font-bold">
                <PlayCircle className="w-4 h-4" />
                <span>{unreadCounts[user._id]}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isSearchResult ? (
              <UserPlus className="w-5 h-5 text-blue-400" />
            ) : (
              <>
                <MessageCircle className="w-5 h-5 text-blue-400" />
                {openChatStatuses[user._id] && (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading your friends...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center p-8 rounded-2xl bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Connections</h2>
        </div>
        
        {/* Search Bar */}
        <div className={`relative transition-all duration-300 ${searchFocused ? 'scale-[1.02]' : ''}`}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Discover new friends..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-slate-800 transition-all duration-200"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchLoading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Search Results */}
        {searchTerm.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
              <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wider">
                Search Results
              </h3>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
            </div>
            
            {searchError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center">
                {searchError}
              </div>
            )}
            
            {searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((user) => (
                  <UserCard key={user._id} user={user} isSearchResult />
                ))}
              </div>
            ) : !searchLoading && !searchError && (
              <div className="text-center p-8 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <p className="text-slate-400">No users found</p>
              </div>
            )}
          </div>
        )}

        {/* Friends List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
            <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wider">
              Your Friends ({friends.length})
            </h3>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
          </div>
          
          {friends.length === 0 ? (
            <div className="text-center p-12 rounded-2xl bg-slate-800/30 border border-slate-700/50">
              <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-lg sm:text-xl text-slate-400 mb-2">No friends yet</p>
              <p className="text-slate-500 text-sm">Search above to find and add friends</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <UserCard key={friend._id} user={friend} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsList;