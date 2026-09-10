const trigger = jest.fn();
const Haptics = {
  impact: jest.fn(),
  selection: jest.fn(),
  notification: jest.fn(),
};

module.exports = {
  trigger,
  Haptics,
  default: { trigger, Haptics },
};
module.exports.default.trigger = trigger;
module.exports.default.Haptics = Haptics;