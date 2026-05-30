// src/pages/admin/AdminUsers.jsx

import React, { useEffect, useState } from "react";
import {
  getAllUsersAdmin,
  changeUserStatusAdmin,
  deleteUserAdmin,
  changeUserRoleAdmin
} from "../../api/adminApi";

import "../../styles/admin-users.css";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    customers: 0,
    admins: 0,
    blocked: 0
  });

  const fetchUsers = async (pageNumber = page, searchText = search) => {
    try {
      setLoading(true);

      const res = await getAllUsersAdmin({
        page: pageNumber,
        limit: 10,
        search: searchText
      });

      if (res.data.success) {
        const usersData = res.data.data || [];

        setUsers(usersData);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (error) {
      console.log(error);
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const countRes = await getAllUsersAdmin({
        page: 1,
        limit: 1,
        search: ""
      });

      if (!countRes.data.success) return;

      const totalUsers = countRes.data.total || 0;

      if (totalUsers === 0) {
        setStats({
          total: 0,
          customers: 0,
          admins: 0,
          blocked: 0
        });
        return;
      }

      const allUsersRes = await getAllUsersAdmin({
        page: 1,
        limit: totalUsers,
        search: ""
      });

      if (allUsersRes.data.success) {
        const allUsers = allUsersRes.data.data || [];

        const totalAdmins = allUsers.filter(
          (user) => user.role === "admin"
        ).length;

        const totalBlocked = allUsers.filter(
          (user) => user.isBlocked
        ).length;

        setStats({
          total: totalUsers,
          customers: totalUsers - totalAdmins,
          admins: totalAdmins,
          blocked: totalBlocked
        });
      }
    } catch (error) {
      console.log("Stats Error:", error);
    }
  };

  useEffect(() => {
    fetchUsers(page, search);
  }, [page]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearch = () => {
    if (page === 1) {
      fetchUsers(1, search);
    } else {
      setPage(1);
    }
  };

  const refreshUsersAndStats = () => {
    fetchUsers(page, search);
    fetchStats();
  };

  const handleBlock = async (id, currentStatus) => {
    try {
      await changeUserStatusAdmin(id, !currentStatus);
      refreshUsersAndStats();
    } catch (error) {
      alert("Status update failed");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this user?");

    if (!confirmDelete) return;

    try {
      await deleteUserAdmin(id);
      refreshUsersAndStats();
    } catch (error) {
      alert("Delete failed");
    }
  };

  const handleRole = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "customer" : "admin";

    try {
      await changeUserRoleAdmin(id, newRole);
      refreshUsersAndStats();
    } catch (error) {
      alert("Role update failed");
    }
  };

  return (
    <div className="admin-users">
      <div className="users-header">
        <h1>Admin User Management</h1>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p>Total Users</p>
          <h2>{stats.total}</h2>
        </div>

        <div className="stat-card">
          <p>Total Customers</p>
          <h2>{stats.customers}</h2>
        </div>

        <div className="stat-card">
          <p>Total Admins</p>
          <h2>{stats.admins}</h2>
        </div>

        <div className="stat-card">
          <p>Total Blocked Users</p>
          <h2 id="block">{stats.blocked}</h2>
        </div>
      </div>

      {loading ? (
        <div className="loading-box">
          Loading users...
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone}</td>

                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${
                          user.isBlocked ? "blocked" : "active"
                        }`}
                      >
                        {user.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </td>

                    <td>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    <td>
                      <div className="action-btns">
                        <button
                          className="btn-warning"
                          onClick={() =>
                            handleBlock(user._id, user.isBlocked)
                          }
                        >
                          {user.isBlocked ? "Unblock" : "Block"}
                        </button>

                        <button
                          className="btn-info"
                          onClick={() =>
                            handleRole(user._id, user.role)
                          }
                        >
                          Role
                        </button>

                        <button
                          className="btn-danger"
                          onClick={() => handleDelete(user._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Prev
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminUsers;