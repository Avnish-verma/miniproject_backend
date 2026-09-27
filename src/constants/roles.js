const REACTION_TYPES = ['LIKE', 'LOVE', 'FIRE', 'INSIGHT', 'CLAP'];

const CALL_STATUS = {
  RINGING: 'ringing',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  MISSED: 'missed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

const CALL_TYPES = {
  AUDIO: 'audio',
  VIDEO: 'video',
};

const PRIVACY_SETTINGS = {
  ALLOW_DM_EVERYONE: 'everyone',
  ALLOW_DM_FOLLOWING: 'following',
  ALLOW_DM_NONE: 'none',
};

module.exports = {
  REACTION_TYPES,
  CALL_STATUS,
  CALL_TYPES,
  PRIVACY_SETTINGS,
};
