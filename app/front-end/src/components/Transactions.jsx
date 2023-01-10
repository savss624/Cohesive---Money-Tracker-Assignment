import React, { useState } from "react";
import "../styles/tailwind.css";

const Transactions = (props) => {
  const [currentUser, setCurrentUser] = useState("");
  const [activities, setActivities] = useState([]);
  const [activitiesBackup, setActivitiesBackup] = useState([]);
  const [knownUsers, setKnownUsers] = useState({});
  const [userTransactionsSummary, setUserTransactionsSummary] = useState({});

  React.useEffect(() => {
    function getUserDetails() {
      // Gets current user details.
      fetch("/api/user/me/", {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Token " + props.authToken,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setCurrentUser(data);
          fetch(`api/${props.groupId}/user-transactions-summary/${data.id}/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Token " + props.authToken,
            },
          })
            .then((res) => res.json())
            .then((data) => {
              setUserTransactionsSummary(data);
            });
        });
    }

    function getGroupActivities() {
      // Gets all transactions and settlements of a group.
      // Joins them and sort them acc to their date.
      Promise.all([
        fetch(`/money-tracker/api/${props.groupId}/transactions/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Token " + props.authToken,
          },
        }),
        fetch(`/money-tracker/api/${props.groupId}/settles/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Token " + props.authToken,
          },
        }),
      ])
        .then(([resTransactions, resSettles]) =>
          Promise.all([resTransactions.json(), resSettles.json()])
        )
        .then(([dataTransactions, dataSettles]) => {
          let newActivities = [...dataTransactions, ...dataSettles].sort(
            (a, b) => (new Date(a.date) > new Date(b.date) ? -1 : 1)
          );
          setActivities(newActivities);
          setActivitiesBackup(newActivities);
        });
    }

    function getKnownUsers() {
      // Gets all members and non members of a group.
      Promise.all([
        fetch(`/money-tracker/api/${props.groupId}/members/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Token " + props.authToken,
          },
        }),
        fetch(`/money-tracker/api/${props.groupId}/non-members/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Token " + props.authToken,
          },
        }),
      ])
        .then(([resMembers, resNonMembers]) =>
          Promise.all([resMembers.json(), resNonMembers.json()])
        )
        .then(([dataMembers, dataNonMembers]) => {
          let members = {};
          dataMembers.map(
            (user) => (members[`m_${user.id}`] = [user.name, true])
          );
          let nonMembers = {};
          dataNonMembers.map(
            (user) => (nonMembers[`nm_${user.id}`] = [user.name, false])
          );
          setKnownUsers({ ...members, ...nonMembers });
        });
    }

    getUserDetails();
    getGroupActivities();
    getKnownUsers();
  }, [props.authToken, props.groupId]);

  function updateUserTransactionSummary(id) {
    // Get and updates the group balance for current user.
    fetch(`api/${props.groupId}/user-transactions-summary/${id}/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token " + props.authToken,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUserTransactionsSummary(data);
      });
  }

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [payedBy, setPayedBy] = useState([]);
  const [newPayedBy, setNewPayedBy] = useState("");
  const [newOwedBy, setNewOwedBy] = useState("");

  function createTransaction() {
    // Create a transaction.
    fetch("/money-tracker/api/transactions/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token " + props.authToken,
      },
      body: JSON.stringify({
        category: category,
        group_id: props.groupId,
        added_by: currentUser.id,
        amt: amount,
        payed_by: {
          users: [
            ...payedBy.map((id) => [id, ...knownUsers[id]]),
            ...newPayedBy
              .split(",")
              .filter((name) => name !== "")
              .map((name) => ["", name.trim(), false]),
          ],
        },
        owes_by: {
          users: [
            ...Object.keys(knownUsers).map((id) => [id, ...knownUsers[id]]),
            ...newPayedBy
              .split(",")
              .filter((name) => name !== "")
              .map((name) => ["", name.trim(), false]),
            ...newOwedBy
              .split(",")
              .filter((name) => name !== "")
              .map((name) => ["", name.trim(), false]),
          ],
        },
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        Promise.all([
          fetch(`/money-tracker/api/${props.groupId}/members/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Token " + props.authToken,
            },
          }),
          fetch(`/money-tracker/api/${props.groupId}/non-members/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Token " + props.authToken,
            },
          }),
        ])
          .then(([resMembers, resNonMembers]) =>
            Promise.all([resMembers.json(), resNonMembers.json()])
          )
          .then(([dataMembers, dataNonMembers]) => {
            console.log(dataMembers, dataNonMembers);
            let members = {};
            dataMembers.map(
              (user) => (members[`m_${user.id}`] = [user.name, true])
            );
            let nonMembers = {};
            dataNonMembers.map(
              (user) => (nonMembers[`nm_${user.id}`] = [user.name, false])
            );
            let newKnownUsers = { ...members, ...nonMembers };
            console.log(newKnownUsers);
            setKnownUsers(newKnownUsers);
            setActivities((activities) => [data, ...activities]);
            setActivitiesBackup((activities) => [data, ...activities]);
            updateUserTransactionSummary(currentUser.id);
            setCategory("");
            setAmount("");
            setPayedBy([]);
            setNewOwedBy("");
            setNewPayedBy("");
            setKnownUsersDropButtonState(false);
            setEditing(false);
          });
      });
  }

  const [settleWith, setSettleWith] = useState("");

  function createSettle() {
    // Creates a settlement.
    fetch("/money-tracker/api/settles/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token " + props.authToken,
      },
      body: JSON.stringify({
        group_id: props.groupId,
        added_by: currentUser.id,
        amt: userTransactionsSummary.owes[settleWith],
        pays: `m_${currentUser.id}`,
        gets: settleWith,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setActivities((activities) => [data, ...activities]);
        setActivitiesBackup((activities) => [data, ...activities]);
        updateUserTransactionSummary(currentUser.id);
        setSettleWith("");
        setOwesToDropButtonState(false);
      });
  }

  function deleteTransaction(id) {
    // Deletes a transaction.
    fetch(`/money-tracker/api/transactions/${id}/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token " + props.authToken,
      },
    }).then((res) => {
      if (res.ok) {
        let new_activities = activities.filter(
          (activity) =>
            !(activity.id === id && activity.hasOwnProperty("category"))
        );
        updateUserTransactionSummary(currentUser.id);
        setActivities(new_activities);
        setActivitiesBackup(new_activities);
      }
    });
  }

  function deleteSettle(id) {
    // Deletes a settlement.
    fetch(`/money-tracker/api/settles/${id}/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token " + props.authToken,
      },
    }).then((res) => {
      if (res.ok) {
        let new_activities = activities.filter(
          (activity) =>
            !(activity.id === id && !activity.hasOwnProperty("category"))
        );
        updateUserTransactionSummary(currentUser.id);
        setActivities(new_activities);
        setActivitiesBackup(new_activities);
      }
    });
  }

  const [editing, setEditing] = useState(false);
  const [idToUpdate, setIdToUpdate] = useState("");

  function updateTransaction(id) {
    // Updates a transaction.
    fetch(`/money-tracker/api/transactions/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token " + props.authToken,
      },
      body: JSON.stringify({
        category: category,
        group_id: props.groupId,
        added_by: currentUser.id,
        amt: amount,
        payed_by: {
          users: [...payedBy.map((id) => [id, ...knownUsers[id]])],
        },
        owes_by: {
          users: [
            ...Object.keys(knownUsers).map((id) => [id, ...knownUsers[id]]),
          ],
        },
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        let new_activities = activities.map((activity) => {
          if (activity.id === id) return data;
          return activity;
        });
        setActivities(new_activities);
        setActivitiesBackup(new_activities);
        updateUserTransactionSummary(currentUser.id);
        setCategory("");
        setAmount("");
        setPayedBy([]);
        setNewOwedBy("");
        setNewPayedBy("");
        setKnownUsersDropButtonState(false);
        setEditing(false);
        setIdToUpdate("");
      });
  }

  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  function applyFilter() {
    // Apply a filter on the bases of either
    // category or date.
    let new_activities = activitiesBackup;

    if (categoryFilter !== "")
      new_activities = new_activities.filter((activity) =>
        activity.category.includes(categoryFilter)
      );
    if (startDateFilter !== "")
      new_activities = new_activities.filter((activity) => {
        return (
          new Date(activity.date) >= new Date(`${startDateFilter} 00:00:00`)
        );
      });
    if (endDateFilter !== "")
      new_activities = new_activities.filter(
        (activity) =>
          new Date(activity.date) <= new Date(`${endDateFilter} 23:59:59`)
      );

    setActivities(new_activities);
  }

  const [knownUsersDropButtonState, setKnownUsersDropButtonState] =
    useState(false);
  const [owesToDropButtonState, setOwesToDropButtonState] = useState(false);

  return (
    <section className="bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col px-6 py-8 mx-auto md:h-screen lg:py-0">
        <div className="flex flex-wrap justify-between">
          <div>
            <p className="flex items-center mt-6 mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
              Activities
            </p>
            <form className="flex flex-wrap space-x-4 mt-4 mb-4">
              <div className="flex flex-col space-x-4 mt-4 mb-4">
                <div className="flex flex-row">
                  <div>
                    <input
                      type="text"
                      className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Category*"
                      required=""
                      onChange={(event) => setCategory(event.target.value)}
                      value={category}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Amount*"
                      required=""
                      onChange={(event) => setAmount(event.target.value)}
                      value={amount}
                    />
                  </div>
                  <div>
                    <button
                      className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                      type="button"
                    >
                      Payed By*
                      <svg
                        className="w-4 h-4 ml-2"
                        onClick={() =>
                          setKnownUsersDropButtonState(
                            (knownUsersDropButtonState) =>
                              !knownUsersDropButtonState
                          )
                        }
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </button>
                    <div
                      className={`z-10 w-48 ${
                        knownUsersDropButtonState ? "" : "hidden"
                      } bg-white divide-y divide-gray-100 rounded shadow dark:bg-gray-700 dark:divide-gray-600`}
                    >
                      <ul className="p-3 space-y-3 text-sm text-gray-700 dark:text-gray-200">
                        {Object.keys(knownUsers).map((id) => (
                          <li key={id}>
                            <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                              <input
                                checked={payedBy.includes(id) ? true : false}
                                type="checkbox"
                                onClick={() => {
                                  let newPayedBy = payedBy.includes(id)
                                    ? payedBy.filter(
                                        (payedBy_id) => payedBy_id !== id
                                      )
                                    : [...payedBy, id];
                                  setPayedBy(newPayedBy);
                                }}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                              />
                              <label className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                {knownUsers[id]}
                              </label>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                {!editing && (
                  <div className="flex flex-row space-x-4 mt-4 mb-4">
                    <div className="flex flex-col">
                      <div className="mb-2 text-sm font-medium text-gray-900 dark:text-white text-center items-center inline-flex">
                        Not a Member?
                      </div>
                      <div className="mb-2 text-sm font-medium text-gray-900 dark:text-white text-center items-center inline-flex">
                        Write their names separated by ,
                      </div>
                    </div>
                    <div>
                      <input
                        type="text"
                        className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="One Who Payed"
                        required=""
                        onChange={(event) => setNewPayedBy(event.target.value)}
                        value={newPayedBy}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Or One Who Owed"
                        required=""
                        onChange={(event) => setNewOwedBy(event.target.value)}
                        value={newOwedBy}
                      />
                    </div>
                  </div>
                )}
              </div>
              {!editing && (
                <button
                  className="w-48 text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                  onClick={createTransaction}
                >
                  Create New Expense
                </button>
              )}
              {editing && (
                <>
                  <button
                    className="w-48 text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                    onClick={() => {
                      if (category !== "") {
                        updateTransaction(idToUpdate);
                      }
                    }}
                  >
                    Update Expense
                  </button>
                  <button
                    className="w-48 text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                    onClick={() => {
                      setEditing(false);
                      setPayedBy([]);
                      setKnownUsersDropButtonState(false);
                      setIdToUpdate("");
                      setCategory("");
                      setAmount("");
                    }}
                  >
                    Back
                  </button>
                </>
              )}
            </form>
          </div>
          <div>
            <p className="flex items-center mt-6 mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Group ID: {props.groupId}
            </p>
            <button
              className="text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
              onClick={() => props.setGroupId("")}
            >
              Exit Group
            </button>
          </div>
        </div>
        <div className="mt-2">
          {userTransactionsSummary.hasOwnProperty("id") && (
            <>
              <p className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                {Object.keys(userTransactionsSummary.owes)
                  .filter((id) => userTransactionsSummary.owes[id] !== 0)
                  .map(
                    (id) =>
                      `you owe ${userTransactionsSummary.owes[id]} to ${knownUsers[id][0]}`
                  )
                  .join(", ")}
              </p>
              <p className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                {Object.keys(userTransactionsSummary.gets)
                  .filter((id) => userTransactionsSummary.gets[id] !== 0)
                  .map(
                    (id) =>
                      `${knownUsers[id][0]} owes you ${userTransactionsSummary.gets[id]}`
                  )
                  .join(", ")}
              </p>
            </>
          )}
        </div>
        <form className="flex flex-wrap space-x-4 mt-4 mb-4">
          <div>
            <button
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              type="button"
            >
              You Owes To*
              <svg
                className="w-4 h-4 ml-2"
                onClick={() =>
                  setOwesToDropButtonState(
                    (owesToDropButtonState) => !owesToDropButtonState
                  )
                }
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </button>
            <div
              className={`z-10 w-48 ${
                owesToDropButtonState ? "" : "hidden"
              } bg-white divide-y divide-gray-100 rounded shadow dark:bg-gray-700 dark:divide-gray-600`}
            >
              <ul className="p-3 space-y-3 text-sm text-gray-700 dark:text-gray-200">
                {userTransactionsSummary.hasOwnProperty("id") &&
                  Object.keys(userTransactionsSummary.owes)
                    .filter((id) => userTransactionsSummary.owes[id] !== 0)
                    .map((id) => (
                      <li key={id}>
                        <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                          <input
                            type="radio"
                            onClick={() => {
                              setSettleWith(id);
                            }}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                          />
                          <label className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                            {knownUsers[id]} ({userTransactionsSummary.owes[id]}
                            )
                          </label>
                        </div>
                      </li>
                    ))}
              </ul>
            </div>
          </div>
          <button
            className="w-48 text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
            onClick={createSettle}
          >
            Settle
          </button>
        </form>
        <form className="flex flex-wrap space-x-4 mt-4 mb-4">
          <div>
            <input
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Category"
              required=""
              onChange={(event) => setCategoryFilter(event.target.value)}
              value={categoryFilter}
            />
          </div>
          <div>
            <input
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Start Date (yyyy-mm-dd)"
              required=""
              onChange={(event) => setStartDateFilter(event.target.value)}
              value={startDateFilter}
            />
          </div>
          <div>
            <input
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="End Date(yyyy-mm-dd)"
              required=""
              onChange={(event) => setEndDateFilter(event.target.value)}
              value={endDateFilter}
            />
          </div>
          <button
            className="w-48 text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
            onClick={applyFilter}
          >
            Filter
          </button>
          {(categoryFilter !== "" ||
            startDateFilter !== "" ||
            endDateFilter !== "") && (
            <button
              className="w-48 text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
              onClick={() => {
                setCategoryFilter("");
                setStartDateFilter("");
                setEndDateFilter("");
                applyFilter();
              }}
            >
              Clear Filter
            </button>
          )}
        </form>
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Date
                </th>
                <th scope="col" className="px-6 py-3">
                  Category
                </th>
                <th scope="col" className="px-6 py-3">
                  Amt
                </th>
                <th scope="col" className="px-6 py-3">
                  Payed By
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
              {activities.map((activity) => (
                <tr
                  key={activity.id}
                  className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  {activity.hasOwnProperty("category") && (
                    <>
                      <th className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        {new Date(activity.date).toUTCString()}
                      </th>
                      <td className="px-6 py-4">{activity.category}</td>
                      <td className="px-6 py-4">{activity.amt}</td>
                      <td className="px-6 py-4">
                        {Object.keys(JSON.parse(activity.payed_by))
                          .map((id) => knownUsers[id] && knownUsers[id][0])
                          .join(", ")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setIdToUpdate(activity.id);
                            setCategory(activity.category);
                            setAmount(activity.amt);
                            setEditing(true);
                            setKnownUsersDropButtonState(true);
                            setPayedBy(activity.payed_by);
                            setNewPayedBy(
                              Object.keys(activity.payed_by)
                                .filter((id) => id.startsWith("nm_"))
                                .map((id) => knownUsers[id])
                                .join(", ")
                            );
                            setNewOwedBy(
                              Object.keys(activity.owes_by)
                                .filter((id) => id.startsWith("nm_"))
                                .map((id) => knownUsers[id])
                                .join(", ")
                            );
                          }}
                          className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                        >
                          Edit
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => deleteTransaction(activity.id)}
                          className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                  {!activity.hasOwnProperty("category") && (
                    <>
                      <th className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        {new Date(activity.date).toUTCString()}
                      </th>
                      <td className="px-6 py-4">Settlement</td>
                      <td className="px-6 py-4">{activity.amt}</td>
                      <td className="px-6 py-4">
                        {knownUsers.hasOwnProperty(activity.pays) &&
                          knownUsers.hasOwnProperty(activity.gets) && (
                            <>
                              {knownUsers[activity.pays][0]} settled with{" "}
                              {knownUsers[activity.gets][0]}
                            </>
                          )}
                      </td>
                      <td className="px-6 py-4 text-right"></td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => deleteSettle(activity.id)}
                          className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default Transactions;
