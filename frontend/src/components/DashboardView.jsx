import { useEffect, useState } from 'react';
import { groupApi, wishApi } from '../api/client';
import GroupMembers from './GroupMembers';
import WishModal from './WishModal';
import InputModal from './InputModal';

const DashboardView = ({ token, user, onLogout }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [wishStatus, setWishStatus] = useState({ submitted: false, delivered: false });
  const [createTitle, setCreateTitle] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [wishModalOpen, setWishModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [wishModalKey, setWishModalKey] = useState(0);
  const [showEmailTip, setShowEmailTip] = useState(true);

  useEffect(() => {
    loadGroups();
    // Restore banner dismiss state
    try {
      const hidden = localStorage.getItem('hideEmailTip') === 'true';
      setShowEmailTip(!hidden);
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(id);
  }, [message]);

  // Auto-dismiss error messages after 5 seconds
  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(id);
  }, [error]);

  const loadGroups = async ({ autoSelect = !selectedGroup } = {}) => {
    try {
      const data = await groupApi.getMine(token);
      setGroups(data.groups);
      if (autoSelect && data.groups.length) {
        selectGroup(data.groups[0].code);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const selectGroup = async (code) => {
    if (!code) return;
    setLoading(true);
    setError('');
    try {
      const data = await groupApi.getByCode(token, code);
      setSelectedGroup(data);
      const status = await wishApi.status(token, data.code);
      setWishStatus(status);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    if (!createTitle.trim()) return;

    setLoading(true);
    setError('');
    try {
      const group = await groupApi.create(token, { title: createTitle.trim() });
      setMessage(`Group created! Share code ${group.code} with your friends.`);
      setCreateTitle('');
      setCreateModalOpen(false);
      setSelectedGroup(group);
      setWishStatus({ submitted: false, delivered: false });
      await loadGroups({ autoSelect: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (event) => {
    event.preventDefault();
    if (!joinCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      const group = await groupApi.join(token, { code: joinCode.trim().toUpperCase() });
      setMessage(`Joined group ${group.title}!`);
      setJoinCode('');
      setJoinModalOpen(false);
      setSelectedGroup(group);
      const status = await wishApi.status(token, group.code);
      setWishStatus(status);
      await loadGroups({ autoSelect: false });
    } catch (err) {
      setError(err.message);
      // If joining is closed after Secret Santa start, close the modal as a UX cue
      if (String(err.message).toLowerCase().includes('secret santa already started')) {
        setJoinModalOpen(false);
        setJoinCode('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartSanta = async () => {
    if (!selectedGroup) return;
    setLoading(true);
    setError('');
    try {
      const updated = await groupApi.start(token, selectedGroup.code);
      setSelectedGroup(updated);
      setMessage('Secret Santa has begun! Ask everyone to make their wishes.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    const confirm = window.confirm('Delete this group and all its wishes? This cannot be undone.');
    if (!confirm) return;
    setLoading(true);
    setError('');
    try {
      await groupApi.delete(token, selectedGroup.code);
      setMessage('Group deleted successfully');
      // Remove from local list
      setGroups((prev) => prev.filter((g) => g.code !== selectedGroup.code));
      setSelectedGroup(null);
      setWishStatus({ submitted: false, delivered: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (selectedGroup) {
      await selectGroup(selectedGroup.code);
    }
  };

  const handleWishSubmit = async (payload) => {
    if (!selectedGroup) return;
    setLoading(true);
    setError('');
    try {
      await wishApi.submit(token, selectedGroup.code, payload);
      setWishStatus({ submitted: true, delivered: true });
      setWishModalOpen(false);
      setMessage('Your wish is sent to your Secret Santa via email.');
      await selectGroup(selectedGroup.code);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openWishModal = () => {
    setWishModalKey((key) => key + 1);
    setWishModalOpen(true);
  };

  const copyGroupCode = async () => {
    if (!selectedGroup?.code) return;
    try {
      await navigator.clipboard.writeText(selectedGroup.code);
      setMessage('Group code copied to clipboard');
    } catch (e) {
      setError('Could not copy code');
    }
  };

  return (
    <div className="min-h-screen">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between px-6 py-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white font-bold">Holiday Control Center</p>
          <h2 className="text-3xl font-bold text-yellow-500">Welcome back, {user.name}</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/75 font-semibold">{user.email}</span>
          <button
            onClick={onLogout}
            className="rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-semibold text-holly-700 shadow-sm hover:bg-white"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="px-6 pb-12 space-y-8">
        {showEmailTip && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm flex items-start justify-between gap-3">
            <p className="text-sm">
              Heads up: Secret Santa emails can land in Gmail <span className="font-semibold">Promotions</span> or
              <span className="font-semibold"> Spam</span>. Please check those tabs and mark <span className="font-semibold">Not spam</span>
              or drag the email to <span className="font-semibold">Primary</span>.
            </p>
            <button
              onClick={() => { setShowEmailTip(false); try { localStorage.setItem('hideEmailTip', 'true'); } catch {} }}
              className="ml-3 shrink-0 rounded-lg border border-amber-300 bg-white/70 px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-white"
            >
              Dismiss
            </button>
          </div>
        )}
        {message && <p className="rounded-2xl bg-emerald-100/80 px-4 py-3 text-emerald-700">{message}</p>}
        {error && <p className="rounded-2xl bg-red-100/80 px-4 py-3 text-red-700">{error}</p>}
        <section className="flex flex-wrap gap-3">
          <button
            onClick={() => { setCreateModalOpen(true); setJoinModalOpen(false); }}
            className="rounded-2xl bg-amber-600 hover:bg-amber-700 px-4 py-2 font-semibold text-black shadow-lg"
          >
            Create Group
          </button>
          <button
            onClick={() => { setJoinModalOpen(true); setCreateModalOpen(false); }}
            className="rounded-2xl bg-slate-200 hover:bg-slate-300 px-4 py-2 font-semibold text-slate-900 border border-slate-300 shadow"
          >
            Join Group
          </button>
        </section>

        <section className="rounded-3xl border border-white/60 bg-white/75 p-6 shadow-xl w-full min-w-0 overflow-hidden">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-holly-700">Your Groups</h3>
              <p className="text-sm text-holly-600">Select a group to view members and status.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {groups.map((group) => (
                <button
                  key={group.code}
                  onClick={() => selectGroup(group.code)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold border ${
                    selectedGroup?.code === group.code
                      ? 'bg-holly-600 text-white border-holly-600'
                      : 'bg-white text-holly-700 border-holly-200'
                  }`}
                >
                  {group.title}
                </button>
              ))}
              {!groups.length && <p className="text-holly-600">No groups yet. Create or join one above!</p>}
            </div>
          </div>

          {selectedGroup && (
            <div className="mt-6 space-y-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-holly-600">Group code</p>
                  <div className="flex items-center gap-2">
                    <h4 className="text-3xl font-bold text-holly-700">{selectedGroup.code}</h4>
                    <button
                      onClick={copyGroupCode}
                      disabled={loading}
                      className="rounded-full border border-holly-200 bg-white/80 px-3 py-1 text-xs font-semibold text-holly-700 hover:bg-white disabled:opacity-40"
                      title="Copy code"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-holly-600">Share this code so friends can join.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleRefresh}
                    className="rounded-2xl bg-lime-500 px-4 py-2 font-semibold text-white border border-holly-200"
                  >
                    Refresh
                  </button>
                  {selectedGroup.host === user.id && (
                    <button
                      onClick={handleStartSanta}
                      disabled={selectedGroup.hasStarted || loading || (selectedGroup.members?.length || 0) < 2}
                      className="rounded-2xl bg-holly-600 px-4 py-2 font-semibold text-white shadow-lg disabled:opacity-40"
                      title={(selectedGroup.members?.length || 0) < 2 ? 'Need at least 2 members' : undefined}
                    >
                      {selectedGroup.hasStarted
                        ? 'Secret Santa Started'
                        : (selectedGroup.members?.length || 0) < 2
                          ? 'Waiting for Members'
                          : 'Start Secret Santa'}
                    </button>
                  )}
                  {selectedGroup.host === user.id && (
                    <button
                      onClick={handleDeleteGroup}
                      disabled={loading}
                      className="rounded-2xl bg-red-600 hover:bg-red-700 px-4 py-2 font-semibold text-white shadow-lg disabled:opacity-40"
                    >
                      Delete Group
                    </button>
                  )}
                  {selectedGroup.host !== user.id && (
                    <button
                      onClick={async () => {
                        if (!selectedGroup) return;
                        const confirmLeave = window.confirm('Leave this group? You will be removed from members and your wish (if any) will be deleted.');
                        if (!confirmLeave) return;
                        setLoading(true);
                        setError('');
                        try {
                          await groupApi.leave(token, selectedGroup.code);
                          setGroups((prev) => prev.filter((g) => g.code !== selectedGroup.code));
                          setSelectedGroup(null);
                          setWishStatus({ submitted: false, delivered: false });
                          setMessage('You left the group successfully');
                        } catch (err) {
                          setError(err.message);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className="rounded-2xl bg-slate-200 hover:bg-slate-300 px-4 py-2 font-semibold text-slate-900 border border-slate-300 shadow disabled:opacity-40"
                    >
                      Leave Group
                    </button>
                  )}
                  {selectedGroup.hasStarted && !wishStatus.submitted && (
                    <button
                      onClick={openWishModal}
                      className="rounded-2xl bg-amber-600 px-4 py-2 font-semibold text-white shadow-lg"
                    >
                      Make a Wish
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-holly-50/70 p-4 text-holly-700">
                {selectedGroup.hasStarted ? (
                  <p>
                    Secret Santa is live! {selectedGroup.host === user.id ? 'Encourage everyone to submit their wish forms.' : 'Fill your wish form so your Santa learns what to gift.'}
                  </p>
                ) : (
                  <p>
                    Waiting for the host to start Secret Santa. You can see who joined and refresh for new members.
                  </p>
                )}
                {wishStatus.submitted && (
                  <p className="mt-2 font-semibold text-emerald-700">Your wish is sent to your Secret Santa via email.</p>
                )}
              </div>

              <GroupMembers members={selectedGroup.members} hostId={selectedGroup.host} currentUserId={user.id} />
            </div>
          )}
        </section>
      </main>

      {wishModalOpen && (
        <WishModal
          key={wishModalKey}
          open={wishModalOpen}
          onClose={() => setWishModalOpen(false)}
          onSubmit={handleWishSubmit}
          defaultName={user.name}
        />
      )}

      {createModalOpen && (
        <InputModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateGroup}
          title="Create a Festive Group"
          label="Group Name"
          placeholder="e.g. Cozy Family Exchange"
          value={createTitle}
          onChange={(v) => setCreateTitle(v)}
          submitText="Get Secret Code"
          disabled={loading}
        />
      )}

      {joinModalOpen && (
        <InputModal
          open={joinModalOpen}
          onClose={() => setJoinModalOpen(false)}
          onSubmit={handleJoinGroup}
          title="Join with a Code"
          label="Group Code"
          placeholder="ABC123"
          value={joinCode}
          onChange={(v) => setJoinCode(v.toUpperCase())}
          submitText="Join Group"
          disabled={loading}
        />
      )}

      {loading && <div className="fixed bottom-6 right-6 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-holly-700">Working...</div>}
    </div>
  );
};

export default DashboardView;
