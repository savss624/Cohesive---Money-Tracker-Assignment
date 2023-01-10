import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import Groups from "../../components/Groups.jsx";
import Auth from "../../components/Auth.jsx";
import Transactions from "../../components/Transactions.jsx";

const App = () => {
  const [authToken, setAuthToken] = useState("");
  const [groupId, setGroupId] = useState("");

  return (
    <>
      {authToken === "" ? (
        <Auth authToken={authToken} setAuthToken={setAuthToken} />
      ) : groupId === "" ? (
        <Groups
          authToken={authToken}
          setAuthToken={setAuthToken}
          groupId={groupId}
          setGroupId={setGroupId}
        />
      ) : (
        <Transactions
          authToken={authToken}
          groupId={groupId}
          setGroupId={setGroupId}
        />
      )}
    </>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);
