import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Landing() {
  const { user, wasLoggedIn } = useAuth();

  if (user || wasLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    window.location.href = '/landing/index.html';
  }, []);

  return null;
}
