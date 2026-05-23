window.YATZY_CONFIG = {
  players: [
    { name: "Player 1", className: "player-one", shortLabel: "P1", isRobotDefault: false },
    { name: "Player 2", className: "player-two", shortLabel: "P2", isRobotDefault: false }
  ],
  bonus: {
    threshold: 63,
    points: 35
  },
  matchmaking: {
    purgeAfterHours: 24000
  },
  robot: {
    minStepDelayMs: 1000,
    rollDelayMs: 1000,
    holdDelayMs: 0,
    scoreChoiceDelayMs: 1000,
    confirmDelayMs: 1000,
    maxFutureTurns: 1,
    decisionBudgetMs: 24
  },
  categories: [
    { key: "ones", label: "Ones", type: "upper", face: 1, scoreRule: "upper" },
    { key: "twos", label: "Twos", type: "upper", face: 2, scoreRule: "upper" },
    { key: "threes", label: "Threes", type: "upper", face: 3, scoreRule: "upper" },
    { key: "fours", label: "Fours", type: "upper", face: 4, scoreRule: "upper" },
    { key: "fives", label: "Fives", type: "upper", face: 5, scoreRule: "upper" },
    { key: "sixes", label: "Sixes", type: "upper", face: 6, scoreRule: "upper" },
    {
      key: "fullHouse",
      label: "Full House",
      type: "lower",
      scoreRule: "fullHouse",
      fixedScore: 30,
      icon: { kind: "word", text: "FULL" }
    },
    {
      key: "fourKind",
      label: "Carre",
      type: "lower",
      scoreRule: "fourKind",
      fixedScore: 40,
      icon: { kind: "word", text: "CARRE" }
    },
    {
      key: "largeStraight",
      label: "Suite",
      type: "lower",
      scoreRule: "straight",
      fixedScore: 40,
      icon: { kind: "word", text: "SUITE" }
    },
    {
      key: "min",
      label: "Minimum",
      type: "lower",
      scoreRule: "sum",
      icon: { kind: "word", text: "MIN" }
    },
    {
      key: "max",
      label: "Maximum",
      type: "lower",
      scoreRule: "sum",
      icon: { kind: "word", text: "MAX" }
    },
    {
      key: "yatzy",
      label: "Yatzy",
      type: "lower",
      scoreRule: "yatzy",
      fixedScore: 50,
      icon: { kind: "yatzy" }
    }
  ]
};
