import React, { useState } from "react";
import "../styles/tailwind.css";

const Groups = (props) => {
  const [user, setUser] = useState("");
  const [groups, setGroups] = useState([]);

  React.useEffect(() => {
    // Fetches a current user details.
    fetch("/api/user/me/", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token " + props.authToken,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
      });

    // Fetches all groups current user is a part of.
    fetch("/money-tracker/api/groups/", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token " + props.authToken,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setGroups(data);
      });
  }, [props.authToken]);

  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");

  function createGroup() {
    // Creates a group.
    fetch("/money-tracker/api/groups/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token " + props.authToken,
      },
      body: JSON.stringify({
        title: title,
        budget: budget,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setGroups([data, ...groups]);
        setTitle("");
        setBudget("");
      });
  }

  const [joinGroupId, setJoinGroupId] = useState("");

  function joinGroup() {
    // Joins a group with its group id.
    fetch("/money-tracker/api/join-group/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token " + props.authToken,
      },
      body: JSON.stringify({
        user_id: user.id,
        group_id: joinGroupId,
      }),
    }).then((res) => {
      if (res.ok) {
        props.setGroupId(joinGroupId);
      }
    });
  }

  function deleteGroup(id) {
    // Deletes a group
    fetch(`/money-tracker/api/groups/${id}/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token " + props.authToken,
      },
    }).then((res) => {
      if (res.ok) {
        let new_groups = groups.filter((group) => group.id !== id);
        setGroups(new_groups);
      }
    });
  }

  const [editing, setEditing] = useState(false);
  const [idToUpdate, setIdToUpdate] = useState("");

  function updateGroup(id, group) {
    // Updates a group details.
    fetch(`/money-tracker/api/groups/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token " + props.authToken,
      },
      body: JSON.stringify({
        title: group.title,
        budget: group.budget,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        let new_groups = groups.map((group) => {
          if (group.id === id) return data;
          return group;
        });
        setGroups(new_groups);
        setTitle("");
        setBudget("");
      });
  }

  return (
    <section className="bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col px-6 py-8 mx-auto md:h-screen lg:py-0">
        <div className="flex flex-wrap justify-between">
          <div>
            <p className="flex items-center mt-6 mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
              Groups
            </p>
            <form className="flex flex-wrap space-x-4 mt-4">
              <div>
                <input
                  type="text"
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Group Title*"
                  required=""
                  onChange={(event) => setTitle(event.target.value)}
                  value={title}
                />
              </div>
              <div>
                <input
                  type="text"
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-50"
                  placeholder="Group Budget"
                  required=""
                  onChange={(event) => setBudget(event.target.value)}
                  value={budget}
                />
              </div>
              {!editing && (
                <button
                  className="w-48 text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                  onClick={createGroup}
                >
                  Create New Group
                </button>
              )}
              {editing && (
                <>
                  <button
                    className="w-24 text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                    onClick={() => {
                      let groupToUpdate = groups.find(
                        (group) => group.id === idToUpdate
                      );
                      groupToUpdate.title = title;
                      groupToUpdate.budget = budget;
                      updateGroup(idToUpdate, groupToUpdate);
                      setEditing(false);
                      setIdToUpdate("");
                    }}
                  >
                    Update
                  </button>
                  <button
                    className="w-24 text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                    onClick={() => {
                      setEditing(false);
                      setIdToUpdate("");
                      setTitle("");
                      setBudget("");
                    }}
                  >
                    Back
                  </button>
                </>
              )}
            </form>
            <form className="flex flex-wrap space-x-4 mt-4 mb-4">
              <div>
                <input
                  type="text"
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Group Id*"
                  required=""
                  onChange={(event) => setJoinGroupId(event.target.value)}
                  value={joinGroupId}
                />
              </div>
              <button
                className="w-48 text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                onClick={joinGroup}
              >
                Join New Group
              </button>
            </form>
          </div>
          <div>
            <p className="flex items-center mt-6 mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Hi {user.name}
            </p>
            <button
              className="text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
              onClick={() => props.setAuthToken("")}
            >
              Logout
            </button>
          </div>
        </div>
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Group
                </th>
                <th scope="col" className="px-6 py-3">
                  Spent Amt
                </th>
                <th scope="col" className="px-6 py-3">
                  Budget
                </th>
                <th scope="col" className="px-6 py-3">
                  <span className="sr-only">Edit</span>
                </th>
                <th scope="col" className="px-6 py-3">
                  <span className="sr-only">Delete</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr
                  key={group.id}
                  className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <th
                    onClick={() => props.setGroupId(group.id)}
                    className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                  >
                    {group.title}
                  </th>
                  <td className="px-6 py-4">{group.amt_spent}</td>
                  <td className="px-6 py-4">{group.budget}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setIdToUpdate(group.id);
                        setTitle(group.title);
                        setBudget(group.budget);
                        setEditing(true);
                      }}
                      className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteGroup(group.id)}
                      className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default Groups;
