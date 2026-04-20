// src/admin/FeedbackManager.jsx
import StaffFeedbackManager from '../feedback/StaffFeedbackManager';

const AdminFeedbackManager = ({ token, user }) => {
  return (
    <div style={{ padding: '0' }}>
      <StaffFeedbackManager 
        token={token} 
        user={user} 
        role="admin"
        apiBase="http://localhost:8000/api/v1"  // ✅ Pass API base
      />
    </div>
  );
};

export default AdminFeedbackManager;