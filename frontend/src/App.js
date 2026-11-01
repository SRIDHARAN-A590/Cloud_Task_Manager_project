import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function App() {

  const {
    isAuthenticated,
    isLoading,
    user
  } = useAuth0();

  if (isLoading) {
    return <h2>Loading...</h2>;
  }

  return (
    <>
      {isAuthenticated ? (
        <Dashboard user={user} />
      ) : (
        <Login />
      )}
    </>
  );
}

export default App;