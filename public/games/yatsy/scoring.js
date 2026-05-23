(function attachYatzyScoring(global) {
  function calculateCategoryScore(categoryMap, categoryKey, values) {
    const diceValues = values.filter((value) => value !== null);
    const category = categoryMap[categoryKey];

    if (!category || diceValues.length !== 5) {
      return 0;
    }

    const counts = getCounts(diceValues);
    const total = diceValues.reduce((sum, value) => sum + value, 0);

    switch (category.scoreRule) {
      case "upper":
        return sumByFace(diceValues, category.face);
      case "fourKind":
        return hasCountAtLeast(counts, 4) ? category.fixedScore : 0;
      case "fullHouse":
        return isFullHouse(counts) ? category.fixedScore : 0;
      case "sum":
        return total;
      case "straight":
        return isStraight(diceValues) ? category.fixedScore : 0;
      case "smallStraight":
        return isSmallStraight(diceValues) ? category.fixedScore : 0;
      case "threeKind":
        return hasCountAtLeast(counts, 3) ? category.fixedScore : 0;
      case "yatzy":
        return hasCountAtLeast(counts, 5) ? category.fixedScore : 0;
      case "sumWeighted":
        return total * Math.max(0, Number(category.multiplier) || 0);
      default:
        return 0;
    }
  }

  function calculateUpperSection(categories, scorecard) {
    return categories
      .filter((category) => category.type === "upper")
      .reduce((sum, category) => sum + (scorecard[category.key] || 0), 0);
  }

  function calculateGrandTotal(categories, bonusConfig, scorecard) {
    const subtotal = categories.reduce((sum, category) => sum + (scorecard[category.key] || 0), 0);
    const upperSection = calculateUpperSection(categories, scorecard);
    const bonus = upperSection >= bonusConfig.threshold ? bonusConfig.points : 0;
    return subtotal + bonus;
  }

  function calculateMinMaxDelta(scorecard) {
    if (scorecard.min === null || scorecard.max === null) {
      return 0;
    }

    return Math.max(0, scorecard.max - scorecard.min);
  }

  function isScoreboardFull(categories, scoreMatrix) {
    return scoreMatrix.every((scorecard) =>
      categories.every((category) => scorecard[category.key] !== null)
    );
  }

  function isYatzyHand(values) {
    return values.length === 5 && values.every((value) => value !== null && value === values[0]);
  }

  function sumByFace(values, face) {
    return values.filter((value) => value === face).reduce((sum, value) => sum + value, 0);
  }

  function getCounts(values) {
    return values.reduce((map, value) => {
      map[value] = (map[value] || 0) + 1;
      return map;
    }, {});
  }

  function hasCountAtLeast(counts, target) {
    return Object.values(counts).some((count) => count >= target);
  }

  function isFullHouse(counts) {
    const occurrences = Object.values(counts).sort((a, b) => a - b);
    return occurrences.length === 2 && occurrences[0] === 2 && occurrences[1] === 3;
  }

  function isSequence(values, expected) {
    const sorted = [...values].sort((a, b) => a - b);
    return expected.every((value, index) => sorted[index] === value);
  }

  function isStraight(values) {
    return (
      isSequence(values, [1, 2, 3, 4, 5]) ||
      isSequence(values, [2, 3, 4, 5, 6])
    );
  }

  function isSmallStraight(values) {
    return isSequence(values, [1, 2, 3, 4, 5]);
  }

  global.YATZY_SCORING = {
    calculateCategoryScore,
    calculateUpperSection,
    calculateGrandTotal,
    calculateMinMaxDelta,
    isScoreboardFull,
    isYatzyHand
  };
})(window);
