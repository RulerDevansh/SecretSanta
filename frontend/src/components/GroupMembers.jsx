const badgeClasses = 'px-2 py-0.5 rounded-full text-xs font-semibold';

const formatName = (raw) => {
  if (!raw) return '';
  const first = String(raw).trim().split(/\s+/)[0] || '';
  if (first.length > 9) return first.slice(0, 9) + '..';
  return first;
};

const formatEmail = (raw) => {
  if (!raw) return '';
  const email = String(raw).trim();
  if (email.length <= 12) return email;
  const [local, domain] = email.split('@');
  if (!domain) return email.length > 12 ? email.slice(0, 12) + '..' : email;
  const shortLocal = (local || '').slice(0, 2) + '..';
  return `${shortLocal}@${domain}`;
};

const GroupMembers = ({ members = [], hostId, currentUserId }) => {
  if (!members.length) {
    return (
      <p className="text-center text-holly-600 bg-white/70 rounded-2xl py-6">No members have joined yet.</p>
    );
  }

  return (
    <div className="grid min-w-0 gap-4 md:grid-cols-2">
      {members.map((member) => (
        <div key={member.id} className="w-full min-w-0 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div>
              <p className="text-lg font-semibold text-holly-700">{formatName(member.name)}</p>
              <p className="text-sm text-holly-500 break-words">{formatEmail(member.email)}</p>
            </div>
            <div className="text-2xl">🎅</div>
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
