//InviteBell.jsx 

import { useEffect, useState , useCallback} from "react";
import axiosClient from "../api/axiosClient";
import { io } from "socket.io-client";

const socket = io("http://127.0.0.1:4000");

export default function InviteBell() {
  const [invites, setInvites] = useState([]);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

 const loadInvites = useCallback(async () => {
  if (!user.email) return;
  const res = await axiosClient.get(`/invites/pending?email=${user.email}`);
  setInvites(res.data.invites || []);
}, [user.email]);


  useEffect(() => {
    loadInvites();

    socket.on("invite:new", loadInvites);
    socket.on("invite:accepted", loadInvites);

    return () => {
      socket.off("invite:new");
      socket.off("invite:accepted");
    };
  }, [loadInvites]);

  return (
    <div className="invite-bell">
      🔔 <span>{invites.length}</span>

      {invites.length > 0 && (
        <div className="invite-dropdown">
          <h4>Your Pending Invites</h4>
          {invites.map(i => (
            <div key={i.id}>
              🏢 <b>{i.team_name}</b>
              <span className="badge pending">Pending</span>
              <button
                onClick={async () => {
                  await axiosClient.post(`/invites/${i.id}/accept`);
                  loadInvites();
                }}
              >
                Accept
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
