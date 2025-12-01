const badgeClasses = 'px-2 py-0.5 rounded-full text-xs font-semibold';

const GroupMembers = ({ members = [], hostId, currentUserId }) => {
  if (!members.length) {
    return (
      <p className="text-center text-holly-600 bg-white/70 rounded-2xl py-6">No members have joined yet.</p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {members.map((member) => (
        <div key={member.id} className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-holly-700">{member.name}</p>
              <p className="text-sm text-holly-500">{member.email}</p>
            </div>
            <div className="text-3xl">🎅</div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-holly-600">
            {member.id === hostId && <span className={`${badgeClasses} bg-holly-100 text-holly-700`}>Host</span>}
            {member.id === currentUserId && <span className={`${badgeClasses} bg-amber-100 text-amber-700`}>You</span>}
            <span className={`${badgeClasses} ${member.wishSubmitted ? 'bg-emerald-100 text-emerald-700' : 'bg-holly-100 text-holly-700'}`}>
              Wish {member.wishSubmitted ? 'ready' : 'pending'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GroupMembers;
