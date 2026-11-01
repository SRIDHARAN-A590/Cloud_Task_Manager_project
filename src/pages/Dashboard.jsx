import { useAuth0 } from "@auth0/auth0-react";
import React, { useState, useEffect, useRef, useMemo } from "react";
import dbx from "../dropbox";
import "./Dashboard.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function Dashboard({ user }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState("Low");
  const [file, setFile] = useState(null);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const toastTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const { logout } = useAuth0();

  const showToast = (message, type = "success") => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const closeToast = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast(null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setTitle("");
    setDescription("");
    setDue("");
    setPriority("Low");
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${user.sub}`);

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const data = await response.json();
      const taskList = data.map((task) => ({
        id: task._id,
        ...task,
      }));

      setTasks(taskList);
    } catch (error) {
      console.log("Get tasks error:", error);
      showToast("Error loading tasks from server", "error");
    }
  };

  useEffect(() => {
    if (user) {
      getTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const uploadToDropbox = async () => {
    if (!file) {
      return null;
    }

    try {
      const response = await dbx.filesUpload({
        path: "/" + file.name,
        contents: file,
        mode: { ".tag": "overwrite" },
        autorename: true,
      });

      const filePath = response.result.path_display;
      let url = "";

      try {
        const linkResponse = await dbx.sharingCreateSharedLinkWithSettings({
          path: filePath,
        });
        url = linkResponse.result.url;
      } catch (linkError) {
        console.log("Shared link creation failed, using fallback:", linkError);
        try {
          const existingLinks = await dbx.sharingListSharedLinks({ path: filePath });
          if (existingLinks.result.links && existingLinks.result.links.length > 0) {
            url = existingLinks.result.links[0].url;
          } else {
            const tempLink = await dbx.filesGetTemporaryLink({ path: filePath });
            url = tempLink.result.link;
          }
        } catch (fallbackError) {
          try {
            const tempLink = await dbx.filesGetTemporaryLink({ path: filePath });
            url = tempLink.result.link;
          } catch (tempErr) {
            console.warn("Could not generate Dropbox URL:", tempErr);
          }
        }
      }

      return {
        name: file.name,
        path: filePath,
        url: url,
      };
    } catch (error) {
      console.log("Dropbox upload error:", error);
      showToast(
        "Error uploading file to Dropbox: " +
          (error?.error?.error_summary || error?.message || "Check permissions"),
        "error"
      );
      return null;
    }
  };

  const addTask = async () => {
    if (title.trim() === "" || description.trim() === "") {
      showToast("Please fill in both title and description", "warning");
      return;
    }

    setSubmitting(true);

    try {
      const oldTask = editId !== null ? tasks.find((t) => t.id === editId) : null;
      let dropboxFile = null;

      if (editId !== null && file) {
        dropboxFile = await uploadToDropbox();
        if (!dropboxFile) {
          setSubmitting(false);
          return;
        }

        if (oldTask && oldTask.filePath) {
          try {
            await dbx.filesDeleteV2({ path: oldTask.filePath });
          } catch (delErr) {
            console.warn("Could not delete old file:", delErr);
          }
        }
      }

      if (editId === null && file) {
        dropboxFile = await uploadToDropbox();
        if (!dropboxFile) {
          setSubmitting(false);
          return;
        }
      }

      const taskData = {
        title,
        description,
        due,
        priority,
        uid: user.sub,
        fileName: dropboxFile ? dropboxFile.name : oldTask?.fileName || "",
        filePath: dropboxFile ? dropboxFile.path : oldTask?.filePath || "",
        fileUrl: dropboxFile ? dropboxFile.url : oldTask?.fileUrl || "",
      };

      if (editId !== null) {
        const response = await fetch(`${API_BASE_URL}/api/tasks/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });

        if (!response.ok) {
          throw new Error("Failed to update task");
        }

        showToast("Task updated successfully!", "success");
        setEditId(null);
      } else {
        const response = await fetch(`${API_BASE_URL}/api/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });

        if (!response.ok) {
          throw new Error("Failed to add task");
        }

        showToast("Task added successfully!", "success");
      }

      await getTasks();

      setTitle("");
      setDescription("");
      setDue("");
      setPriority("Low");
      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.log("Task error:", error);
      showToast("Error saving task. Please check server.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTask = async (task) => {
    try {
      if (task.filePath) {
        try {
          await dbx.filesDeleteV2({ path: task.filePath });
        } catch (delErr) {
          console.warn("Could not delete file from Dropbox:", delErr);
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      await getTasks();
      showToast("Task deleted successfully!", "success");
    } catch (error) {
      console.log("Delete error:", error);
      showToast("Error deleting task", "error");
    }
  };

  const editTask = (task) => {
    setTitle(task.title);
    setDescription(task.description);
    setDue(task.due || "");
    setPriority(task.priority || "Low");
    setEditId(task.id);
    document.getElementById("taskForm")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority =
        priorityFilter === "All" ||
        t.priority?.toLowerCase() === priorityFilter.toLowerCase();
      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, priorityFilter]);

  const highPriorityCount = tasks.filter(
    (t) => t.priority?.toLowerCase() === "high"
  ).length;
  const filesCount = tasks.filter((t) => Boolean(t.fileName)).length;

  return (
    <div className="dashboard">
      {/* Toast Notifications */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <span className="toast-icon">
              {toast.type === "success" && "✓"}
              {toast.type === "error" && "✕"}
              {toast.type === "warning" && "⚠"}
              {toast.type === "info" && "ℹ"}
            </span>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={closeToast} title="Dismiss">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Modern Glass Navbar */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="brand-icon">☁</div>
          <span className="brand-title">Cloud Task Manager</span>
          <span className="brand-badge-cloud">Workspace</span>
        </div>

        <div className="nav-user">
          <div className="user-chip">
            <div className="user-avatar">
              {user.picture ? (
                <img src={user.picture} alt={user.name} />
              ) : (
                user.name?.charAt(0) || "U"
              )}
            </div>
            <span className="user-name">{user.name}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Metric Cards */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-total">📋</div>
            <div className="stat-details">
              <h4>Total Tasks</h4>
              <div className="stat-number">{tasks.length}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-high">⚡</div>
            <div className="stat-details">
              <h4>High Priority</h4>
              <div className="stat-number">{highPriorityCount}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-files">📁</div>
            <div className="stat-details">
              <h4>Cloud Attachments</h4>
              <div className="stat-number">{filesCount}</div>
            </div>
          </div>
        </section>

        {/* Task Form */}
        <section className="task-form-card" id="taskForm">
          <div className="form-header">
            <h2>{editId !== null ? "Edit Task" : "Create New Task"}</h2>
            {editId !== null && <span className="edit-badge">Editing Mode</span>}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Task Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>
            </div>

            {/* Custom Dropbox Upload Zone */}
            <div className="form-group">
              <label>Dropbox Attachment (Optional)</label>
              <div
                className="file-upload-zone"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
                {file ? (
                  <div className="file-selected-badge">
                    <span>📎 {file.name}</span>
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="file-prompt">
                    <span className="file-prompt-icon">☁️</span>
                    <span>Click or drop a file to upload to Dropbox</span>
                    <span className="file-cloud-note">
                      Securely synchronized to your cloud storage
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-buttons">
              <button
                type="button"
                className="submit-btn"
                onClick={addTask}
                disabled={submitting}
              >
                {submitting
                  ? "Saving..."
                  : editId !== null
                  ? "Save Changes"
                  : "Add Task"}
              </button>
              {editId !== null && (
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Task List Section */}
        <section className="tasks-section">
          <div className="tasks-toolbar">
            <div className="tasks-title-group">
              <h2>My Tasks</h2>
              <span className="tasks-count-pill">{filteredTasks.length}</span>
            </div>

            <div className="tasks-filter-group">
              <input
                type="text"
                className="search-input"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <div className="priority-tabs">
                {["All", "Low", "Medium", "High"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`tab-btn ${priorityFilter === tab ? "active" : ""}`}
                    onClick={() => setPriorityFilter(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="empty-tasks">
              <div className="empty-icon">☁️</div>
              <h3>No tasks found</h3>
              <p>
                {searchQuery || priorityFilter !== "All"
                  ? "No tasks match your filter criteria."
                  : "Create your first task above to get started!"}
              </p>
            </div>
          ) : (
            <div className="tasks-grid">
              {filteredTasks.map((task) => (
                <div className="task-card" key={task.id}>
                  <div>
                    <div className="task-card-header">
                      <h3 className="task-title">{task.title}</h3>
                      <span
                        className={`priority-badge ${
                          task.priority ? task.priority.toLowerCase() : "low"
                        }`}
                      >
                        <span className="priority-dot"></span>
                        {task.priority || "Low"}
                      </span>
                    </div>

                    <p className="task-desc">{task.description}</p>
                  </div>

                  <div className="task-meta">
                    {task.due && (
                      <div className="task-due-date">
                        <span className="task-due-icon">📅</span>
                        <span>Due: {task.due}</span>
                      </div>
                    )}

                    {task.fileUrl && (
                      <a
                        href={task.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="task-file-attachment"
                        title="Open file from Dropbox"
                      >
                        <span>📎 {task.fileName || "View Attachment"}</span>
                        <span className="cloud-chip">Dropbox ↗</span>
                      </a>
                    )}

                    <div className="task-actions">
                      <button
                        type="button"
                        className="btn-card-edit"
                        onClick={() => editTask(task)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-card-delete"
                        onClick={() => deleteTask(task)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;