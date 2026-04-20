// src/receptionist/FeedbackManager.jsx
import StaffFeedbackManager from '../feedback/StaffFeedbackManager';

const ReceptionistFeedbackManager = ({ token, user }) => {
  return (
    <div style={{ padding: '0' }}>
      <StaffFeedbackManager 
        token={token} 
        user={user} 
        role="receptionist"
        apiBase="http://localhost:8000/api/v1"  // ✅ Pass API base
      />
    </div>
  );
};

export default ReceptionistFeedbackManager; 