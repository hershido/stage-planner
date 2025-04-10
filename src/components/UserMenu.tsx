import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const UserMenu: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Set avatar error in case the photoURL is not accessible
  useEffect(() => {
    if (currentUser && currentUser.photoURL) {
      const img = new Image();
      img.onload = () => setAvatarError(false);
      img.onerror = () => setAvatarError(true);
      img.src = currentUser.photoURL;
    }
  }, [currentUser]);

  if (!currentUser) return null;

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
  };

  // Get user initial for avatar fallback
  const getUserInitial = () => {
    if (currentUser.displayName && currentUser.displayName.length > 0) {
      return currentUser.displayName.charAt(0).toUpperCase();
    } else if (currentUser.email && currentUser.email.length > 0) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Either show the profile image or a fallback avatar with initial
  const renderAvatar = () => {
    if (!avatarError && currentUser.photoURL) {
      return (
        <img
          src={currentUser.photoURL}
          alt="Profile"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
          }}
          onError={() => setAvatarError(true)}
        />
      );
    } else {
      return (
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: "#3498db",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
          }}
        >
          {getUserInitial()}
        </div>
      );
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: "20px",
        left: "20px",
        zIndex: 51,
      }}
    >
      <div
        onClick={toggleMenu}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          padding: "8px",
          background: "white",
          color: "#333",
          borderRadius: "4px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
          border: "1px solid #e0e0e0",
        }}
      >
        {renderAvatar()}
        <span style={{ fontSize: "14px", fontWeight: "500" }}>
          {currentUser.displayName || currentUser.email || "User"}
        </span>
      </div>

      {menuOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            left: "0",
            background: "white",
            padding: "10px",
            borderRadius: "4px",
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
            width: "200px",
            border: "1px solid #e0e0e0",
          }}
        >
          <div
            style={{
              marginBottom: "10px",
              padding: "8px",
              borderBottom: "1px solid #e0e0e0",
            }}
          >
            <div
              style={{ fontWeight: "600", color: "#333", marginBottom: "4px" }}
            >
              {currentUser.displayName || "User"}
            </div>
            <div style={{ fontSize: "12px", color: "#555" }}>
              {currentUser.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: "#f5f5f5",
              color: "#333",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "14px",
              fontWeight: "500",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#e0e0e0";
              e.currentTarget.style.color = "#000";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#f5f5f5";
              e.currentTarget.style.color = "#333";
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
