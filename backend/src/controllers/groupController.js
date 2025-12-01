// uuid v13 is ESM-only; use dynamic import from CommonJS context
let _uuidv4;
const loadUuid = async () => {
  if (!_uuidv4) {
    const { v4 } = await import('uuid');
    _uuidv4 = v4;
  }
  return _uuidv4;
};
const Group = require('../models/Group');
const User = require('../models/User');
const Wish = require('../models/Wish');

const buildGroupResponse = async (group) => {
  const populatedGroup = await group.populate('members', 'name email hasAssignedGift');
  const wishes = await Wish.find({ group: group._id }).select('user deliveredToSanta');
  const wishMap = wishes.reduce((map, wish) => {
    map[wish.user.toString()] = {
      submitted: true,
      delivered: wish.deliveredToSanta,
    };
    return map;
  }, {});

  return {
    id: populatedGroup._id,
    title: populatedGroup.title,
    code: populatedGroup.code,
    hasStarted: populatedGroup.hasStarted,
    host: populatedGroup.host.toString(),
    members: populatedGroup.members.map((member) => ({
      id: member._id.toString(),
      name: member.name,
      email: member.email,
      hasAssignedGift: member.hasAssignedGift,
      wishSubmitted: wishMap[member._id.toString()]?.submitted || false,
      wishDelivered: wishMap[member._id.toString()]?.delivered || false,
    })),
  };
};

const generateGroupCode = async () => {
  const uuidv4 = await loadUuid();
  let code;
  let exists = true;
  while (exists) {
    code = uuidv4().replace(/-/g, '').slice(0, 6).toUpperCase();
    exists = await Group.exists({ code });
  }
  return code;
};

exports.createGroup = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Group title is required' });
    }

    const code = await generateGroupCode();

    const group = await Group.create({
      title,
      code,
      host: req.user.id,
      members: [req.user.id],
    });

    await User.findByIdAndUpdate(req.user.id, { $addToSet: { groups: group._id } });

    res.status(201).json(await buildGroupResponse(group));
  } catch (error) {
    console.error('Create group error', error);
    res.status(500).json({ message: 'Failed to create group' });
  }
};

exports.joinGroup = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Group code is required' });
    }

    const normalizedCode = code.trim().toUpperCase();
    const existing = await Group.findOne({ code: normalizedCode });
    if (!existing) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // If Secret Santa has started, block new members but allow existing members to fetch the group
    const alreadyMember = existing.members.some((m) => m.toString() === req.user.id);
    if (existing.hasStarted && !alreadyMember) {
      return res.status(400).json({ message: 'Secret Santa already started. Joining is closed.' });
    }

    const group = alreadyMember
      ? existing
      : await Group.findOneAndUpdate(
          { code: normalizedCode },
          { $addToSet: { members: req.user.id } },
          { new: true }
        );

    await User.findByIdAndUpdate(req.user.id, { $addToSet: { groups: group._id } });

    res.json(await buildGroupResponse(group));
  } catch (error) {
    console.error('Join group error', error);
    res.status(500).json({ message: 'Failed to join group' });
  }
};

exports.getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .sort({ createdAt: -1 })
      .select('title code hasStarted host');

    res.json({
      groups: groups.map((group) => ({
        id: group._id,
        title: group.title,
        code: group.code,
        hasStarted: group.hasStarted,
        host: group.host.toString(),
      })),
    });
  } catch (error) {
    console.error('Get my groups error', error);
    res.status(500).json({ message: 'Failed to load groups' });
  }
};

exports.getGroupByCode = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const group = await Group.findOne({ code });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.some((memberId) => memberId.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'You are not part of this group' });
    }

    res.json(await buildGroupResponse(group));
  } catch (error) {
    console.error('Get group error', error);
    res.status(500).json({ message: 'Failed to load group' });
  }
};

exports.startSecretSanta = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const group = await Group.findOne({ code });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.host.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the host can start Secret Santa' });
    }

    if (group.hasStarted) {
      return res.status(400).json({ message: 'Secret Santa already started' });
    }

    if (!group.members || group.members.length < 2) {
      return res.status(400).json({ message: 'Need at least 2 members to start Secret Santa' });
    }

    group.hasStarted = true;
    await group.save();

    res.json(await buildGroupResponse(group));
  } catch (error) {
    console.error('Start Secret Santa error', error);
    res.status(500).json({ message: 'Failed to start Secret Santa' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const group = await Group.findOne({ code });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.host.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the host can delete this group' });
    }

    // Remove wishes tied to the group
    await Wish.deleteMany({ group: group._id });
    // Pull group reference from users
    await User.updateMany({ groups: group._id }, { $pull: { groups: group._id } });
    // Delete the group itself
    await Group.deleteOne({ _id: group._id });

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error', error);
    res.status(500).json({ message: 'Failed to delete group' });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const group = await Group.findOne({ code });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.host.toString() === req.user.id) {
      return res.status(403).json({ message: 'Host cannot leave the group' });
    }

    const isMember = group.members.some((m) => m.toString() === req.user.id);
    if (!isMember) {
      return res.status(400).json({ message: 'You are not a member of this group' });
    }

    await Group.updateOne({ _id: group._id }, { $pull: { members: req.user.id } });
    await User.updateOne({ _id: req.user.id }, { $pull: { groups: group._id } });
    await Wish.deleteOne({ group: group._id, user: req.user.id });

    return res.json({ message: 'Left group successfully' });
  } catch (error) {
    console.error('Leave group error', error);
    res.status(500).json({ message: 'Failed to leave group' });
  }
};
