import React from 'react';

const UserList = ({ users, onUserClick }) => {
  if (!users || users.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No users found.</p>;
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div
          key={user._id}
          onClick={() => onUserClick(user._id)}
          className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <img
            src={user.profileImage || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
            alt={user.name}
            className="w-10 h-10 rounded-full mr-4 object-cover"
          />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserList;