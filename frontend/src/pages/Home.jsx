import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import FriendsList from '../components/FriendsList';

const Home = ({ globalUnreadCounts }) => {
  const navigate = useNavigate();

  const handleUserClick = (friend) => {
    navigate(`/chat/${friend._id}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header title="Sevo" showBackButton={false} />
      <main className="flex-1">
        <FriendsList onSelectFriend={handleUserClick} globalUnreadCounts={globalUnreadCounts} />
      </main>
    </div>
  );
};

export default Home;