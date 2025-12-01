const Group = require('../models/Group');
const Wish = require('../models/Wish');
const User = require('../models/User');
const { sendWishEmail } = require('../utils/email');

const sanitizeList = (items = []) =>
  items
    .filter((item) => item && item.trim())
    .map((item) => item.trim())
    .slice(0, 3);

const ensureMembership = (group, userId) =>
  group.members.some((memberId) => memberId.toString() === userId);

const buildWishEmail = ({ wishOwner, wish, group }) => {
  const likes = wish.thingsLove?.length ? wish.thingsLove : ['No specific items'];
  const avoid = wish.thingsNoNeed?.length ? wish.thingsNoNeed : ['They are open to anything!'];

  // Simple HTML escape to protect against accidental markup
  const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const wishItems = likes.map((item) => `<li style="margin:6px 0">${esc(item)}</li>`).join('');
  const avoidItems = avoid.map((item) => `<li style="margin:6px 0">${esc(item)}</li>`).join('');

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:24px 0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:92%;background:#ffffff;border:1px solid #e6e8ef;border-radius:12px;font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, sans-serif;color:#0f172a">
          <tr>
            <td style="padding:0;border-bottom:1px solid #e6e8ef;border-radius:12px 12px 0 0;background:linear-gradient(135deg,#dc2626,#b91c1c);">
              <div style="padding:18px 24px;font-size:20px;line-height:1.2;color:#fff;font-weight:700;letter-spacing:0.2px">
                🎄 You are Secret Santa For ${esc(wish.displayName)}!
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px">
              <p style="margin:0 0 12px 0;font-size:16px;color:#0f172a">You both are part of group:- <strong>${esc(
                group.title
              )}</strong>:</p>
              <p style="margin:18px 0 0 0;font-size:13px;color:#64748b">This wish was submitted by <strong>${esc(
                wishOwner.name
              )}</strong> (<a style="color:#0ea5e9;text-decoration:none" href="mailto:${esc(
                wishOwner.email
              )}">${esc(wishOwner.email)}</a>). Keep the surprise alive!</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 8px">
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;font-size:14px">
                    <strong style="display:inline-block;min-width:150px;color:#0f172a">Favorite color:</strong>
                    <span style="color:#334155">${esc(wish.favoriteColor)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;font-size:14px">
                    <strong style="display:inline-block;min-width:150px;color:#0f172a">Favorite snacks:</strong>
                    <span style="color:#334155">${esc(wish.favoriteSnacks)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;font-size:14px">
                    <strong style="display:inline-block;min-width:150px;color:#0f172a">Hobbies & interests:</strong>
                    <span style="color:#334155">${esc(wish.hobbies)}</span>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-collapse:separate;border-spacing:0 0">
                <tr>
                  <td style="vertical-align:top;width:50%;padding-right:8px">
                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px">
                      <div style="font-weight:700;margin-bottom:8px;color:#0f172a">Wish list</div>
                      <ul style="margin:0;padding-left:18px;color:#334155;font-size:14px;line-height:1.5">${wishItems}</ul>
                    </div>
                  </td>
                  <td style="vertical-align:top;width:50%;padding-left:8px">
                    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px">
                      <div style="font-weight:700;margin-bottom:8px;color:#0f172a">Things to avoid</div>
                      <ul style="margin:0;padding-left:18px;color:#334155;font-size:14px;line-height:1.5">${avoidItems}</ul>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:6px 0 0 0;font-size:14px;color:#0f172a">Happy gifting and keep the secret safe! 🎅</p>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #e6e8ef;padding:16px 24px;border-radius:0 0 12px 12px;background:#ffffff">
              <div style="font-size:12px;color:#94a3b8">Sent by Secret Santa • Please don't reply to this automated email.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
};

exports.getWishStatus = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const group = await Group.findOne({ code });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!ensureMembership(group, req.user.id)) {
      return res.status(403).json({ message: 'You are not part of this group' });
    }

    const wish = await Wish.findOne({ group: group._id, user: req.user.id });
    res.json({ submitted: Boolean(wish), delivered: wish?.deliveredToSanta ?? false });
  } catch (error) {
    console.error('Get wish status error', error);
    res.status(500).json({ message: 'Failed to load wish status' });
  }
};

exports.submitWish = async (req, res) => {
  let wishDoc;
  try {
    const code = req.params.code.toUpperCase();
    const group = await Group.findOne({ code });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!ensureMembership(group, req.user.id)) {
      return res.status(403).json({ message: 'You are not part of this group' });
    }

    if (!group.hasStarted) {
      return res.status(400).json({ message: 'Secret Santa has not started yet' });
    }

    const existing = await Wish.findOne({ group: group._id, user: req.user.id });
    if (existing) {
      return res.status(400).json({ message: 'You already submitted your wish' });
    }

    const { name, favoriteColor, favoriteSnacks, hobbies, thingsLove = [], thingsNoNeed = [] } = req.body;

    const cleanedName = name?.trim();
    const cleanedColor = favoriteColor?.trim();
    const cleanedSnacks = favoriteSnacks?.trim();
    const cleanedHobbies = hobbies?.trim();

    if (!cleanedName || !cleanedColor || !cleanedSnacks || !cleanedHobbies) {
      return res.status(400).json({ message: 'Please complete all required fields' });
    }

    wishDoc = await Wish.create({
      displayName: cleanedName,
      group: group._id,
      user: req.user.id,
      favoriteColor: cleanedColor,
      favoriteSnacks: cleanedSnacks,
      hobbies: cleanedHobbies,
      thingsLove: sanitizeList(thingsLove),
      thingsNoNeed: sanitizeList(thingsNoNeed),
      deliveredToSanta: false,
    });

    const wishOwner = await User.findById(req.user.id).select('name email');
    if (!wishOwner) {
      return res.status(500).json({ message: 'Unable to find wish owner' });
    }

    const santaId = await pickSecretSanta({ group, exclude: req.user.id });
    const santaUser = await User.findById(santaId).select('name email hasAssignedGift');

    if (!santaUser) {
      return res.status(500).json({ message: 'Could not locate a Secret Santa' });
    }

    await sendWishEmail({
      to: santaUser.email,
      subject: `You are Secret Santa for ${wishDoc.displayName}`,
      html: buildWishEmail({ wishOwner, wish: wishDoc, group }),
    });

    wishDoc.deliveredToSanta = true;
    await wishDoc.save();

    if (!santaUser.hasAssignedGift) {
      santaUser.hasAssignedGift = true;
      await santaUser.save();
    }

    res.status(201).json({ message: 'Your wish is sent to your Secret Santa via email!' });
  } catch (error) {
    console.error('Submit wish error', error);
    if (wishDoc && !wishDoc.deliveredToSanta) {
      await Wish.findByIdAndDelete(wishDoc._id);
    }
    res.status(500).json({ message: 'Failed to submit wish' });
  }
};

const pickSecretSanta = async ({ group, exclude }) => {
  const candidateIds = group.members.map((memberId) => memberId.toString()).filter((id) => id !== exclude);
  if (!candidateIds.length) {
    throw new Error('No eligible members to assign');
  }

  const freshCandidates = await User.find({ _id: { $in: candidateIds }, hasAssignedGift: false }).select('_id');
  const pool = freshCandidates.length
    ? freshCandidates
    : await User.find({ _id: { $in: candidateIds } }).select('_id');

  if (!pool.length) {
    throw new Error('No eligible members to assign');
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex]._id;
};
